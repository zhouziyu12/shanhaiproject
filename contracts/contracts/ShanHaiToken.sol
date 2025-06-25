// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ShanHaiToken is ERC20, Ownable, ReentrancyGuard {
    
    // 基础配置
    uint256 public constant INITIAL_SUPPLY = 10_000_000 * 10**18; // 1000万初始供应量
    uint256 public constant DAILY_REWARD = 100 * 10**18;          // 每日签到奖励 100 SHT
    uint256 public constant MINT_REWARD = 50 * 10**18;            // NFT铸造奖励 50 SHT
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10**18;    // 最大供应量 1亿
    
    // Automation奖励配置
    uint256 public constant AUTO_BASE_REWARD = 10 * 10**18;       // Automation基础奖励 10 SHT
    uint256 public automationRewardPool = 50_000_000 * 10**18;    // Automation奖励池 5000万
    uint256 public totalAutomationRewards;                        // 已发放的Automation奖励
    
    // 用户数据结构
    struct UserStats {
        uint256 lastClaimTime;     // 上次签到时间
        uint256 consecutiveDays;   // 连续签到天数
        uint256 totalClaimed;      // 累计签到领取
        uint256 mintCount;         // 铸造NFT次数
        uint256 automationRewards; // Automation累计奖励
        uint256 lastAutoReward;    // 上次自动奖励时间
    }
    
    // 映射存储
    mapping(address => UserStats) public userStats;
    mapping(address => bool) public authorizedMinters;    // 授权的NFT合约
    mapping(address => bool) public authorizedAutomation; // 授权的Automation合约
    
    // Automation配置
    mapping(address => bool) public autoRewardHolders;    // 加入自动奖励的持有者
    address[] public allAutoHolders;                      // 所有自动奖励持有者列表
    mapping(address => uint256) public holderIndex;       // 持有者在数组中的索引
    
    // 事件
    event DailyRewardClaimed(address indexed user, uint256 amount, uint256 consecutiveDays);
    event MintReward(address indexed user, uint256 amount);
    event AutomationReward(address indexed user, uint256 amount, string reason);
    event BatchAutomationRewards(address[] users, uint256[] amounts, uint256 totalAmount);
    event HolderAddedToAuto(address indexed holder);
    event HolderRemovedFromAuto(address indexed holder);
    event AuthorizedMinterAdded(address indexed minter);
    event AuthorizedMinterRemoved(address indexed minter);
    event AuthorizedAutomationAdded(address indexed automation);
    event AuthorizedAutomationRemoved(address indexed automation);
    event Airdrop(address[] recipients, uint256[] amounts);
    
    constructor() ERC20("ShanHai Token", "SHT") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
    
    // ========== 每日签到系统 ==========
    
    function claimDailyReward() external nonReentrant {
        UserStats storage stats = userStats[msg.sender];
        
        require(canClaimToday(msg.sender), "Already claimed today");
        require(totalSupply() + DAILY_REWARD <= MAX_SUPPLY, "Max supply reached");
        
        uint256 reward = DAILY_REWARD;
        
        // 连续签到加成
        if (isConsecutiveDay(msg.sender)) {
            stats.consecutiveDays++;
            // 每7天增加10%奖励，最高50%
            uint256 bonus = (stats.consecutiveDays / 7) * 10;
            if (bonus > 50) bonus = 50;
            reward = reward * (100 + bonus) / 100;
        } else {
            stats.consecutiveDays = 1;
        }
        
        stats.lastClaimTime = block.timestamp;
        stats.totalClaimed += reward;
        
        _mint(msg.sender, reward);
        
        emit DailyRewardClaimed(msg.sender, reward, stats.consecutiveDays);
    }
    
    function canClaimToday(address user) public view returns (bool) {
        uint256 lastClaim = userStats[user].lastClaimTime;
        return block.timestamp >= lastClaim + 24 hours;
    }
    
    function isConsecutiveDay(address user) internal view returns (bool) {
        uint256 lastClaim = userStats[user].lastClaimTime;
        if (lastClaim == 0) return false;
        return block.timestamp <= lastClaim + 48 hours;
    }
    
    // ========== NFT铸造奖励系统 ==========
    
    function mintReward(address to) external {
        require(authorizedMinters[msg.sender], "Not authorized minter");
        require(totalSupply() + MINT_REWARD <= MAX_SUPPLY, "Max supply reached");
        
        userStats[to].mintCount++;
        _mint(to, MINT_REWARD);
        
        emit MintReward(to, MINT_REWARD);
    }
    
    function addAuthorizedMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = true;
        emit AuthorizedMinterAdded(minter);
    }
    
    function removeAuthorizedMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
        emit AuthorizedMinterRemoved(minter);
    }
    
    // ========== Automation自动奖励系统 ==========
    
    function batchAutomationReward(
        address[] calldata holders, 
        uint256[] calldata amounts
    ) external nonReentrant {
        require(authorizedAutomation[msg.sender], "Not authorized automation");
        require(holders.length == amounts.length, "Arrays length mismatch");
        require(holders.length > 0, "Empty arrays");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        require(
            totalAutomationRewards + totalAmount <= automationRewardPool,
            "Automation reward pool exhausted"
        );
        require(totalSupply() + totalAmount <= MAX_SUPPLY, "Max supply reached");
        
        // 批量发放奖励
        for (uint256 i = 0; i < holders.length; i++) {
            if (amounts[i] > 0) {
                _mint(holders[i], amounts[i]);
                userStats[holders[i]].automationRewards += amounts[i];
                userStats[holders[i]].lastAutoReward = block.timestamp;
                emit AutomationReward(holders[i], amounts[i], "Daily Auto Reward");
            }
        }
        
        totalAutomationRewards += totalAmount;
        emit BatchAutomationRewards(holders, amounts, totalAmount);
    }
    
    function singleAutomationReward(address holder, uint256 amount, string calldata reason) external nonReentrant {
        require(authorizedAutomation[msg.sender], "Not authorized automation");
        require(amount > 0, "Amount must be greater than 0");
        require(
            totalAutomationRewards + amount <= automationRewardPool,
            "Automation reward pool exhausted"
        );
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply reached");
        
        _mint(holder, amount);
        userStats[holder].automationRewards += amount;
        userStats[holder].lastAutoReward = block.timestamp;
        totalAutomationRewards += amount;
        
        emit AutomationReward(holder, amount, reason);
    }
    
    function addAuthorizedAutomation(address automation) external onlyOwner {
        require(automation != address(0), "Invalid automation address");
        authorizedAutomation[automation] = true;
        emit AuthorizedAutomationAdded(automation);
    }
    
    function removeAuthorizedAutomation(address automation) external onlyOwner {
        authorizedAutomation[automation] = false;
        emit AuthorizedAutomationRemoved(automation);
    }
    
    // ========== 持有者管理（供Automation调用）==========
    
    function addToAutoRewards(address holder) external {
        require(
            authorizedAutomation[msg.sender] || msg.sender == owner(),
            "Not authorized"
        );
        require(holder != address(0), "Invalid holder");
        require(!autoRewardHolders[holder], "Already added");
        
        autoRewardHolders[holder] = true;
        holderIndex[holder] = allAutoHolders.length;
        allAutoHolders.push(holder);
        
        emit HolderAddedToAuto(holder);
    }
    
    function removeFromAutoRewards(address holder) external {
        require(
            authorizedAutomation[msg.sender] || msg.sender == owner(),
            "Not authorized"
        );
        require(autoRewardHolders[holder], "Not in auto rewards");
        
        autoRewardHolders[holder] = false;
        
        // 从数组中移除
        uint256 index = holderIndex[holder];
        uint256 lastIndex = allAutoHolders.length - 1;
        
        if (index != lastIndex) {
            address lastHolder = allAutoHolders[lastIndex];
            allAutoHolders[index] = lastHolder;
            holderIndex[lastHolder] = index;
        }
        
        allAutoHolders.pop();
        delete holderIndex[holder];
        
        emit HolderRemovedFromAuto(holder);
    }
    
    function getAllAutoHolders() external view returns (address[] memory) {
        return allAutoHolders;
    }
    
    function getAutoHoldersCount() external view returns (uint256) {
        return allAutoHolders.length;
    }
    
    function isInAutoRewards(address holder) external view returns (bool) {
        return autoRewardHolders[holder];
    }
    
    // ========== 空投功能 ==========
    
    function airdrop(address[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        require(totalSupply() + totalAmount <= MAX_SUPPLY, "Max supply exceeded");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
        }
        
        emit Airdrop(recipients, amounts);
    }
    
    // ========== 查询函数 ==========
    
    function getUserStats(address user) external view returns (UserStats memory) {
        return userStats[user];
    }
    
    function getNextClaimTime(address user) external view returns (uint256) {
        uint256 lastClaim = userStats[user].lastClaimTime;
        if (lastClaim == 0) return block.timestamp;
        return lastClaim + 24 hours;
    }
    
    function calculateDailyReward(address user) external view returns (uint256) {
        if (!canClaimToday(user)) return 0;
        
        uint256 reward = DAILY_REWARD;
        if (isConsecutiveDay(user)) {
            uint256 consecutiveDays = userStats[user].consecutiveDays + 1;
            uint256 bonus = (consecutiveDays / 7) * 10;
            if (bonus > 50) bonus = 50;
            reward = reward * (100 + bonus) / 100;
        }
        
        return reward;
    }
    
    function getRemainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }
    
    function getAutomationPoolInfo() external view returns (
        uint256 poolSize,
        uint256 distributed,
        uint256 remaining
    ) {
        return (
            automationRewardPool,
            totalAutomationRewards,
            automationRewardPool - totalAutomationRewards
        );
    }
    
    function isAuthorizedMinter(address minter) external view returns (bool) {
        return authorizedMinters[minter];
    }
    
    function isAuthorizedAutomation(address automation) external view returns (bool) {
        return authorizedAutomation[automation];
    }
    
    // ========== 管理功能 ==========
    
    function setAutomationRewardPool(uint256 newPoolSize) external onlyOwner {
        require(newPoolSize >= totalAutomationRewards, "Pool size too small");
        automationRewardPool = newPoolSize;
    }
    
    bool public paused = false;
    
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
    }
    
    function transfer(address to, uint256 amount) public override returns (bool) {
        require(!paused, "Contract is paused");
        return super.transfer(to, amount);
    }
    
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        require(!paused, "Contract is paused");
        return super.transferFrom(from, to, amount);
    }
}
