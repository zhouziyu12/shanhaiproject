import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');
  
  console.log('🔍 API: Fetching NFT data, address:', address);
  
  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }

  try {
    const nfts = await prisma.nFT.findMany({
      where: { creator: address.toLowerCase() },
      orderBy: { mintedAt: 'desc' }
    });

    // Convert BigInt to string for JSON serialization
    const serializedNFTs = nfts.map(nft => ({
      ...nft,
      tokenId: nft.tokenId.toString()
    }));

    console.log('✅ API: Successfully fetched NFT data:', serializedNFTs.length, 'items');
    return NextResponse.json({ success: true, nfts: serializedNFTs });
  } catch (error) {
    console.error('❌ API: Failed to fetch NFTs:', error);
    return NextResponse.json({ error: 'Failed to fetch NFTs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🆕 API: Adding new NFT:', body);
    
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
    console.log('👤 Preparing to process NFT, user:', creatorAddress);

    // Ensure tokenId is BigInt
    const tokenIdBigInt = BigInt(tokenId);

    // First ensure user record exists
    await prisma.user.upsert({
      where: { address: creatorAddress },
      update: { updatedAt: new Date() },
      create: { address: creatorAddress }
    });

    // 🔧 Fix: Use atomic upsert operation to avoid race conditions
    const result = await prisma.nFT.upsert({
      where: { tokenId: tokenIdBigInt },
      update: {
        // If NFT already exists, update these fields
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
        // If NFT doesn't exist, create new record
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

    // Convert BigInt to string
    const serializedResult = {
      ...result,
      tokenId: result.tokenId.toString()
    };

    // Determine if it's create or update (by checking if mintedAt and updatedAt are the same)
    const action = result.mintedAt.getTime() === result.updatedAt.getTime() ? 'created' : 'updated';
    
    console.log(`✅ API: NFT ${action} successfully:`, {
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
    console.error('❌ API: Failed to process NFT:', error);
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
    
    // Convert BigInt to string
    const serializedNFTs = nfts.map(nft => ({
      ...nft,
      tokenId: nft.tokenId.toString()
    }));
    
    return NextResponse.json({ success: true, nfts: serializedNFTs });
  } catch (error) {
    console.error('❌ API: Failed to fetch all NFTs:', error);
    return NextResponse.json({ error: 'Failed to fetch all NFTs' }, { status: 500 });
  }
}