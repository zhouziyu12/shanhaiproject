// VRF诊断和修复脚本 - 检查并修复VRF配置问题
import { ethers } from 'ethers';

const CONFIG = {
  RPC_URL: 'https://eth-sepolia.g.alchemy.com/v2/aoHaEBQa8NDjn-e0t8DyL6Ac8VZ6p9ST',
  CONTRACT_ADDRESS: '0x1C466dbDddb23e123760A2EDCce54b1709Fa735A',
  VRF_COORDINATOR: '0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625',
  PRIVATE_KEY: '0x019ef439d8a1a061e5e1ac1f4be7ca2bea83f87f84e08a427a5ff1dc6f7fba55',
  // Sepolia LINK Token地址
  LINK_TOKEN: '0x779877A7B0D9E8603169DdbD7836e478b4624789'
};

// 扩展的ABI包含VRF管理函数
const ENHANCED_ABI = [
  // 基础函数
  {
    "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "string", "name": "prompt", "type": "string"}],
    "name": "mint",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "payable",
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
  // VRF配置查询函数
  {
    "inputs": [],
    "name": "s_vrfCoordinator",
    "outputs": [{"internalType": "contract IVRFCoordinatorV2Plus", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  // 所有者函数
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  // VRF配置管理函数（仅所有者）
  {
    "inputs": [{"internalType": "uint256", "name": "_subscriptionId", "type": "uint256"}],
    "name": "setVRFSubscriptionId",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_vrfCoordinator", "type": "address"}],
    "name": "setCoordinator",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "_keyHash", "type": "bytes32"}, {"internalType": "uint32", "name": "_callbackGasLimit", "type": "uint32"}, {"internalType": "uint16", "name": "_requestConfirmations", "type": "uint16"}],
    "name": "updateVRFConfig",
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
  }
];

// LINK Token ABI（简化版）
const LINK_TOKEN_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "transfer",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

class VRFDiagnosticTool {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    this.wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, this.provider);
    this.contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, ENHANCED_ABI, this.wallet);
    this.linkToken = new ethers.Contract(CONFIG.LINK_TOKEN, LINK_TOKEN_ABI, this.provider);
    
    this.diagnosis = {
      contractOwner: null,
      vrfCoordinator: null,
      subscriptionId: null,
      isOwner: false,
      linkBalance: null,
      vrfConfigured: false,
      issues: [],
      solutions: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const icons = { info: '📋', success: '✅', warning: '⚠️', error: '❌', progress: '🔄', fix: '🔧' };
    console.log(`${icons[type] || '📋'} [${timestamp}] ${message}`);
  }

  // 步骤1：诊断合约配置
  async diagnoseContract() {
    this.log('🔍 诊断合约VRF配置...', 'progress');
    
    try {
      // 检查合约所有者
      this.diagnosis.contractOwner = await this.contract.owner();
      this.diagnosis.isOwner = this.diagnosis.contractOwner.toLowerCase() === this.wallet.address.toLowerCase();
      
      this.log(`合约所有者: ${this.diagnosis.contractOwner}`, 'info');
      this.log(`你是所有者: ${this.diagnosis.isOwner ? 'YES ✅' : 'NO ❌'}`, this.diagnosis.isOwner ? 'success' : 'warning');
      
      // 检查VRF协调器
      try {
        this.diagnosis.vrfCoordinator = await this.contract.s_vrfCoordinator();
        this.log(`VRF协调器: ${this.diagnosis.vrfCoordinator}`, 'info');
        
        if (this.diagnosis.vrfCoordinator === CONFIG.VRF_COORDINATOR) {
          this.log('✅ VRF协调器地址正确', 'success');
        } else {
          this.log('⚠️ VRF协调器地址不匹配', 'warning');
          this.diagnosis.issues.push('VRF协调器地址不正确');
        }
      } catch (error) {
        this.log('❌ 无法获取VRF协调器地址', 'error');
        this.diagnosis.issues.push('VRF协调器未配置');
      }
      
      // 检查LINK余额
      try {
        this.diagnosis.linkBalance = await this.linkToken.balanceOf(this.wallet.address);
        this.log(`你的LINK余额: ${ethers.formatEther(this.diagnosis.linkBalance)} LINK`, 'info');
        
        if (this.diagnosis.linkBalance < ethers.parseEther('1')) {
          this.diagnosis.issues.push('LINK余额不足（需要至少1 LINK用于VRF）');
        }
      } catch (error) {
        this.log('无法检查LINK余额', 'warning');
      }
      
      return this.diagnosis;
      
    } catch (error) {
      this.log(`诊断失败: ${error.message}`, 'error');
      throw error;
    }
  }

  // 步骤2：检查Chainlink订阅状态
  async checkSubscriptionStatus() {
    this.log('🔗 检查Chainlink VRF订阅状态...', 'progress');
    
    try {
      // 尝试从最近的事件中找到订阅信息
      this.log('搜索历史VRF请求以确定订阅ID...', 'progress');
      
      const currentBlock = await this.provider.getBlockNumber();
      
      // 搜索最近的VRF请求事件
      for (let i = 0; i < 20; i++) {
        const fromBlock = Math.max(0, currentBlock - 1000 * (i + 1));
        const toBlock = currentBlock - 1000 * i;
        
        try {
          // 搜索RandomWordsRequested事件来找订阅ID
          const vrfCoordinator = new ethers.Contract(CONFIG.VRF_COORDINATOR, [
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
          ], this.provider);
          
          const requestFilter = vrfCoordinator.filters.RandomWordsRequested(null, null, null, null, null, null, null, CONFIG.CONTRACT_ADDRESS);
          const requestEvents = await vrfCoordinator.queryFilter(requestFilter, fromBlock, toBlock);
          
          if (requestEvents.length > 0) {
            const event = requestEvents[0];
            this.diagnosis.subscriptionId = event.args.subId.toString();
            this.log(`找到订阅ID: ${this.diagnosis.subscriptionId}`, 'success');
            break;
          }
        } catch (error) {
          // 继续搜索下一个区块范围
        }
      }
      
      if (!this.diagnosis.subscriptionId) {
        this.log('⚠️ 未找到历史VRF请求，可能订阅未配置', 'warning');
        this.diagnosis.issues.push('未找到VRF订阅配置');
        this.diagnosis.solutions.push('需要配置Chainlink VRF订阅ID');
      }
      
    } catch (error) {
      this.log(`检查订阅状态失败: ${error.message}`, 'error');
    }
  }

  // 步骤3：尝试手动触发VRF以测试配置
  async testVRFConfiguration() {
    this.log('🧪 测试VRF配置...', 'progress');
    
    try {
      // 使用之前创建的Token #84来测试
      const testTokenId = 84;
      
      this.log(`尝试为Token #${testTokenId}手动触发VRF...`, 'progress');
      
      // 检查Token状态
      const beast = await this.contract.beasts(testTokenId);
      
      if (beast.rarityRevealed) {
        this.log(`Token #${testTokenId}稀有度已揭晓，无法重新触发VRF`, 'warning');
        
        // 创建新的NFT来测试
        this.log('创建新NFT进行VRF测试...', 'progress');
        const newTokenResult = await this.createTestNFT();
        
        if (newTokenResult.success) {
          return this.attemptVRFTrigger(newTokenResult.tokenId);
        }
      } else {
        return this.attemptVRFTrigger(testTokenId);
      }
      
    } catch (error) {
      this.log(`VRF配置测试失败: ${error.message}`, 'error');
      return false;
    }
  }

  // 创建测试NFT
  async createTestNFT() {
    try {
      const prompt = `VRF诊断测试 ${Date.now()}`;
      const mintTx = await this.contract.mint(this.wallet.address, prompt, {
        value: await this.contract.mintPrice(),
        gasLimit: 500000
      });
      
      const receipt = await mintTx.wait();
      
      // 提取Token ID
      const transferTopic = ethers.id("Transfer(address,address,uint256)");
      for (const log of receipt.logs) {
        if (log.topics[0] === transferTopic) {
          const tokenId = parseInt(BigInt(log.topics[3]).toString());
          this.log(`测试NFT创建成功 - Token ID: ${tokenId}`, 'success');
          return { success: true, tokenId };
        }
      }
      
      return { success: false };
    } catch (error) {
      this.log(`创建测试NFT失败: ${error.message}`, 'error');
      return { success: false };
    }
  }

  // 尝试触发VRF
  async attemptVRFTrigger(tokenId) {
    try {
      this.log(`为Token #${tokenId}触发VRF...`, 'progress');
      
      const revealTx = await this.contract.revealRarityManually(tokenId, {
        gasLimit: 300000
      });
      
      this.log(`VRF触发交易: ${revealTx.hash}`, 'success');
      
      const receipt = await revealTx.wait();
      this.log(`VRF触发交易已确认，区块: ${receipt.blockNumber}`, 'success');
      
      // 检查是否产生了RarityRequested事件
      const hasVRFRequest = await this.checkForVRFRequest(receipt, tokenId);
      
      if (hasVRFRequest) {
        this.log('✅ VRF请求成功发起！', 'success');
        this.diagnosis.vrfConfigured = true;
        return true;
      } else {
        this.log('⚠️ VRF触发但未发现VRF请求事件', 'warning');
        this.diagnosis.issues.push('VRF配置可能存在问题');
        return false;
      }
      
    } catch (error) {
      this.log(`VRF触发失败: ${error.message}`, 'error');
      
      // 分析错误信息
      if (error.message.includes('insufficient funds')) {
        this.diagnosis.issues.push('VRF订阅余额不足');
        this.diagnosis.solutions.push('需要向Chainlink VRF订阅充值LINK代币');
      } else if (error.message.includes('subscription')) {
        this.diagnosis.issues.push('VRF订阅配置问题');
        this.diagnosis.solutions.push('检查VRF订阅ID和合约配置');
      }
      
      return false;
    }
  }

  // 检查VRF请求事件
  async checkForVRFRequest(receipt, tokenId) {
    try {
      // 检查receipt中的事件
      for (const log of receipt.logs) {
        try {
          const parsedLog = this.contract.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          
          if (parsedLog && parsedLog.name === 'RarityRequested' && 
              parseInt(parsedLog.args.tokenId.toString()) === tokenId) {
            this.log(`发现VRF请求事件 - 请求ID: ${parsedLog.args.requestId}`, 'success');
            return true;
          }
        } catch (e) {
          // 继续检查下一个log
        }
      }
      
      return false;
    } catch (error) {
      this.log(`检查VRF请求事件失败: ${error.message}`, 'error');
      return false;
    }
  }

  // 步骤4：提供修复建议
  generateFixRecommendations() {
    this.log('📋 生成修复建议...', 'progress');
    
    // 基于诊断结果生成建议
    if (!this.diagnosis.isOwner) {
      this.diagnosis.solutions.push('联系合约所有者进行VRF配置');
    }
    
    if (this.diagnosis.issues.includes('VRF订阅余额不足')) {
      this.diagnosis.solutions.push('访问 https://vrf.chain.link 充值LINK到订阅');
    }
    
    if (!this.diagnosis.vrfConfigured) {
      this.diagnosis.solutions.push('检查VRF订阅ID、KeyHash、CallbackGasLimit配置');
    }
    
    return {
      issues: this.diagnosis.issues,
      solutions: this.diagnosis.solutions,
      canFix: this.diagnosis.isOwner,
      subscriptionId: this.diagnosis.subscriptionId
    };
  }

  // 运行完整诊断
  async runDiagnosis() {
    console.log('🔬 开始VRF诊断和修复流程...');
    console.log('🎯 目标：找出为什么VRF使用备用随机数并提供修复方案');
    console.log('');
    
    try {
      // 步骤1：诊断合约配置
      await this.diagnoseContract();
      console.log('');
      
      // 步骤2：检查订阅状态
      await this.checkSubscriptionStatus();
      console.log('');
      
      // 步骤3：测试VRF配置
      const vrfWorking = await this.testVRFConfiguration();
      console.log('');
      
      // 步骤4：生成修复建议
      const recommendations = this.generateFixRecommendations();
      
      // 输出诊断报告
      this.generateDiagnosticReport(recommendations, vrfWorking);
      
      return {
        diagnosis: this.diagnosis,
        recommendations,
        vrfWorking
      };
      
    } catch (error) {
      this.log(`诊断过程失败: ${error.message}`, 'error');
      throw error;
    }
  }

  // 生成诊断报告
  generateDiagnosticReport(recommendations, vrfWorking) {
    console.log('🏥 =============== VRF诊断报告 ===============');
    console.log('');
    
    // 当前状态
    console.log('📊 当前状态:');
    console.log(`  合约所有者: ${this.diagnosis.contractOwner}`);
    console.log(`  你是所有者: ${this.diagnosis.isOwner ? 'YES ✅' : 'NO ❌'}`);
    console.log(`  VRF协调器: ${this.diagnosis.vrfCoordinator || '未配置'}`);
    console.log(`  订阅ID: ${this.diagnosis.subscriptionId || '未找到'}`);
    console.log(`  LINK余额: ${this.diagnosis.linkBalance ? ethers.formatEther(this.diagnosis.linkBalance) + ' LINK' : '未知'}`);
    console.log(`  VRF工作状态: ${vrfWorking ? 'YES ✅' : 'NO ❌'}`);
    console.log('');
    
    // 发现的问题
    console.log('⚠️ 发现的问题:');
    if (this.diagnosis.issues.length === 0) {
      console.log('  未发现明显问题');
    } else {
      this.diagnosis.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    }
    console.log('');
    
    // 修复建议
    console.log('🔧 修复建议:');
    if (recommendations.solutions.length === 0) {
      console.log('  VRF配置看起来正常');
    } else {
      recommendations.solutions.forEach((solution, index) => {
        console.log(`  ${index + 1}. ${solution}`);
      });
    }
    console.log('');
    
    // 下一步行动
    console.log('🎯 下一步行动:');
    if (vrfWorking) {
      console.log('  ✅ VRF配置正常，新的mint应该会使用真实VRF');
      console.log('  🎮 运行: npm run complete-vrf-test 再次测试');
    } else if (recommendations.subscriptionId) {
      console.log(`  🔗 检查订阅 ${recommendations.subscriptionId} 在 https://vrf.chain.link`);
      console.log('  💰 确保订阅有足够的LINK余额（建议至少5 LINK）');
      console.log('  ✅ 确保合约地址已添加为订阅消费者');
    } else {
      console.log('  📋 需要重新配置Chainlink VRF订阅');
      console.log('  🔗 访问 https://vrf.chain.link 创建新订阅');
      console.log('  ⚙️ 更新合约的VRF配置');
    }
    
    console.log('');
    console.log('==========================================');
  }
}

// 主执行函数
async function runVRFDiagnosis() {
  const diagnostic = new VRFDiagnosticTool();
  
  try {
    const result = await diagnostic.runDiagnosis();
    
    console.log('');
    if (result.vrfWorking) {
      console.log('🎉 VRF诊断完成！配置正常，应该可以使用真实VRF了。');
      process.exit(0);
    } else {
      console.log('⚠️ VRF需要修复，请按照建议进行配置。');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ VRF诊断失败:', error.message);
    process.exit(1);
  }
}

// 执行诊断
runVRFDiagnosis();
