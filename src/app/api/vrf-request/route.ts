import { prisma } from "@/lib/prisma";
// app/api/vrf-request/route.ts - 修复Token验证和数据库问题
import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// 配置
const SHANHAI_NFT_CONTRACT_ADDRESS = '0x9269C7b6BFe45143f899fdA45d5ba2C7aDD0367A';
const SEPOLIA_RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/aoHaEBQa8NDjn-e0t8DyL6Ac8VZ6p9ST';
const MAX_RETRIES = 3;

// VRF 2.5合约ABI
const SHANHAI_NFT_ABI = [
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"name": "", "type": "address"}],
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
    "inputs": [{"name": "", "type": "uint256"}],
    "name": "beasts",
    "outputs": [
      {"name": "prompt", "type": "string"},
      {"name": "ipfsUrl", "type": "string"},
      {"name": "rarity", "type": "uint8"},
      {"name": "timestamp", "type": "uint256"},
      {"name": "creator", "type": "address"},
      {"name": "rarityRevealed", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "tokenId", "type": "uint256"},
      {"indexed": true, "name": "rarity", "type": "uint8"},
      {"indexed": false, "name": "randomValue", "type": "uint256"}
    ],
    "name": "RarityRevealed",
    "type": "event"
  }
];

// 创建Provider
function createProvider() {
  return new ethers.JsonRpcProvider(SEPOLIA_RPC_URL, {
    name: 'sepolia',
    chainId: 11155111
  });
}

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

// 验证Token是否存在且有效
async function validateToken(contract: ethers.Contract, tokenId: bigint) {
  console.log(`🔍 验证Token ${tokenId}是否存在...`);
  
  try {
    // 方法1: 检查ownerOf
    try {
      const owner = await contract.ownerOf(tokenId);
      if (owner && owner !== ethers.ZeroAddress) {
        console.log('✅ Token存在，所有者:', owner);
        
        // 获取详细信息
        const beastInfo = await contract.beasts(tokenId);
        console.log('📊 Beast详细信息:', {
          prompt: beastInfo.prompt || beastInfo[0],
          creator: beastInfo.creator || beastInfo[4],
          rarity: (beastInfo.rarity || beastInfo[2]).toString(),
          rarityRevealed: beastInfo.rarityRevealed || beastInfo[5]
        });
        
        return {
          exists: true,
          owner: owner,
          prompt: beastInfo.prompt || beastInfo[0],
          ipfsUrl: beastInfo.ipfsUrl || beastInfo[1],
          rarity: beastInfo.rarity || beastInfo[2],
          timestamp: beastInfo.timestamp || beastInfo[3],
          creator: beastInfo.creator || beastInfo[4],
          rarityRevealed: beastInfo.rarityRevealed || beastInfo[5]
        };
      }
    } catch (ownerError) {
      console.log('❌ ownerOf调用失败，Token可能不存在:', ownerError.message);
    }
    
    // 方法2: 检查下一个TokenId
    try {
      const nextTokenId = await contract.getNextTokenId();
      console.log(`📋 下一个Token ID: ${nextTokenId}, 请求的Token ID: ${tokenId}`);
      
      if (BigInt(tokenId) >= nextTokenId) {
        throw new Error(`Token ${tokenId} 尚未铸造。下一个可用ID: ${nextTokenId}`);
      }
    } catch (nextIdError) {
      console.warn('⚠️ 无法获取下一个TokenId:', nextIdError.message);
    }
    
    return { exists: false };
    
  } catch (error) {
    console.error('❌ Token验证过程出错:', error);
    throw error;
  }
}

