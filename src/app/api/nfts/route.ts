import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');
  
  console.log('🔍 API: 获取NFT数据，地址:', address);
  
  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }

  try {
    const nfts = await prisma.nFT.findMany({
      where: { creator: address.toLowerCase() },
      orderBy: { mintedAt: 'desc' }
    });

    // 转换BigInt为字符串以便JSON序列化
    const serializedNFTs = nfts.map(nft => ({
      ...nft,
      tokenId: nft.tokenId.toString()
    }));

    console.log('✅ API: 成功获取NFT数据:', serializedNFTs.length, '个');
    return NextResponse.json({ success: true, nfts: serializedNFTs });
  } catch (error) {
    console.error('❌ API: 获取NFT失败:', error);
    return NextResponse.json({ error: 'Failed to fetch NFTs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🆕 API: 添加新NFT:', body);
    
    const {
      tokenId,
      name,
      originalInput,
      optimizedPrompt,
      style,
      creator,
      imageUrl,
      ipfsImageUrl,
      ipfsMetadataUrl,
      gatewayImageUrl,
      rarity,
      vrfRequestId
    } = body;

    const creatorAddress = creator.toLowerCase();
    console.log('👤 准备处理NFT，用户:', creatorAddress);

    // 确保tokenId是BigInt
    const tokenIdBigInt = BigInt(tokenId);

    // 先确保用户记录存在
    await prisma.user.upsert({
      where: { address: creatorAddress },
      update: { updatedAt: new Date() },
      create: { address: creatorAddress }
    });

    // 🔧 修复：使用原子upsert操作，避免并发竞争
    const result = await prisma.nFT.upsert({
      where: { tokenId: tokenIdBigInt },
      update: {
        // 如果NFT已存在，更新这些字段
        name,
        originalInput,
        optimizedPrompt,
        style,
        creator: creatorAddress,
        imageUrl,
        ipfsImageUrl,
        ipfsMetadataUrl,
        gatewayImageUrl,
        rarity,
        rarityRevealed: true,
        vrfRequestId,
        updatedAt: new Date()
      },
      create: {
        // 如果NFT不存在，创建新记录
        tokenId: tokenIdBigInt,
        name,
        originalInput,
        optimizedPrompt,
        style,
        creator: creatorAddress,
        imageUrl,
        ipfsImageUrl,
        ipfsMetadataUrl,
        gatewayImageUrl,
        rarity,
        rarityRevealed: true,
        vrfRequestId,
        mintedAt: new Date()
      }
    });

    // 转换BigInt为字符串
    const serializedResult = {
      ...result,
      tokenId: result.tokenId.toString()
    };

    // 判断是创建还是更新（通过检查mintedAt和updatedAt是否相同）
    const action = result.mintedAt.getTime() === result.updatedAt.getTime() ? 'created' : 'updated';
    
    console.log(`✅ API: NFT${action === 'created' ? '创建' : '更新'}成功:`, {
      tokenId: tokenId,
      action: action,
      name: name
    });
    
    return NextResponse.json({ 
      success: true, 
      nft: serializedResult, 
      action: action 
    });

  } catch (error) {
    console.error('❌ API: 处理NFT失败:', error);
    return NextResponse.json({ 
      error: 'Failed to process NFT', 
      details: error.message
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const nfts = await prisma.nFT.findMany({
      orderBy: { mintedAt: 'desc' },
      take: 50
    });
    
    // 转换BigInt为字符串
    const serializedNFTs = nfts.map(nft => ({
      ...nft,
      tokenId: nft.tokenId.toString()
    }));
    
    return NextResponse.json({ success: true, nfts: serializedNFTs });
  } catch (error) {
    console.error('❌ API: 获取所有NFT失败:', error);
    return NextResponse.json({ error: 'Failed to fetch all NFTs' }, { status: 500 });
  }
}
