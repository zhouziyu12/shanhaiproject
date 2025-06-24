// 快速VRF检查脚本 - 检查现有Token的VRF真实性
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量 - 尝试多个可能的路径
const envPaths = [
  join(__dirname, '../.env.local'),
  join(__dirname, '../.env'),
  '.env.local',
  '.env'
];

let envLoaded = false;
for (const envPath of envPaths) {
  try {
    const result = dotenv.config({ path: envPath });
    if (result.parsed) {
      console.log(`✅ 已加载环境变量: ${envPath}`);
      envLoaded = true;
      break;
    }
  } catch (error) {
    // 继续尝试下一个路径
  }
}

if (!envLoaded) {
  console.log('⚠️ 未找到.env文件，使用系统环境变量');
}

const CONFIG = {
  RPC_URL: process.env.SEPOLIA_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL,
  CONTRACT_ADDRESS: process.env.SHANHAI_NFT_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_PROMPT_NFT_ADDRESS,
  VRF_COORDINATOR: '0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625'
};

// 验证配置
console.log('📋 配置验证:');
console.log(`  RPC URL: ${CONFIG.RPC_URL ? '✅ 已设置' : '❌ 未设置'}`);
console.log(`  合约地址: ${CONFIG.CONTRACT_ADDRESS ? '✅ 已设置' : '❌ 未设置'}`);
console.log(`  VRF协调器: ${CONFIG.VRF_COORDINATOR ? '✅ 已设置' : '❌ 未设置'}`);

if (!CONFIG.RPC_URL) {
  console.error('❌ 错误: RPC_URL 未配置');
  console.log('请在 .env.local 中设置:');
  console.log('SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY');
  console.log('或');
  console.log('NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY');
  process.exit(1);
}

if (!CONFIG.CONTRACT_ADDRESS) {
  console.error('❌ 错误: CONTRACT_ADDRESS 未配置');
  console.log('请在 .env.local 中设置:');
  console.log('SHANHAI_NFT_CONTRACT_ADDRESS=0x你的合约地址');
  console.log('或');
  console.log('NEXT_PUBLIC_PROMPT_NFT_ADDRESS=0x你的合约地址');
  process.exit(1);
}

console.log('');

// 简化的ABI
const NFT_ABI = [
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "beasts",
    "outputs": [
      {"name": "prompt", "type": "string"},
      {"name": "ipfsImageUrl", "type": "string"}, 
      {"name": "ipfsMetadataUrl", "type": "string"},
      {"name": "rarity", "type": "uint8"},
      {"name": "timestamp", "type": "uint256"},
      {"name": "creator", "type": "address"},
      {"name": "rarityRevealed", "type": "bool"},
      {"name": "hasIPFS", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "tokenId", "type": "uint256"},
      {"indexed": false, "name": "requestId", "type": "uint256"}
    ],
    "name": "RarityRequested",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "tokenId", "type": "uint256"},
      {"indexed": false, "name": "rarity", "type": "uint8"},
      {"indexed": false, "name": "randomValue", "type": "uint256"}
    ],
    "name": "RarityRevealed",
    "type": "event"
  }
];

const VRF_COORDINATOR_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "requestId", "type": "uint256"},
      {"indexed": false, "name": "outputSeed", "type": "uint256"},
      {"indexed": false, "name": "payment", "type": "uint256"},
      {"indexed": false, "name": "success", "type": "bool"}
    ],
    "name": "RandomWordsFulfilled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "keyHash", "type": "bytes32"},
      {"indexed": false, "name": "requestId", "type": "uint256"},
      {"indexed": false, "name": "preSeed", "type": "uint256"},
      {"indexed": true, "name": "subId", "type": "uint64"},
      {"indexed": false, "name": "minimumRequestConfirmations", "type": "uint16"},
      {"indexed": false, "name": "callbackGasLimit", "type": "uint32"},
      {"indexed": false, "name": "numWords", "type": "uint32"},
      {"indexed": true, "name": "sender", "type": "address"}
    ],
    "name": "RandomWordsRequested",
    "type": "event"
  }
];

