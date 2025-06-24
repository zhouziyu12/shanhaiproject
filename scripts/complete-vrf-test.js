// 完整VRF测试脚本 - 使用真实ABI进行mint+VRF监控
import { ethers } from 'ethers';

const CONFIG = {
  RPC_URL: 'https://eth-sepolia.g.alchemy.com/v2/aoHaEBQa8NDjn-e0t8DyL6Ac8VZ6p9ST',
  CONTRACT_ADDRESS: '0x1C466dbDddb23e123760A2EDCce54b1709Fa735A',
  VRF_COORDINATOR: '0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625',
  PRIVATE_KEY: '0x019ef439d8a1a061e5e1ac1f4be7ca2bea83f87f84e08a427a5ff1dc6f7fba55',
  MAX_WAIT_TIME: 20 * 60 * 1000, // 20分钟等待时间
  POLL_INTERVAL: 15000, // 15秒轮询间隔
};

// 完整的ShanHaiNFT ABI
const SHANHAI_NFT_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "string", "name": "prompt", "type": "string"}],
    "name": "mint",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "mintPrice",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getNextTokenId",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "beasts",
    "outputs": [
      {"internalType": "string", "name": "prompt", "type": "string"},
      {"internalType": "string", "name": "ipfsImageUrl", "type": "string"},
      {"internalType": "string", "name": "ipfsMetadataUrl", "type": "string"},
      {"internalType": "enum ShanHaiNFT.Rarity", "name": "rarity", "type": "uint8"},
      {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"internalType": "address", "name": "creator", "type": "address"},
      {"internalType": "bool", "name": "rarityRevealed", "type": "bool"},
      {"internalType": "bool", "name": "hasIPFS", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "revealRarityManually",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "vrfPending",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "creator", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "prompt", "type": "string"},
      {"indexed": false, "internalType": "bool", "name": "hasIPFS", "type": "bool"}
    ],
    "name": "BeastMinted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "requestId", "type": "uint256"}
    ],
    "name": "RarityRequested",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"indexed": false, "internalType": "enum ShanHaiNFT.Rarity", "name": "rarity", "type": "uint8"},
      {"indexed": false, "internalType": "uint256", "name": "randomValue", "type": "uint256"}
    ],
    "name": "RarityRevealed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "from", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "to", "type": "address"},
      {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"}
    ],
    "name": "Transfer",
    "type": "event"
  }
];

// VRF协调器ABI（简化版）
const VRF_COORDINATOR_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "requestId", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "outputSeed", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "payment", "type": "uint256"},
      {"indexed": false, "internalType": "bool", "name": "success", "type": "bool"}
    ],
    "name": "RandomWordsFulfilled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "bytes32", "name": "keyHash", "type": "bytes32"},
      {"indexed": false, "internalType": "uint256", "name": "requestId", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "preSeed", "type": "uint256"},
      {"indexed": true, "internalType": "uint64", "name": "subId", "type": "uint64"},
      {"indexed": false, "internalType": "uint16", "name": "minimumRequestConfirmations", "type": "uint16"},
      {"indexed": false, "internalType": "uint32", "name": "callbackGasLimit", "type": "uint32"},
      {"indexed": false, "internalType": "uint32", "name": "numWords", "type": "uint32"},
      {"indexed": true, "internalType": "address", "name": "sender", "type": "address"}
    ],
    "name": "RandomWordsRequested",
    "type": "event"
  }
];

