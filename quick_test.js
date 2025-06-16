const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function quickTest() {
  try {
    console.log('🚀 开始快速测试...');
    
    // 1. 测试用户创建
    const user = await prisma.user.create({
      data: { address: 'quicktest123' }
    });
    console.log('✅ 用户创建成功:', user.address);
    
    // 2. 测试NFT创建
    const nft = await prisma.nFT.create({
      data: {
        tokenId: 777777,
        name: '快速测试NFT',
        originalInput: '测试',
        optimizedPrompt: '测试',
        style: 'test',
        creator: 'quicktest123',
        imageUrl: 'https://test.com',
        rarity: 1
      }
    });
    console.log('✅ NFT创建成功:', nft.name);
    
    // 3. 测试VRF创建
    const vrf = await prisma.vRFRequest.create({
      data: {
        requestId: 'test_vrf_12345',
        status: 'fulfilled',
        randomWord: 5555,
        rarity: 1,
        tokenId: 777777,
        requester: 'quicktest123'
      }
    });
    console.log('✅ VRF创建成功:', vrf.requestId);
    
    // 4. 查询验证
    const counts = await Promise.all([
      prisma.user.count(),
      prisma.nFT.count(),
      prisma.vRFRequest.count()
    ]);
    
    console.log('📊 数据统计:');
    console.log('👥 用户:', counts[0]);
    console.log('🎨 NFT:', counts[1]);
    console.log('🎲 VRF:', counts[2]);
    
    console.log('🎉 所有测试通过！数据库工作正常！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

quickTest();