async function quickVRFCheck(tokenId) {
  console.log(`🔍 快速检查Token ${tokenId}的VRF真实性...`);
  
  const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
  const contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, NFT_ABI, provider);
  const vrfCoordinator = new ethers.Contract(CONFIG.VRF_COORDINATOR, VRF_COORDINATOR_ABI, provider);
  
  try {
    // 测试网络连接
    console.log(`  📡 测试网络连接...`);
    const blockNumber = await provider.getBlockNumber();
    console.log(`  ✅ 当前区块: ${blockNumber}`);
    
    // 1. 获取Token基本信息
    console.log(`  📊 获取Token ${tokenId}信息...`);
    const beastInfo = await contract.beasts(BigInt(tokenId));
    
    console.log('📊 Token信息:');
    console.log(`  稀有度: ${beastInfo.rarity}`);
    console.log(`  已揭晓: ${beastInfo.rarityRevealed}`);
    console.log(`  创建者: ${beastInfo.creator}`);
    
    if (!beastInfo.rarityRevealed) {
      console.log('⚠️ 稀有度尚未揭晓，无法检查VRF');
      return {
        tokenId,
        rarity: null,
        rarityRevealed: false,
        isRealVRF: null,
        message: '稀有度尚未揭晓'
      };
    }
    
    // 2. 查找VRF事件
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 100000);
    
    console.log(`🔍 搜索VRF事件 (区块 ${fromBlock} - ${currentBlock})...`);
    
    // 查找RarityRequested
    console.log(`  🔍 查找RarityRequested事件...`);
    const requestFilter = contract.filters.RarityRequested(tokenId);
    const requestEvents = await contract.queryFilter(requestFilter, fromBlock, currentBlock);
    
    // 查找RarityRevealed
    console.log(`  🔍 查找RarityRevealed事件...`);
    const revealFilter = contract.filters.RarityRevealed(tokenId);
    const revealEvents = await contract.queryFilter(revealFilter, fromBlock, currentBlock);
    
    let vrfRequestId = null;
    let randomValue = null;
    
    if (requestEvents.length > 0) {
      vrfRequestId = requestEvents[0].args.requestId.toString();
      console.log(`✅ 找到VRF请求: ${vrfRequestId}`);
    } else {
      console.log(`❌ 未找到VRF请求事件`);
    }
    
    if (revealEvents.length > 0) {
      randomValue = revealEvents[0].args.randomValue.toString();
      console.log(`✅ 找到随机数: ${randomValue}`);
    } else {
      console.log(`❌ 未找到随机数事件`);
    }
    
    // 3. 检查VRF协调器事件
    let isRealVRF = false;
    
    if (vrfRequestId) {
      console.log('🎲 检查Chainlink VRF协调器事件...');
      
      const fulfillFilter = vrfCoordinator.filters.RandomWordsFulfilled();
      const fulfillEvents = await vrfCoordinator.queryFilter(fulfillFilter, fromBlock, currentBlock);
      
      console.log(`  📋 找到 ${fulfillEvents.length} 个VRF履行事件`);
      
      const matchingFulfill = fulfillEvents.find(event => 
        event.args.requestId.toString() === vrfRequestId
      );
      
      if (matchingFulfill) {
        isRealVRF = true;
        console.log(`✅ 找到Chainlink VRF履行事件！`);
        console.log(`  请求ID: ${vrfRequestId}`);
        console.log(`  成功状态: ${matchingFulfill.args.success}`);
        console.log(`  区块号: ${matchingFulfill.blockNumber}`);
      } else {
        console.log(`❌ 未找到对应的Chainlink VRF履行事件`);
        console.log(`  搜索的请求ID: ${vrfRequestId}`);
      }
    } else {
      console.log('⚠️ 没有VRF请求ID，跳过协调器检查');
    }
    
    // 4. 生成检查结果
    console.log('');
    console.log('🏆 VRF真实性检查结果:');
    console.log(`Token ID: ${tokenId}`);
    console.log(`稀有度: ${beastInfo.rarity}`);
    console.log(`随机数: ${randomValue || '未找到'}`);
    console.log(`VRF请求ID: ${vrfRequestId || '未找到'}`);
    
    if (isRealVRF) {
      console.log('');
      console.log('✅ 结论: 使用了真实的Chainlink VRF!');
      console.log('🔒 这个Token的稀有度是通过去中心化预言机网络生成的');
      console.log('🎲 随机数无法被预测或操控，完全公平');
    } else if (randomValue) {
      console.log('');
      console.log('⚠️ 结论: 疑似使用了备用随机数机制');
      console.log('🔧 可能是合约内部生成或其他非VRF来源');
      console.log('⚡ 建议检查VRF配置是否正确');
    } else {
      console.log('');
      console.log('❌ 结论: 未找到随机数或VRF数据');
      console.log('🔍 可能Token还在处理中或VRF配置有问题');
    }
    
    return {
      tokenId,
      rarity: parseInt(beastInfo.rarity.toString()),
      randomValue,
      vrfRequestId,
      isRealVRF,
      hasRandomValue: !!randomValue,
      hasVRFRequest: !!vrfRequestId
    };
    
  } catch (error) {
    console.error(`❌ 检查Token ${tokenId}失败:`, error);
    throw error;
  }
}

