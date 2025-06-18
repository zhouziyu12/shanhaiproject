// test-vrf.js - Chainlink VRF链上随机数测试脚本
const { ethers } = require('ethers');
require('dotenv').config({ path: '.env.local' });

// 配置
const config = {
  rpcUrl: process.env.SEPOLIA_RPC_URL,
  privateKey: process.env.VRF_WALLET_PRIVATE_KEY,
  contractAddress: process.env.SHANHAI_NFT_CONTRACT_ADDRESS,
  vrfCoordinator: process.env.VRF_COORDINATOR_ADDRESS,
  subscriptionId: process.env.VRF_SUBSCRIPTION_ID
};

// ShanHaiNFT合约ABI（简化版）
const SHANHAI_NFT_ABI = [
  {
    "inputs": [
      {"name": "to", "type": "address"},
      {"name": "prompt", "type": "string"}
    ],
    "name": "mint",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
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
    "inputs": [],
    "name": "getNextTokenId",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "tokenId", "type": "uint256"},
      {"indexed": true, "name": "creator", "type": "address"},
      {"indexed": false, "name": "prompt", "type": "string"},
      {"indexed": false, "name": "hasIPFS", "type": "bool"}
    ],
    "name": "BeastMinted",
    "type": "event"
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

// 颜色输出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

