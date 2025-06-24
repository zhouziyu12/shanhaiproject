// 简化VRF测试 - 直接使用现有NFT测试VRF
import { ethers } from 'ethers';

const CONFIG = {
  RPC_URL: 'https://eth-sepolia.g.alchemy.com/v2/aoHaEBQa8NDjn-e0t8DyL6Ac8VZ6p9ST',
  CONTRACT_ADDRESS: '0x1C466dbDddb23e123760A2EDCce54b1709Fa735A',
  VRF_COORDINATOR: '0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625',
  PRIVATE_KEY: '0x019ef439d8a1a061e5e1ac1f4be7ca2bea83f87f84e08a427a5ff1dc6f7fba55'
};

// 最小的ABI - 只包含必要的函数
const MINIMAL_ABI = [
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
    "name": "revealRarity",
    "outputs": [],
    "stateMutability": "nonpayable",
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
  }
];

class SimpleVRFTest {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    this.wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, this.provider);
    this.contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, MINIMAL_ABI, this.wallet);
    this.vrfCoordinator = new ethers.Contract(CONFIG.VRF_COORDINATOR, VRF_COORDINATOR_ABI, this.provider);
  }

  log(message, type = 'info') {
    const icons = { info: '📋', success: '✅', warning: '⚠️', error: '❌', progress: '🔄' };
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${icons[type]} [${timestamp}] ${message}`);
  }

  // 直接检查特定Token的VRF状态
  async checkSpecificTokens() {
    this.log('🔍 检查特定Token的VRF状态...', 'progress');
    
    // 检查最近可能的Token ID（假设从60-66）
    const tokenIds = [66, 65, 64, 63, 62, 61, 60];
    
    for (const tokenId of tokenIds) {
      try {
        this.log(`检查Token #${tokenId}...`, 'progress');
        
        const beast = await this.contract.beasts(tokenId);
        
        this.log(`Token #${tokenId}:`, 'info');
        this.log(`  Prompt: ${beast.prompt}`, 'info');
        this.log(`  稀有度已揭晓: ${beast.rarityRevealed}`, 'info');
        if (beast.rarityRevealed) {
          this.log(`  稀有度: ${beast.rarity}`, 'info');
        }
        this.log(`  创建者: ${beast.creator}`, 'info');
        
        // 如果稀有度未揭晓，这是一个VRF测试的好候选
        if (!beast.rarityRevealed && beast.creator.toLowerCase() === this.wallet.address.toLowerCase()) {
          this.log(`🎯 找到VRF测试候选Token #${tokenId}!`, 'success');
          return { tokenId, beast };
        }
        
        // 如果稀有度已揭晓，我们可以验证VRF真实性
        if (beast.rarityRevealed && beast.creator.toLowerCase() === this.wallet.address.toLowerCase()) {
          this.log(`🔍 Token #${tokenId} 可用于VRF真实性验证`, 'success');
          
          // 检查这个Token的VRF事件
          const vrfData = await this.checkVRFEvents(tokenId);
          if (vrfData.isRealVRF) {
            this.log(`✅ Token #${tokenId} 使用了真实的Chainlink VRF!`, 'success');
            return { tokenId, beast, vrfData, isVerified: true };
          }
        }
        
        console.log('');
      } catch (error) {
        this.log(`Token #${tokenId} 查询失败: ${error.message}`, 'warning');
      }
    }
    
    return null;
  }

  // 检查VRF事件
  async checkVRFEvents(tokenId) {
    this.log(`🔍 查找Token #${tokenId}的VRF事件...`, 'progress');
    
    try {
      const currentBlock = await this.provider.getBlockNumber();
      
      // 使用较小的区块范围避免API限制
      let vrfRequestId = null;
      let randomValue = null;
      let isRealVRF = false;
      
      // 分批搜索事件
      for (let i = 0; i < 10; i++) {
        const fromBlock = Math.max(0, currentBlock - 500 * (i + 1));
        const toBlock = currentBlock - 500 * i;
        
        try {
          // 查找RarityRequested事件
          const requestFilter = this.contract.filters.RarityRequested(tokenId);
          const requestEvents = await this.contract.queryFilter(requestFilter, fromBlock, toBlock);
          
          if (requestEvents.length > 0) {
            vrfRequestId = requestEvents[0].args.requestId.toString();
            this.log(`找到VRF请求ID: ${vrfRequestId}`, 'success');
            break;
          }
        } catch (error) {
          this.log(`搜索区块 ${fromBlock}-${toBlock} 失败`, 'warning');
        }
      }
      
      if (vrfRequestId) {
        // 检查VRF协调器事件
        for (let i = 0; i < 10; i++) {
          const fromBlock = Math.max(0, currentBlock - 500 * (i + 1));
          const toBlock = currentBlock - 500 * i;
          
          try {
            const fulfillFilter = this.vrfCoordinator.filters.RandomWordsFulfilled();
            const fulfillEvents = await this.vrfCoordinator.queryFilter(fulfillFilter, fromBlock, toBlock);
            
            const matchingEvent = fulfillEvents.find(event => 
              event.args.requestId.toString() === vrfRequestId
            );
            
            if (matchingEvent) {
              isRealVRF = true;
              this.log(`✅ 找到匹配的Chainlink VRF履行事件!`, 'success');
              break;
            }
          } catch (error) {
            // 继续搜索
          }
        }
      }
      
      return { vrfRequestId, randomValue, isRealVRF };
      
    } catch (error) {
      this.log(`检查VRF事件失败: ${error.message}`, 'error');
      return { vrfRequestId: null, randomValue: null, isRealVRF: false };
    }
  }

  // 尝试触发VRF
  async triggerVRF(tokenId) {
    this.log(`🎲 尝试为Token #${tokenId}触发VRF...`, 'progress');
    
    try {
      // 先检查是否已经在处理中
      const isPending = await this.contract.vrfPending(tokenId);
      if (isPending) {
        this.log(`Token #${tokenId} VRF已在处理中，开始监控...`, 'warning');
        return this.monitorVRF(tokenId);
      }
      
      // 尝试触发VRF
      const tx = await this.contract.revealRarity(tokenId, {
        gasLimit: 300000
      });
      
      this.log(`VRF触发成功! 交易: ${tx.hash}`, 'success');
      
      const receipt = await tx.wait();
      this.log(`交易已确认，区块: ${receipt.blockNumber}`, 'success');
      
      // 开始监控VRF
      return this.monitorVRF(tokenId);
      
    } catch (error) {
      this.log(`触发VRF失败: ${error.message}`, 'error');
      return null;
    }
  }

  // 监控VRF处理过程
  async monitorVRF(tokenId) {
    this.log(`🔄 开始监控Token #${tokenId}的VRF处理...`, 'progress');
    
    const startTime = Date.now();
    const maxWaitTime = 10 * 60 * 1000; // 10分钟
    let pollCount = 0;
    
    return new Promise((resolve) => {
      const checkVRF = async () => {
        try {
          pollCount++;
          const elapsed = Date.now() - startTime;
          
          this.log(`VRF轮询 ${pollCount} - 已等待 ${Math.round(elapsed/1000)}秒`, 'progress');
          
          if (elapsed > maxWaitTime) {
            this.log('VRF监控超时', 'warning');
            resolve({ success: false, reason: 'timeout' });
            return;
          }
          
          const beast = await this.contract.beasts(tokenId);
          
          if (beast.rarityRevealed) {
            this.log(`🎉 VRF完成! 稀有度: ${beast.rarity}`, 'success');
            
            // 检查VRF真实性
            const vrfData = await this.checkVRFEvents(tokenId);
            
            resolve({
              success: true,
              tokenId: tokenId,
              rarity: parseInt(beast.rarity.toString()),
              isRealVRF: vrfData.isRealVRF,
              vrfRequestId: vrfData.vrfRequestId,
              waitTime: elapsed,
              pollCount: pollCount
            });
            return;
          }
          
          // 继续轮询
          setTimeout(checkVRF, 10000); // 10秒间隔
          
        } catch (error) {
          this.log(`VRF轮询错误: ${error.message}`, 'error');
          setTimeout(checkVRF, 10000);
        }
      };
      
      checkVRF();
    });
  }

  // 生成报告
  generateReport(result) {
    console.log('');
    console.log('🏆 =============== VRF测试报告 ===============');
    console.log('');
    
    if (result.isVerified) {
      console.log('✅ VRF真实性验证结果:');
      console.log(`  Token ID: #${result.tokenId}`);
      console.log(`  稀有度: ${result.beast.rarity}`);
      console.log(`  使用真实VRF: ${result.vrfData.isRealVRF ? 'YES' : 'NO'}`);
      
      if (result.vrfData.isRealVRF) {
        console.log('');
        console.log('🎉 恭喜！您的合约正在使用真实的Chainlink VRF！');
        console.log('🔒 随机数来源: Chainlink去中心化预言机网络');
        console.log('🎲 安全性: 最高级，完全不可预测');
      } else {
        console.log('');
        console.log('⚠️ 警告：可能使用了备用随机数机制');
        console.log('🔧 建议检查VRF配置和订阅状态');
      }
    } else if (result.success) {
      console.log('✅ VRF测试完成:');
      console.log(`  Token ID: #${result.tokenId}`);
      console.log(`  稀有度: ${result.rarity}`);
      console.log(`  使用真实VRF: ${result.isRealVRF ? 'YES' : 'NO'}`);
      console.log(`  等待时间: ${Math.round(result.waitTime/1000)}秒`);
      console.log(`  轮询次数: ${result.pollCount}`);
      
      if (result.isRealVRF) {
        console.log('');
        console.log('🎉 成功！您的合约正在使用真实的Chainlink VRF！');
      }
    } else {
      console.log('❌ VRF测试失败');
      console.log(`  原因: ${result.reason}`);
    }
    
    console.log('');
    console.log('===============================================');
  }

  // 运行简化测试
  async runSimpleTest() {
    console.log('🎯 开始简化VRF测试...');
    console.log('🔍 使用你现有的NFT进行测试');
    console.log('');
    
    try {
      // 1. 检查现有Token
      const tokenInfo = await this.checkSpecificTokens();
      
      if (!tokenInfo) {
        this.log('没有找到可用的Token进行测试', 'error');
        return;
      }
      
      // 2. 如果已经验证过
      if (tokenInfo.isVerified) {
        this.generateReport(tokenInfo);
        return tokenInfo;
      }
      
      // 3. 如果需要触发VRF
      if (!tokenInfo.beast.rarityRevealed) {
        this.log(`使用Token #${tokenInfo.tokenId}进行VRF测试`, 'success');
        
        const vrfResult = await this.triggerVRF(tokenInfo.tokenId);
        
        if (vrfResult) {
          this.generateReport(vrfResult);
          return vrfResult;
        }
      }
      
    } catch (error) {
      this.log(`测试失败: ${error.message}`, 'error');
    }
  }
}

// 运行测试
async function runSimpleVRFTest() {
  const tester = new SimpleVRFTest();
  
  try {
    const result = await tester.runSimpleTest();
    
    if (result && result.isRealVRF) {
      console.log('🎉 测试成功！您使用了真实的Chainlink VRF！');
      process.exit(0);
    } else {
      console.log('⚠️ 测试完成，请查看报告了解详情');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
}

runSimpleVRFTest();
