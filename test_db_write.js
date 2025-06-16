const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testWrite() {
  try {
    console.log('🧪 测试数据库写入...');
    
    // 测试创建用户
    const user = await prisma.user.create({
      data: {
        address: 'test123456789'
      }
    });
    
    console.log('✅ 用户创建成功:', user);
    
    // 测试创建NFT
    const nft = await prisma.nFT.create({
      data: {
        tokenId: 999999,
        name: '测试NFT',
        originalInput: '测试',
        optimizedPrompt: '测试',
        style: 'test',
        creator: 'test123456789',
        imageUrl: 'https://test.com',
        rarity: 0
      }
    });
    
    console.log('✅ NFT创建成功:', nft);
    
    // 查询验证
    const allUsers = await prisma.user.findMany();
    const allNFTs = await prisma.nFT.findMany();
    
    console.log('📊 数据统计:');
    console.log('👥 用户数量:', allUsers.length);
    console.log('🎨 NFT数量:', allNFTs.length);
    
  } catch (error) {
    console.error('❌ 数据库写入测试失败:', error.message);
    console.error('详细错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testWrite();
