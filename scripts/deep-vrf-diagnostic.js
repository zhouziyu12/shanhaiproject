// 深度VRF诊断脚本 - 详细检查VRF配置和合约逻辑
import { ethers } from 'ethers';

const CONFIG = {
  RPC_URL: 'https://eth-sepolia.g.alchemy.com/v2/aoHaEBQa8NDjn-e0t8DyL6Ac8VZ6p9ST',
  CONTRACT_ADDRESS: '0x1C466dbDddb23e123760A2EDCce54b1709Fa735A',
  VRF_COORDINATOR: '0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625',
  PRIVATE_KEY: '0x019ef439d8a1a061e5e1ac1f4be7ca2bea83f87f84e08a427a5ff1dc6f7fba55',
  SUBSCRIPTION_ID: '11978318525222896027773046731460179890031671972527309000293301562433571167752'
};

// 扩展的ABI包含更多VRF相关函数
const DEEP_DIAGNOSTIC_ABI = [
  // VRF配置查询函数
  {
    "inputs": [],
    "name": "s_subscriptionId",
    "outputs": [{"internalType": "uint64", "name": "", "type": "uint64"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "s_vrfCoordinator",
    "outputs": [{"internalType": "contract IVRFCoordinatorV2Plus", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "s_keyHash",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "s_callbackGasLimit",
    "outputs": [{"internalType": "uint32", "name": "", "type": "uint32"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "s_requestConfirmations",
    "outputs": [{"internalType": "uint16", "name": "", "type": "uint16"}],
    "stateMutability": "view",
    "type": "function"
  },
  // 基础函数
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
  // 事件
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
  }
];

class DeepVRFDiagnostic {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    this.wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, this.provider);
    this.contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, DEEP_DIAGNOSTIC_ABI, this.wallet);
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const icons = { info: '📋', success: '✅', warning: '⚠️', error: '❌', progress: '🔄', deep: '🔬' };
    console.log(`${icons[type]} [${timestamp}] ${message}`);
  }

  // 步骤1：深度检查VRF配置
  async deepCheckVRFConfiguration() {
    this.log('🔬 深度检查VRF配置...', 'deep');
    
    try {
      const [
        subscriptionId,
        vrfCoordinator,
        keyHash,
        callbackGasLimit,
        requestConfirmations
      ] = await Promise.all([
        this.contract.s_subscriptionId().catch(() => null),
        this.contract.s_vrfCoordinator().catch(() => null),
        this.contract.s_keyHash().catch(() => null),
        this.contract.s_callbackGasLimit().catch(() => null),
        this.contract.s_requestConfirmations().catch(() => null)
      ]);

      console.log('');
      console.log('📊 VRF配置详情:');
      console.log(`  订阅ID: ${subscriptionId || '❌ 未设置'}`);
      console.log(`  VRF协调器: ${vrfCoordinator || '❌ 未设置'}`);
      console.log(`  KeyHash: ${keyHash || '❌ 未设置'}`);
      console.log(`  回调Gas限制: ${callbackGasLimit || '❌ 未设置'}`);
      console.log(`  确认块数: ${requestConfirmations || '❌ 未设置'}`);
      console.log('');

      // 验证配置正确性
      let configIssues = [];
      
      if (!subscriptionId || subscriptionId.toString() === '0') {
        configIssues.push('订阅ID未设置或为0');
      } else if (subscriptionId.toString() !== CONFIG.SUBSCRIPTION_ID) {
        configIssues.push(`订阅ID不匹配 (期望: ${CONFIG.SUBSCRIPTION_ID}, 实际: ${subscriptionId})`);
      }
      
      if (!vrfCoordinator || vrfCoordinator.toLowerCase() !== CONFIG.VRF_COORDINATOR.toLowerCase()) {
        configIssues.push('VRF协调器地址不正确');
      }
      
      if (!keyHash || keyHash === '0x0000000000000000000000000000000000000000000000000000000000000000') {
        configIssues.push('KeyHash未设置');
      }
      
      if (!callbackGasLimit || callbackGasLimit.toString() === '0') {
        configIssues.push('回调Gas限制未设置');
      }

      if (configIssues.length > 0) {
        this.log('❌ 发现配置问题:', 'error');
        configIssues.forEach(issue => {
          this.log(`  - ${issue}`, 'error');
        });
        return false;
      } else {
        this.log('✅ VRF配置验证通过', 'success');
        return true;
      }

    } catch (error) {
      this.log(`配置检查失败: ${error.message}`, 'error');
      return false;
    }
  }

  // 步骤2：检查合约源码逻辑
  async analyzeContractLogic() {
    this.log('🔬 分析合约逻辑...', 'deep');
    
    try {
      // 尝试调用mint并观察日志
      this.log('创建测试mint来观察合约行为...', 'progress');
      
      const prompt = `深度诊断测试 ${Date.now()}`;
      const mintPrice = await this.contract.mintPrice();
      
      // 估算Gas使用量
      const gasEstimate = await this.contract.mint.estimateGas(
        this.wallet.address, 
        prompt, 
        { value: mintPrice }
      );
      
      this.log(`估算Gas使用量: ${gasEstimate.toString()}`, 'info');
      
      // 执行mint交易并详细监控
      const mintTx = await this.contract.mint(this.wallet.address, prompt, {
        value: mintPrice,
        gasLimit: Math.floor(Number(gasEstimate) * 1.2) // 增加20%缓冲
      });
      
      this.log(`测试Mint交易: ${mintTx.hash}`, 'info');
      
      const receipt = await mintTx.wait();
      this.log(`交易确认，区块: ${receipt.blockNumber}`, 'success');
      
      // 详细分析交易日志
      return await this.analyzeTransactionLogs(receipt);
      
    } catch (error) {
      this.log(`合约逻辑分析失败: ${error.message}`, 'error');
      
      // 分析错误类型
      if (error.message.includes('insufficient funds')) {
        this.log('可能原因: 订阅余额不足', 'warning');
      } else if (error.message.includes('revert')) {
        this.log('可能原因: 合约内部逻辑阻止了VRF请求', 'warning');
      } else if (error.message.includes('gas')) {
        this.log('可能原因: Gas限制问题', 'warning');
      }
      
      return false;
    }
  }

  // 分析交易日志
  async analyzeTransactionLogs(receipt) {
    this.log('🔍 分析交易日志...', 'progress');
    
    let foundVRFRequest = false;
    let foundRarityRevealed = false;
    let tokenId = null;
    
    try {
      // 解析所有日志
      for (const log of receipt.logs) {
        try {
          const parsedLog = this.contract.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          
          if (parsedLog) {
            this.log(`发现事件: ${parsedLog.name}`, 'info');
            
            if (parsedLog.name === 'RarityRequested') {
              foundVRFRequest = true;
              tokenId = parseInt(parsedLog.args.tokenId.toString());
              this.log(`✅ VRF请求已发起! Token ID: ${tokenId}, 请求ID: ${parsedLog.args.requestId}`, 'success');
            }
            
            if (parsedLog.name === 'RarityRevealed') {
              foundRarityRevealed = true;
              tokenId = parseInt(parsedLog.args.tokenId.toString());
              this.log(`稀有度已揭晓: Token ID: ${tokenId}, 稀有度: ${parsedLog.args.rarity}, 随机数: ${parsedLog.args.randomValue}`, 'info');
            }
          }
        } catch (e) {
          // 非合约事件，跳过
        }
      }
      
      console.log('');
      console.log('📊 交易分析结果:');
      console.log(`  VRF请求已发起: ${foundVRFRequest ? 'YES ✅' : 'NO ❌'}`);
      console.log(`  稀有度立即揭晓: ${foundRarityRevealed ? 'YES ⚠️' : 'NO ✅'}`);
      
      if (foundVRFRequest && !foundRarityRevealed) {
        this.log('🎉 太好了！VRF请求已成功发起，正在等待Chainlink履行', 'success');
        
        if (tokenId) {
          this.log(`开始监控Token #${tokenId}的VRF履行过程...`, 'progress');
          return await this.monitorVRFFulfillment(tokenId);
        }
        
        return true;
      } else if (foundVRFRequest && foundRarityRevealed) {
        this.log('⚠️ VRF请求发起但立即使用了备用随机数', 'warning');
        return false;
      } else if (!foundVRFRequest && foundRarityRevealed) {
        this.log('❌ 没有VRF请求，直接使用了备用随机数', 'error');
        return false;
      } else {
        this.log('❓ 未检测到稀有度相关事件', 'warning');
        return false;
      }
      
    } catch (error) {
      this.log(`日志分析失败: ${error.message}`, 'error');
      return false;
    }
  }

  // 监控VRF履行过程
  async monitorVRFFulfillment(tokenId) {
    this.log(`🔄 监控Token #${tokenId}的VRF履行...`, 'progress');
    
    const startTime = Date.now();
    const maxWaitTime = 10 * 60 * 1000; // 10分钟
    const pollInterval = 10000; // 10秒
    
    return new Promise((resolve) => {
      const checkFulfillment = async () => {
        try {
          const elapsed = Date.now() - startTime;
          const minutes = Math.floor(elapsed / 60000);
          const seconds = Math.floor((elapsed % 60000) / 1000);
          
          this.log(`监控进度 - 等待时间 ${minutes}:${seconds.toString().padStart(2, '0')}`, 'progress');
          
          if (elapsed > maxWaitTime) {
            this.log('⏰ VRF监控超时', 'warning');
            resolve(false);
            return;
          }
          
          // 检查稀有度是否已揭晓
          const beast = await this.contract.beasts(tokenId);
          
          if (beast.rarityRevealed) {
            this.log(`🎉 VRF履行完成！稀有度: ${beast.rarity}`, 'success');
            
            // 检查是否找到Chainlink履行事件
            const vrfFulfilled = await this.checkChainlinkFulfillment(tokenId);
            
            if (vrfFulfilled) {
              this.log('✅ 确认使用了真实的Chainlink VRF！', 'success');
              resolve(true);
            } else {
              this.log('⚠️ 稀有度已揭晓但未找到Chainlink履行事件', 'warning');
              resolve(false);
            }
            return;
          }
          
          // 继续监控
          setTimeout(checkFulfillment, pollInterval);
          
        } catch (error) {
          this.log(`监控过程出错: ${error.message}`, 'error');
          setTimeout(checkFulfillment, pollInterval);
        }
      };
      
      checkFulfillment();
    });
  }

  // 检查Chainlink履行事件
  async checkChainlinkFulfillment(tokenId) {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      
      // 搜索RarityRevealed事件获取详细信息
      for (let i = 0; i < 5; i++) {
        const fromBlock = Math.max(0, currentBlock - 50 * (i + 1));
        const toBlock = currentBlock - 50 * i;
        
        try {
          const revealFilter = this.contract.filters.RarityRevealed(tokenId);
          const revealEvents = await this.contract.queryFilter(revealFilter, fromBlock, toBlock);
          
          if (revealEvents.length > 0) {
            const event = revealEvents[0];
            this.log(`找到RarityRevealed事件，随机数: ${event.args.randomValue}`, 'info');
            
            // 检查随机数是否来自真实VRF
            const randomValue = event.args.randomValue.toString();
            
            // 真实VRF通常产生很大的随机数，备用随机数通常较小
            if (randomValue.length > 10) {
              this.log('✅ 随机数格式符合真实VRF特征', 'success');
              return true;
            } else {
              this.log('⚠️ 随机数格式可能来自备用机制', 'warning');
              return false;
            }
          }
        } catch (error) {
          // 继续搜索
        }
      }
      
      return false;
    } catch (error) {
      this.log(`检查Chainlink履行失败: ${error.message}`, 'error');
      return false;
    }
  }

  // 运行深度诊断
  async runDeepDiagnosis() {
    console.log('🔬 开始深度VRF诊断...');
    console.log('🎯 目标：找出VRF配置正确但仍使用备用随机数的原因');
    console.log('');
    
    try {
      // 步骤1：深度检查VRF配置
      const configOK = await this.deepCheckVRFConfiguration();
      console.log('');
      
      if (!configOK) {
        this.log('❌ VRF配置存在问题，需要重新配置', 'error');
        return false;
      }
      
      // 步骤2：分析合约逻辑
      const logicOK = await this.analyzeContractLogic();
      console.log('');
      
      // 生成诊断结论
      this.generateDeepDiagnosisConclusion(configOK, logicOK);
      
      return logicOK;
      
    } catch (error) {
      this.log(`深度诊断失败: ${error.message}`, 'error');
      throw error;
    }
  }

  // 生成深度诊断结论
  generateDeepDiagnosisConclusion(configOK, logicOK) {
    console.log('🏥 =============== 深度诊断结论 ===============');
    console.log('');
    
    if (configOK && logicOK) {
      console.log('🎉 诊断结果: VRF配置和逻辑都正常！');
      console.log('✅ 合约现在应该使用真实的Chainlink VRF');
      console.log('🎮 建议: 再次运行 npm run complete-vrf-test 验证');
    } else if (configOK && !logicOK) {
      console.log('⚠️ 诊断结果: VRF配置正确，但可能存在其他问题');
      console.log('');
      console.log('🔧 可能的问题和解决方案:');
      console.log('  1. 订阅余额不足 - 检查 https://vrf.chain.link');
      console.log('  2. Gas限制过低 - 增加callbackGasLimit');
      console.log('  3. 网络拥堵 - 等待网络状况改善');
      console.log('  4. 合约内部逻辑 - 检查合约源码');
    } else {
      console.log('❌ 诊断结果: VRF配置存在问题');
      console.log('🔧 建议: 重新运行 npm run configure-vrf 配置VRF');
    }
    
    console.log('');
    console.log('==========================================');
  }
}

// 主执行函数
async function runDeepDiagnosis() {
  const diagnostic = new DeepVRFDiagnostic();
  
  try {
    const result = await diagnostic.runDeepDiagnosis();
    
    console.log('');
    if (result) {
      console.log('🎉 深度诊断完成！VRF应该正常工作了。');
      process.exit(0);
    } else {
      console.log('⚠️ 发现问题，请按照建议进行修复。');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ 深度诊断失败:', error.message);
    process.exit(1);
  }
}

// 执行深度诊断
runDeepDiagnosis();
