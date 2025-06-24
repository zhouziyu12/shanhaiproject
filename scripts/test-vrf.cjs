// 引入所需模块
const { ethers } = require("ethers");
const axios = require("axios");

// 配置：网络和身份
const RPC_URL = "https://sepolia.infura.io/v3/315dbedded6b4b37a95b73281cb81e22";  // Infura Sepolia RPC
const PRIVATE_KEY = "0x019ef439d8a1a061e5e1ac1f4be7ca2bea83f87f84e08a427a5ff1dc6f7fba55"; // 测试钱包私钥
const CONTRACT_ADDRESS = "0x1C466dbDddb23e123760A2EDCce54b1709Fa735A";                // NFT合约地址
const VRF_API_URL = "http://localhost:3000/api/vrf-request";                            // 本地 VRF 监听服务 API

// 初始化以太坊提供者和钱包签名器
const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);

// 合约ABI片段：仅包含mint函数签名（假定mint需要传入tokenURI，且需要支付一定ETH）
const contractABI = [
    "function mint(string tokenURI) public payable"  // NFT合约的mint函数 (payable 以防需要支付mint费用)
];
const nftContract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

(async () => {
  try {
    // 循环铸造3个NFT
    for (let i = 1; i <= 3; i++) {
      console.log(`\n铸造第 ${i} 个 NFT...`);
      
      // 1. 调用合约mint函数铸造NFT（发送交易）
      // 如果mint需要支付费用，这里附带0.001 ETH价值；如果不需要支付，则不会扣费
      const tx = await nftContract.mint("ipfs://test-uri", {
        value: ethers.parseUnits("0.001", "ether")   // 发送0.001 ETH (根据合约要求支付)
      });
      console.log("  提交交易哈希:", tx.hash);
      
      // 等待交易确认完成
      const receipt = await tx.wait();
      if (receipt.status !== 1) {
        console.error("  交易失败，状态码:", receipt.status);
        continue;  // 跳过本轮循环
      }
      console.log("  交易已确认，在区块:", receipt.blockNumber);
      
      // 2. 从交易日志中获取新铸造的 tokenId
      let tokenId = null;
      const transferEventSignature = ethers.keccak256(ethers.toUtf8Bytes("Transfer(address,address,uint256)")); 
      for (const log of receipt.logs) {
        // 筛选出合约地址匹配且事件签名为Transfer的日志
        if (log.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase() && log.topics[0] === transferEventSignature) {
          // Transfer事件的第3个主题参数为tokenId（索引2，从0开始计数）
          tokenId = BigInt(log.topics[3]).toString();
          break;
        }
      }
      if (!tokenId) {
        console.error("  未找到 Transfer 日志，无法获取 tokenId");
        continue;
      }
      console.log(`  新 NFT 已铸造，tokenId = ${tokenId}`);
      
      // 3. 调用本地 VRF API，触发 VRF 请求监听
      try {
        const response = await axios.post(VRF_API_URL, { tokenId: tokenId, requester: CONTRACT_ADDRESS });
        const data = response.data;
        // 判断 VRF 随机数是否成功揭晓（fulfilled）
        if (data && data.fulfilled) {
          console.log(`  VRF 请求已完成，随机事件成功揭晓（fulfilled = ${data.fulfilled}）`);
        } else {
          console.log(`  VRF 请求发送成功，但尚未完成揭晓（response = ${JSON.stringify(data) || '无数据'}）`);
        }
      } catch (err) {
        console.error("  调用 VRF API 时出错：", err.message);
      }
    }
  } catch (error) {
    console.error("脚本运行出错：", error);
  }
})();
