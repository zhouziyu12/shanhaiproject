// scripts/test-vrf.mjs
import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

// ======== 配置区 ========
const RPC_URL            = 'https://sepolia.infura.io/v3/315dbedded6b4b37a95b73281cb81e22';          // https://eth-sepolia.g.alchemy.com/v2/xxx
const PRIVATE_KEY        = '0x019ef439d8a1a061e5e1ac1f4be7ca2bea83f87f84e08a427a5ff1dc6f7fba55';            // 0x...
const NFT_ADDRESS        = "0x1C466dbDddb23e123760A2EDCce54b1709Fa735A";
const VRF_POLL_INTERVAL  = 15_000;  // 15s 轮询
const MINT_FEE_ETH       = "0.001"; // 基础铸造费
const NUMBER_TO_MINT     = 1;       // 想一次测几枚改这里
// ===================================

// 与前端保持一致的精简 ABI（只放我们用得到的函数 / 事件）
const ABI = [
  // mintNFT(address to,string tokenURI,uint256 discountPercent)
  "function mintNFT(address to,string uri,uint256 discountPercent) payable returns(uint256 tokenId)",
  "event RarityRevealed(uint256 indexed tokenId,uint8 rarity,uint256 randomWord)"
];

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet   = new ethers.Wallet(PRIVATE_KEY, provider);
const nft      = new ethers.Contract(NFT_ADDRESS, ABI, wallet);
const iface    = new ethers.Interface(ABI);

console.log("▶️  钱包地址:", wallet.address);
console.log("▶️  目标网络区块高度:", await provider.getBlockNumber());

async function main() {
  for (let i = 0; i < NUMBER_TO_MINT; i++) {
    console.log(`\n🔨 铸造第 ${i + 1} 个 NFT...`);

    // 这里只写一个随便的占位 URI，真跑时放你上传到 IPFS 的 metadata
    const dummyURI = `ipfs://dummy-${Date.now() + i}`;

    try {
      const tx = await nft.mintNFT(
        wallet.address,
        dummyURI,
        0,                                      // 不使用折扣
        { value: ethers.parseEther(MINT_FEE_ETH) }
      );
      console.log("⏳ 等待交易确认:", tx.hash);
      const receipt = await tx.wait();
      const tokenId = receipt.logs                // 找到 Transfer 事件里的 tokenId
        .map(l => iface.parseLog(l).args?.tokenId)
        .find(Boolean);

      console.log(`✅ 铸造成功，TokenID = ${tokenId}`);

      // 开始监听 VRF 事件
      await waitForRarity(tokenId);
    } catch (err) {
      console.error("❌ 铸造被合约回滚：", err);
    }
  }
  process.exit(0);
}

// 轮询链上事件 / filter 监听均可。下面用简单轮询，避免节点 WS 订阅问题
async function waitForRarity(tokenId) {
  console.log(`🔍 监听 VRF -> RarityRevealed (token ${tokenId}) ...`);
  const filter = {
    address: NFT_ADDRESS,
    topics: [ethers.id("RarityRevealed(uint256,uint8,uint256)"), ethers.zeroPadValue(ethers.toBeHex(tokenId), 32)]
  };

  while (true) {
    try {
      const logs = await provider.getLogs({ ...filter, fromBlock: "latest".toString() });
      if (logs.length) {
        const { args } = iface.parseLog(logs[0]);
        console.log(`🎉 VRF 完成！Token ${args.tokenId} 稀有度=${args.rarity} Random=${args.randomWord}`);
        break;
      }
    } catch (err) {
      console.error("⚠️ 查询日志出错：", err);
    }
    await new Promise(r => setTimeout(r, VRF_POLL_INTERVAL));
  }
}

main();
