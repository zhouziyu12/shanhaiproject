// 合约诊断脚本 - 分析为什么mint失败
import { ethers } from 'ethers';

const CONFIG = {
  RPC_URL: 'https://eth-sepolia.g.alchemy.com/v2/aoHaEBQa8NDjn-e0t8DyL6Ac8VZ6p9ST',
  CONTRACT_ADDRESS: '0x1C466dbDddb23e123760A2EDCce54b1709Fa735A',
  PRIVATE_KEY: '0x019ef439d8a1a061e5e1ac1f4be7ca2bea83f87f84e08a427a5ff1dc6f7fba55'
};

// 扩展的合约ABI - 包含可能的状态查询函数
const DIAGNOSIS_ABI = [
  // 基础查询函数
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "mintPrice",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "maxSupply",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "mintingEnabled",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
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
  // 免费mint函数（如果存在）
  {
    "inputs": [{"name": "prompt", "type": "string"}],
    "name": "freeMint",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // 管理员mint函数（如果存在）
  {
    "inputs": [{"name": "to", "type": "address"}, {"name": "prompt", "type": "string"}],
    "name": "adminMint",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

class ContractDiagnostic {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    this.wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, this.provider);
    this.contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, DIAGNOSIS_ABI, this.wallet);
  }

  log(message, type = 'info') {
    const icons = { info: '📋', success: '✅', warning: '⚠️', error: '❌', progress: '🔄' };
    console.log(`${icons[type]} ${message}`);
  }

  // 检查合约基本状态
  async checkContractState() {
    this.log('🔍 检查合约状态...', 'progress');
    
    const results = {};
    
    // 检查各种可能的状态
    const checks = [
      { name: 'totalSupply', desc: '当前总供应量' },
      { name: 'maxSupply', desc: '最大供应量' },
      { name: 'mintPrice', desc: 'Mint价格' },
      { name: 'paused', desc: '是否暂停' },
      { name: 'mintingEnabled', desc: '是否启用铸造' },
      { name: 'owner', desc: '合约所有者' }
    ];
    
    for (const check of checks) {
      try {
        const result = await this.contract[check.name]();
        results[check.name] = result;
        
        if (check.name === 'mintPrice' && result) {
          this.log(`${check.desc}: ${ethers.formatEther(result)} ETH`, 'info');
        } else if (check.name === 'paused' && result) {
          this.log(`${check.desc}: ${result} ⚠️ 合约已暂停！`, 'warning');
        } else if (check.name === 'mintingEnabled' && !result) {
          this.log(`${check.desc}: ${result} ⚠️ 铸造已禁用！`, 'warning');
        } else {
          this.log(`${check.desc}: ${result}`, 'info');
        }
      } catch (error) {
        this.log(`${check.desc}: 查询失败 (${error.message})`, 'warning');
      }
    }
    
    return results;
  }

  // 检查用户状态
  async checkUserState() {
    this.log('👤 检查用户状态...', 'progress');
    
    try {
      const userAddress = this.wallet.address;
      const balance = await this.contract.balanceOf(userAddress);
      
      this.log(`用户地址: ${userAddress}`, 'info');
      this.log(`已拥有NFT数量: ${balance.toString()}`, 'info');
      
      return { userAddress, nftBalance: balance };
    } catch (error) {
      this.log(`检查用户状态失败: ${error.message}`, 'error');
      return null;
    }
  }

  // 尝试不同的mint价格
  async tryDifferentMintPrices() {
    this.log('💰 尝试不同的mint价格...', 'progress');
    
    const prices = ['0', '0.001', '0.01', '0.1'];
    const prompt = 'Test mint diagnosis';
    
    for (const price of prices) {
      try {
        this.log(`尝试价格 ${price} ETH...`, 'progress');
        
        const gasEstimate = await this.contract.mint.estimateGas(prompt, {
          value: ethers.parseEther(price)
        });
        
        this.log(`价格 ${price} ETH - Gas估算成功: ${gasEstimate.toString()}`, 'success');
        return price;
        
      } catch (error) {
        this.log(`价格 ${price} ETH - 失败: ${error.message}`, 'warning');
      }
    }
    
    return null;
  }

  // 尝试免费mint函数
  async tryFreeMint() {
    this.log('🆓 尝试免费mint函数...', 'progress');
    
    const prompt = 'Free mint test';
    
    try {
      const gasEstimate = await this.contract.freeMint.estimateGas(prompt);
      this.log(`免费mint - Gas估算成功: ${gasEstimate.toString()}`, 'success');
      return 'freeMint';
    } catch (error) {
      this.log(`免费mint失败: ${error.message}`, 'warning');
      return null;
    }
  }

  // 检查合约代码
  async checkContractCode() {
    this.log('📝 检查合约代码...', 'progress');
    
    try {
      const code = await this.provider.getCode(CONFIG.CONTRACT_ADDRESS);
      
      if (code === '0x') {
        this.log('❌ 合约地址没有代码！可能地址错误', 'error');
        return false;
      } else {
        this.log(`✅ 合约代码存在，长度: ${code.length} 字符`, 'success');
        return true;
      }
    } catch (error) {
      this.log(`检查合约代码失败: ${error.message}`, 'error');
      return false;
    }
  }

  // 分析最近的交易
  async analyzeRecentTransactions() {
    this.log('📊 分析最近的成功交易...', 'progress');
    
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = currentBlock - 10000; // 最近1万个区块
      
      // 查找成功的TokenMinted事件
      const filter = {
        address: CONFIG.CONTRACT_ADDRESS,
        topics: [
          ethers.id("TokenMinted(uint256,address,string)") // TokenMinted事件签名
        ],
        fromBlock: fromBlock,
        toBlock: currentBlock
      };
      
      const logs = await this.provider.getLogs(filter);
      
      if (logs.length > 0) {
        this.log(`找到 ${logs.length} 个成功的mint交易`, 'success');
        
        // 分析最新的几个交易
        const recentLogs = logs.slice(-3);
        
        for (const log of recentLogs) {
          const tx = await this.provider.getTransaction(log.transactionHash);
          this.log(`成功交易: ${log.transactionHash}`, 'info');
          this.log(`  价值: ${ethers.formatEther(tx.value)} ETH`, 'info');
          this.log(`  Gas限制: ${tx.gasLimit.toString()}`, 'info');
        }
        
        return recentLogs;
      } else {
        this.log('最近没有找到成功的mint交易', 'warning');
        return [];
      }
    } catch (error) {
      this.log(`分析交易失败: ${error.message}`, 'error');
      return [];
    }
  }

  // 运行完整诊断
  async runDiagnosis() {
    console.log('🔬 开始合约诊断...');
    console.log('');
    
    try {
      // 1. 检查合约代码
      const hasCode = await this.checkContractCode();
      if (!hasCode) return;
      
      console.log('');
      
      // 2. 检查合约状态
      const contractState = await this.checkContractState();
      
      console.log('');
      
      // 3. 检查用户状态
      const userState = await this.checkUserState();
      
      console.log('');
      
      // 4. 分析最近交易
      const recentTxs = await this.analyzeRecentTransactions();
      
      console.log('');
      
      // 5. 尝试不同价格
      const workingPrice = await this.tryDifferentMintPrices();
      
      console.log('');
      
      // 6. 尝试免费mint
      const freeMintWorks = await this.tryFreeMint();
      
      console.log('');
      console.log('🏆 诊断结果总结:');
      console.log('');
      
      // 生成建议
      if (contractState.paused) {
        this.log('❌ 问题: 合约已暂停，无法mint', 'error');
      } else if (contractState.mintingEnabled === false) {
        this.log('❌ 问题: 铸造功能已禁用', 'error');
      } else if (workingPrice !== null) {
        this.log(`✅ 建议: 使用价格 ${workingPrice} ETH 进行mint`, 'success');
      } else if (freeMintWorks) {
        this.log('✅ 建议: 使用freeMint函数进行免费铸造', 'success');
      } else {
        this.log('❌ 所有mint方法都失败，可能合约有特殊限制', 'error');
      }
      
      if (recentTxs.length > 0) {
        this.log('💡 可以参考最近成功交易的参数', 'info');
      }
      
      return {
        contractState,
        userState,
        workingPrice,
        freeMintWorks,
        recentTxs
      };
      
    } catch (error) {
      this.log(`诊断过程中出错: ${error.message}`, 'error');
      throw error;
    }
  }
}

// 运行诊断
async function runDiagnosis() {
  const diagnostic = new ContractDiagnostic();
  
  try {
    const results = await diagnostic.runDiagnosis();
    
    console.log('');
    console.log('🔧 下一步建议:');
    
    if (results.workingPrice !== null) {
      console.log(`1. 使用价格 ${results.workingPrice} ETH 重新运行VRF测试`);
      console.log('2. 检查合约是否有最大mint数量限制');
    } else if (results.freeMintWorks) {
      console.log('1. 尝试使用freeMint函数');
      console.log('2. 检查是否有白名单或其他限制');
    } else {
      console.log('1. 联系合约开发者确认mint条件');
      console.log('2. 检查是否需要特殊权限或白名单');
    }
    
  } catch (error) {
    console.error('❌ 诊断失败:', error.message);
  }
}

runDiagnosis();
