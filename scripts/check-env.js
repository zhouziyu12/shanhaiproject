// check-env.js - 环境变量检查脚本
require('dotenv').config({ path: '.env.local' });

function checkEnv() {
  console.log('🔍 检查环境变量配置...\n');

  const configs = [
    {
      name: 'RPC URL',
      keys: ['SEPOLIA_RPC_URL', 'NEXT_PUBLIC_RPC_URL'],
      required: true,
      validate: (value) => value && value.startsWith('http')
    },
    {
      name: '私钥',
      keys: ['VRF_WALLET_PRIVATE_KEY'],
      required: true,
      validate: (value) => {
        if (!value) return false;
        const cleanKey = value.startsWith('0x') ? value.slice(2) : value;
        return cleanKey.length === 64 && /^[a-fA-F0-9]+$/.test(cleanKey);
      },
      display: (value) => value ? `${value.substring(0, 10)}...` : '未设置'
    },
    {
      name: '合约地址',
      keys: ['SHANHAI_NFT_CONTRACT_ADDRESS', 'NEXT_PUBLIC_PROMPT_NFT_ADDRESS'],
      required: true,
      validate: (value) => value && value.startsWith('0x') && value.length === 42
    },
    {
      name: 'VRF订阅ID',
      keys: ['VRF_SUBSCRIPTION_ID'],
      required: true,
      validate: (value) => value && value.length > 10
    },
    {
      name: 'VRF协调器',
      keys: ['VRF_COORDINATOR_ADDRESS'],
      required: true,
      validate: (value) => value && value.startsWith('0x') && value.length === 42
    }
  ];

  let allValid = true;

  configs.forEach(config => {
    const value = config.keys.find(key => process.env[key]) 
      ? process.env[config.keys.find(key => process.env[key])]
      : null;
    
    const isValid = config.validate ? config.validate(value) : !!value;
    const status = isValid ? '✅' : (config.required ? '❌' : '⚠️');
    const displayValue = config.display ? config.display(value) : (value || '未设置');
    
    console.log(`${status} ${config.name}: ${displayValue}`);
    
    if (!isValid && config.required) {
      allValid = false;
      console.log(`   📋 期望格式: ${getExpectedFormat(config.name)}`);
      console.log(`   🔑 环境变量: ${config.keys.join(' 或 ')}`);
    }
    
    console.log('');
  });

  if (allValid) {
    console.log('🎉 所有配置验证通过！可以运行VRF测试了！\n');
    console.log('🚀 运行测试命令:');
    console.log('   node fixed-quick-test.js');
  } else {
    console.log('❌ 配置验证失败，请修复以上问题后重试\n');
    console.log('💡 修复建议:');
    console.log('   1. 检查 .env.local 文件是否存在');
    console.log('   2. 确保私钥格式正确（64位十六进制）');
    console.log('   3. 验证合约地址格式（0x开头，42位）');
    console.log('   4. 确认网络配置正确（Sepolia）');
  }

  return allValid;
}

function getExpectedFormat(configName) {
  switch (configName) {
    case '私钥':
      return '64位十六进制字符串（可选0x前缀）';
    case '合约地址':
    case 'VRF协调器':
      return '0x开头的42位以太坊地址';
    case 'RPC URL':
      return 'https://开头的RPC端点';
    case 'VRF订阅ID':
      return '长数字字符串';
    default:
      return '有效值';
  }
}

// 额外的网络连接测试
async function testConnection() {
  if (!checkEnv()) {
    return;
  }

  console.log('🌐 测试网络连接...\n');

  try {
    const { ethers } = require('ethers');
    
    const rpcUrl = process.env.SEPOLIA_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    console.log('📡 连接到RPC端点...');
    const network = await provider.getNetwork();
    console.log(`✅ 网络: ${network.name} (Chain ID: ${network.chainId})`);
    
    const blockNumber = await provider.getBlockNumber();
    console.log(`✅ 最新区块: ${blockNumber}`);
    
    // 测试钱包
    let privateKey = process.env.VRF_WALLET_PRIVATE_KEY;
    if (!privateKey.startsWith('0x')) {
      privateKey = '0x' + privateKey;
    }
    
    const wallet = new ethers.Wallet(privateKey, provider);
    const balance = await provider.getBalance(wallet.address);
    
    console.log(`✅ 钱包地址: ${wallet.address}`);
    console.log(`✅ ETH余额: ${ethers.formatEther(balance)} ETH`);
    
    if (balance < ethers.parseEther('0.001')) {
      console.log('⚠️  余额较低，建议从水龙头获取更多测试ETH');
      console.log('🚰 Sepolia水龙头: https://faucets.chain.link/sepolia');
    }
    
    // 测试合约
    const contractAddress = process.env.SHANHAI_NFT_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_PROMPT_NFT_ADDRESS;
    const code = await provider.getCode(contractAddress);
    
    if (code === '0x') {
      console.log('❌ 合约未部署或地址错误');
    } else {
      console.log('✅ 合约验证成功');
    }
    
    console.log('\n🎯 网络连接测试完成！可以运行VRF测试了！');
    
  } catch (error) {
    console.log(`❌ 连接测试失败: ${error.message}`);
    
    if (error.message.includes('invalid private key')) {
      console.log('💡 私钥格式错误，请检查配置');
    } else if (error.message.includes('network')) {
      console.log('💡 网络连接问题，请检查RPC URL');
    }
  }
}

// 运行检查
if (require.main === module) {
  console.log('🧪 环境配置检查工具\n');
  testConnection();
}