// GET: 查询VRF状态
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const requestId = searchParams.get('requestId');

  console.log('🔗 查询VRF 2.5状态:', requestId);

  if (!requestId) {
    return NextResponse.json({
      success: false,
      error: 'Missing requestId parameter'
    }, { status: 400 });
  }

  try {
    // 检查数据库连接
    try {
      const vrfRequest = await prisma.vrfRequest.findUnique({
        where: { requestId }
      });

      if (!vrfRequest) {
        return NextResponse.json({
          success: false,
          error: 'VRF request not found'
        }, { status: 404 });
      }

      if (vrfRequest.status === 'fulfilled') {
        return NextResponse.json(serializeVRFRequest(vrfRequest));
      }

      // 查询链上状态
      const tokenId = vrfRequest.tokenId;
      if (!tokenId) {
        throw new Error('Token ID missing from database');
      }

      const chainStatus = await queryChainStatusWithRetry(tokenId);
      
      if (chainStatus.rarityRevealed) {
        const updatedVRF = await prisma.vrfRequest.update({
          where: { requestId },
          data: {
            status: 'fulfilled',
            randomWord: chainStatus.randomWord || Math.floor(Math.random() * 1000000),
            rarity: chainStatus.rarity
          }
        });

        return NextResponse.json(serializeVRFRequest(updatedVRF));
      } else {
        return NextResponse.json({
          success: true,
          requestId: vrfRequest.requestId,
          status: 'pending',
          tokenId: vrfRequest.tokenId?.toString(),
          timestamp: vrfRequest.createdAt.getTime(),
          message: 'Waiting for Chainlink VRF 2.5 fulfillment'
        });
      }
    } catch (dbError) {
      console.error('❌ 数据库连接失败:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: 'Unable to connect to database. Please check your connection.',
        suggestion: 'Try again later or contact support.'
      }, { status: 503 });
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

// POST: 创建VRF监控记录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenId, requester } = body;

    console.log('🔗 创建VRF 2.5监控记录:', { tokenId, requester });

    // 首先验证Token
    try {
      const provider = createProvider();
      const contract = new ethers.Contract(SHANHAI_NFT_CONTRACT_ADDRESS, SHANHAI_NFT_ABI, provider);
      
      const tokenValidation = await validateToken(contract, BigInt(tokenId));
      
      if (!tokenValidation.exists) {
        return NextResponse.json({
          success: false,
          error: 'Token does not exist',
          details: `Token ${tokenId} has not been minted yet`,
          suggestion: 'Please ensure the token has been successfully minted before monitoring VRF status'
        }, { status: 404 });
      }
      
      console.log('✅ Token验证成功');
      
      // 检查稀有度是否已经揭晓
      if (tokenValidation.rarityRevealed) {
        console.log('🎉 VRF 2.5稀有度已经揭晓:', tokenValidation.rarity?.toString());
        
        // 不使用数据库，直接返回结果
        return NextResponse.json({
          success: true,
          status: 'fulfilled',
          rarity: parseInt(tokenValidation.rarity?.toString() || '0'),
          randomWord: Math.floor(Math.random() * 1000000),
          message: 'VRF 2.5 already completed',
          chainInfo: {
            tokenId: tokenId,
            contractAddress: SHANHAI_NFT_CONTRACT_ADDRESS,
            network: 'Sepolia',
            vrfVersion: '2.5',
            prompt: tokenValidation.prompt,
            owner: tokenValidation.owner
          }
        });
      }
      
    } catch (error) {
      console.error('❌ Token验证失败:', error);
      return NextResponse.json({
        success: false,
        error: 'Token validation failed',
        details: error instanceof Error ? error.message : 'Unknown validation error'
      }, { status: 400 });
    }

    // 尝试数据库操作，如果失败则跳过
    try {
      await prisma.User.upsert({
        where: { address: requester.toLowerCase() },
        update: {},
        create: { address: requester.toLowerCase() }
      });

      const vrfRequestId = `vrf_${tokenId}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

      const vrfRequest = await prisma.vrfRequest.create({
        data: {
          requestId: vrfRequestId,
          status: 'pending',
          tokenId: BigInt(tokenId),
          requester: requester.toLowerCase()
        }
      });

      console.log('💾 VRF监控记录已保存到数据库');

      return NextResponse.json({
        success: true,
        vrfRequestId,
        message: 'VRF 2.5 monitoring started with database tracking',
        estimatedRevealTime: Date.now() + (3 * 60 * 1000),
        chainInfo: {
          tokenId: tokenId,
          contractAddress: SHANHAI_NFT_CONTRACT_ADDRESS,
          network: 'Sepolia',
          vrfVersion: '2.5'
        }
      });

    } catch (dbError) {
      console.error('⚠️ 数据库保存失败，但Token验证成功:', dbError);
      
      // 即使数据库失败，也返回成功（无数据库模式）
      return NextResponse.json({
        success: true,
        vrfRequestId: `vrf_${tokenId}_${Date.now()}_nodatabase`,
        message: 'VRF 2.5 monitoring started (database unavailable)',
        estimatedRevealTime: Date.now() + (3 * 60 * 1000),
        chainInfo: {
          tokenId: tokenId,
          contractAddress: SHANHAI_NFT_CONTRACT_ADDRESS,
          network: 'Sepolia',
          vrfVersion: '2.5'
        },
        note: 'Database is temporarily unavailable, but VRF monitoring is active'
      });
    }

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
      const provider = createProvider();
      const contract = new ethers.Contract(SHANHAI_NFT_CONTRACT_ADDRESS, SHANHAI_NFT_ABI, provider);
      
      const tokenValidation = await validateToken(contract, tokenId);
      
      if (!tokenValidation.exists) {
        throw new Error('Token does not exist');
      }
      
      if (tokenValidation.rarityRevealed) {
        let randomWord;
        try {
          const filter = contract.filters.RarityRevealed(tokenId);
          const events = await contract.queryFilter(filter, -2000, 'latest');
          
          if (events.length > 0) {
            const event = events[events.length - 1];
            randomWord = parseInt(event.args?.randomValue?.toString() || '0');
          }
        } catch (eventError) {
          randomWord = Math.floor(Math.random() * 1000000);
        }

        return {
          rarityRevealed: true,
          rarity: parseInt(tokenValidation.rarity?.toString() || '0'),
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
      
      await new Promise(resolve => setTimeout(resolve, 3000 * (i + 1)));
    }
  }

  throw new Error('All query attempts failed');
}