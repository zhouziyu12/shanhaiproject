// 快速配置检查脚本
import dotenv from 'dotenv';
import { ethers } from 'ethers';

// 加载环境变量
dotenv.config({ path: '../.env.local' });

async function checkConfig() {
  console.log('🔍 检查测试环境配置...');
  console.log('');
  
  // 检查环境变量
  const rpcUrl = process.env.SEPOLIA_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;
  const privateKey = process.env.PRIVATE_KEY;
  const contractAddress = '0x1C466dbDddb23e123760A2EDCce54b1709Fa735A';
  
  console.log('📋 环境变量检查:');
  console.log(`  RPC URL: ${rpcUrl ? '✅ 已设置' : '❌ 未设置'}`);
  console.log(`  私钥: ${privateKey ? '✅ 已设置' : '❌ 未设置'}`);
  console.log(`  合约地址: ${contractAddress}`);
  console.log('');
  
  if (!rpcUrl || !privateKey) {
    console.log('❌ 配置不完整，请编辑 .env.local 文件');
    return false;
  }
  
  try {
    // 测试网络连接
    console.log('🌐 测试网络连接...');
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const blockNumber = await provider.getBlockNumber();
    console.log(`  ✅ 网络连接成功，当前区块: ${blockNumber}`);
    
    // 检查钱包
    const wallet = new ethers.Wallet(privateKey, provider);
    const address = await wallet.getAddress();
    const balance = await wallet.getBalance();
    
    console.log('💰 钱包检查:');
    console.log(`  地址: ${address}`);
    console.log(`  余额: ${ethers.formatEther(balance)} ETH`);
    
    if (balance < ethers.parseEther('0.01')) {
      console.log('  ⚠️ 余额可能不足，建议至少有 0.01 ETH');
      console.log('  💡 获取测试ETH: https://sepoliafaucet.com/');
    } else {
      console.log('  ✅ 余额充足');
    }
    
    console.log('');
    console.log('✅ 配置检查完成！可以运行测试了');
    console.log('🚀 运行命令: npm run test-nft-vrf');
    
    return true;
    
  } catch (error) {
    console.error('❌ 连接测试失败:', error.message);
    return false;
  }
}

checkConfig();
