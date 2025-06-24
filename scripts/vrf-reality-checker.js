// VRF真实性检测脚本 - 验证是否真正使用Chainlink VRF
import { ethers } from 'ethers';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '../.env.local' });

// 配置
const CONFIG = {
  RPC_URL: process.env.SEPOLIA_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL,
  CONTRACT_ADDRESS: process.env.SHANHAI_NFT_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_PROMPT_NFT_ADDRESS,
  VRF_COORDINATOR: '0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625', // Sepolia VRF Coordinator
  PRIVATE_KEY: process.env.PRIVATE_KEY
};

// 合约ABI
const SHANHAI_NFT_ABI = [
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
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "vrfPending",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "prompt", "type": "string"}],
    "name": "mint",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "revealRarity",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // 事件
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "tokenId", "type": "uint256"},
      {"indexed": true, "name": "creator", "type": "address"},
      {"indexed": false, "name": "prompt", "type": "string"}
    ],
    "name": "TokenMinted",
    "type": "event"
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

// Chainlink VRF Coordinator ABI (简化版)
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

class VRFRealityChecker {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    this.wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, this.provider);
    this.contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, SHANHAI_NFT_ABI, this.wallet);
    this.vrfCoordinator = new ethers.Contract(CONFIG.VRF_COORDINATOR, VRF_COORDINATOR_ABI, this.provider);
  }

  // 🎯 主要检测函数：创建NFT并检测VRF真实性
  async testVRFReality() {
    console.log('🔬 开始VRF真实性检测...');
    console.log('📊 配置信息:');
    console.log(`  - 合约地址: ${CONFIG.CONTRACT_ADDRESS}`);
    console.log(`  - VRF协调器: ${CONFIG.VRF_COORDINATOR}`);
    console.log(`  - 网络: Sepolia`);
    console.log('');

    try {
      // 第一步：创建NFT
      const tokenId = await this.createTestNFT();
      
      // 第二步：监控VRF过程
      const vrfData = await this.monitorVRFProcess(tokenId);
      
      // 第三步：验证VRF真实性
      const realityCheck = await this.verifyVRFReality(tokenId, vrfData);
      
      // 第四步：生成详细报告
      this.generateVRFReport(tokenId, vrfData, realityCheck);
      
      return realityCheck;
      
    } catch (error) {
      console.error('❌ VRF检测失败:', error);
      throw error;
    }
  }

  // 🎨 创建测试NFT
  async createTestNFT() {
    console.log('🎨 第一步：创建测试NFT...');
    
    const prompt = `VRF测试神兽 ${Date.now()}`;
    console.log(`📝 测试描述: ${prompt}`);
    
    try {
      const mintTx = await this.contract.mint(prompt, {
        value: ethers.parseEther('0.001'),
        gasLimit: 500000
      });
      
      console.log(`📤 Mint交易已提交: ${mintTx.hash}`);
      console.log('⏳ 等待交易确认...');
      
      const receipt = await mintTx.wait();
      console.log(`✅ 交易已确认，区块: ${receipt.blockNumber}`);
      
      // 解析TokenMinted事件获取tokenId
      const tokenId = await this.extractTokenIdFromReceipt(receipt);
      console.log(`🎯 NFT创建成功! Token ID: ${tokenId}`);
      console.log('');
      
      return tokenId;
      
    } catch (error) {
      console.error('❌ NFT创建失败:', error);
      throw error;
    }
  }

  // 📊 从交易回执中提取tokenId
  async extractTokenIdFromReceipt(receipt) {
    for (const log of receipt.logs) {
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: log.topics,
          data: log.data
        });
        
        if (parsedLog.name === 'TokenMinted') {
          return parseInt(parsedLog.args.tokenId.toString());
        }
      } catch (e) {
        // 跳过无法解析的日志
      }
    }
    
    throw new Error('无法从交易回执中获取tokenId');
  }

  // 🔄 监控VRF处理过程
  async monitorVRFProcess(tokenId) {
    console.log(`🔄 第二步：监控Token ${tokenId}的VRF处理过程...`);
    
    const startTime = Date.now();
    const maxWaitTime = 10 * 60 * 1000; // 10分钟
    const pollInterval = 5000; // 5秒
    let pollCount = 0;
    
    const vrfData = {
      tokenId,
      startTime,
      vrfRequestId: null,
      vrfRequestBlock: null,
      vrfRequestTx: null,
      vrfFulfillBlock: null,
      vrfFulfillTx: null,
      randomValue: null,
      rarity: null,
      isRealVRF: false,
      coordinatorEvents: [],
      contractEvents: []
    };

    return new Promise((resolve, reject) => {
      const checkVRF = async () => {
        try {
          pollCount++;
          const elapsed = Date.now() - startTime;
          
          console.log(`🔍 轮询 ${pollCount} - 已等待 ${Math.round(elapsed/1000)}秒`);
          
          // 检查超时
          if (elapsed > maxWaitTime) {
            console.log('⏰ 监控超时');
            resolve(vrfData);
            return;
          }
          
          // 检查链上状态
          const beastInfo = await this.contract.beasts(BigInt(tokenId));
          const isPending = await this.contract.vrfPending(BigInt(tokenId));
          
          console.log(`  - 稀有度已揭晓: ${beastInfo.rarityRevealed}`);
          console.log(`  - VRF待处理: ${isPending}`);
          
          // 如果稀有度已揭晓，收集所有VRF相关数据
          if (beastInfo.rarityRevealed) {
            console.log('🎉 稀有度已揭晓，收集VRF数据...');
            
            vrfData.rarity = parseInt(beastInfo.rarity.toString());
            
            // 收集所有相关事件
            await this.collectVRFEvents(tokenId, vrfData);
            
            console.log('✅ VRF数据收集完成');
            resolve(vrfData);
            return;
          }
          
          // 如果VRF不在处理中，尝试手动触发
          if (!isPending && elapsed > 30000) { // 30秒后
            console.log('🔧 尝试手动触发VRF...');
            try {
              const revealTx = await this.contract.revealRarity(tokenId);
              console.log(`📤 手动触发交易: ${revealTx.hash}`);
              await revealTx.wait();
              console.log('✅ 手动触发成功');
            } catch (error) {
              console.log('❌ 手动触发失败:', error.message);
            }
          }
          
          // 继续轮询
          setTimeout(checkVRF, pollInterval);
          
        } catch (error) {
          console.error('❌ 轮询错误:', error);
          reject(error);
        }
      };
      
      // 开始监控
      checkVRF();
    });
  }

  // 📋 收集所有VRF相关事件
  async collectVRFEvents(tokenId, vrfData) {
    console.log('📋 收集VRF相关事件...');
    
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 100000); // 搜索10万个区块
      
      console.log(`  搜索范围: ${fromBlock} - ${currentBlock}`);
      
      // 1. 收集合约事件
      await this.collectContractEvents(tokenId, fromBlock, currentBlock, vrfData);
      
      // 2. 收集VRF协调器事件
      await this.collectCoordinatorEvents(tokenId, fromBlock, currentBlock, vrfData);
      
    } catch (error) {
      console.error('❌ 收集事件失败:', error);
    }
  }

  // 📄 收集合约事件
  async collectContractEvents(tokenId, fromBlock, toBlock, vrfData) {
    console.log('  🔍 收集合约事件...');
    
    try {
      // RarityRequested事件
      const requestedFilter = this.contract.filters.RarityRequested(tokenId);
      const requestedEvents = await this.contract.queryFilter(requestedFilter, fromBlock, toBlock);
      
      if (requestedEvents.length > 0) {
        const event = requestedEvents[requestedEvents.length - 1];
        vrfData.vrfRequestId = event.args.requestId.toString();
        vrfData.vrfRequestBlock = event.blockNumber;
        vrfData.vrfRequestTx = event.transactionHash;
        
        console.log(`    ✅ 找到RarityRequested: ${vrfData.vrfRequestId}`);
        
        vrfData.contractEvents.push({
          type: 'RarityRequested',
          requestId: vrfData.vrfRequestId,
          block: vrfData.vrfRequestBlock,
          tx: vrfData.vrfRequestTx
        });
      }
      
      // RarityRevealed事件
      const revealedFilter = this.contract.filters.RarityRevealed(tokenId);
      const revealedEvents = await this.contract.queryFilter(revealedFilter, fromBlock, toBlock);
      
      if (revealedEvents.length > 0) {
        const event = revealedEvents[revealedEvents.length - 1];
        vrfData.randomValue = parseInt(event.args.randomValue.toString());
        vrfData.vrfFulfillBlock = event.blockNumber;
        vrfData.vrfFulfillTx = event.transactionHash;
        
        console.log(`    ✅ 找到RarityRevealed: ${vrfData.randomValue}`);
        
        vrfData.contractEvents.push({
          type: 'RarityRevealed',
          randomValue: vrfData.randomValue,
          rarity: parseInt(event.args.rarity.toString()),
          block: vrfData.vrfFulfillBlock,
          tx: vrfData.vrfFulfillTx
        });
      }
      
    } catch (error) {
      console.error('    ❌ 收集合约事件失败:', error);
    }
  }

  // 🎲 收集VRF协调器事件
  async collectCoordinatorEvents(tokenId, fromBlock, toBlock, vrfData) {
    console.log('  🎲 收集VRF协调器事件...');
    
    if (!vrfData.vrfRequestId) {
      console.log('    ⚠️ 没有VRF请求ID，跳过协调器事件收集');
      return;
    }
    
    try {
      // RandomWordsRequested事件
      const requestFilter = this.vrfCoordinator.filters.RandomWordsRequested();
      const requestEvents = await this.vrfCoordinator.queryFilter(requestFilter, fromBlock, toBlock);
      
      // 查找匹配的请求
      const matchingRequest = requestEvents.find(event => 
        event.args.requestId.toString() === vrfData.vrfRequestId
      );
      
      if (matchingRequest) {
        console.log(`    ✅ 找到VRF请求事件`);
        vrfData.coordinatorEvents.push({
          type: 'RandomWordsRequested',
          requestId: matchingRequest.args.requestId.toString(),
          sender: matchingRequest.args.sender,
          block: matchingRequest.blockNumber,
          tx: matchingRequest.transactionHash
        });
        
        vrfData.isRealVRF = true; // 找到VRF协调器事件说明是真实VRF
      }
      
      // RandomWordsFulfilled事件
      const fulfillFilter = this.vrfCoordinator.filters.RandomWordsFulfilled();
      const fulfillEvents = await this.vrfCoordinator.queryFilter(fulfillFilter, fromBlock, toBlock);
      
      // 查找匹配的履行
      const matchingFulfill = fulfillEvents.find(event => 
        event.args.requestId.toString() === vrfData.vrfRequestId
      );
      
      if (matchingFulfill) {
        console.log(`    ✅ 找到VRF履行事件`);
        vrfData.coordinatorEvents.push({
          type: 'RandomWordsFulfilled',
          requestId: matchingFulfill.args.requestId.toString(),
          success: matchingFulfill.args.success,
          block: matchingFulfill.blockNumber,
          tx: matchingFulfill.transactionHash
        });
      }
      
    } catch (error) {
      console.error('    ❌ 收集协调器事件失败:', error);
    }
  }

  // ✅ 验证VRF真实性
  async verifyVRFReality(tokenId, vrfData) {
    console.log('');
    console.log('✅ 第三步：验证VRF真实性...');
    
    const checks = {
      hasVRFRequest: !!vrfData.vrfRequestId,
      hasRandomValue: !!vrfData.randomValue,
      hasCoordinatorEvents: vrfData.coordinatorEvents.length > 0,
      isRealVRF: vrfData.isRealVRF,
      timeToComplete: vrfData.vrfFulfillBlock && vrfData.vrfRequestBlock ? 
        vrfData.vrfFulfillBlock - vrfData.vrfRequestBlock : null
    };
    
    console.log('🔍 检查结果:');
    console.log(`  ✓ 有VRF请求: ${checks.hasVRFRequest ? '✅' : '❌'}`);
    console.log(`  ✓ 有随机数: ${checks.hasRandomValue ? '✅' : '❌'}`);
    console.log(`  ✓ 有协调器事件: ${checks.hasCoordinatorEvents ? '✅' : '❌'}`);
    console.log(`  ✓ 真实VRF: ${checks.isRealVRF ? '✅' : '❌'}`);
    
    if (checks.timeToComplete) {
      console.log(`  ✓ 完成时间: ${checks.timeToComplete} 个区块`);
    }
    
    return checks;
  }

  // 📋 生成详细报告
  generateVRFReport(tokenId, vrfData, checks) {
    console.log('');
    console.log('📋 ========== VRF真实性检测报告 ==========');
    console.log('');
    console.log('🎯 基本信息:');
    console.log(`  Token ID: ${tokenId}`);
    console.log(`  稀有度: ${vrfData.rarity}`);
    console.log(`  随机数: ${vrfData.randomValue || '未获取'}`);
    console.log(`  总耗时: ${Math.round((Date.now() - vrfData.startTime) / 1000)}秒`);
    console.log('');
    
    console.log('🔗 VRF请求信息:');
    if (vrfData.vrfRequestId) {
      console.log(`  请求ID: ${vrfData.vrfRequestId}`);
      console.log(`  请求区块: ${vrfData.vrfRequestBlock}`);
      console.log(`  请求交易: ${vrfData.vrfRequestTx}`);
    } else {
      console.log('  ❌ 未找到VRF请求');
    }
    console.log('');
    
    console.log('📄 合约事件:');
    vrfData.contractEvents.forEach(event => {
      console.log(`  - ${event.type}: 区块 ${event.block}`);
    });
    console.log('');
    
    console.log('🎲 VRF协调器事件:');
    if (vrfData.coordinatorEvents.length > 0) {
      vrfData.coordinatorEvents.forEach(event => {
        console.log(`  - ${event.type}: 区块 ${event.block}`);
      });
    } else {
      console.log('  ❌ 未找到协调器事件');
    }
    console.log('');
    
    console.log('🏆 最终结论:');
    if (checks.isRealVRF && checks.hasCoordinatorEvents) {
      console.log('  ✅ 确认使用了真实的Chainlink VRF!');
      console.log('  🎯 随机数来源: Chainlink去中心化预言机网络');
      console.log('  🔒 安全性: 高度安全，无法预测或操控');
    } else if (checks.hasRandomValue && !checks.hasCoordinatorEvents) {
      console.log('  ⚠️ 疑似使用了备用随机数生成机制');
      console.log('  🎯 随机数来源: 合约内部或其他机制');
      console.log('  🔒 安全性: 相对较低，可能可预测');
    } else {
      console.log('  ❌ VRF处理异常或未完成');
      console.log('  🎯 随机数来源: 未确定');
      console.log('  🔒 安全性: 未知');
    }
    console.log('');
    console.log('==========================================');
  }
}

// 🚀 主执行函数
async function runVRFCheck() {
  console.log('🔬 启动VRF真实性检测器...');
  console.log('');
  
  try {
    const checker = new VRFRealityChecker();
    const result = await checker.testVRFReality();
    
    console.log('');
    console.log('🎉 检测完成!');
    
    if (result.isRealVRF) {
      console.log('✅ 恭喜！你的项目正在使用真实的Chainlink VRF');
    } else {
      console.log('⚠️ 注意！可能没有使用真实的Chainlink VRF');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ 检测失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  runVRFCheck();
}

export { VRFRealityChecker, runVRFCheck };
