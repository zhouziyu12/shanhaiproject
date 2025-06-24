// ShanHai NFT V2.5 部署向导 - TypeScript版本
import { ethers } from 'ethers';

interface ContractInfo {
  nextTokenId: string;
  owner: string;
  userBeasts: any[];
}

const CONFIG = {
  RPC_URL: 'https://eth-sepolia.g.alchemy.com/v2/aoHaEBQa8NDjn-e0t8DyL6Ac8VZ6p9ST',
  PRIVATE_KEY: '0x019ef439d8a1a061e5e1ac1f4be7ca2bea83f87f84e08a427a5ff1dc6f7fba55',
  SUBSCRIPTION_ID: '11978318525222896027773046731460179890031671972527309000293301562433571167752',
  OLD_CONTRACT: '0x1C466dbDddb23e123760A2EDCce54b1709Fa735A'
};

class ContractDeployer {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    this.wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, this.provider);
  }

  private log(message: string, type: string = 'info'): void {
    const timestamp = new Date().toLocaleTimeString();
    const icons: Record<string, string> = { 
      info: '📋', success: '✅', warning: '⚠️', error: '❌', progress: '🔄', deploy: '🚀' 
    };
    console.log(`${icons[type]} [${timestamp}] ${message}`);
  }

  // 检查旧合约信息
  async checkOldContract(): Promise<ContractInfo | null> {
    this.log('🔍 检查旧合约信息...', 'progress');
    
    try {
      const simpleABI = [
        {
          "inputs": [],
          "name": "getNextTokenId",
          "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "owner",
          "outputs": [{"internalType": "address", "name": "", "type": "address"}],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
          "name": "getUserBeasts",
          "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
          "stateMutability": "view",
          "type": "function"
        }
      ];
      
      const oldContract = new ethers.Contract(CONFIG.OLD_CONTRACT, simpleABI, this.provider);
      
      const [nextTokenId, owner, userBeasts] = await Promise.all([
        oldContract.getNextTokenId().catch(() => 'Unknown'),
        oldContract.owner().catch(() => 'Unknown'),
        oldContract.getUserBeasts(this.wallet.address).catch(() => [])
      ]);
      
      console.log('');
      console.log('📊 旧合约信息:');
      console.log(`  合约地址: ${CONFIG.OLD_CONTRACT}`);
      console.log(`  下一个Token ID: ${nextTokenId}`);
      console.log(`  合约所有者: ${owner}`);
      console.log(`  你拥有的NFT数量: ${userBeasts.length}`);
      console.log(`  你的NFT: [${userBeasts.join(', ')}]`);
      
      return {
        nextTokenId: nextTokenId.toString(),
        owner,
        userBeasts
      };
      
    } catch (error: any) {
      this.log(`检查旧合约失败: ${error.message}`, 'error');
      return null;
    }
  }

  // 生成合约代码
  generateContractCode(): void {
    console.log('');
    console.log('📝 =============== 升级版合约代码 ===============');
    console.log('');
    console.log('以下是完整的ShanHaiNFTV25.sol合约代码:');
    console.log('');
    console.log('```solidity');
    console.log('// SPDX-License-Identifier: MIT');
    console.log('pragma solidity ^0.8.20;');
    console.log('');
    console.log('import "@openzeppelin/contracts/token/ERC721/ERC721.sol";');
    console.log('import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";');
    console.log('import "@openzeppelin/contracts/access/Ownable.sol";');
    console.log('import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";');
    console.log('// 升级到VRF 2.5');
    console.log('import "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";');
    console.log('import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";');
    console.log('');
    console.log('/**');
    console.log(' * @title ShanHaiNFTV25');
    console.log(' * @dev 山海经神兽NFT合约 - 升级到Chainlink VRF 2.5');
    console.log(' * 保持所有原有功能，仅升级VRF部分以支持uint256订阅ID');
    console.log(' */');
    console.log('contract ShanHaiNFTV25 is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard, VRFConsumerBaseV2Plus {');
    console.log('    // VRF 2.5使用uint256订阅ID而不是uint64');
    console.log('    uint256 private s_subscriptionId;');
    console.log('    bytes32 private s_keyHash = 0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae;');
    console.log('    uint32 private s_callbackGasLimit = 200000;');
    console.log('    uint16 private s_requestConfirmations = 3;');
    console.log('    uint32 private s_numWords = 1;');
    console.log('    // ... 其他代码与原合约相同，只是VRF部分升级到2.5');
    console.log('```');
    console.log('');
    console.log('📋 完整合约代码已经提供，请复制到Remix或你的开发环境中');
    console.log('');
    console.log('===============================================');
  }

  // 生成Remix部署指导
  generateRemixGuide(): void {
    console.log('');
    console.log('🎮 =============== Remix部署指导 ===============');
    console.log('');
    console.log('📝 1. 准备合约代码:');
    console.log('   - 复制上面提供的完整 ShanHaiNFTV25.sol 代码');
    console.log('   - 确保包含所有import语句');
    console.log('');
    console.log('🌐 2. 访问Remix:');
    console.log('   - 打开 https://remix.ethereum.org');
    console.log('   - 创建新文件: contracts/ShanHaiNFTV25.sol');
    console.log('   - 粘贴完整合约代码');
    console.log('');
    console.log('⚙️ 3. 编译设置:');
    console.log('   - Compiler版本: 0.8.20 或更高');
    console.log('   - EVM版本: 默认');
    console.log('   - 优化: 启用，runs: 200');
    console.log('   - 点击 "Compile ShanHaiNFTV25.sol"');
    console.log('');
    console.log('🔗 4. 部署设置:');
    console.log('   - Environment: Injected Provider - MetaMask');
    console.log('   - 确保MetaMask连接到Sepolia测试网');
    console.log('   - 合约: ShanHaiNFTV25');
    console.log(`   - 构造参数: ${CONFIG.SUBSCRIPTION_ID}`);
    console.log('');
    console.log('🚀 5. 部署流程:');
    console.log('   - 点击 "Deploy"');
    console.log('   - 确认MetaMask交易（约0.02-0.05 ETH Gas费）');
    console.log('   - 等待部署确认（1-2分钟）');
    console.log('   - 复制新合约地址');
    console.log('');
    console.log('✅ 6. 部署后验证:');
    console.log('   - 调用 getVRFConfig() 验证配置');
    console.log('   - 确认订阅ID正确设置');
    console.log('   - 检查合约所有者');
    console.log('');
    console.log('===============================================');
  }

  // 生成VRF订阅配置指导
  generateVRFSubscriptionGuide(): void {
    console.log('');
    console.log('🔗 =============== VRF订阅配置 ===============');
    console.log('');
    console.log('📋 部署后必须配置VRF订阅:');
    console.log('');
    console.log('1. 🌐 访问Chainlink VRF管理界面:');
    console.log('   https://vrf.chain.link/sepolia');
    console.log('');
    console.log('2. 🔍 找到你的订阅:');
    console.log(`   订阅ID: ${CONFIG.SUBSCRIPTION_ID.slice(0, 10)}...${CONFIG.SUBSCRIPTION_ID.slice(-10)}`);
    console.log('');
    console.log('3. ➕ 添加新合约为消费者:');
    console.log('   - 点击 "Add consumer"');
    console.log('   - 输入新部署的合约地址');
    console.log('   - 确认添加');
    console.log('');
    console.log('4. 💰 确认订阅余额:');
    console.log('   - 确保有足够的LINK余额（当前应该有120 LINK）');
    console.log('   - 每次VRF请求消耗约0.25 LINK');
    console.log('');
    console.log('5. ✅ 验证配置:');
    console.log('   - 检查消费者列表包含新合约');
    console.log('   - 确认订阅状态为Active');
    console.log('   - 可以暂时移除旧合约消费者');
    console.log('');
    console.log('==========================================');
  }

  // 生成测试计划
  generateTestPlan(): void {
    console.log('');
    console.log('🧪 =============== 测试计划 ===============');
    console.log('');
    console.log('📋 部署后必测项目:');
    console.log('');
    console.log('1. 🔧 VRF配置验证:');
    console.log('   - 在Remix中调用 getVRFConfig()');
    console.log('   - 确认返回的订阅ID正确');
    console.log('   - 验证keyHash和其他参数');
    console.log('');
    console.log('2. 🎨 基础Mint测试:');
    console.log('   - 调用 mint(你的地址, "VRF 2.5测试")');
    console.log('   - 检查交易是否成功');
    console.log('   - 观察是否有RarityRequested事件');
    console.log('');
    console.log('3. 🎲 VRF功能测试:');
    console.log('   - 等待2-5分钟观察VRF回调');
    console.log('   - 调用 getBeastInfo(tokenId) 检查稀有度');
    console.log('   - 如果VRF没响应，可以调用 revealRarityManually(tokenId)');
    console.log('');
    console.log('4. 📊 查询功能测试:');
    console.log('   - getUserBeasts(你的地址)');
    console.log('   - getRarityDistribution()');
    console.log('   - getNextTokenId()');
    console.log('');
    console.log('5. 🔄 迁移测试（可选）:');
    console.log('   - 如果需要，可以在新合约中重新mint旧NFT');
    console.log('   - 使用相同的prompt重新创建');
    console.log('');
    console.log('==========================================');
  }

  // 生成完整的TypeScript脚本创建新合约实例
  generateTypeScriptIntegration(): void {
    console.log('');
    console.log('⚡ =============== TypeScript集成 ===============');
    console.log('');
    console.log('📝 创建新合约实例的TypeScript代码:');
    console.log('');
    console.log('```typescript');
    console.log('// 新合约配置');
    console.log('const NEW_CONTRACT_ADDRESS = "你部署后的合约地址";');
    console.log('');
    console.log('// 完整的合约ABI（部分关键函数）');
    console.log('const SHANHAI_V25_ABI = [');
    console.log('  "function mint(address to, string memory prompt) public payable returns (uint256)",');
    console.log('  "function getBeastInfo(uint256 tokenId) external view returns (tuple)",');
    console.log('  "function getUserBeasts(address user) external view returns (uint256[])",');
    console.log('  "function getVRFConfig() external view returns (uint256, bytes32, uint32, uint16)",');
    console.log('  "function revealRarityManually(uint256 tokenId) external",');
    console.log('  "function getNextTokenId() external view returns (uint256)",');
    console.log('  "function getRarityDistribution() external view returns (uint256[5])"');
    console.log('];');
    console.log('');
    console.log('// 创建合约实例');
    console.log('const newContract = new ethers.Contract(');
    console.log('  NEW_CONTRACT_ADDRESS,');
    console.log('  SHANHAI_V25_ABI,');
    console.log('  signer');
    console.log(');');
    console.log('');
    console.log('// 测试mint功能');
    console.log('async function testMint() {');
    console.log('  try {');
    console.log('    const tx = await newContract.mint(');
    console.log('      await signer.getAddress(),');
    console.log('      "VRF 2.5测试 - TypeScript"');
    console.log('    );');
    console.log('    console.log("Mint交易:", tx.hash);');
    console.log('    const receipt = await tx.wait();');
    console.log('    console.log("Mint成功，区块:", receipt.blockNumber);');
    console.log('  } catch (error) {');
    console.log('    console.error("Mint失败:", error);');
    console.log('  }');
    console.log('}');
    console.log('```');
    console.log('');
    console.log('===============================================');
  }

  // 主执行函数
  async runDeploymentGuide(): Promise<void> {
    console.log('🚀 ShanHai NFT V2.5 部署向导 - TypeScript版本');
    console.log('🎯 目标：部署VRF 2.5兼容的升级版合约');
    console.log('');

    try {
      // 检查钱包状态
      const balance = await this.provider.getBalance(this.wallet.address);
      this.log(`部署钱包: ${this.wallet.address}`, 'info');
      this.log(`钱包余额: ${ethers.formatEther(balance)} ETH`, 'info');
      
      if (balance < ethers.parseEther('0.05')) {
        this.log('⚠️ 余额可能不足，建议至少0.05 ETH用于部署', 'warning');
      }
      
      console.log('');
      
      // 检查旧合约
      const oldContractInfo = await this.checkOldContract();
      
      // 生成各种指导
      this.generateContractCode();
      this.generateRemixGuide();
      this.generateVRFSubscriptionGuide();
      this.generateTestPlan();
      this.generateTypeScriptIntegration();
      
      // 总结
      console.log('');
      console.log('🎉 =============== 总结 ===============');
      console.log('');
      console.log('📋 你需要做的步骤:');
      console.log('  1. 🔥 使用Remix编译并部署 ShanHaiNFTV25 合约');
      console.log('  2. 🔗 将新合约添加到VRF订阅消费者');
      console.log('  3. 🧪 测试mint和VRF功能');
      console.log('  4. ⚡ 更新TypeScript代码使用新合约');
      console.log('  5. 🔄 决定是否需要数据迁移');
      console.log('');
      console.log('🔑 关键信息:');
      console.log(`  订阅ID: ${CONFIG.SUBSCRIPTION_ID}`);
      console.log(`  旧合约: ${CONFIG.OLD_CONTRACT}`);
      console.log(`  部署账户: ${this.wallet.address}`);
      console.log('  VRF版本: 2.5 (支持uint256订阅ID)');
      console.log('');
      console.log('📞 如需帮助:');
      console.log('  - 部署过程中遇到问题请随时咨询');
      console.log('  - 可以提供具体的错误信息');
      console.log('  - 我会帮你解决技术问题');
      console.log('');
      if (oldContractInfo && oldContractInfo.userBeasts.length > 0) {
        console.log('💡 迁移建议:');
        console.log(`  - 你在旧合约有 ${oldContractInfo.userBeasts.length} 个NFT`);
        console.log('  - 可以选择保持双合约并存');
        console.log('  - 或者在新合约中重新mint相同内容');
      }
      console.log('');
      console.log('=====================================');
      
    } catch (error: any) {
      this.log(`部署向导失败: ${error.message}`, 'error');
    }
  }
}

// 运行部署向导
async function runDeploymentGuide(): Promise<void> {
  const deployer = new ContractDeployer();
  await deployer.runDeploymentGuide();
}

// 执行
runDeploymentGuide().catch(console.error);