// 批量检查多个Token
async function batchVRFCheck(tokenIds) {
  console.log(`🔍 批量检查 ${tokenIds.length} 个Token的VRF真实性...`);
  console.log('');
  
  const results = [];
  
  for (const tokenId of tokenIds) {
    try {
      console.log(`--- Token ${tokenId} ---`);
      const result = await quickVRFCheck(tokenId);
      results.push(result);
      console.log('');
    } catch (error) {
      console.error(`Token ${tokenId} 检查失败:`, error.message);
      results.push({
        tokenId,
        error: error.message,
        isRealVRF: false
      });
      console.log('');
    }
  }
  
  // 汇总统计
  const realVRFCount = results.filter(r => r.isRealVRF).length;
  const hasRandomCount = results.filter(r => r.hasRandomValue).length;
  
  console.log('📊 批量检查汇总:');
  console.log(`总检查数量: ${results.length}`);
  console.log(`使用真实VRF: ${realVRFCount} (${Math.round(realVRFCount/results.length*100)}%)`);
  console.log(`有随机数: ${hasRandomCount} (${Math.round(hasRandomCount/results.length*100)}%)`);
  
  return results;
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('使用方法:');
    console.log('  检查单个Token: node quick-vrf-check.js 80');
    console.log('  检查多个Token: node quick-vrf-check.js 80,81,82');
    console.log('  检查范围Token: node quick-vrf-check.js 80-85');
    return;
  }
  
  let tokenIds = [];
  
  // 解析参数
  const input = args[0];
  if (input.includes(',')) {
    // 逗号分隔: 80,81,82
    tokenIds = input.split(',').map(id => parseInt(id.trim()));
  } else if (input.includes('-')) {
    // 范围: 80-85
    const [start, end] = input.split('-').map(id => parseInt(id.trim()));
    for (let i = start; i <= end; i++) {
      tokenIds.push(i);
    }
  } else {
    // 单个: 80
    tokenIds = [parseInt(input)];
  }
  
  console.log(`🎯 准备检查Token: ${tokenIds.join(', ')}`);
  console.log('');
  
  try {
    if (tokenIds.length === 1) {
      await quickVRFCheck(tokenIds[0]);
    } else {
      await batchVRFCheck(tokenIds);
    }
  } catch (error) {
    console.error('❌ 检查失败:', error);
    process.exit(1);
  }
}

// 运行
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { quickVRFCheck, batchVRFCheck };