class CompleteVRFTester {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    this.wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, this.provider);
    this.contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, SHANHAI_NFT_ABI, this.wallet);
    this.vrfCoordinator = new ethers.Contract(CONFIG.VRF_COORDINATOR, VRF_COORDINATOR_ABI, this.provider);
    
    this.testData = {
      startTime: Date.now(),
      mintTxHash: null,
      tokenId: null,
      vrfRequestId: null,
      finalRarity: null,
      randomValue: null,
      isRealVRF: false,
      backupUsed: false,
      events: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const icons = { info: '📋', success: '✅', warning: '⚠️', error: '❌', progress: '🔄', vrf: '🎲' };
    console.log(`${icons[type] || '📋'} [${timestamp}] ${message}`);
  }

  // 步骤1：检查合约状态
  async checkContractStatus() {
    this.log('🔍 检查合约状态...', 'progress');
    
    try {
      const [mintPrice, nextTokenId, balance] = await Promise.all([
        this.contract.mintPrice(),
        this.contract.getNextTokenId(),
        this.contract.balanceOf(this.wallet.address)
      ]);
      
      this.log(`Mint价格: ${ethers.formatEther(mintPrice)} ETH`, 'info');
      this.log(`下一个Token ID: ${nextTokenId}`, 'info');
      this.log(`你当前拥有: ${balance} 个NFT`, 'info');
      
      const walletBalance = await this.provider.getBalance(this.wallet.address);
      this.log(`钱包余额: ${ethers.formatEther(walletBalance)} ETH`, 'info');
      
      if (walletBalance < mintPrice) {
        throw new Error(`余额不足！需要 ${ethers.formatEther(mintPrice)} ETH`);
      }
      
      return { mintPrice, nextTokenId, balance };
    } catch (error) {
      this.log(`状态检查失败: ${error.message}`, 'error');
      throw error;
    }
  }

  // 步骤2：执行mint
  async performMint() {
    this.log('🎨 开始铸造NFT...', 'progress');
    
    try {
      const prompt = `VRF真实性测试 ${Date.now()} - Chainlink验证`;
      const mintPrice = await this.contract.mintPrice();
      
      this.log(`铸造prompt: "${prompt}"`, 'info');
      this.log(`支付金额: ${ethers.formatEther(mintPrice)} ETH`, 'info');
      
      // 执行mint交易
      const mintTx = await this.contract.mint(this.wallet.address, prompt, {
        value: mintPrice,
        gasLimit: 500000
      });
      
      this.testData.mintTxHash = mintTx.hash;
      this.log(`✅ Mint交易已提交: ${mintTx.hash}`, 'success');
      this.log('⏳ 等待交易确认...', 'progress');
      
      const receipt = await mintTx.wait();
      this.log(`🎉 交易已确认！区块: ${receipt.blockNumber}`, 'success');
      
      // 从事件中提取tokenId
      const tokenId = this.extractTokenIdFromReceipt(receipt);
      this.testData.tokenId = tokenId;
      
      this.log(`🆔 新NFT Token ID: ${tokenId}`, 'success');
      
      return { tokenId, txHash: mintTx.hash, blockNumber: receipt.blockNumber };
      
    } catch (error) {
      this.log(`❌ Mint失败: ${error.message}`, 'error');
      throw error;
    }
  }

  // 从交易回执中提取Token ID
  extractTokenIdFromReceipt(receipt) {
    // 首先尝试从Transfer事件提取
    const transferTopic = ethers.id("Transfer(address,address,uint256)");
    
    for (const log of receipt.logs) {
      if (log.topics[0] === transferTopic) {
        // Transfer事件的第三个参数是tokenId
        const tokenId = BigInt(log.topics[3]);
        return parseInt(tokenId.toString());
      }
    }
    
    // 如果没找到Transfer事件，尝试从BeastMinted事件提取
    for (const log of receipt.logs) {
      try {
        const parsedLog = this.contract.interface.parseLog({
          topics: log.topics,
          data: log.data
        });
        
        if (parsedLog && parsedLog.name === 'BeastMinted') {
          return parseInt(parsedLog.args.tokenId.toString());
        }
      } catch (e) {
        // 继续尝试下一个log
      }
    }
    
    throw new Error('无法从交易回执中提取Token ID');
  }

  // 步骤3：监控VRF过程
  async monitorVRFProcess(tokenId) {
    this.log(`🔄 开始监控Token #${tokenId}的VRF过程...`, 'progress');
    
    const startTime = Date.now();
    let pollCount = 0;
    const maxPolls = Math.floor(CONFIG.MAX_WAIT_TIME / CONFIG.POLL_INTERVAL);
    
    return new Promise((resolve) => {
      const checkStatus = async () => {
        try {
          pollCount++;
          const elapsed = Date.now() - startTime;
          const minutes = Math.floor(elapsed / 60000);
          const seconds = Math.floor((elapsed % 60000) / 1000);
          
          this.log(`📊 轮询 ${pollCount}/${maxPolls} - 等待时间 ${minutes}:${seconds.toString().padStart(2, '0')}`, 'progress');
          
          // 检查超时
          if (elapsed > CONFIG.MAX_WAIT_TIME) {
            this.log('⏰ VRF监控超时', 'warning');
            resolve({ success: false, reason: 'timeout' });
            return;
          }
          
          // 查询NFT状态
          const beast = await this.contract.beasts(tokenId);
          const isPending = await this.contract.vrfPending(tokenId);
          
          this.log(`状态 - 稀有度已揭晓: ${beast.rarityRevealed} | VRF处理中: ${isPending}`, 'info');
          
          // 如果稀有度已经揭晓
          if (beast.rarityRevealed) {
            this.testData.finalRarity = parseInt(beast.rarity.toString());
            this.log(`🎉 稀有度已揭晓: ${this.testData.finalRarity}`, 'success');
            
            // 检查VRF真实性
            await this.analyzeVRFReality(tokenId);
            
            resolve({
              success: true,
              tokenId: tokenId,
              rarity: this.testData.finalRarity,
              isRealVRF: this.testData.isRealVRF,
              backupUsed: this.testData.backupUsed,
              waitTime: elapsed,
              pollCount: pollCount
            });
            return;
          }
          
          // 如果等待超过3分钟且没有VRF处理，尝试手动触发
          if (!isPending && elapsed > 180000) {
            this.log('🔧 尝试手动触发VRF...', 'progress');
            try {
              const revealTx = await this.contract.revealRarityManually(tokenId);
              this.log(`手动触发成功: ${revealTx.hash}`, 'success');
              await revealTx.wait();
              this.log('手动触发交易已确认', 'success');
            } catch (error) {
              this.log(`手动触发失败: ${error.message}`, 'warning');
            }
          }
          
          // 继续轮询
          setTimeout(checkStatus, CONFIG.POLL_INTERVAL);
          
        } catch (error) {
          this.log(`轮询错误: ${error.message}`, 'error');
          setTimeout(checkStatus, CONFIG.POLL_INTERVAL);
        }
      };
      
      checkStatus();
    });
  }

  // 步骤4：分析VRF真实性
  async analyzeVRFReality(tokenId) {
    this.log(`🔍 分析Token #${tokenId}的VRF真实性...`, 'vrf');
    
    try {
      const currentBlock = await this.provider.getBlockNumber();
      
      // 搜索RarityRequested事件
      await this.searchRarityRequestedEvents(tokenId, currentBlock);
      
      // 如果找到了VRF请求ID，检查Chainlink协调器
      if (this.testData.vrfRequestId) {
        await this.checkChainlinkVRFCoordinator(currentBlock);
      }
      
      // 搜索RarityRevealed事件获取随机数
      await this.searchRarityRevealedEvents(tokenId, currentBlock);
      
      // 分析结果
      this.analyzeResults();
      
    } catch (error) {
      this.log(`VRF真实性分析失败: ${error.message}`, 'error');
    }
  }

  // 搜索RarityRequested事件
  async searchRarityRequestedEvents(tokenId, currentBlock) {
    this.log('🔍 搜索RarityRequested事件...', 'progress');
    
    try {
      // 分批搜索最近的区块
      for (let i = 0; i < 10; i++) {
        const fromBlock = Math.max(0, currentBlock - 200 * (i + 1));
        const toBlock = currentBlock - 200 * i;
        
        try {
          const requestFilter = this.contract.filters.RarityRequested(tokenId);
          const requestEvents = await this.contract.queryFilter(requestFilter, fromBlock, toBlock);
          
          if (requestEvents.length > 0) {
            const event = requestEvents[0];
            this.testData.vrfRequestId = event.args.requestId.toString();
            this.log(`✅ 找到VRF请求ID: ${this.testData.vrfRequestId}`, 'success');
            this.testData.events.push({
              type: 'RarityRequested',
              requestId: this.testData.vrfRequestId,
              block: event.blockNumber
            });
            return;
          }
        } catch (error) {
          this.log(`搜索区块 ${fromBlock}-${toBlock} 失败: ${error.message}`, 'warning');
        }
      }
      
      this.log('⚠️ 未找到RarityRequested事件', 'warning');
    } catch (error) {
      this.log(`搜索RarityRequested事件失败: ${error.message}`, 'error');
    }
  }

  // 检查Chainlink VRF协调器
  async checkChainlinkVRFCoordinator(currentBlock) {
    this.log(`🔗 检查Chainlink VRF协调器 (请求ID: ${this.testData.vrfRequestId})...`, 'vrf');
    
    try {
      // 分批搜索VRF协调器事件
      for (let i = 0; i < 5; i++) {
        const fromBlock = Math.max(0, currentBlock - 100 * (i + 1));
        const toBlock = currentBlock - 100 * i;
        
        try {
          const fulfillFilter = this.vrfCoordinator.filters.RandomWordsFulfilled();
          const fulfillEvents = await this.vrfCoordinator.queryFilter(fulfillFilter, fromBlock, toBlock);
          
          // 查找匹配的事件
          const matchingEvent = fulfillEvents.find(event => 
            event.args.requestId.toString() === this.testData.vrfRequestId
          );
          
          if (matchingEvent) {
            this.testData.isRealVRF = true;
            this.log(`🎉 找到匹配的Chainlink VRF履行事件！`, 'success');
            this.log(`履行状态: ${matchingEvent.args.success}`, 'info');
            this.log(`履行区块: ${matchingEvent.blockNumber}`, 'info');
            
            this.testData.events.push({
              type: 'RandomWordsFulfilled',
              requestId: this.testData.vrfRequestId,
              success: matchingEvent.args.success,
              block: matchingEvent.blockNumber
            });
            return;
          }
        } catch (error) {
          this.log(`检查协调器区块 ${fromBlock}-${toBlock} 失败`, 'warning');
        }
      }
      
      this.log('⚠️ 未找到匹配的Chainlink VRF履行事件', 'warning');
      this.testData.backupUsed = true;
      
    } catch (error) {
      this.log(`检查Chainlink协调器失败: ${error.message}`, 'error');
    }
  }

  // 搜索RarityRevealed事件
  async searchRarityRevealedEvents(tokenId, currentBlock) {
    this.log('🔍 搜索RarityRevealed事件...', 'progress');
    
    try {
      for (let i = 0; i < 5; i++) {
        const fromBlock = Math.max(0, currentBlock - 100 * (i + 1));
        const toBlock = currentBlock - 100 * i;
        
        try {
          const revealFilter = this.contract.filters.RarityRevealed(tokenId);
          const revealEvents = await this.contract.queryFilter(revealFilter, fromBlock, toBlock);
          
          if (revealEvents.length > 0) {
            const event = revealEvents[0];
            this.testData.randomValue = event.args.randomValue.toString();
            this.log(`✅ 找到随机数: ${this.testData.randomValue}`, 'success');
            
            this.testData.events.push({
              type: 'RarityRevealed',
              randomValue: this.testData.randomValue,
              rarity: parseInt(event.args.rarity.toString()),
              block: event.blockNumber
            });
            return;
          }
        } catch (error) {
          this.log(`搜索揭晓事件区块 ${fromBlock}-${toBlock} 失败`, 'warning');
        }
      }
      
      this.log('⚠️ 未找到RarityRevealed事件', 'warning');
    } catch (error) {
      this.log(`搜索RarityRevealed事件失败: ${error.message}`, 'error');
    }
  }

  // 分析结果
  analyzeResults() {
    this.log('📊 分析VRF结果...', 'progress');
    
    if (this.testData.isRealVRF && this.testData.vrfRequestId) {
      this.log('✅ 确认使用了真实的Chainlink VRF', 'success');
    } else if (this.testData.vrfRequestId && !this.testData.isRealVRF) {
      this.log('⚠️ 发起了VRF请求但未找到Chainlink履行事件', 'warning');
      this.testData.backupUsed = true;
    } else {
      this.log('❓ 未检测到VRF请求，可能直接使用了备用随机数', 'warning');
      this.testData.backupUsed = true;
    }
  }

  // 步骤5：生成最终报告
  generateFinalReport(vrfResult) {
    const endTime = Date.now();
    const totalTime = Math.round((endTime - this.testData.startTime) / 1000);
    
    console.log('');
    console.log('🏆 =============== VRF真实性测试报告 ===============');
    console.log('');
    
    // 测试概要
    console.log('📋 测试概要:');
    console.log(`  开始时间: ${new Date(this.testData.startTime).toLocaleString()}`);
    console.log(`  总耗时: ${Math.floor(totalTime/60)}分${totalTime%60}秒`);
    console.log(`  测试地址: ${CONFIG.CONTRACT_ADDRESS}`);
    console.log('');
    
    // Mint结果
    console.log('🎨 Mint结果:');
    console.log(`  Transaction: ${this.testData.mintTxHash}`);
    console.log(`  Token ID: #${this.testData.tokenId}`);
    console.log(`  最终稀有度: ${this.testData.finalRarity}`);
    console.log('');
    
    // VRF详情
    console.log('🎲 VRF处理详情:');
    console.log(`  VRF请求ID: ${this.testData.vrfRequestId || '未检测到'}`);
    console.log(`  随机数值: ${this.testData.randomValue || '未检测到'}`);
    console.log(`  Chainlink VRF: ${this.testData.isRealVRF ? 'YES ✅' : 'NO ❌'}`);
    console.log(`  备用随机数: ${this.testData.backupUsed ? 'YES ⚠️' : 'NO ✅'}`);
    console.log('');
    
    // 事件时间线
    console.log('📅 事件时间线:');
    this.testData.events.forEach((event, index) => {
      console.log(`  ${index + 1}. ${event.type} (区块 ${event.block})`);
      if (event.requestId) console.log(`     请求ID: ${event.requestId}`);
      if (event.randomValue) console.log(`     随机数: ${event.randomValue}`);
      if (event.rarity !== undefined) console.log(`     稀有度: ${event.rarity}`);
    });
    console.log('');
    
    // 最终结论
    console.log('🏆 最终结论:');
    if (this.testData.isRealVRF) {
      console.log('  🎉 恭喜！您的合约正在使用真实的Chainlink VRF！');
      console.log('  🔒 随机数来源: Chainlink去中心化预言机网络');
      console.log('  🎯 安全级别: 最高级，完全不可预测和操控');
      console.log('  ✨ 验证状态: 通过区块链事件验证');
      console.log('  🌟 建议: 继续使用，您的项目具有真正的随机性！');
    } else if (this.testData.vrfRequestId && this.testData.backupUsed) {
      console.log('  ⚠️ 检测到使用了备用随机数机制');
      console.log('  🔧 随机数来源: 合约内部生成机制');
      console.log('  🎯 安全级别: 中等，存在一定可预测性');
      console.log('  💡 可能原因: VRF订阅余额不足、网络拥堵或配置问题');
      console.log('  📋 建议: 检查Chainlink VRF订阅状态和LINK代币余额');
    } else {
      console.log('  ❌ 未检测到VRF请求流程');
      console.log('  🔧 随机数来源: 纯合约内部机制');
      console.log('  ⚠️ 建议: 检查VRF配置是否正确启用');
    }
    
    console.log('');
    console.log('==========================================');
    
    return this.testData.isRealVRF;
  }

  // 运行完整测试
  async runCompleteTest() {
    console.log('🚀 开始完整VRF真实性测试...');
    console.log('🎯 目标：铸造新NFT并验证是否使用真实Chainlink VRF');
    console.log('');
    
    try {
      // 步骤1：检查合约状态
      await this.checkContractStatus();
      console.log('');
      
      // 步骤2：执行mint
      const mintResult = await this.performMint();
      console.log('');
      
      // 步骤3：监控VRF过程
      const vrfResult = await this.monitorVRFProcess(mintResult.tokenId);
      console.log('');
      
      // 步骤4：生成最终报告
      const isRealVRF = this.generateFinalReport(vrfResult);
      
      return isRealVRF;
      
    } catch (error) {
      this.log(`❌ 测试过程中发生错误: ${error.message}`, 'error');
      console.log('');
      console.log('🔧 故障排除建议:');
      console.log('  1. 检查网络连接和RPC URL');
      console.log('  2. 确认钱包余额充足');
      console.log('  3. 验证合约地址和ABI');
      console.log('  4. 稍后重试（网络可能拥堵）');
      throw error;
    }
  }
}

// 主执行函数
async function runCompleteVRFTest() {
  const tester = new CompleteVRFTester();
  
  try {
    const isRealVRF = await tester.runCompleteTest();
    
    console.log('');
    if (isRealVRF) {
      console.log('🎉 测试成功！您的项目使用了真实的Chainlink VRF！');
      process.exit(0);
    } else {
      console.log('⚠️ 检测到使用了备用随机数，建议检查VRF配置。');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ VRF测试失败:', error.message);
    process.exit(1);
  }
}

// 执行测试
runCompleteVRFTest();
