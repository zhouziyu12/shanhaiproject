const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDB() {
  try {
    console.log('🔍 检查数据库状态...');
    
    // 检查用户表
    const users = await prisma.user.findMany();
    console.log('👥 用户数量:', users.length);
    
    // 检查NFT表
    const nfts = await prisma.nFT.findMany();
    console.log('🎨 NFT数量:', nfts.length);
    
    // 检查VRF表
    const vrfs = await prisma.vRFRequest.findMany();
    console.log('🎲 VRF数量:', vrfs.length);
    
  } catch (error) {
    console.error('❌ 数据库检查失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDB();
