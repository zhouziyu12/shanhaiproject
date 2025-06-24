// 深度诊断脚本 - 找出mint失败的具体原因
import { ethers } from 'ethers';

const CONFIG = {
  RPC_URL: 'https://eth-sepolia.g.alchemy.com/v2/aoHaEBQa8NDjn-e0t8DyL6Ac8VZ6p9ST',
  CONTRACT_ADDRESS: '0x1C466dbDddb23e123760A2EDCce54b1709Fa735A',
  PRIVATE_KEY: '0x019ef439d8a1a061e5e1ac1f4be7ca2bea83f87f84e08a427a5ff1dc6f7fba55'
};

// 更完整的ABI，包含你合约中可能存在的函数
const FULL_ABI = [
  // 标准ERC721函数
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  
  // 可能的mint相关函数
  {
    "inputs": [{"name": "prompt", "type": "string"}],
    "name": "mint",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"name": "to", "type": "address"}, {"name": "prompt", "type": "string"}],
    "name": "safeMint",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"name": "recipient", "type": "address"}, {"name": "prompt", "type": "string"}],
    "name": "mintTo",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  
  // 可能的状态检查函数
  {
    "inputs": [],
    "name": "mintingPaused",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "publicMintEnabled",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "mintEnabled",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MINT_PRICE",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_SUPPLY",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  
  // beasts函数（你的合约特有）
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
  
  // VRF相关函数
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
  }
];

