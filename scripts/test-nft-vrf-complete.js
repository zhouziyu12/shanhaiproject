// 完整的NFT创建+VRF监控测试脚本
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
const envPaths = [
  join(__dirname, '../.env.local'),
  join(__dirname, '../.env'),
  '.env.local',
  '.env'
];

for (const envPath of envPaths) {
  try {
    const result = dotenv.config({ path: envPath });
    if (result.parsed) {
      console.log(`✅ 已加载环境变量: ${envPath}`);
      break;
    }
  } catch (error) {
    // 继续尝试下一个路径
  }
}

// 配置
const CONFIG = {
  RPC_URL: process.env.SEPOLIA_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_KEY',
  CONTRACT_ADDRESS: '0x1C466dbDddb23e123760A2EDCce54b1709Fa735A', // 你的合约地址
  VRF_COORDINATOR: '0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625', // Sepolia VRF Coordinator
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  
  // VRF监控配置
  MAX_WAIT_TIME: 10 * 60 * 1000, // 10分钟
  POLL_INTERVAL: 5000, // 5秒轮询
  EVENT_LOOKBACK_BLOCKS: 100000, // 搜索10万个区块
  MAX_RETRIES: 3
};

// 验证配置
console.log('📋 配置验证:');
console.log(`  RPC URL: ${CONFIG.RPC_URL !== 'https://sepolia.infura.io/v3/YOUR_KEY' ? '✅ 已设置' : '❌ 需要设置真实RPC URL'}`);
console.log(`  合约地址: ${CONFIG.CONTRACT_ADDRESS}`);
console.log(`  VRF协调器: ${CONFIG.VRF_COORDINATOR}`);
console.log(`  私钥: ${CONFIG.PRIVATE_KEY ? '✅ 已设置' : '❌ 未设置'}`);

if (!CONFIG.PRIVATE_KEY) {
  console.error('❌ 错误: PRIVATE_KEY 未配置');
  console.log('请在 .env.local 中设置: PRIVATE_KEY=0x你的私钥');
  process.exit(1);
}

if (CONFIG.RPC_URL === 'https://sepolia.infura.io/v3/YOUR_KEY') {
  console.error('❌ 错误: RPC_URL 未正确配置');
  console.log('请在 .env.local 中设置有效的 SEPOLIA_RPC_URL');
  process.exit(1);
}

console.log('');

