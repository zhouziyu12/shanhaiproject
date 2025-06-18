// fixed-quick-test.js - 修复版快速VRF测试脚本
const { ethers } = require('ethers');
require('dotenv').config({ path: '.env.local' });

async function quickTest() {
  console.log('🚀 快速VRF测试...\n');

  try {
    // 验证和修复环境变量
    console.log('🔍 检查环境变量...');
    
    const rpcUrl = process.env.SEPOLIA_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;
    let privateKey = process.env.VRF_WALLET_PRIVATE_KEY;
    const contractAddress = process.env.SHANHAI_NFT_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_PROMPT_NFT_ADDRESS;
    
    if (!rpcUrl) {
      throw new Error('❌ 缺少RPC URL配置');
    }
    
    if (!privateKey) {
      throw new Error('❌ 缺少私钥配置');
    }
    
    if (!contractAddress) {
      throw new Error('❌ 缺少合约地址配置');
    }
    
    // 修复私钥格式
    if (!privateKey.startsWith('0x')) {
      privateKey = '0x' + privateKey;
      console.log('🔧 已修复私钥格式，添加0x前缀');
    }
    
    // 验证私钥长度
    if (privateKey.length !== 66) { // 0x + 64字符
      throw new Error(`❌ 私钥长度不正确: ${privateKey.length}, 期望66`);
    }
    
    console.log('✅ 环境变量验证通过');
    console.log(`📡 RPC: ${rpcUrl.substring(0, 50)}...`);
    console.log(`🔑 私钥: ${privateKey.substring(0, 10)}...`);
    console.log(`📄 合约: ${contractAddress}\n`);

    // 基础配置
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // 简化ABI
    const contractABI = [
      "function mint(address to, string memory prompt) public payable returns (uint256)",
      "function beasts(uint256) public view returns (string, string, string, uint8, uint256, address, bool, bool)",
      "function getNextTokenId() public view returns (uint256)",
      "event BeastMinted(uint256 indexed tokenId, address indexed creator, string prompt, bool hasIPFS)",
      "event RarityRevealed(uint256 indexed tokenId, uint8 rarity, uint256 randomValue)"
    ];

    const contract = new ethers.Contract(contractAddress, contractABI, wallet);

    // 1. 检查连接
    console.log('🔗 检查网络连接...');
    const network = await provider.getNetwork();
    console.log(`📡 网络: ${network.name} (${network.chainId})`);
    
    const balance = await provider.getBalance(wallet.address);
    console.log(`💰 钱包: ${wallet.address}`);
    console.log(`💰 余额: ${ethers.formatEther(balance)} ETH`);
    
    if (balance < ethers.parseEther('0.001')) {
      console.log('⚠️  警告: ETH余额可能不足，请从水龙头获取测试ETH');
      console.log('🚰 Sepolia水龙头: https://faucets.chain.link/sepolia\n');
    } else {
      console.log('✅ 余额充足\n');
    }

    // 2. 验证合约
    console.log('📄 验证合约...');
    const code = await provider.getCode(contractAddress);
    if (code === '0x') {
      throw new Error('❌ 合约地址无效或未部署');
    }
    console.log('✅ 合约验证成功\n');

    // 3. 获取下一个Token ID
    console.log('🔢 获取下一个Token ID...');
    const nextTokenId = await contract.getNextTokenId();
    console.log(`📋 下一个Token ID: ${nextTokenId}\n`);

    // 4. 铸造NFT
    console.log('⛏️  开始铸造测试NFT...');
    const testPrompt = `快速测试神兽 - ${new Date().toISOString()}`;
    console.log(`📝 描述: ${testPrompt}`);
    
    // 估算gas
    try {
      const gasEstimate = await contract.mint.estimateGas(wallet.address, testPrompt, { value: 0 });
      console.log(`⛽ 预估Gas: ${gasEstimate.toString()}`);
    } catch (gasError) {
      console.log('⚠️  Gas估算失败，使用默认值');
    }
    
    const tx = await contract.mint(
      wallet.address,
      testPrompt,
      { 
        value: 0,
        gasLimit: 300000 // 使用固定gas限制
      }
    );
    
    console.log(`🔗 交易哈希: ${tx.hash}`);
    console.log('⏳ 等待交易确认...');
    
    const receipt = await tx.wait();
    console.log(`✅ 交易确认! Gas使用: ${receipt.gasUsed.toString()}`);
    console.log(`📊 区块号: ${receipt.blockNumber}\n`);

    // 5. 监控VRF状态
    const tokenId = nextTokenId;
    console.log(`👁️  开始监控Token ${tokenId}的VRF状态...`);
    console.log('🕐 每10秒检查一次，最多等待5分钟\n');

    for (let i = 0; i < 30; i++) { // 最多检查5分钟
      try {
        const beast = await contract.beasts(tokenId);
        const [prompt, , , rarity, timestamp, creator, revealed] = beast;
        
        const checkTime = new Date().toLocaleTimeString();
        console.log(`[${checkTime}] 检查 ${i + 1}/30:`);
        console.log(`   创建者: ${creator}`);
        console.log(`   稀有度: ${rarity}`);
        console.log(`   已揭晓: ${revealed}`);
        console.log(`   时间戳: ${new Date(Number(timestamp) * 1000).toLocaleString()}`);
        
        if (revealed) {
          const rarityNames = ['普通', '稀有', '史诗', '传说', '神话'];
          console.log(`\n🎉 VRF完成! 稀有度: ${rarityNames[rarity]} (${rarity})`);
          
          // 尝试查找随机数事件
          try {
            console.log('🔍 查找RarityRevealed事件...');
            const filter = contract.filters.RarityRevealed(tokenId);
            const events = await contract.queryFilter(filter, receipt.blockNumber);
            
            if (events.length > 0) {
              const event = events[0];
              const randomValue = event.args.randomValue.toString();
              console.log(`🎲 链上随机数: ${randomValue}`);
              console.log(`🔗 VRF交易: ${event.transactionHash}`);
              console.log(`📊 VRF区块: ${event.blockNumber}`);
            } else {
              console.log('⚠️  未找到RarityRevealed事件，但稀有度已确定');
            }
          } catch (eventError) {
            console.log(`⚠️  查询事件失败: ${eventError.message}`);
          }
          
          console.log('\n🎯 测试结果总结:');
          console.log(`   ✅ Token ID: ${tokenId}`);
          console.log(`   ✅ 铸造交易: ${tx.hash}`);
          console.log(`   ✅ 稀有度: ${rarityNames[rarity]} (${rarity})`);
          console.log(`   ✅ VRF处理时间: ${(i + 1) * 10}秒`);
          console.log('\n🎉 测试完成! Chainlink VRF工作正常! ✨');
          return;
        }
        
        if (i < 29) {
          console.log(`⏳ VRF仍在处理中，10秒后再次检查...\n`);
          await new Promise(resolve => setTimeout(resolve, 10000)); // 等待10秒
        }
      } catch (checkError) {
        console.log(`❌ 检查失败: ${checkError.message}`);
        if (i < 29) {
          console.log('🔄 10秒后重试...\n');
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      }
    }
    
    console.log('\n⏰ 超时: VRF在5分钟内未完成');
    console.log('💡 这可能是因为:');
    console.log('   • VRF订阅余额不足');
    console.log('   • 网络拥堵');
    console.log('   • Chainlink节点响应缓慢');
    console.log('\n🔍 建议:');
    console.log('   • 检查VRF订阅: https://vrf.chain.link');
    console.log('   • 稍后再次运行测试');
    console.log(`   • 手动查看Token ${tokenId}状态`);
    
  } catch (error) {
    console.error(`\n❌ 测试失败: ${error.message}`);
    
    if (error.message.includes('insufficient funds')) {
      console.log('\n💡 解决方案:');
      console.log('   获取Sepolia测试ETH: https://faucets.chain.link/sepolia');
    } else if (error.message.includes('nonce')) {
      console.log('\n💡 解决方案:');
      console.log('   等待几秒后重试，可能是nonce冲突');
    } else if (error.message.includes('gas')) {
      console.log('\n💡 解决方案:');
      console.log('   检查合约调用参数，可能gas限制不足');
    }
    
    console.log('\n🔍 调试信息:');
    console.log(`   钱包地址: ${wallet?.address || '未知'}`);
    console.log(`   合约地址: ${contractAddress}`);
    console.log(`   网络: ${network?.name || '未知'} (${network?.chainId || '未知'})`);
  }
}

quickTest();
