// 完整的VRF测试脚本 - 硬编码所有配置，专注于VRF测试
import { ethers } from 'ethers';

// 🔧 硬编码配置（基于你的.env文件）
const CONFIG = {
  // 网络配置
  RPC_URL: 'https://eth-sepolia.g.alchemy.com/v2/aoHaEBQa8NDjn-e0t8DyL6Ac8VZ6p9ST',
  CHAIN_ID: 11155111,
  
  // 合约地址
  CONTRACT_ADDRESS: '0x1C466dbDddb23e123760A2EDCce54b1709Fa735A',
  VRF_COORDINATOR: '0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625', // Sepolia VRF Coordinator
  
  // 钱包配置
  PRIVATE_KEY: '0x019ef439d8a1a061e5e1ac1f4be7ca2bea83f87f84e08a427a5ff1dc6f7fba55',
  
  // VRF监控配置
  MAX_WAIT_TIME: 15 * 60 * 1000, // 15分钟
  POLL_INTERVAL: 10000, // 10秒轮询
  EVENT_LOOKBACK_BLOCKS: 200000, // 搜索20万个区块
};

console.log('🎯 VRF真实性专项测试');
console.log('📋 配置信息:');
console.log(`  网络: Sepolia (Chain ID: ${CONFIG.CHAIN_ID})`);
console.log(`  RPC: ${CONFIG.RPC_URL.substring(0, 50)}...`);
console.log(`  合约: ${CONFIG.CONTRACT_ADDRESS}`);
console.log(`  钱包: ${CONFIG.PRIVATE_KEY.substring(0, 10)}...`);
console.log('');

// 完整的合约ABI
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

