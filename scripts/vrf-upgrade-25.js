// VRF 2.5升级脚本 - 升级合约到VRF 2.5支持uint256订阅ID
import { ethers } from 'ethers';

const CONFIG = {
  RPC_URL: 'https://eth-sepolia.g.alchemy.com/v2/aoHaEBQa8NDjn-e0t8DyL6Ac8VZ6p9ST',
  CONTRACT_ADDRESS: '0x1C466dbDddb23e123760A2EDCce54b1709Fa735A',
  PRIVATE_KEY: '0x019ef439d8a1a061e5e1ac1f4be7ca2bea83f87f84e08a427a5ff1dc6f7fba55',
  
  // VRF 2.5配置
  SUBSCRIPTION_ID: '11978318525222896027773046731460179890031671972527309000293301562433571167752',
  VRF_COORDINATOR_V25: '0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B', // Sepolia VRF 2.5协调器
  KEY_HASH_V25: '0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae', // VRF 2.5 KeyHash
  CALLBACK_GAS_LIMIT: 200000,
  REQUEST_CONFIRMATIONS: 3
};

// VRF 2.5 ABI - 支持uint256订阅ID
const VRF_25_ABI = [
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  
  // VRF 2.5配置函数 - 使用uint256订阅ID
  {
    "inputs": [{"internalType": "uint256", "name": "_subscriptionId", "type": "uint256"}],
    "name": "setVRFSubscriptionId",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  {
    "inputs": [{"internalType": "uint256", "name": "_subscriptionId", "type": "uint256"}],
    "name": "setSubscriptionId",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  {
    "inputs": [{"internalType": "uint256", "name": "_subscriptionId", "type": "uint256"}],
    "name": "updateSubscriptionId",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // VRF协调器设置 - 新的2.5协调器地址
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
  
  // VRF参数更新 - 2.5版本的KeyHash
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
  
  // 升级到VRF 2.5的函数
  {
    "inputs": [],
    "name": "upgradeToVRF25",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  {
    "inputs": [],
    "name": "migrateToVRF25",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // 查询函数 - VRF 2.5使用uint256
  {
    "inputs": [],
    "name": "s_subscriptionId",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  
  {
    "inputs": [],
    "name": "subscriptionId",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
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
  }
];

class VRF25Upgrader {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    this.wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, this.provider);
    this.contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, VRF_25_ABI, this.wallet);
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const icons = { info: '📋', success: '✅', warning: '⚠️', error: '❌', progress: '🔄', upgrade: '🚀' };
    console.log(`${icons[type]} [${timestamp}] ${message}`);
  }

  // 检查当前VRF版本
  async checkCurrentVRFVersion() {
    this.log('🔍 检查当前VRF版本...', 'progress');
    
    try {
      // 尝试读取当前配置
      let currentCoordinator = null;
      let currentSubscriptionId = null;
      
      try {
        currentCoordinator = await this.contract.s_vrfCoordinator();
        this.log(`当前VRF协调器: ${currentCoordinator}`, 'info');
      } catch (error) {
        try {
          currentCoordinator = await this.contract.vrfCoordinator();
          this.log(`当前VRF协调器: ${currentCoordinator}`, 'info');
        } catch (e) {
          this.log('无法读取VRF协调器地址', 'warning');
        }
      }
      
      try {
        currentSubscriptionId = await this.contract.s_subscriptionId();
        this.log(`当前订阅ID: ${currentSubscriptionId}`, 'info');
      } catch (error) {
        try {
          currentSubscriptionId = await this.contract.subscriptionId();
          this.log(`当前订阅ID: ${currentSubscriptionId}`, 'info');
        } catch (e) {
          this.log('无法读取订阅ID', 'warning');
        }
      }
      
      // 判断VRF版本
      const isVRF25 = currentCoordinator?.toLowerCase() === CONFIG.VRF_COORDINATOR_V25.toLowerCase();
      
      console.log('');
      console.log('📊 VRF版本分析:');
      if (isVRF25) {
        console.log('  ✅ 检测到VRF 2.5协调器');
        console.log('  ✅ 合约已升级到VRF 2.5');
      } else {
        console.log('  ⚠️ 检测到VRF 2.0协调器或未配置');
        console.log('  🚀 需要升级到VRF 2.5');
      }
      
      return {
        isVRF25,
        currentCoordinator,
        currentSubscriptionId: currentSubscriptionId?.toString()
      };
      
    } catch (error) {
      this.log(`版本检查失败: ${error.message}`, 'error');
      return { isVRF25: false, currentCoordinator: null, currentSubscriptionId: null };
    }
  }

  // 尝试直接升级函数
  async tryDirectUpgrade() {
    this.log('🚀 尝试直接升级到VRF 2.5...', 'upgrade');
    
    const upgradeFunctions = ['upgradeToVRF25', 'migrateToVRF25'];
    
    for (const funcName of upgradeFunctions) {
      try {
        this.log(`尝试调用 ${funcName}...`, 'progress');
        
        const tx = await this.contract[funcName]({
          gasLimit: 200000
        });
        
        this.log(`升级交易: ${tx.hash}`, 'info');
        await tx.wait();
        this.log(`✅ ${funcName} 升级成功`, 'success');
        
        return true;
      } catch (error) {
        if (error.message.includes('function does not exist')) {
          this.log(`函数 ${funcName} 不存在`, 'warning');
        } else {
          this.log(`${funcName} 失败: ${error.message}`, 'error');
        }
      }
    }
    
    return false;
  }

  // 手动升级配置
  async manualUpgradeConfiguration() {
    this.log('🔧 手动升级VRF配置...', 'upgrade');
    
    try {
      // 检查权限
      const owner = await this.contract.owner();
      if (owner.toLowerCase() !== this.wallet.address.toLowerCase()) {
        throw new Error('只有合约所有者可以升级VRF配置');
      }
      
      this.log('✅ 确认所有者权限', 'success');
      
      let upgradeSuccess = false;
      
      // 步骤1: 升级VRF协调器到2.5版本
      this.log('步骤1: 升级VRF协调器到2.5版本...', 'progress');
      const coordinatorFunctions = ['setCoordinator', 'setVRFCoordinator'];
      
      for (const funcName of coordinatorFunctions) {
        try {
          const tx = await this.contract[funcName](CONFIG.VRF_COORDINATOR_V25, {
            gasLimit: 150000
          });
          
          this.log(`协调器升级交易: ${tx.hash}`, 'info');
          await tx.wait();
          this.log('✅ VRF协调器升级成功', 'success');
          upgradeSuccess = true;
          break;
        } catch (error) {
          if (!error.message.includes('function does not exist')) {
            this.log(`协调器升级失败: ${error.message}`, 'error');
          }
        }
      }
      
      // 步骤2: 设置VRF 2.5订阅ID (uint256)
      this.log('步骤2: 设置VRF 2.5订阅ID...', 'progress');
      const subscriptionFunctions = ['setVRFSubscriptionId', 'setSubscriptionId', 'updateSubscriptionId'];
      
      for (const funcName of subscriptionFunctions) {
        try {
          const tx = await this.contract[funcName](CONFIG.SUBSCRIPTION_ID, {
            gasLimit: 150000
          });
          
          this.log(`订阅ID设置交易: ${tx.hash}`, 'info');
          await tx.wait();
          this.log('✅ VRF 2.5订阅ID设置成功', 'success');
          upgradeSuccess = true;
          break;
        } catch (error) {
          if (!error.message.includes('function does not exist')) {
            this.log(`订阅ID设置失败: ${error.message}`, 'error');
          }
        }
      }
      
      // 步骤3: 更新VRF 2.5参数
      this.log('步骤3: 更新VRF 2.5参数...', 'progress');
      const configFunctions = ['updateVRFConfig', 'setVRFConfig'];
      
      for (const funcName of configFunctions) {
        try {
          const tx = await this.contract[funcName](
            CONFIG.KEY_HASH_V25,
            CONFIG.CALLBACK_GAS_LIMIT,
            CONFIG.REQUEST_CONFIRMATIONS,
            {
              gasLimit: 150000
            }
          );
          
          this.log(`VRF参数更新交易: ${tx.hash}`, 'info');
          await tx.wait();
          this.log('✅ VRF 2.5参数更新成功', 'success');
          upgradeSuccess = true;
          break;
        } catch (error) {
          if (!error.message.includes('function does not exist')) {
            this.log(`VRF参数更新失败: ${error.message}`, 'error');
          }
        }
      }
      
      return upgradeSuccess;
      
    } catch (error) {
      this.log(`手动升级失败: ${error.message}`, 'error');
      throw error;
    }
  }

  // 验证升级结果
  async verifyUpgrade() {
    this.log('🔍 验证VRF 2.5升级结果...', 'progress');
    
    const versionInfo = await this.checkCurrentVRFVersion();
    
    console.log('');
    console.log('📊 升级验证结果:');
    
    if (versionInfo.isVRF25) {
      console.log('  ✅ VRF协调器: VRF 2.5 ✅');
      console.log(`  ✅ 协调器地址: ${versionInfo.currentCoordinator}`);
      
      if (versionInfo.currentSubscriptionId === CONFIG.SUBSCRIPTION_ID) {
        console.log('  ✅ 订阅ID: 正确设置 ✅');
        console.log(`  ✅ 订阅ID: ${versionInfo.currentSubscriptionId}`);
        
        this.log('🎉 VRF 2.5升级完全成功！', 'success');
        return true;
      } else {
        console.log('  ⚠️ 订阅ID: 需要重新设置');
        this.log('⚠️ VRF 2.5升级部分成功', 'warning');
        return false;
      }
    } else {
      console.log('  ❌ VRF协调器: 仍为VRF 2.0或未配置');
      this.log('❌ VRF 2.5升级失败', 'error');
      return false;
    }
  }

  // 运行完整升级流程
  async runFullUpgrade() {
    console.log('🚀 开始VRF 2.5升级流程...');
    console.log('🎯 目标：将合约从VRF 2.0升级到VRF 2.5，支持uint256订阅ID');
    console.log('');
    
    try {
      // 步骤1: 检查当前版本
      const versionInfo = await this.checkCurrentVRFVersion();
      console.log('');
      
      if (versionInfo.isVRF25 && versionInfo.currentSubscriptionId === CONFIG.SUBSCRIPTION_ID) {
        this.log('✅ 合约已经是VRF 2.5，无需升级', 'success');
        return true;
      }
      
      // 步骤2: 尝试直接升级
      this.log('尝试直接升级函数...', 'progress');
      const directUpgrade = await this.tryDirectUpgrade();
      
      if (directUpgrade) {
        console.log('');
        return await this.verifyUpgrade();
      }
      
      // 步骤3: 手动升级配置
      this.log('尝试手动升级配置...', 'progress');
      const manualUpgrade = await this.manualUpgradeConfiguration();
      
      if (manualUpgrade) {
        console.log('');
        return await this.verifyUpgrade();
      } else {
        this.log('❌ 手动升级也失败了', 'error');
        return false;
      }
      
    } catch (error) {
      this.log(`VRF 2.5升级失败: ${error.message}`, 'error');
      throw error;
    }
  }

  // 生成升级指南
  generateUpgradeGuide() {
    console.log('');
    console.log('📖 =============== VRF 2.5升级指南 ===============');
    console.log('');
    console.log('🔍 VRF版本对比:');
    console.log('  VRF 2.0: uint64订阅ID, 协调器 0x8103B0A8...');
    console.log('  VRF 2.5: uint256订阅ID, 协调器 0x9DdfaCa8...');
    console.log('');
    console.log('⚠️ 问题根源:');
    console.log('  - 你的合约使用VRF 2.0 (uint64)');
    console.log('  - 你的订阅是VRF 2.5 (uint256)');
    console.log('  - 类型不匹配导致"value out-of-bounds"错误');
    console.log('');
    console.log('🔧 解决方案:');
    console.log('  方案1: 升级合约到VRF 2.5');
    console.log('    - 更新协调器地址');
    console.log('    - 更新订阅ID类型为uint256');
    console.log('    - 更新KeyHash和其他参数');
    console.log('');
    console.log('  方案2: 创建VRF 2.0订阅');
    console.log('    - 通过编程方式创建uint64订阅');
    console.log('    - 保持合约不变');
    console.log('    - 但VRF 2.0已过时，不推荐');
    console.log('');
    console.log('🎯 推荐: 升级到VRF 2.5');
    console.log('  - 使用最新技术');
    console.log('  - 支持LINK和原生代币支付');
    console.log('  - 更好的灵活性和未来兼容性');
    console.log('');
    console.log('📋 如果升级失败:');
    console.log('  1. 检查合约源码确认函数名');
    console.log('  2. 确保合约支持VRF 2.5');
    console.log('  3. 可能需要重新部署合约');
    console.log('  4. 或者联系合约开发者进行升级');
    console.log('');
    console.log('=============================================');
  }
}

// 主执行函数
async function upgradeToVRF25() {
  const upgrader = new VRF25Upgrader();
  
  try {
    const success = await upgrader.runFullUpgrade();
    
    console.log('');
    if (success) {
      console.log('🎉 VRF 2.5升级成功！');
      console.log('');
      console.log('🔄 现在运行以下命令测试:');
      console.log('  npm run deep-vrf-diagnose');
      console.log('  npm run complete-vrf-test');
      console.log('');
      console.log('🎮 你的合约现在支持:');
      console.log('  ✅ uint256订阅ID');
      console.log('  ✅ VRF 2.5协调器');
      console.log('  ✅ 最新的KeyHash');
      console.log('  ✅ 更高的Gas限制');
      
      process.exit(0);
    } else {
      console.log('❌ VRF 2.5升级失败');
      upgrader.generateUpgradeGuide();
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ VRF 2.5升级过程出错:', error.message);
    
    console.log('');
    console.log('🔧 故障排除:');
    console.log('  1. 确保你是合约所有者');
    console.log('  2. 检查合约是否支持VRF 2.5');
    console.log('  3. 确认网络连接正常');
    console.log('  4. 验证订阅ID正确');
    console.log('  5. 查看合约源码确认升级函数');
    
    process.exit(1);
  }
}

// 运行VRF 2.5升级
upgradeToVRF25();
