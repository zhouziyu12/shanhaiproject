import { prisma } from "@/lib/prisma";
// app/api/vrf-request/route.ts - 修复BigInt序列化问题
import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// 配置
const SHANHAI_NFT_CONTRACT_ADDRESS = process.env.SHANHAI_NFT_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_PROMPT_NFT_ADDRESS;
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;
const MAX_RETRIES = parseInt(process.env.VRF_QUERY_RETRIES || '3');

// 合约ABI
const SHANHAI_NFT_ABI = [
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

// Provider和合约实例
const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
const contract = new ethers.Contract(SHANHAI_NFT_CONTRACT_ADDRESS, SHANHAI_NFT_ABI, provider);

// 🔧 BigInt序列化辅助函数
function serializeVRFRequest(vrfRequest: any) {
  return {
    success: true,
    requestId: vrfRequest.requestId,
    status: vrfRequest.status,
    randomWord: vrfRequest.randomWord ? Number(vrfRequest.randomWord) : null,
    rarity: vrfRequest.rarity,
    tokenId: vrfRequest.tokenId ? vrfRequest.tokenId.toString() : null,
    timestamp: vrfRequest.createdAt.getTime()
  };
}

// GET: 查询VRF状态
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const requestId = searchParams.get('requestId');

  console.log('🔗 查询真实VRF状态:', requestId);

  if (!requestId) {
    return NextResponse.json({
      success: false,
      error: 'Missing requestId parameter'
    }, { status: 400 });
  }

  try {
    // 1. 从数据库获取记录
    const vrfRequest = await prisma.vRFRequest.findUnique({
      where: { requestId }
    });

    if (!vrfRequest) {
      return NextResponse.json({
        success: false,
        error: 'VRF request not found'
      }, { status: 404 });
    }

    console.log('📋 数据库记录:', {
      status: vrfRequest.status,
      tokenId: vrfRequest.tokenId?.toString(),
      rarity: vrfRequest.rarity
    });

    // 2. 如果已经完成，直接返回（修复BigInt序列化）
    if (vrfRequest.status === 'fulfilled') {
      return NextResponse.json(serializeVRFRequest(vrfRequest));
    }

    // 3. 查询链上最新状态
    const tokenId = vrfRequest.tokenId;
    if (!tokenId) {
      throw new Error('Token ID missing from database');
    }

    console.log(`🔍 查询Token ${tokenId}的链上状态...`);
    
    const chainStatus = await queryChainStatusWithRetry(tokenId);
    
    if (chainStatus.rarityRevealed) {
      console.log('⭐ 链上稀有度已揭晓，更新数据库...');
      
      // 更新数据库
      const updatedVRF = await prisma.vRFRequest.update({
        where: { requestId },
        data: {
          status: 'fulfilled',
          randomWord: chainStatus.randomWord || Math.floor(Math.random() * 1000000),
          rarity: chainStatus.rarity
        }
      });

      console.log('✅ VRF状态已更新:', {
        rarity: chainStatus.rarity,
        randomWord: chainStatus.randomWord
      });

      return NextResponse.json(serializeVRFRequest(updatedVRF));
    } else {
      // 仍在等待
      console.log('⏳ VRF仍在处理中...');
      return NextResponse.json({
        success: true,
        requestId: vrfRequest.requestId,
        status: 'pending',
        tokenId: vrfRequest.tokenId?.toString(),
        timestamp: vrfRequest.createdAt.getTime(),
        message: 'Waiting for Chainlink VRF fulfillment'
      });
    }

  } catch (error) {
    console.error('❌ 查询VRF状态失败:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to query VRF status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST: 创建VRF监控记录（在mint成功后调用）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenId, requester } = body;

    console.log('🔗 创建VRF监控记录:', { tokenId, requester });

    // 验证Token是否存在于链上
    try {
      const beastInfo = await contract.beasts(BigInt(tokenId));
      if (!beastInfo.creator || beastInfo.creator === ethers.ZeroAddress) {
        throw new Error('Token does not exist on chain');
      }
      console.log('✅ Token存在，创建者:', beastInfo.creator);
      
      // 检查是否已经揭晓稀有度
      if (beastInfo.rarityRevealed) {
        console.log('🎉 Token稀有度已经揭晓:', beastInfo.rarity.toString());
        
        // 立即查找随机数
        let randomWord = null;
        try {
          const filter = contract.filters.RarityRevealed(tokenId);
          const events = await contract.queryFilter(filter, -1000);
          
          if (events.length > 0) {
            const event = events[events.length - 1];
            randomWord = parseInt(event.args?.randomValue?.toString() || '0');
            console.log('🎲 找到随机数:', randomWord);
          }
        } catch (eventError) {
          console.warn('⚠️ 查询事件失败，使用备用随机数');
          randomWord = Math.floor(Math.random() * 1000000);
        }

        // 直接创建已完成的记录
        const vrfRequestId = `vrf_${tokenId}_${Date.now()}_completed`;
        
        await prisma.user.upsert({
          where: { address: requester.toLowerCase() },
          update: {},
          create: { address: requester.toLowerCase() }
        });

        const vrfRequest = await prisma.vRFRequest.create({
          data: {
            requestId: vrfRequestId,
            status: 'fulfilled',
            tokenId: BigInt(tokenId),
            requester: requester.toLowerCase(),
            randomWord: BigInt(randomWord || Math.floor(Math.random() * 1000000)),
            rarity: parseInt(beastInfo.rarity.toString())
          }
        });

        return NextResponse.json({
          success: true,
          vrfRequestId,
          status: 'fulfilled',
          rarity: parseInt(beastInfo.rarity.toString()),
          randomWord: randomWord,
          message: 'VRF already completed',
          chainInfo: {
            tokenId: tokenId,
            contractAddress: SHANHAI_NFT_CONTRACT_ADDRESS,
            network: 'Sepolia',
            vrfVersion: '2.5'
          }
        });
      }
    } catch (error) {
      console.error('❌ Token验证失败:', error);
      return NextResponse.json({
        success: false,
        error: 'Token validation failed',
        details: 'Token may not exist or contract call failed'
      }, { status: 400 });
    }

    // 保存pending记录的其余逻辑...
    await prisma.user.upsert({
      where: { address: requester.toLowerCase() },
      update: {},
      create: { address: requester.toLowerCase() }
    });

    const vrfRequestId = `vrf_${tokenId}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const vrfRequest = await prisma.vRFRequest.create({
      data: {
        requestId: vrfRequestId,
        status: 'pending',
        tokenId: BigInt(tokenId),
        requester: requester.toLowerCase()
      }
    });

    console.log('💾 VRF监控记录已创建');

    return NextResponse.json({
      success: true,
      vrfRequestId,
      message: 'VRF monitoring started',
      estimatedRevealTime: Date.now() + (3 * 60 * 1000),
      chainInfo: {
        tokenId: tokenId,
        contractAddress: SHANHAI_NFT_CONTRACT_ADDRESS,
        network: 'Sepolia',
        vrfVersion: '2.5'
      }
    });

  } catch (error) {
    console.error('❌ 创建VRF监控记录失败:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create VRF monitoring record',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// 工具函数：带重试的链上状态查询
async function queryChainStatusWithRetry(tokenId: bigint, retries = MAX_RETRIES): Promise<{
  rarityRevealed: boolean;
  rarity: number;
  randomWord?: number;
}> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔍 尝试 ${i + 1}/${retries}: 查询Token ${tokenId}...`);
      
      const beastInfo = await contract.beasts(tokenId);
      
      if (beastInfo.rarityRevealed) {
        let randomWord;
        try {
          const filter = contract.filters.RarityRevealed(tokenId);
          const events = await contract.queryFilter(filter, -2000, 'latest');
          
          if (events.length > 0) {
            const event = events[events.length - 1];
            randomWord = parseInt(event.args?.randomValue?.toString() || '0');
            console.log('🎲 找到随机数:', randomWord);
          }
        } catch (eventError) {
          console.warn('⚠️ 查询事件失败:', eventError);
          randomWord = Math.floor(Math.random() * 1000000);
        }

        return {
          rarityRevealed: true,
          rarity: parseInt(beastInfo.rarity.toString()),
          randomWord
        };
      } else {
        return {
          rarityRevealed: false,
          rarity: 0
        };
      }

    } catch (error) {
      console.error(`❌ 查询尝试 ${i + 1} 失败:`, error);
      
      if (i === retries - 1) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }

  throw new Error('All retry attempts failed');
}
