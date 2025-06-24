// VRF配置修复脚本 - 使用正确的函数名和方法
import { ethers } from 'ethers';

const CONFIG = {
  RPC_URL: 'https://eth-sepolia.g.alchemy.com/v2/aoHaEBQa8NDjn-e0t8DyL6Ac8VZ6p9ST',
  CONTRACT_ADDRESS: '0x1C466dbDddb23e123760A2EDCce54b1709Fa735A',
  PRIVATE_KEY: '0x019ef439d8a1a061e5e1ac1f4be7ca2bea83f87f84e08a427a5ff1dc6f7fba55',
  
  // VRF参数
  SUBSCRIPTION_ID: '11978318525222896027773046731460179890031671972527309000293301562433571167752',
  VRF_COORDINATOR: '0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625',
  KEY_HASH: '0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae',
  CALLBACK_GAS_LIMIT: 200000, // 增加Gas限制
  REQUEST_CONFIRMATIONS: 3
};

// 尝试多种可能的函数名
const VRF_FIX_ABI = [
  // 所有者相关
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  
  // VRF配置函数 - 尝试多种可能的函数名
  // 方法1: setVRFSubscriptionId
  {
    "inputs": [{"internalType": "uint64", "name": "_subscriptionId", "type": "uint64"}],
    "name": "setVRFSubscriptionId",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // 方法2: setSubscriptionId
  {
    "inputs": [{"internalType": "uint64", "name": "_subscriptionId", "type": "uint64"}],
    "name": "setSubscriptionId",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // 方法3: updateSubscriptionId
  {
    "inputs": [{"internalType": "uint64", "name": "_subscriptionId", "type": "uint64"}],
    "name": "updateSubscriptionId",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // VRF协调器设置
  {
    "inputs": [{"internalType": "address", "name": "_vrfCoordinator", "type": "address"}],
    "name": "setCoordinator",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  {
    "inputs": [{"internalType": "address", "name": "_vrfCoordinator", "type": "address"}],
    "name": "setVRFCoordinator",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // VRF参数更新
  {
    "inputs": [
      {"internalType": "bytes32", "name": "_keyHash", "type": "bytes32"}, 
      {"internalType": "uint32", "name": "_callbackGasLimit", "type": "uint32"}, 
      {"internalType": "uint16", "name": "_requestConfirmations", "type": "uint16"}
    ],
    "name": "updateVRFConfig",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  {
    "inputs": [
      {"internalType": "bytes32", "name": "_keyHash", "type": "bytes32"}, 
      {"internalType": "uint32", "name": "_callbackGasLimit", "type": "uint32"}, 
      {"internalType": "uint16", "name": "_requestConfirmations", "type": "uint16"}
    ],
    "name": "setVRFConfig",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // 查询函数来验证配置
  {
    "inputs": [],
    "name": "s_subscriptionId",
    "outputs": [{"internalType": "uint64", "name": "", "type": "uint64"}],
    "stateMutability": "view",
    "type": "function"
  },
  
  {
    "inputs": [],
    "name": "subscriptionId",
    "outputs": [{"internalType": "uint64", "name": "", "type": "uint64"}],
    "stateMutability": "view",
    "type": "function"
  },
  
  {
    "inputs": [],
    "name": "s_vrfCoordinator",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  
  {
    "inputs": [],
    "name": "vrfCoordinator",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
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
    "name": "keyHash",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
  }
];

class VRFConfigFixer {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    this.wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, this.provider);
    this.contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, VRF_FIX_ABI, this.wallet);
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const icons = { info: '📋', success: '✅', warning: '⚠️', error: '❌', progress: '🔄', fix: '🔧' };
    console.log(`${icons[type]} [${timestamp}] ${message}`);
  }

  // 尝试调用函数
  async tryFunction(functionName, args = [], description = '') {
    try {
      const tx = await this.contract[functionName](...args, {
        gasLimit: 150000
      });
      
      this.log(`${description}交易: ${tx.hash}`, 'info');
      await tx.wait();
      this.log(`✅ ${description}成功`, 'success');
      return true;
    } catch (error) {
      if (error.message.includes('function does not exist')) {
        this.log(`函数 ${functionName} 不存在`, 'warning');
      } else {
        this.log(`${description}失败: ${error.message}`, 'error');
      }
      return false;
    }
  }

  // 尝试读取当前配置
  async readCurrentConfig() {
    this.log('🔍 尝试读取当前VRF配置...', 'progress');
    
    const configReaders = [
      { name: 's_subscriptionId', desc: '订阅ID' },
      { name: 'subscriptionId', desc: '订阅ID (备选)' },
      { name: 's_vrfCoordinator', desc: 'VRF协调器' },
      { name: 'vrfCoordinator', desc: 'VRF协调器 (备选)' },
      { name: 's_keyHash', desc: 'KeyHash' },
      { name: 'keyHash', desc: 'KeyHash (备选)' }
    ];
    
    const config = {};
    
    for (const reader of configReaders) {
      try {
        const value = await this.contract[reader.name]();
        if (value) {
          config[reader.desc] = value.toString();
          this.log(`${reader.desc}: ${config[reader.desc]}`, 'info');
        }
      } catch (error) {
        // 函数不存在，跳过
      }
    }
    
    return config;
  }

  // 智能配置VRF
  async smartConfigureVRF() {
    this.log('🔧 开始智能VRF配置...', 'fix');
    
    try {
      // 检查所有者权限
      const owner = await this.contract.owner();
      if (owner.toLowerCase() !== this.wallet.address.toLowerCase()) {
        throw new Error('只有合约所有者可以配置VRF');
      }
      
      this.log('✅ 确认所有者权限', 'success');
      
      // 读取当前配置
      const currentConfig = await this.readCurrentConfig();
      console.log('');
      
      // 步骤1: 尝试设置订阅ID
      this.log('尝试设置订阅ID...', 'progress');
      const subscriptionFunctions = ['setVRFSubscriptionId', 'setSubscriptionId', 'updateSubscriptionId'];
      
      let subscriptionSet = false;
      for (const funcName of subscriptionFunctions) {
        if (await this.tryFunction(funcName, [CONFIG.SUBSCRIPTION_ID], '设置订阅ID: ')) {
          subscriptionSet = true;
          break;
        }
      }
      
      if (!subscriptionSet) {
        this.log('❌ 无法设置订阅ID - 可能函数名不正确', 'error');
      }
      
      // 步骤2: 尝试设置VRF协调器
      this.log('尝试设置VRF协调器...', 'progress');
      const coordinatorFunctions = ['setCoordinator', 'setVRFCoordinator'];
      
      let coordinatorSet = false;
      for (const funcName of coordinatorFunctions) {
        if (await this.tryFunction(funcName, [CONFIG.VRF_COORDINATOR], '设置协调器: ')) {
          coordinatorSet = true;
          break;
        }
      }
      
      if (!coordinatorSet) {
        this.log('❌ 无法设置VRF协调器 - 可能函数名不正确', 'error');
      }
      
      // 步骤3: 尝试设置VRF参数
      this.log('尝试设置VRF参数...', 'progress');
      const configFunctions = ['updateVRFConfig', 'setVRFConfig'];
      
      let configSet = false;
      for (const funcName of configFunctions) {
        if (await this.tryFunction(
          funcName, 
          [CONFIG.KEY_HASH, CONFIG.CALLBACK_GAS_LIMIT, CONFIG.REQUEST_CONFIRMATIONS], 
          '设置VRF参数: '
        )) {
          configSet = true;
          break;
        }
      }
      
      if (!configSet) {
        this.log('❌ 无法设置VRF参数 - 可能函数名不正确', 'error');
      }
      
      // 验证配置结果
      console.log('');
      this.log('🔍 验证配置结果...', 'progress');
      const newConfig = await this.readCurrentConfig();
      
      // 分析配置成功情况
      const success = subscriptionSet || coordinatorSet || configSet;
      
      if (success) {
        this.log('🎉 部分配置成功！请重新测试VRF', 'success');
        return true;
      } else {
        this.log('❌ 配置失败 - 可能需要检查合约源码', 'error');
        return false;
      }
      
    } catch (error) {
      this.log(`智能配置失败: ${error.message}`, 'error');
      throw error;
    }
  }

  // 生成合约源码分析建议
  generateContractAnalysisAdvice() {
    console.log('');
    console.log('🔍 =============== 合约源码分析建议 ===============');
    console.log('');
    console.log('如果智能配置失败，可能的原因和解决方案:');
    console.log('');
    console.log('1. 📋 函数名不匹配:');
    console.log('   - 合约可能使用不同的函数名来设置VRF配置');
    console.log('   - 建议查看合约源码中的VRF相关函数');
    console.log('');
    console.log('2. 🔒 访问控制:');
    console.log('   - 函数可能有额外的访问控制修饰符');
    console.log('   - 可能需要特定的角色或权限');
    console.log('');
    console.log('3. 🎛️ 不同的配置方式:');
    console.log('   - 合约可能使用构造函数设置VRF配置');
    console.log('   - 或者通过单个函数设置所有参数');
    console.log('');
    console.log('4. 📜 获取合约源码的方法:');
    console.log('   - 访问 https://sepolia.etherscan.io/address/0x1C466dbDddb23e123760A2EDCce54b1709Fa735A');
    console.log('   - 查看 "Contract" 标签页');
    console.log('   - 查找VRF相关的函数和变量');
    console.log('');
    console.log('5. 🛠️ 手动配置建议:');
    console.log('   - 如果有Remix或其他IDE');
    console.log('   - 可以直接与合约交互');
    console.log('   - 使用正确的函数名和参数');
    console.log('');
    console.log('=============================================');
  }
}

// 主执行函数
async function fixVRFConfiguration() {
  const fixer = new VRFConfigFixer();
  
  console.log('🔧 VRF配置修复向导');
  console.log('🎯 目标：使用正确的函数名修复VRF配置');
  console.log('');
  
  try {
    const success = await fixer.smartConfigureVRF();
    
    if (success) {
      console.log('');
      console.log('🎉 配置修复可能成功！');
      console.log('🔄 请运行以下命令验证:');
      console.log('  npm run deep-vrf-diagnose');
      console.log('  npm run complete-vrf-test');
      console.log('');
    } else {
      console.log('');
      fixer.generateContractAnalysisAdvice();
    }
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('❌ VRF配置修复失败:', error.message);
    
    console.log('');
    console.log('🔧 故障排除步骤:');
    console.log('  1. 确保你是合约所有者');
    console.log('  2. 检查网络连接');
    console.log('  3. 查看合约源码确认函数名');
    console.log('  4. 尝试在Remix中手动配置');
    
    process.exit(1);
  }
}

// 运行修复
fixVRFConfiguration();
