import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

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
    console.log('👤 准备创建NFT，用户:', creatorAddress);

    // 确保tokenId是BigInt
    const tokenIdBigInt = BigInt(tokenId);

    // 先确保用户记录存在
    await prisma.user.upsert({
      where: { address: creatorAddress },
      update: { updatedAt: new Date() },
      create: { address: creatorAddress }
    });

    // 检查tokenId是否已存在
    const existingNFT = await prisma.nFT.findUnique({
      where: { tokenId: tokenIdBigInt }
    });

    let result;
    if (existingNFT) {
      console.log('⚠️ TokenId已存在，更新现有NFT:', tokenId);
      result = await prisma.nFT.update({
        where: { tokenId: tokenIdBigInt },
        data: {
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
        }
      });
      
      // 转换BigInt为字符串
      const serializedResult = {
        ...result,
        tokenId: result.tokenId.toString()
      };
      
      console.log('✅ API: NFT更新成功:', serializedResult);
      return NextResponse.json({ success: true, nft: serializedResult, action: 'updated' });
    } else {
      console.log('🆕 创建新NFT:', tokenId);
      result = await prisma.nFT.create({
        data: {
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
          vrfRequestId
        }
      });
      
      // 转换BigInt为字符串
      const serializedResult = {
        ...result,
        tokenId: result.tokenId.toString()
      };
      
      console.log('✅ API: NFT创建成功:', serializedResult);
      return NextResponse.json({ success: true, nft: serializedResult, action: 'created' });
    }

  } catch (error) {
    console.error('❌ API: 创建NFT失败:', error);
    return NextResponse.json({ 
      error: 'Failed to create NFT', 
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