class DeepDiagnostic {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    this.wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, this.provider);
    this.contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, FULL_ABI, this.wallet);
  }

  log(message, type = 'info') {
    const icons = { info: '📋', success: '✅', warning: '⚠️', error: '❌', progress: '🔄' };
    console.log(`${icons[type]} ${message}`);
  }

  // 检查你已有的NFT
  async checkExistingNFTs() {
    this.log('🔍 检查你已有的NFT...', 'progress');
    
    try {
      const balance = await this.contract.balanceOf(this.wallet.address);
      this.log(`你拥有 ${balance} 个NFT`, 'info');
      
      if (balance > 0) {
        // 检查最新的几个NFT
        const totalSupply = await this.contract.totalSupply();
        this.log(`合约总供应量: ${totalSupply}`, 'info');
        
        // 检查最新的NFT状态
        if (totalSupply > 0) {
          const latestTokenId = totalSupply - 1n;
          try {
            const owner = await this.contract.ownerOf(latestTokenId);
            this.log(`最新NFT #${latestTokenId} 的拥有者: ${owner}`, 'info');
            
            // 检查beast信息
            const beast = await this.contract.beasts(latestTokenId);
            this.log(`最新NFT稀有度已揭晓: ${beast.rarityRevealed}`, 'info');
            if (beast.rarityRevealed) {
              this.log(`稀有度: ${beast.rarity}`, 'info');
            }
          } catch (error) {
            this.log(`检查最新NFT失败: ${error.message}`, 'warning');
          }
        }
      }
      
      return { balance, totalSupply };
    } catch (error) {
      this.log(`检查NFT失败: ${error.message}`, 'error');
      return null;
    }
  }

  // 尝试调用你现有NFT的VRF
  async tryVRFOnExistingNFT() {
    this.log('🎲 尝试对现有NFT调用VRF...', 'progress');
    
    try {
      const totalSupply = await this.contract.totalSupply();
      
      if (totalSupply > 0) {
        // 找一个你拥有的、稀有度未揭晓的NFT
        for (let i = totalSupply - 1n; i >= 0n && i >= totalSupply - 10n; i--) {
          try {
            const owner = await this.contract.ownerOf(i);
            if (owner.toLowerCase() === this.wallet.address.toLowerCase()) {
              const beast = await this.contract.beasts(i);
              
              if (!beast.rarityRevealed) {
                this.log(`找到未揭晓稀有度的NFT #${i}`, 'success');
                
                // 尝试调用revealRarity
                try {
                  const gasEstimate = await this.contract.revealRarity.estimateGas(i);
                  this.log(`VRF调用gas估算成功: ${gasEstimate}`, 'success');
                  
                  // 实际执行VRF调用
                  const tx = await this.contract.revealRarity(i);
                  this.log(`VRF交易已提交: ${tx.hash}`, 'success');
                  
                  const receipt = await tx.wait();
                  this.log(`VRF交易已确认，区块: ${receipt.blockNumber}`, 'success');
                  
                  return { tokenId: i, txHash: tx.hash, success: true };
                } catch (error) {
                  this.log(`VRF调用失败: ${error.message}`, 'warning');
                }
              }
            }
          } catch (error) {
            // 跳过这个token
          }
        }
        
        this.log('没有找到可用于VRF的NFT', 'warning');
      }
      
      return null;
    } catch (error) {
      this.log(`VRF测试失败: ${error.message}`, 'error');
      return null;
    }
  }

  // 尝试不同的mint函数签名
  async tryDifferentMintFunctions() {
    this.log('🛠️ 尝试不同的mint函数...', 'progress');
    
    const prompt = "VRF测试神兽";
    const mintFunctions = [
      { name: 'mint', params: [prompt] },
      { name: 'safeMint', params: [this.wallet.address, prompt] },
      { name: 'mintTo', params: [this.wallet.address, prompt] }
    ];
    
    for (const func of mintFunctions) {
      try {
        this.log(`尝试 ${func.name} 函数...`, 'progress');
        
        // 尝试不同的价值
        const values = ['0', '0.001', '0.01'];
        
        for (const value of values) {
          try {
            const gasEstimate = await this.contract[func.name].estimateGas(...func.params, {
              value: ethers.parseEther(value)
            });
            
            this.log(`${func.name} 函数 + ${value} ETH: 成功! Gas: ${gasEstimate}`, 'success');
            return { function: func.name, params: func.params, value, gasEstimate };
          } catch (error) {
            this.log(`${func.name} + ${value} ETH: ${error.message}`, 'warning');
          }
        }
      } catch (error) {
        this.log(`${func.name} 函数不存在`, 'warning');
      }
    }
    
    return null;
  }

  // 分析最近的成功交易（使用更小的区块范围）
  async analyzeRecentTransactions() {
    this.log('📊 分析最近的交易（小范围）...', 'progress');
    
    try {
      const currentBlock = await this.provider.getBlockNumber();
      
      // 使用更小的区块范围避免API限制
      for (let blockRange = 100; blockRange <= 1000; blockRange += 100) {
        try {
          const fromBlock = currentBlock - blockRange;
          
          const filter = {
            address: CONFIG.CONTRACT_ADDRESS,
            fromBlock: fromBlock,
            toBlock: currentBlock
          };
          
          const logs = await this.provider.getLogs(filter);
          
          if (logs.length > 0) {
            this.log(`在最近${blockRange}个区块中找到 ${logs.length} 个事件`, 'success');
            
            // 分析最新的交易
            const recentLog = logs[logs.length - 1];
            const tx = await this.provider.getTransaction(recentLog.transactionHash);
            
            this.log(`最新交易: ${recentLog.transactionHash}`, 'info');
            this.log(`交易价值: ${ethers.formatEther(tx.value)} ETH`, 'info');
            this.log(`Gas限制: ${tx.gasLimit}`, 'info');
            this.log(`Gas价格: ${tx.gasPrice}`, 'info');
            this.log(`交易数据长度: ${tx.data.length}`, 'info');
            
            return { tx, logs };
          }
        } catch (error) {
          this.log(`搜索${blockRange}区块范围失败: ${error.message}`, 'warning');
        }
      }
      
      this.log('没有找到最近的交易', 'warning');
      return null;
    } catch (error) {
      this.log(`分析交易失败: ${error.message}`, 'error');
      return null;
    }
  }

  // 运行深度诊断
  async runDeepDiagnosis() {
    console.log('🔬 开始深度诊断...');
    console.log('');
    
    try {
      // 1. 检查现有NFT
      const nftInfo = await this.checkExistingNFTs();
      console.log('');
      
      // 2. 尝试对现有NFT调用VRF
      const vrfResult = await this.tryVRFOnExistingNFT();
      console.log('');
      
      // 3. 尝试不同的mint函数
      const mintResult = await this.tryDifferentMintFunctions();
      console.log('');
      
      // 4. 分析最近交易
      const txAnalysis = await this.analyzeRecentTransactions();
      console.log('');
      
      // 5. 生成建议
      console.log('🏆 深度诊断结果:');
      console.log('');
      
      if (vrfResult && vrfResult.success) {
        this.log('✅ VRF功能正常工作！你可以对现有NFT调用VRF', 'success');
        this.log(`VRF测试交易: ${vrfResult.txHash}`, 'info');
        this.log('🎯 建议: 监控这个VRF交易来测试VRF真实性', 'success');
        
        return {
          vrfWorks: true,
          vrfTestTx: vrfResult.txHash,
          tokenId: vrfResult.tokenId
        };
      } else if (mintResult) {
        this.log(`✅ 找到工作的mint函数: ${mintResult.function}`, 'success');
        this.log(`参数: ${JSON.stringify(mintResult.params)}`, 'info');
        this.log(`价值: ${mintResult.value} ETH`, 'info');
        
        return {
          mintFunction: mintResult.function,
          mintParams: mintResult.params,
          mintValue: mintResult.value
        };
      } else {
        this.log('❌ 所有测试都失败了', 'error');
        
        if (nftInfo && nftInfo.balance > 0) {
          this.log('💡 但是你有现有的NFT，可能需要等待或有其他限制', 'info');
        }
        
        return { allFailed: true };
      }
      
    } catch (error) {
      this.log(`深度诊断失败: ${error.message}`, 'error');
      throw error;
    }
  }
}

// 运行深度诊断
async function runDeepDiagnosis() {
  const diagnostic = new DeepDiagnostic();
  
  try {
    const results = await diagnostic.runDeepDiagnosis();
    
    console.log('');
    console.log('🔧 下一步行动计划:');
    
    if (results.vrfWorks) {
      console.log('1. ✅ VRF功能正常，可以监控现有的VRF交易');
      console.log(`2. 🔍 检查交易 ${results.vrfTestTx} 的VRF结果`);
      console.log(`3. 🎲 使用Token #${results.tokenId} 来验证VRF真实性`);
    } else if (results.mintFunction) {
      console.log(`1. ✅ 使用 ${results.mintFunction} 函数进行mint`);
      console.log(`2. 💰 使用价值 ${results.mintValue} ETH`);
      console.log('3. 🔄 修改VRF测试脚本使用正确的函数');
    } else {
      console.log('1. ❌ 可能需要联系合约开发者');
      console.log('2. 🔍 检查合约是否有特殊的调用条件');
      console.log('3. ⏰ 或者等待合约状态改变');
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ 深度诊断失败:', error.message);
    return null;
  }
}

runDeepDiagnosis();
