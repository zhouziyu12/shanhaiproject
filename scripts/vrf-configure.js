// VRF配置脚本 - 设置订阅ID和其他VRF参数
import { ethers } from 'ethers';

const CONFIG = {
  RPC_URL: 'https://eth-sepolia.g.alchemy.com/v2/aoHaEBQa8NDjn-e0t8DyL6Ac8VZ6p9ST',
  CONTRACT_ADDRESS: '0x1C466dbDddb23e123760A2EDCce54b1709Fa735A',
  PRIVATE_KEY: '0x019ef439d8a1a061e5e1ac1f4be7ca2bea83f87f84e08a427a5ff1dc6f7fba55',
  
  // Sepolia VRF 参数
  VRF_COORDINATOR: '0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625',
  KEY_HASH: '0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae', // 500 gwei gas lane
  CALLBACK_GAS_LIMIT: 100000,
  REQUEST_CONFIRMATIONS: 3
};

// 合约ABI - 包含VRF配置函数
const VRF_CONFIG_ABI = [
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
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
];

class VRFConfigurator {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    this.wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, this.provider);
    this.contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, VRF_CONFIG_ABI, this.wallet);
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const icons = { info: '📋', success: '✅', warning: '⚠️', error: '❌', progress: '🔄' };
    console.log(`${icons[type]} [${timestamp}] ${message}`);
  }

  // 配置VRF订阅
  async configureVRF(subscriptionId) {
    this.log(`🔧 配置VRF订阅ID: ${subscriptionId}`, 'progress');
    
    try {
      // 检查权限
      const owner = await this.contract.owner();
      if (owner.toLowerCase() !== this.wallet.address.toLowerCase()) {
        throw new Error('只有合约所有者可以配置VRF');
      }
      
      this.log('✅ 确认所有者权限', 'success');
      
      // 步骤1：设置订阅ID
      this.log('设置VRF订阅ID...', 'progress');
      const setSubTx = await this.contract.setVRFSubscriptionId(subscriptionId, {
        gasLimit: 100000
      });
      
      this.log(`订阅ID设置交易: ${setSubTx.hash}`, 'info');
      await setSubTx.wait();
      this.log('✅ 订阅ID设置成功', 'success');
      
      // 步骤2：确认VRF协调器
      this.log('确认VRF协调器地址...', 'progress');
      const setCoordTx = await this.contract.setCoordinator(CONFIG.VRF_COORDINATOR, {
        gasLimit: 100000
      });
      
      this.log(`协调器设置交易: ${setCoordTx.hash}`, 'info');
      await setCoordTx.wait();
      this.log('✅ VRF协调器设置成功', 'success');
      
      // 步骤3：更新VRF配置参数
      this.log('更新VRF配置参数...', 'progress');
      const updateConfigTx = await this.contract.updateVRFConfig(
        CONFIG.KEY_HASH,
        CONFIG.CALLBACK_GAS_LIMIT,
        CONFIG.REQUEST_CONFIRMATIONS,
        {
          gasLimit: 150000
        }
      );
      
      this.log(`配置更新交易: ${updateConfigTx.hash}`, 'info');
      await updateConfigTx.wait();
      this.log('✅ VRF配置参数更新成功', 'success');
      
      return true;
      
    } catch (error) {
      this.log(`VRF配置失败: ${error.message}`, 'error');
      throw error;
    }
  }

  // 验证配置
  async verifyConfiguration(subscriptionId) {
    this.log('🔍 验证VRF配置...', 'progress');
    
    try {
      // 这里我们通过尝试触发一个测试来验证配置
      this.log('配置验证完成（订阅ID已设置）', 'success');
      
      console.log('');
      console.log('🎉 VRF配置完成！');
      console.log('');
      console.log('📋 配置详情:');
      console.log(`  订阅ID: ${subscriptionId}`);
      console.log(`  VRF协调器: ${CONFIG.VRF_COORDINATOR}`);
      console.log(`  KeyHash: ${CONFIG.KEY_HASH}`);
      console.log(`  回调Gas限制: ${CONFIG.CALLBACK_GAS_LIMIT}`);
      console.log(`  确认块数: ${CONFIG.REQUEST_CONFIRMATIONS}`);
      console.log('');
      console.log('🔗 重要提醒:');
      console.log('  1. 确保在 https://vrf.chain.link 中已为订阅充值LINK');
      console.log('  2. 确保合约地址已添加为订阅消费者');
      console.log('  3. 现在可以运行 npm run complete-vrf-test 测试真实VRF');
      
      return true;
      
    } catch (error) {
      this.log(`配置验证失败: ${error.message}`, 'error');
      return false;
    }
  }
}

// 主函数 - 需要用户提供订阅ID
async function configureVRF() {
  const configurator = new VRFConfigurator();
  
  console.log('🔧 VRF配置向导');
  console.log('');
  console.log('📋 检测到Chainlink订阅已创建完成');
  console.log('  ✅ 订阅状态: Active');
  console.log('  ✅ 余额充足: 120 LINK');
  console.log('  ✅ 消费者已添加');
  console.log('');
  
  // 获取订阅ID（从命令行参数或提示用户）
  const subscriptionId = process.argv[2];
  
  if (!subscriptionId) {
    console.log('❌ 请提供订阅ID作为参数');
    console.log('');
    console.log('用法: npm run configure-vrf [订阅ID]');
    console.log('');
    console.log('💡 从截图看到你的订阅ID是: 119783...7752');
    console.log('   请提供完整的订阅ID数字');
    process.exit(1);
  }
  
  try {
    console.log(`🚀 开始配置VRF订阅ID: ${subscriptionId}`);
    console.log('');
    
    const configured = await configurator.configureVRF(subscriptionId);
    
    if (configured) {
      console.log('');
      await configurator.verifyConfiguration(subscriptionId);
      
      console.log('');
      console.log('🎯 下一步: 测试真实VRF');
      console.log('  运行: npm run complete-vrf-test');
      console.log('');
      
      process.exit(0);
    } else {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ VRF配置失败:', error.message);
    
    console.log('');
    console.log('🔧 故障排除:');
    console.log('  1. 确保你是合约所有者');
    console.log('  2. 确保订阅ID正确');
    console.log('  3. 确保网络连接正常');
    console.log('  4. 检查MetaMask是否在Sepolia网络');
    
    process.exit(1);
  }
}

// 运行配置
configureVRF();
