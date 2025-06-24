// 简单订阅ID修复脚本 - 尝试各种方法设置订阅ID
import { ethers } from 'ethers';

const CONFIG = {
  RPC_URL: 'https://eth-sepolia.g.alchemy.com/v2/aoHaEBQa8NDjn-e0t8DyL6Ac8VZ6p9ST',
  CONTRACT_ADDRESS: '0x1C466dbDddb23e123760A2EDCce54b1709Fa735A',
  PRIVATE_KEY: '0x019ef439d8a1a061e5e1ac1f4be7ca2bea83f87f84e08a427a5ff1dc6f7fba55',
  SUBSCRIPTION_ID: '11978318525222896027773046731460179890031671972527309000293301562433571167752'
};

// 扩展的ABI包含可能的函数名
const EXTENDED_ABI = [
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  
  // 各种可能的订阅ID设置函数
  {
    "inputs": [{"internalType": "uint256", "name": "_subscriptionId", "type": "uint256"}],
    "name": "setSubscriptionId",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_subscriptionId", "type": "uint256"}],
    "name": "setVRFSubscriptionId",
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
  {
    "inputs": [{"internalType": "uint256", "name": "_subscriptionId", "type": "uint256"}],
    "name": "setVrfSubscriptionId",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_subscriptionId", "type": "uint256"}],
    "name": "setSubId",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // 尝试uint64版本以防万一
  {
    "inputs": [{"internalType": "uint64", "name": "_subscriptionId", "type": "uint64"}],
    "name": "setSubscriptionIdLegacy",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // 读取函数
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
    "name": "getSubscriptionId",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  
  // 测试mint功能
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
  }
];

class SimpleSubscriptionFixer {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    this.wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, this.provider);
    this.contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, EXTENDED_ABI, this.wallet);
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const icons = { info: '📋', success: '✅', warning: '⚠️', error: '❌', progress: '🔄', fix: '🔧' };
    console.log(`${icons[type]} [${timestamp}] ${message}`);
  }

  // 尝试所有可能的订阅ID设置方法
  async tryAllSubscriptionMethods() {
    this.log('🔧 尝试所有可能的订阅ID设置方法...', 'fix');
    
    // 检查权限
    const owner = await this.contract.owner();
    if (owner.toLowerCase() !== this.wallet.address.toLowerCase()) {
      throw new Error('只有合约所有者可以设置订阅ID');
    }
    
    this.log('✅ 确认所有者权限', 'success');
    
    // 所有可能的函数名
    const methods = [
      'setSubscriptionId',
      'setVRFSubscriptionId', 
      'updateSubscriptionId',
      'setVrfSubscriptionId',
      'setSubId'
    ];
    
    for (const method of methods) {
      try {
        this.log(`尝试 ${method}...`, 'progress');
        
        const tx = await this.contract[method](CONFIG.SUBSCRIPTION_ID, {
          gasLimit: 150000
        });
        
        this.log(`${method} 交易: ${tx.hash}`, 'info');
        await tx.wait();
        this.log(`✅ ${method} 成功！`, 'success');
        
        return method; // 返回成功的方法名
        
      } catch (error) {
        if (error.message.includes('function does not exist')) {
          this.log(`${method} 函数不存在`, 'warning');
        } else if (error.message.includes('value out-of-bounds')) {
          this.log(`${method} 数值超出范围 - 可能仍是uint64`, 'warning');
        } else {
          this.log(`${method} 失败: ${error.message}`, 'error');
        }
      }
    }
    
    return null; // 没有方法成功
  }

  // 验证订阅ID是否设置成功
  async verifySubscriptionId() {
    this.log('🔍 验证订阅ID设置...', 'progress');
    
    const getterMethods = ['s_subscriptionId', 'subscriptionId', 'getSubscriptionId'];
    
    for (const method of getterMethods) {
      try {
        const value = await this.contract[method]();
        if (value && value.toString() !== '0') {
          this.log(`${method}: ${value.toString()}`, 'info');
          
          if (value.toString() === CONFIG.SUBSCRIPTION_ID) {
            this.log('✅ 订阅ID验证成功！', 'success');
            return true;
          } else {
            this.log('⚠️ 订阅ID不匹配', 'warning');
          }
        }
      } catch (error) {
        // 函数不存在，跳过
      }
    }
    
    return false;
  }

  // 测试VRF功能
  async testVRFAfterFix() {
    this.log('🎮 测试VRF功能...', 'progress');
    
    try {
      const prompt = `VRF 2.5测试 ${Date.now()}`;
      const mintPrice = await this.contract.mintPrice();
      
      this.log(`创建测试NFT: "${prompt}"`, 'info');
      
      const tx = await this.contract.mint(this.wallet.address, prompt, {
        value: mintPrice,
        gasLimit: 300000 // 增加Gas限制用于VRF 2.5
      });
      
      this.log(`测试mint交易: ${tx.hash}`, 'info');
      const receipt = await tx.wait();
      this.log(`交易确认，区块: ${receipt.blockNumber}`, 'success');
      
      // 检查是否有VRF请求事件
      const hasVRFRequest = receipt.logs.some(log => {
        try {
          const parsed = this.contract.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          return parsed && parsed.name === 'RarityRequested';
        } catch {
          return false;
        }
      });
      
      if (hasVRFRequest) {
        this.log('🎉 检测到VRF请求！VRF 2.5配置成功', 'success');
        return true;
      } else {
        this.log('⚠️ 未检测到VRF请求，可能还需要其他配置', 'warning');
        return false;
      }
      
    } catch (error) {
      this.log(`VRF测试失败: ${error.message}`, 'error');
      return false;
    }
  }

  // 运行完整修复流程
  async runSimpleFix() {
    console.log('🔧 开始简单订阅ID修复...');
    console.log('🎯 目标：使用现有合约设置VRF 2.5订阅ID');
    console.log('');
    
    try {
      // 步骤1: 尝试设置订阅ID
      const successMethod = await this.tryAllSubscriptionMethods();
      
      if (!successMethod) {
        this.log('❌ 所有订阅ID设置方法都失败了', 'error');
        return false;
      }
      
      console.log('');
      
      // 步骤2: 验证设置结果
      const verified = await this.verifySubscriptionId();
      
      if (!verified) {
        this.log('❌ 订阅ID验证失败', 'error');
        return false;
      }
      
      console.log('');
      
      // 步骤3: 测试VRF功能
      const vrfWorking = await this.testVRFAfterFix();
      
      console.log('');
      console.log('🏆 =============== 修复结果 ===============');
      
      if (vrfWorking) {
        console.log('🎉 完全成功！');
        console.log('  ✅ 订阅ID设置成功');
        console.log('  ✅ VRF 2.5配置正确');
        console.log('  ✅ VRF请求正常工作');
        console.log('');
        console.log('🎮 你的合约现在可以正常使用VRF 2.5了！');
        return true;
      } else {
        console.log('⚠️ 部分成功');
        console.log('  ✅ 订阅ID设置成功');
        console.log('  ⚠️ VRF功能需要进一步测试');
        console.log('');
        console.log('🔄 建议运行: npm run complete-vrf-test');
        return true; // 订阅ID设置成功就算成功
      }
      
    } catch (error) {
      this.log(`简单修复失败: ${error.message}`, 'error');
      return false;
    }
  }

  // 生成下一步建议
  generateNextSteps(success) {
    console.log('');
    console.log('📋 =============== 下一步建议 ===============');
    
    if (success) {
      console.log('');
      console.log('🎉 恭喜！订阅ID修复成功');
      console.log('');
      console.log('🔄 验证VRF功能:');
      console.log('  npm run complete-vrf-test');
      console.log('');
      console.log('🔍 深度诊断:');
      console.log('  npm run deep-vrf-diagnose');
      console.log('');
      console.log('✨ 如果一切正常，你的VRF 2.5就完全配置好了！');
    } else {
      console.log('');
      console.log('❌ 简单修复失败');
      console.log('');
      console.log('🔧 可能的解决方案:');
      console.log('  1. 合约可能需要重新部署以支持uint256');
      console.log('  2. 合约源码中订阅ID变量类型需要修改');
      console.log('  3. 使用新的VRF 2.5合约模板');
      console.log('');
      console.log('💡 建议:');
      console.log('  - 检查合约源码');
      console.log('  - 考虑重新部署');
      console.log('  - 或使用VRF 2.0订阅（不推荐）');
    }
    
    console.log('');
    console.log('============================================');
  }
}

// 主执行函数
async function runSimpleFix() {
  const fixer = new SimpleSubscriptionFixer();
  
  try {
    const success = await fixer.runSimpleFix();
    
    fixer.generateNextSteps(success);
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('❌ 简单修复过程出错:', error.message);
    
    console.log('');
    console.log('🔧 故障排除:');
    console.log('  1. 确保网络连接正常');
    console.log('  2. 确认你是合约所有者');
    console.log('  3. 检查钱包余额是否足够支付Gas');
    console.log('  4. 验证合约地址正确');
    
    process.exit(1);
  }
}

// 运行简单修复
runSimpleFix();