class VRFTester {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);
    this.contract = new ethers.Contract(config.contractAddress, SHANHAI_NFT_ABI, this.wallet);
    this.testTokenId = null;
    this.vrfRequestId = null;
  }

  async init() {
    log('\n🚀 初始化Chainlink VRF测试...', 'cyan');
    
    // 验证配置
    if (!config.rpcUrl || !config.privateKey || !config.contractAddress) {
      throw new Error('❌ 缺少必要的环境变量配置');
    }

    // 检查网络连接
    const network = await this.provider.getNetwork();
    log(`📡 连接到网络: ${network.name} (Chain ID: ${network.chainId})`, 'blue');

    // 检查钱包余额
    const balance = await this.provider.getBalance(this.wallet.address);
    log(`💰 钱包地址: ${this.wallet.address}`, 'blue');
    log(`💰 ETH余额: ${ethers.formatEther(balance)} ETH`, 'blue');

    if (balance < ethers.parseEther('0.001')) {
      log('⚠️  警告: ETH余额可能不足以支付gas费用', 'yellow');
    }

    // 验证合约
    const code = await this.provider.getCode(config.contractAddress);
    if (code === '0x') {
      throw new Error(`❌ 合约地址无效: ${config.contractAddress}`);
    }
    log(`✅ 合约验证成功: ${config.contractAddress}`, 'green');

    log('\n📋 测试配置:', 'cyan');
    log(`   RPC: ${config.rpcUrl}`, 'blue');
    log(`   合约: ${config.contractAddress}`, 'blue');
    log(`   VRF协调器: ${config.vrfCoordinator}`, 'blue');
    log(`   订阅ID: ${config.subscriptionId}`, 'blue');
  }

  async getNextTokenId() {
    try {
      const nextTokenId = await this.contract.getNextTokenId();
      return nextTokenId.toString();
    } catch (error) {
      log('⚠️  无法获取下一个Token ID，使用估算值', 'yellow');
      return Date.now().toString();
    }
  }

  async mintTestNFT() {
    log('\n⛏️  开始铸造测试NFT...', 'cyan');

    const nextTokenId = await this.getNextTokenId();
    log(`🔢 预期Token ID: ${nextTokenId}`, 'blue');

    const testPrompt = `测试神兽 - ${new Date().toISOString()}`;
    log(`📝 测试描述: ${testPrompt}`, 'blue');

    try {
      // 估算gas费用
      const gasEstimate = await this.contract.mint.estimateGas(
        this.wallet.address,
        testPrompt,
        { value: 0 }
      );
      log(`⛽ 预估Gas: ${gasEstimate.toString()}`, 'blue');

      // 发送铸造交易
      log('📤 发送铸造交易...', 'yellow');
      const tx = await this.contract.mint(
        this.wallet.address,
        testPrompt,
        { 
          value: 0,
          gasLimit: gasEstimate * 120n / 100n // 增加20%余量
        }
      );

      log(`🔗 交易哈希: ${tx.hash}`, 'blue');
      log('⏳ 等待交易确认...', 'yellow');

      const receipt = await tx.wait();
      log(`✅ 交易已确认! Gas使用: ${receipt.gasUsed.toString()}`, 'green');

      // 解析事件获取Token ID
      const mintEvent = receipt.logs.find(log => {
        try {
          const parsed = this.contract.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          return parsed.name === 'BeastMinted';
        } catch {
          return false;
        }
      });

      if (mintEvent) {
        const parsed = this.contract.interface.parseLog({
          topics: mintEvent.topics,
          data: mintEvent.data
        });
        this.testTokenId = parsed.args.tokenId.toString();
        log(`🎯 铸造成功! Token ID: ${this.testTokenId}`, 'green');
      } else {
        this.testTokenId = nextTokenId;
        log(`🎯 铸造成功! 估算Token ID: ${this.testTokenId}`, 'green');
      }

      // 查找VRF请求事件
      const vrfEvent = receipt.logs.find(log => {
        try {
          const parsed = this.contract.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          return parsed.name === 'RarityRequested';
        } catch {
          return false;
        }
      });

      if (vrfEvent) {
        const parsed = this.contract.interface.parseLog({
          topics: vrfEvent.topics,
          data: vrfEvent.data
        });
        this.vrfRequestId = parsed.args.requestId.toString();
        log(`🎲 VRF请求已发送! Request ID: ${this.vrfRequestId}`, 'green');
      }

      return {
        tokenId: this.testTokenId,
        txHash: tx.hash,
        vrfRequestId: this.vrfRequestId
      };

    } catch (error) {
      log(`❌ 铸造失败: ${error.message}`, 'red');
      throw error;
    }
  }

  async monitorVRFStatus() {
    if (!this.testTokenId) {
      throw new Error('❌ 没有要监控的Token ID');
    }

    log(`\n👁️  开始监控Token ${this.testTokenId}的VRF状态...`, 'cyan');

    let attempts = 0;
    const maxAttempts = 60; // 最多检查10分钟
    const checkInterval = 10000; // 10秒检查一次

    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        attempts++;
        
        try {
          log(`\n🔍 检查尝试 ${attempts}/${maxAttempts}...`, 'yellow');
          
          const beastInfo = await this.contract.beasts(this.testTokenId);
          
          log(`📊 Beast状态:`, 'blue');
          log(`   创建者: ${beastInfo.creator}`, 'blue');
          log(`   稀有度: ${beastInfo.rarity}`, 'blue');
          log(`   已揭晓: ${beastInfo.rarityRevealed}`, 'blue');
          log(`   时间戳: ${new Date(Number(beastInfo.timestamp) * 1000).toLocaleString()}`, 'blue');

          if (beastInfo.rarityRevealed) {
            log(`\n🎉 VRF已完成!`, 'green');
            log(`⭐ 最终稀有度: ${this.getRarityName(beastInfo.rarity)}`, 'green');
            
            // 尝试获取随机数
            try {
              const filter = this.contract.filters.RarityRevealed(this.testTokenId);
              const events = await this.contract.queryFilter(filter, -1000);
              
              if (events.length > 0) {
                const event = events[events.length - 1];
                const randomValue = event.args.randomValue.toString();
                log(`🎲 链上随机数: ${randomValue}`, 'green');
                log(`🔗 交易哈希: ${event.transactionHash}`, 'green');
              }
            } catch (eventError) {
              log(`⚠️  无法获取事件详情: ${eventError.message}`, 'yellow');
            }

            resolve({
              tokenId: this.testTokenId,
              rarity: beastInfo.rarity.toString(),
              rarityName: this.getRarityName(beastInfo.rarity),
              revealed: true
            });
            return;
          }

          if (attempts >= maxAttempts) {
            log(`❌ 超时: VRF在${maxAttempts * checkInterval / 1000}秒内未完成`, 'red');
            reject(new Error('VRF监控超时'));
            return;
          }

          log(`⏳ VRF仍在处理中，${checkInterval/1000}秒后再次检查...`, 'yellow');
          setTimeout(checkStatus, checkInterval);

        } catch (error) {
          log(`❌ 检查状态失败: ${error.message}`, 'red');
          
          if (attempts >= maxAttempts) {
            reject(error);
          } else {
            log(`🔄 ${checkInterval/1000}秒后重试...`, 'yellow');
            setTimeout(checkStatus, checkInterval);
          }
        }
      };

      checkStatus();
    });
  }

  getRarityName(rarity) {
    const names = ['普通', '稀有', '史诗', '传说', '神话'];
    return names[rarity] || `未知(${rarity})`;
  }

  async testAPI() {
    log('\n📡 测试API接口...', 'cyan');

    try {
      // 测试POST API
      const postResponse = await fetch('http://localhost:3000/api/vrf-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: this.testTokenId,
          requester: this.wallet.address
        })
      });

      const postData = await postResponse.json();
      log(`📤 POST API响应:`, 'blue');
      console.log(JSON.stringify(postData, null, 2));

      if (postData.success) {
        const vrfRequestId = postData.vrfRequestId;
        
        // 测试GET API
        const getResponse = await fetch(`http://localhost:3000/api/vrf-request?requestId=${vrfRequestId}`);
        const getData = await getResponse.json();
        
        log(`📥 GET API响应:`, 'blue');
        console.log(JSON.stringify(getData, null, 2));
      }

    } catch (error) {
      log(`❌ API测试失败: ${error.message}`, 'red');
      log(`💡 请确保应用正在运行: npm run dev`, 'yellow');
    }
  }

  async runFullTest() {
    try {
      await this.init();
      
      const mintResult = await this.mintTestNFT();
      log(`\n✅ 铸造阶段完成`, 'green');
      log(`   Token ID: ${mintResult.tokenId}`, 'green');
      log(`   交易: ${mintResult.txHash}`, 'green');
      
      // 等待几秒让交易完全确认
      log('\n⏳ 等待5秒让交易完全确认...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const vrfResult = await this.monitorVRFStatus();
      log(`\n✅ VRF测试完成`, 'green');
      log(`   稀有度: ${vrfResult.rarityName} (${vrfResult.rarity})`, 'green');
      
      await this.testAPI();
      
      log(`\n🎉 所有测试完成!`, 'green');
      log(`\n📋 测试总结:`, 'cyan');
      log(`   ✅ 合约连接成功`, 'green');
      log(`   ✅ NFT铸造成功`, 'green');
      log(`   ✅ VRF请求成功`, 'green');
      log(`   ✅ 稀有度揭晓成功`, 'green');
      log(`   ✅ Chainlink VRF工作正常`, 'green');

    } catch (error) {
      log(`\n❌ 测试失败: ${error.message}`, 'red');
      process.exit(1);
    }
  }
}

// 主函数
async function main() {
  log('🧪 Chainlink VRF链上随机数测试脚本', 'cyan');
  log('==========================================\n', 'cyan');

  const tester = new VRFTester();
  await tester.runFullTest();
}

// 错误处理
process.on('unhandledRejection', (error) => {
  log(`❌ 未处理的错误: ${error.message}`, 'red');
  process.exit(1);
});

// 运行测试
if (require.main === module) {
  main();
}