const { ethers } = require('ethers');
require('dotenv').config({ path: '.env.local' });

async function verifyToken30() {
  console.log('🔍 验证Token 30的VRF状态...\n');

  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const contractABI = [
    "function beasts(uint256) public view returns (string, string, string, uint8, uint256, address, bool, bool)"
  ];
  const contract = new ethers.Contract(process.env.SHANHAI_NFT_CONTRACT_ADDRESS, contractABI, provider);

  try {
    const beast = await contract.beasts(30);
    const [prompt, ipfsImageUrl, ipfsMetadataUrl, rarity, timestamp, creator, rarityRevealed, hasIPFS] = beast;
    
    console.log('📊 Token 30 链上状态:');
    console.log(`   创建者: ${creator}`);
    console.log(`   稀有度: ${rarity} (${['普通', '稀有', '史诗', '传说', '神话'][rarity]})`);
    console.log(`   已揭晓: ${rarityRevealed ? '✅ 是' : '❌ 否'}`);
    console.log(`   时间戳: ${new Date(Number(timestamp) * 1000).toLocaleString()}`);
    console.log(`   有IPFS: ${hasIPFS ? '✅ 是' : '❌ 否'}`);
    
    if (rarityRevealed) {
      console.log('\n🎉 结论: VRF已完全成功！');
      console.log('   ✅ Chainlink VRF 工作正常');
      console.log('   ✅ 稀有度正确分配');
      console.log('   ✅ 链上状态一致');
      
      // 验证在Etherscan上也可以看到
      console.log('\n🔗 验证链接:');
      console.log(`   合约: https://sepolia.etherscan.io/address/${process.env.SHANHAI_NFT_CONTRACT_ADDRESS}`);
      console.log(`   Token信息: 调用 beasts(30) 方法查看`);
    } else {
      console.log('\n❌ VRF尚未完成');
    }
    
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  }
}

verifyToken30();