// 🎯 VRF测试器类
class VRFTester {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    this.wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, this.provider);
    this.contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, SHANHAI_NFT_ABI, this.wallet);
    this.vrfCoordinator = new ethers.Contract(CONFIG.VRF_COORDINATOR, VRF_COORDINATOR_ABI, this.provider);
    
    this.testData = {
      startTime: Date.now(),
      tokenId: null,
      vrfRequestId: null,
      randomValue: null,
      rarity: null,
      isRealVRF: false,
      events: []
    };
  }

  // 📊 记录日志
  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const icons = { info: '📋', success: '✅', warning: '⚠️', error: '❌', progress: '🔄' };
    console.log(`${icons[type] || '📋'} [${timestamp}] ${message}`);
  }

  // 🌐 步骤1：测试连接
  async testConnection() {
    this.log('测试网络连接...', 'progress');
    
    try {
      const blockNumber = await this.provider.getBlockNumber();
      const balance = await this.provider.getBalance(this.wallet.address);
      
      this.log(`网络连接成功！当前区块: ${blockNumber}`, 'success');
      this.log(`钱包地址: ${this.wallet.address}`, 'info');
      this.log(`钱包余额: ${ethers.formatEther(balance)} ETH`, 'info');
      
      if (balance < ethers.parseEther('0.01')) {
        this.log('余额较低，可能影响测试', 'warning');
      }
      
      return true;
    } catch (error) {
      this.log(`网络连接失败: ${error.message}`, 'error');
      throw error;
    }
  }

  // 🎨 步骤2：创建NFT
  async createNFT() {
    const prompt = `VRF终极测试 ${Date.now()} - 验证Chainlink VRF真实性`;
    this.log(`创建NFT: "${prompt}"`, 'progress');
    
    try {
      // 执行mint交易
      const mintTx = await this.contract.mint(prompt, {
        value: ethers.parseEther('0.001'),
        gasLimit: 500000
      });
      
      this.log(`Mint交易已提交: ${mintTx.hash}`, 'success');
      this.log('等待交易确认...', 'progress');
      
      const receipt = await mintTx.wait();
      this.log(`交易已确认！区块: ${receipt.blockNumber}`, 'success');
      
      // 解析TokenMinted事件
      const tokenId = this.extractTokenId(receipt);
      this.testData.tokenId = tokenId;
      
      this.log(`🎯 NFT创建成功！Token ID: ${tokenId}`, 'success');
      return tokenId;
      
    } catch (error) {
      this.log(`NFT创建失败: ${error.message}`, 'error');
      throw error;
    }
  }

  // 📊 提取TokenId
  extractTokenId(receipt) {
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
        // 跳过
      }
    }
    throw new Error('无法获取TokenId');
  }

  // 🔄 步骤3：监控VRF过程
  async monitorVRF(tokenId) {
    this.log(`开始监控Token ${tokenId}的VRF处理...`, 'progress');
    
    const startTime = Date.now();
    let pollCount = 0;
    const maxPolls = CONFIG.MAX_WAIT_TIME / CONFIG.POLL_INTERVAL;
    
    return new Promise((resolve) => {
      const checkVRF = async () => {
        try {
          pollCount++;
          const elapsed = Date.now() - startTime;
          const minutes = Math.floor(elapsed / 60000);
          const seconds = Math.floor((elapsed % 60000) / 1000);
          
          this.log(`VRF轮询 ${pollCount}/${Math.floor(maxPolls)} - 已等待 ${minutes}:${seconds.toString().padStart(2, '0')}`, 'progress');
          
          // 检查超时
          if (elapsed > CONFIG.MAX_WAIT_TIME) {
            this.log('VRF监控超时', 'warning');
            resolve(false);
            return;
          }
          
          // 查询链上状态
          const [beastInfo, isPending] = await Promise.all([
            this.contract.beasts(BigInt(tokenId)),
            this.contract.vrfPending(BigInt(tokenId))
          ]);
          
          this.log(`状态 - 稀有度已揭晓: ${beastInfo.rarityRevealed} | VRF处理中: ${isPending}`, 'info');
          
          // 如果稀有度已揭晓
          if (beastInfo.rarityRevealed) {
            this.testData.rarity = parseInt(beastInfo.rarity.toString());
            this.log(`🎉 稀有度已揭晓: ${this.testData.rarity}`, 'success');
            
            // 收集VRF数据
            await this.collectVRFData(tokenId);
            resolve(true);
            return;
          }
          
          // 如果VRF不在处理中且等待超过2分钟，尝试手动触发
          if (!isPending && elapsed > 120000) {
            this.log('尝试手动触发VRF...', 'progress');
            try {
              const revealTx = await this.contract.revealRarity(tokenId);
              this.log(`手动触发成功: ${revealTx.hash}`, 'success');
              await revealTx.wait();
            } catch (error) {
              this.log(`手动触发失败: ${error.message}`, 'warning');
            }
          }
          
          // 继续轮询
          setTimeout(checkVRF, CONFIG.POLL_INTERVAL);
          
        } catch (error) {
          this.log(`VRF轮询错误: ${error.message}`, 'error');
          setTimeout(checkVRF, CONFIG.POLL_INTERVAL);
        }
      };
      
      checkVRF();
    });
  }

  // 📋 步骤4：收集VRF数据
  async collectVRFData(tokenId) {
    this.log('收集VRF相关数据...', 'progress');
    
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - CONFIG.EVENT_LOOKBACK_BLOCKS);
      
      this.log(`搜索事件，区块范围: ${fromBlock} - ${currentBlock}`, 'info');
      
      // 查找RarityRequested事件
      const requestFilter = this.contract.filters.RarityRequested(tokenId);
      const requestEvents = await this.contract.queryFilter(requestFilter, fromBlock, currentBlock);
      
      if (requestEvents.length > 0) {
        const event = requestEvents[0];
        this.testData.vrfRequestId = event.args.requestId.toString();
        this.log(`找到VRF请求: ${this.testData.vrfRequestId}`, 'success');
        this.testData.events.push({
          type: 'RarityRequested',
          requestId: this.testData.vrfRequestId,
          block: event.blockNumber
        });
      } else {
        this.log('未找到VRF请求事件', 'warning');
      }
      
      // 查找RarityRevealed事件
      const revealFilter = this.contract.filters.RarityRevealed(tokenId);
      const revealEvents = await this.contract.queryFilter(revealFilter, fromBlock, currentBlock);
      
      if (revealEvents.length > 0) {
        const event = revealEvents[0];
        this.testData.randomValue = event.args.randomValue.toString();
        this.log(`找到随机数: ${this.testData.randomValue}`, 'success');
        this.testData.events.push({
          type: 'RarityRevealed',
          randomValue: this.testData.randomValue,
          rarity: parseInt(event.args.rarity.toString()),
          block: event.blockNumber
        });
      } else {
        this.log('未找到稀有度揭晓事件', 'warning');
      }
      
      // 检查Chainlink VRF协调器事件
      await this.checkVRFCoordinator();
      
    } catch (error) {
      this.log(`收集数据失败: ${error.message}`, 'error');
    }
  }

  // 🎲 步骤5：检查VRF协调器
  async checkVRFCoordinator() {
    if (!this.testData.vrfRequestId) {
      this.log('没有VRF请求ID，跳过协调器检查', 'warning');
      return;
    }
    
    this.log(`检查Chainlink VRF协调器，请求ID: ${this.testData.vrfRequestId}`, 'progress');
    
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - CONFIG.EVENT_LOOKBACK_BLOCKS);
      
      // 查找RandomWordsFulfilled事件
      const fulfillFilter = this.vrfCoordinator.filters.RandomWordsFulfilled();
      const fulfillEvents = await this.vrfCoordinator.queryFilter(fulfillFilter, fromBlock, currentBlock);
      
      this.log(`在VRF协调器中找到 ${fulfillEvents.length} 个履行事件`, 'info');
      
      // 查找匹配的事件
      const matchingEvent = fulfillEvents.find(event => 
        event.args.requestId.toString() === this.testData.vrfRequestId
      );
      
      if (matchingEvent) {
        this.testData.isRealVRF = true;
        this.log('🎉 找到匹配的Chainlink VRF履行事件！', 'success');
        this.log(`VRF履行成功: ${matchingEvent.args.success}`, 'info');
        this.log(`履行区块: ${matchingEvent.blockNumber}`, 'info');
        
        this.testData.events.push({
          type: 'RandomWordsFulfilled',
          requestId: this.testData.vrfRequestId,
          success: matchingEvent.args.success,
          block: matchingEvent.blockNumber
        });
      } else {
        this.log('❌ 未找到匹配的Chainlink VRF履行事件', 'warning');
        this.log('这表明可能使用了备用随机数机制', 'warning');
      }
      
    } catch (error) {
      this.log(`检查VRF协调器失败: ${error.message}`, 'error');
    }
  }

  // 📊 步骤6：生成最终报告
  generateReport() {
    const endTime = Date.now();
    const totalTime = Math.round((endTime - this.testData.startTime) / 1000);
    
    console.log('');
    console.log('🏆 =============== VRF测试最终报告 ===============');
    console.log('');
    console.log('📋 测试概要:');
    console.log(`  测试时间: ${new Date(this.testData.startTime).toLocaleString()}`);
    console.log(`  总耗时: ${Math.floor(totalTime/60)}分${totalTime%60}秒`);
    console.log(`  Token ID: ${this.testData.tokenId}`);
    console.log(`  合约地址: ${CONFIG.CONTRACT_ADDRESS}`);
    console.log('');
    
    console.log('🎲 VRF数据详情:');
    console.log(`  VRF请求ID: ${this.testData.vrfRequestId || '未找到'}`);
    console.log(`  随机数: ${this.testData.randomValue || '未找到'}`);
    console.log(`  稀有度: ${this.testData.rarity !== null ? this.testData.rarity : '未揭晓'}`);
    console.log('');
    
    console.log('📋 事件时间线:');
    this.testData.events.forEach((event, index) => {
      console.log(`  ${index + 1}. ${event.type} (区块 ${event.block})`);
      if (event.requestId) console.log(`     请求ID: ${event.requestId}`);
      if (event.randomValue) console.log(`     随机数: ${event.randomValue}`);
      if (event.rarity !== undefined) console.log(`     稀有度: ${event.rarity}`);
    });
    console.log('');
    
    console.log('🏆 最终结论:');
    if (this.testData.isRealVRF && this.testData.randomValue) {
      console.log('  ✅ 🎉 恭喜！您的项目正在使用真实的Chainlink VRF！');
      console.log('  🔒 随机数来源: Chainlink去中心化预言机网络');
      console.log('  🎲 安全级别: 最高级，完全不可预测和操控');
      console.log('  ⚡ 验证状态: 通过Chainlink VRF协调器验证');
      console.log('  🌟 推荐度: 继续使用，您的项目具有真正的随机性！');
    } else if (this.testData.randomValue && !this.testData.isRealVRF) {
      console.log('  ⚠️ 警告：检测到使用了备用随机数机制');
      console.log('  🔧 随机数来源: 合约内部生成或其他非VRF机制');
      console.log('  🎯 安全级别: 中等，可能存在可预测性');
      console.log('  📋 建议: 检查VRF订阅状态，确保有足够的LINK代币');
      console.log('  🔗 可能原因: VRF订阅余额不足、网络延迟或配置错误');
    } else {
      console.log('  ❌ 错误：VRF处理未完成或存在配置问题');
      console.log('  🔍 建议: 检查合约VRF配置、订阅状态和网络连接');
      console.log('  ⏰ 状态: VRF请求可能仍在处理中');
    }
    console.log('');
    console.log('===============================================');
    
    return this.testData.isRealVRF;
  }

  // 🚀 运行完整测试
  async runFullTest() {
    try {
      console.log('🚀 启动VRF真实性专项测试...');
      console.log('');
      
      // 步骤1: 测试连接
      await this.testConnection();
      console.log('');
      
      // 步骤2: 创建NFT
      const tokenId = await this.createNFT();
      console.log('');
      
      // 步骤3: 监控VRF
      const vrfCompleted = await this.monitorVRF(tokenId);
      console.log('');
      
      if (vrfCompleted) {
        this.log('VRF处理完成，生成最终报告...', 'success');
      } else {
        this.log('VRF监控超时，但NFT已创建，生成报告...', 'warning');
      }
      
      // 步骤4: 生成报告
      const isRealVRF = this.generateReport();
      
      return isRealVRF;
      
    } catch (error) {
      this.log(`测试失败: ${error.message}`, 'error');
      console.log('');
      console.log('🔧 故障排除建议:');
      console.log('  1. 检查网络连接和RPC URL');
      console.log('  2. 确认钱包余额充足');
      console.log('  3. 验证合约地址正确');
      console.log('  4. 稍后重试（可能网络拥堵）');
      throw error;
    }
  }
}

// 🚀 主执行函数
async function runVRFTest() {
  const tester = new VRFTester();
  
  try {
    const isRealVRF = await tester.runFullTest();
    
    console.log('');
    if (isRealVRF) {
      console.log('🎉 测试成功！您的项目使用了真实的Chainlink VRF！');
      process.exit(0);
    } else {
      console.log('⚠️ 检测到可能使用了备用随机数，建议检查VRF配置。');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ VRF测试失败:', error.message);
    process.exit(1);
  }
}

// 执行测试
runVRFTest();
