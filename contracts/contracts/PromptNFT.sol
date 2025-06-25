// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

/**
 * @title ShanHaiNFTV25
 * @dev 山海经神兽NFT合约 - VRF 2.5优化版
 */
contract ShanHaiNFTV25 is ERC721, ReentrancyGuard, VRFConsumerBaseV2Plus {
    
    // ========== VRF 2.5配置 ==========
    uint256 private s_subscriptionId;
    bytes32 private s_keyHash = 0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae;
    uint32 private s_callbackGasLimit = 200000;
    uint16 private s_requestConfirmations = 3;
    uint32 private s_numWords = 1;
    
    // ========== 状态变量 ==========
    uint256 private _nextTokenId = 1;
    uint256 public mintPrice = 0;
    address public shanHaiTokenAddress;
    
    enum Rarity { Common, Rare, Epic, Legendary, Mythical }
    
    struct ShanHaiBeast {
        string prompt;
        string ipfsUrl;
        Rarity rarity;
        uint256 timestamp;
        address creator;
        bool rarityRevealed;
    }
    
    // ========== 映射 ==========
    mapping(uint256 => ShanHaiBeast) public beasts;
    mapping(uint256 => uint256) public vrfRequestToTokenId;
    mapping(address => uint256[]) public userBeasts;
    mapping(uint256 => bool) public vrfPending;
    mapping(Rarity => uint256) public rarityCount;
    mapping(uint256 => string) private _tokenURIs; // 替代ERC721URIStorage
    
    // ========== 事件 ==========
    event BeastMinted(uint256 indexed tokenId, address indexed creator, string prompt);
    event RarityRequested(uint256 indexed tokenId, uint256 requestId);
    event RarityRevealed(uint256 indexed tokenId, Rarity rarity, uint256 randomValue);
    
    // ========== 构造函数 ==========
    constructor(uint256 subscriptionId) 
        ERC721("ShanHai Beasts V2.5", "SHB25")
        VRFConsumerBaseV2Plus(0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B)
    {
        s_subscriptionId = subscriptionId;
    }
    
    // ========== 核心功能 ==========
    function mint(address to, string memory prompt) external payable nonReentrant returns (uint256) {
        require(msg.value >= mintPrice);
        require(bytes(prompt).length > 0);
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        
        beasts[tokenId] = ShanHaiBeast({
            prompt: prompt,
            ipfsUrl: "",
            rarity: Rarity.Common,
            timestamp: block.timestamp,
            creator: to,
            rarityRevealed: false
        });
        
        userBeasts[to].push(tokenId);
        _requestRarity(tokenId);
        
        if (shanHaiTokenAddress != address(0)) {
            try IShanHaiToken(shanHaiTokenAddress).mintReward(to) {} catch {}
        }
        
        emit BeastMinted(tokenId, to, prompt);
        return tokenId;
    }
    
    function _requestRarity(uint256 tokenId) internal {
        uint256 requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: s_keyHash,
                subId: s_subscriptionId,
                requestConfirmations: s_requestConfirmations,
                callbackGasLimit: s_callbackGasLimit,
                numWords: s_numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
                )
            })
        );
        
        vrfRequestToTokenId[requestId] = tokenId;
        vrfPending[tokenId] = true;
        emit RarityRequested(tokenId, requestId);
    }
    
    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal override {
        uint256 tokenId = vrfRequestToTokenId[requestId];
        require(tokenId != 0);
        require(vrfPending[tokenId]);
        
        uint256 randomValue = randomWords[0] % 1000;
        Rarity rarity = _calculateRarity(randomValue);
        
        beasts[tokenId].rarity = rarity;
        beasts[tokenId].rarityRevealed = true;
        vrfPending[tokenId] = false;
        rarityCount[rarity]++;
        
        emit RarityRevealed(tokenId, rarity, randomValue);
    }
    
    function _calculateRarity(uint256 randomValue) internal pure returns (Rarity) {
        if (randomValue < 2) return Rarity.Mythical;      // 0.2%
        if (randomValue < 30) return Rarity.Legendary;    // 2.8%
        if (randomValue < 150) return Rarity.Epic;        // 12%
        if (randomValue < 400) return Rarity.Rare;        // 25%
        return Rarity.Common;                             // 60%
    }
    
    function revealRarityManually(uint256 tokenId) external {
        require(_ownerOf(tokenId) != address(0));
        require(!beasts[tokenId].rarityRevealed);
        require(msg.sender == owner() || msg.sender == ownerOf(tokenId));
        
        uint256 randomValue = uint256(keccak256(
            abi.encodePacked(block.timestamp, block.prevrandao, tokenId, msg.sender)
        )) % 1000;
        
        Rarity rarity = _calculateRarity(randomValue);
        beasts[tokenId].rarity = rarity;
        beasts[tokenId].rarityRevealed = true;
        vrfPending[tokenId] = false;
        rarityCount[rarity]++;
        
        emit RarityRevealed(tokenId, rarity, randomValue);
    }
    
    // ========== 管理功能 ==========
    function setVRFSubscriptionId(uint256 subscriptionId) external onlyOwner {
        s_subscriptionId = subscriptionId;
    }
    
    function updateVRFConfig(bytes32 _keyHash, uint32 _gasLimit, uint16 _confirmations) external onlyOwner {
        s_keyHash = _keyHash;
        s_callbackGasLimit = _gasLimit;
        s_requestConfirmations = _confirmations;
    }
    
    function setShanHaiTokenAddress(address _tokenAddress) external onlyOwner {
        shanHaiTokenAddress = _tokenAddress;
    }
    
    function setMintPrice(uint256 _newPrice) external onlyOwner {
        mintPrice = _newPrice;
    }
    
    function updateIPFS(uint256 tokenId, string memory ipfsUrl) external {
        require(ownerOf(tokenId) == msg.sender || msg.sender == owner());
        beasts[tokenId].ipfsUrl = ipfsUrl;
        _setTokenURI(tokenId, ipfsUrl);
    }
    
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0);
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success);
    }
    
    // ========== 查询函数 ==========
    function getBeastInfo(uint256 tokenId) external view returns (ShanHaiBeast memory) {
        require(_ownerOf(tokenId) != address(0));
        return beasts[tokenId];
    }
    
    function getUserBeasts(address user) external view returns (uint256[] memory) {
        return userBeasts[user];
    }
    
    function getNextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }
    
    function getVRFConfig() external view returns (uint256, bytes32, uint32, uint16) {
        return (s_subscriptionId, s_keyHash, s_callbackGasLimit, s_requestConfirmations);
    }
    
    function getRarityDistribution() external view returns (uint256[5] memory) {
        return [
            rarityCount[Rarity.Common],
            rarityCount[Rarity.Rare],
            rarityCount[Rarity.Epic],
            rarityCount[Rarity.Legendary],
            rarityCount[Rarity.Mythical]
        ];
    }
    
    // ========== TokenURI功能 ==========
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0));
        
        string memory _tokenURI = _tokenURIs[tokenId];
        if (bytes(_tokenURI).length > 0) {
            return _tokenURI;
        }
        
        ShanHaiBeast memory beast = beasts[tokenId];
        if (bytes(beast.ipfsUrl).length > 0) {
            return beast.ipfsUrl;
        }
        
        return "";
    }
    
    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal {
        require(_ownerOf(tokenId) != address(0));
        _tokenURIs[tokenId] = _tokenURI;
    }
    
    // ========== 兼容性函数 ==========
    function getPrompt(uint256 tokenId) external view returns (string memory) {
        require(_ownerOf(tokenId) != address(0));
        ShanHaiBeast memory beast = beasts[tokenId];
        return bytes(beast.ipfsUrl).length > 0 ? beast.ipfsUrl : beast.prompt;
    }
}

interface IShanHaiToken {
    function mintReward(address to) external;
}