// 完整的合约ABI
const SHANHAI_NFT_ABI = [
  // 查询函数
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
  
  // Mint函数
  {
    "inputs": [{"name": "prompt", "type": "string"}],
    "name": "mint",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  
  // 稀有度揭晓函数
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "revealRarity",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // 事件定义
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

// VRF协调器ABI
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

class NFTVRFTester {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    this.wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, this.provider);
    this.contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, SHANHAI_NFT_ABI, this.wallet);
    this.vrfCoordinator = new ethers.Contract(CONFIG.VRF_COORDINATOR, VRF_COORDINATOR_ABI, this.provider);
    
    this.testResults = {
      startTime: Date.now(),
      steps: [],
      tokenId: null,
      vrfData: {},
      isRealVRF: false,
      finalResult: null
    };
  }

  // 📝 记录测试步骤
  logStep(step, status, details = '') {
    const timestamp = new Date().toISOString();
    const logEntry = { step, status, details, timestamp };
    this.testResults.steps.push(logEntry);
    
    const statusIcon = status === 'success' ? '✅' : status === 'error' ? '❌' : status === 'warning' ? '⚠️' : '🔄';
    console.log(`${statusIcon} [${step}] ${details}`);
  }

  // 🌐 测试网络连接
  async testConnection() {
    try {
      this.logStep('网络连接', 'progress', '测试Sepolia网络连接...');
      
      const blockNumber = await this.provider.getBlockNumber();
      const balance = await this.wallet.getBalance();
      const address = await this.wallet.getAddress();
      
      this.logStep('网络连接', 'success', `连接成功！当前区块: ${blockNumber}`);
      this.logStep('钱包信息', 'success', `地址: ${address}`);
      this.logStep('钱包余额', 'success', `余额: ${ethers.formatEther(balance)} ETH`);
      
      if (balance < ethers.parseEther('0.001')) {
        this.logStep('余额检查', 'warning', '余额可能不足以完成铸造和gas费用');
      }
      
      return true;
    } catch (error) {
      this.logStep('网络连接', 'error', `连接失败: ${error.message}`);
      throw error;
    }
  }

  // 🎨 创建NFT
  async createNFT() {
    try {
      const prompt = `VRF测试神兽 ${Date.now()} - 测试Chainlink VRF真实性`;
      this.logStep('NFT创建', 'progress', `创建测试NFT: "${prompt}"`);
      
      // 估算gas费用
      const gasEstimate = await this.contract.mint.estimateGas(prompt, {
        value: ethers.parseEther('0.001')
      });
      
      this.logStep('Gas估算', 'success', `预估gas: ${gasEstimate.toString()}`);
      
      // 执行铸造
      const mintTx = await this.contract.mint(prompt, {
        value: ethers.parseEther('0.001'),
        gasLimit: gasEstimate * 120n / 100n // 增加20%的gas buffer
      });
      
      this.logStep('交易提交', 'success', `交易哈希: ${mintTx.hash}`);
      this.logStep('等待确认', 'progress', '等待交易被矿工确认...');
      
      const receipt = await mintTx.wait();
      this.logStep('交易确认', 'success', `已确认，区块: ${receipt.blockNumber}`);
      
      // 解析TokenMinted事件获取tokenId
      const tokenId = await this.extractTokenIdFromReceipt(receipt);
      this.testResults.tokenId = tokenId;
      
      this.logStep('Token ID', 'success', `NFT创建成功！Token ID: ${tokenId}`);
      
      return tokenId;
      
    } catch (error) {
      this.logStep('NFT创建', 'error', `创建失败: ${error.message}`);
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

  // 🔄 监控VRF过程
  async monitorVRFProcess(tokenId) {
    this.logStep('VRF监控', 'progress', `开始监控Token ${tokenId}的VRF处理过程...`);
    
    const startTime = Date.now();
    let pollCount = 0;
    const maxPolls = Math.floor(CONFIG.MAX_WAIT_TIME / CONFIG.POLL_INTERVAL);
    
    return new Promise((resolve, reject) => {
      const checkVRF = async () => {
        try {
          pollCount++;
          const elapsed = Date.now() - startTime;
          
          this.logStep('VRF轮询', 'progress', `轮询 ${pollCount}/${maxPolls} - 已等待 ${Math.round(elapsed/1000)}秒`);
          
          // 检查超时
          if (elapsed > CONFIG.MAX_WAIT_TIME) {
            this.logStep('VRF监控', 'warning', `监控超时（${Math.round(elapsed/1000)}秒）`);
            resolve(false);
            return;
          }
          
          // 检查链上状态
          const [beastInfo, isPending] = await Promise.all([
            this.contract.beasts(BigInt(tokenId)),
            this.contract.vrfPending(BigInt(tokenId))
          ]);
          
          this.logStep('状态检查', 'progress', 
            `稀有度已揭晓: ${beastInfo.rarityRevealed} | VRF待处理: ${isPending}`
          );
          
          // 如果稀有度已揭晓，收集VRF数据
          if (beastInfo.rarityRevealed) {
            this.logStep('VRF完成', 'success', `稀有度已揭晓: ${beastInfo.rarity}`);
            
            // 收集VRF相关数据
            await this.collectVRFData(tokenId);
            resolve(true);
            return;
          }
          
          // 如果VRF不在处理中且等待时间较长，尝试手动触发
          if (!isPending && elapsed > 60000) { // 1分钟后
            this.logStep('手动触发', 'progress', '尝试手动触发VRF...');
            try {
              const revealTx = await this.contract.revealRarity(tokenId);
              this.logStep('手动触发', 'success', `手动触发成功: ${revealTx.hash}`);
              await revealTx.wait();
            } catch (error) {
              this.logStep('手动触发', 'warning', `手动触发失败: ${error.message}`);
            }
          }
          
          // 继续轮询
          setTimeout(checkVRF, CONFIG.POLL_INTERVAL);
          
        } catch (error) {
          this.logStep('VRF监控', 'error', `轮询错误: ${error.message}`);
          reject(error);
        }
      };
      
      // 开始监控
      checkVRF();
    });
  }

  // 📋 收集VRF相关数据
  async collectVRFData(tokenId) {
    this.logStep('数据收集', 'progress', '收集VRF相关事件和数据...');
    
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - CONFIG.EVENT_LOOKBACK_BLOCKS);
      
      this.logStep('事件搜索', 'progress', `搜索区块范围: ${fromBlock} - ${currentBlock}`);
      
      // 收集合约事件
      const contractEvents = await this.collectContractEvents(tokenId, fromBlock, currentBlock);
      
      // 收集VRF协调器事件
      const coordinatorEvents = await this.collectCoordinatorEvents(contractEvents.vrfRequestId, fromBlock, currentBlock);
      
      this.testResults.vrfData = {
        contractEvents,
        coordinatorEvents,
        hasRealVRF: coordinatorEvents.length > 0
      };
      
      this.testResults.isRealVRF = coordinatorEvents.length > 0;
      
    } catch (error) {
      this.logStep('数据收集', 'error', `收集失败: ${error.message}`);
    }
  }

  // 📄 收集合约事件
  async collectContractEvents(tokenId, fromBlock, toBlock) {
    const events = {
      vrfRequestId: null,
      randomValue: null,
      rarity: null,
      requestBlock: null,
      revealBlock: null
    };
    
    try {
      // RarityRequested事件
      const requestFilter = this.contract.filters.RarityRequested(tokenId);
      const requestEvents = await this.contract.queryFilter(requestFilter, fromBlock, toBlock);
      
      if (requestEvents.length > 0) {
        const event = requestEvents[0];
        events.vrfRequestId = event.args.requestId.toString();
        events.requestBlock = event.blockNumber;
        this.logStep('VRF请求', 'success', `找到VRF请求: ${events.vrfRequestId} (区块 ${events.requestBlock})`);
      } else {
        this.logStep('VRF请求', 'warning', '未找到VRF请求事件');
      }
      
      // RarityRevealed事件
      const revealFilter = this.contract.filters.RarityRevealed(tokenId);
      const revealEvents = await this.contract.queryFilter(revealFilter, fromBlock, toBlock);
      
      if (revealEvents.length > 0) {
        const event = revealEvents[0];
        events.randomValue = event.args.randomValue.toString();
        events.rarity = parseInt(event.args.rarity.toString());
        events.revealBlock = event.blockNumber;
        this.logStep('稀有度揭晓', 'success', 
          `随机数: ${events.randomValue} | 稀有度: ${events.rarity} (区块 ${events.revealBlock})`
        );
      } else {
        this.logStep('稀有度揭晓', 'warning', '未找到稀有度揭晓事件');
      }
      
    } catch (error) {
      this.logStep('合约事件', 'error', `收集合约事件失败: ${error.message}`);
    }
    
    return events;
  }

  // 🎲 收集VRF协调器事件
  async collectCoordinatorEvents(vrfRequestId, fromBlock, toBlock) {
    const events = [];
    
    if (!vrfRequestId) {
      this.logStep('协调器事件', 'warning', '没有VRF请求ID，跳过协调器事件检查');
      return events;
    }
    
    try {
      this.logStep('协调器检查', 'progress', `在VRF协调器中搜索请求ID: ${vrfRequestId}`);
      
      // RandomWordsRequested事件
      const requestFilter = this.vrfCoordinator.filters.RandomWordsRequested();
      const requestEvents = await this.vrfCoordinator.queryFilter(requestFilter, fromBlock, toBlock);
      
      const matchingRequest = requestEvents.find(event => 
        event.args.requestId.toString() === vrfRequestId
      );
      
      if (matchingRequest) {
        events.push({
          type: 'RandomWordsRequested',
          requestId: matchingRequest.args.requestId.toString(),
          sender: matchingRequest.args.sender,
          block: matchingRequest.blockNumber
        });
        this.logStep('VRF请求确认', 'success', 
          `找到Chainlink VRF请求 (区块 ${matchingRequest.blockNumber})`
        );
      }
      
      // RandomWordsFulfilled事件
      const fulfillFilter = this.vrfCoordinator.filters.RandomWordsFulfilled();
      const fulfillEvents = await this.vrfCoordinator.queryFilter(fulfillFilter, fromBlock, toBlock);
      
      const matchingFulfill = fulfillEvents.find(event => 
        event.args.requestId.toString() === vrfRequestId
      );
      
      if (matchingFulfill) {
        events.push({
          type: 'RandomWordsFulfilled',
          requestId: matchingFulfill.args.requestId.toString(),
          success: matchingFulfill.args.success,
          block: matchingFulfill.blockNumber
        });
        this.logStep('VRF履行确认', 'success', 
          `找到Chainlink VRF履行 (区块 ${matchingFulfill.blockNumber})`
        );
      }
      
      if (events.length === 0) {
        this.logStep('协调器事件', 'warning', '未找到对应的Chainlink VRF事件');
      }
      
    } catch (error) {
      this.logStep('协调器事件', 'error', `检查协调器事件失败: ${error.message}`);
    }
    
    return events;
  }

  // 📊 生成测试报告
  generateTestReport() {
    const endTime = Date.now();
    const totalTime = Math.round((endTime - this.testResults.startTime) / 1000);
    
    console.log('');
    console.log('🏆 ============ VRF真实性测试报告 ============');
    console.log('');
    console.log('📋 基本信息:');
    console.log(`  测试时间: ${new Date(this.testResults.startTime).toLocaleString()}`);
    console.log(`  总耗时: ${totalTime}秒`);
    console.log(`  Token ID: ${this.testResults.tokenId || '未创建'}`);
    console.log(`  合约地址: ${CONFIG.CONTRACT_ADDRESS}`);
    console.log('');
    
    console.log('📊 测试步骤:');
    this.testResults.steps.forEach((step, index) => {
      const statusIcon = step.status === 'success' ? '✅' : 
                         step.status === 'error' ? '❌' : 
                         step.status === 'warning' ? '⚠️' : '🔄';
      console.log(`  ${index + 1}. ${statusIcon} ${step.step}: ${step.details}`);
    });
    console.log('');
    
    if (this.testResults.vrfData.contractEvents) {
      const vrfData = this.testResults.vrfData.contractEvents;
      console.log('🎲 VRF数据:');
      console.log(`  VRF请求ID: ${vrfData.vrfRequestId || '未找到'}`);
      console.log(`  随机数: ${vrfData.randomValue || '未找到'}`);
      console.log(`  稀有度: ${vrfData.rarity !== null ? vrfData.rarity : '未揭晓'}`);
      console.log(`  请求区块: ${vrfData.requestBlock || '未知'}`);
      console.log(`  揭晓区块: ${vrfData.revealBlock || '未知'}`);
      console.log('');
    }
    
    console.log('🔗 Chainlink VRF验证:');
    const coordinatorEvents = this.testResults.vrfData.coordinatorEvents || [];
    if (coordinatorEvents.length > 0) {
      console.log(`  ✅ 找到 ${coordinatorEvents.length} 个Chainlink VRF事件`);
      coordinatorEvents.forEach(event => {
        console.log(`    - ${event.type} (区块 ${event.block})`);
      });
    } else {
      console.log(`  ❌ 未找到Chainlink VRF协调器事件`);
    }
    console.log('');
    
    console.log('🏆 最终结论:');
    if (this.testResults.isRealVRF) {
      console.log('  ✅ 恭喜！您的合约正在使用真实的Chainlink VRF！');
      console.log('  🔒 随机数来源: Chainlink去中心化预言机网络');
      console.log('  🎲 安全性: 高度安全，无法预测或操控');
      console.log('  ⚡ 建议: 继续使用，您的项目具有真正的随机性');
    } else if (this.testResults.vrfData.contractEvents?.randomValue) {
      console.log('  ⚠️ 警告：疑似使用了备用随机数机制');
      console.log('  🔧 随机数来源: 合约内部或其他非VRF机制');
      console.log('  🎯 建议: 检查VRF订阅配置，确保有足够的LINK代币');
      console.log('  📋 可能原因: VRF订阅余额不足、配置错误或网络延迟');
    } else {
      console.log('  ❌ 错误：VRF处理未完成或配置有问题');
      console.log('  🔍 建议: 检查合约配置、VRF订阅状态和网络连接');
    }
    console.log('');
    console.log('===============================================');
    
    this.testResults.finalResult = this.testResults.isRealVRF ? 'real_vrf' : 'backup_random';
    return this.testResults;
  }

  // 🚀 运行完整测试
  async runCompleteTest() {
    try {
      console.log('🔬 启动NFT+VRF完整真实性测试...');
      console.log('');
      
      // 1. 测试网络连接
      await this.testConnection();
      
      // 2. 创建NFT
      const tokenId = await this.createNFT();
      
      // 3. 监控VRF过程
      const vrfCompleted = await this.monitorVRFProcess(tokenId);
      
      if (!vrfCompleted) {
        this.logStep('测试结果', 'warning', 'VRF监控超时，但NFT已成功创建');
      } else {
        this.logStep('测试结果', 'success', 'VRF处理完成');
      }
      
      // 4. 生成报告
      const report = this.generateTestReport();
      
      return report;
      
    } catch (error) {
      this.logStep('测试失败', 'error', error.message);
      console.error('❌ 测试过程中发生错误:', error);
      throw error;
    }
  }
}

// 🚀 主执行函数
async function runTest() {
  const tester = new NFTVRFTester();
  
  try {
    const result = await tester.runCompleteTest();
    
    console.log('');
    if (result.finalResult === 'real_vrf') {
      console.log('🎉 测试成功！您的项目正在使用真实的Chainlink VRF！');
      process.exit(0);
    } else {
      console.log('⚠️ 测试发现问题，请检查VRF配置。');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  runTest();
}

export { NFTVRFTester, runTest };
