import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const requestId = searchParams.get('requestId');

  console.log('🎲 VRF API 查询:', requestId);

  if (!requestId) {
    return NextResponse.json({
      success: false,
      error: 'Missing requestId parameter'
    }, { status: 400 });
  }

  try {
    const vrfRequest = await prisma.vRFRequest.findUnique({
      where: { requestId: requestId }
    });

    if (!vrfRequest) {
      console.log('❌ VRF请求未找到:', requestId);
      
      const allRequests = await prisma.vRFRequest.findMany({
        select: { requestId: true, status: true },
        take: 10
      });
      
      console.log('📋 数据库中的VRF请求:', allRequests);
      
      return NextResponse.json({
        success: false,
        error: 'VRF request not found',
        debug: {
          requestedId: requestId,
          availableRequests: allRequests
        }
      }, { status: 404 });
    }

    console.log('✅ VRF请求找到:', vrfRequest);

    // 处理BigInt序列化
    const serializedVRF = {
      ...vrfRequest,
      tokenId: vrfRequest.tokenId ? vrfRequest.tokenId.toString() : null
    };

    return NextResponse.json({
      success: true,
      requestId: serializedVRF.requestId,
      status: serializedVRF.status,
      randomWord: serializedVRF.randomWord,
      rarity: serializedVRF.rarity,
      tokenId: serializedVRF.tokenId,
      timestamp: serializedVRF.createdAt.getTime()
    });

  } catch (error) {
    console.error('❌ 数据库查询VRF请求失败:', error);
    return NextResponse.json({
      success: false,
      error: 'Database error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenId, requester } = body;

    console.log('🎲 创建VRF请求:', { tokenId, requester });

    // 确保用户存在
    await prisma.user.upsert({
      where: { address: requester.toLowerCase() },
      update: {},
      create: { address: requester.toLowerCase() }
    });

    const vrfRequestId = `vrf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('🆕 生成VRF请求ID:', vrfRequestId);

    // 处理BigInt
    const tokenIdBigInt = BigInt(tokenId);

    const vrfRequest = await prisma.vRFRequest.create({
      data: {
        requestId: vrfRequestId,
        status: 'pending',
        tokenId: tokenIdBigInt,
        requester: requester.toLowerCase()
      }
    });

    console.log('💾 VRF请求已保存到数据库 (pending状态)');

    // 5秒后自动完成VRF
    setTimeout(async () => {
      try {
        const randomWord = Math.floor(Math.random() * 10000);
        let rarity = 0;
        
        if (randomWord < 500) rarity = 4;
        else if (randomWord < 1500) rarity = 3;
        else if (randomWord < 3500) rarity = 2;
        else if (randomWord < 6500) rarity = 1;
        
        await prisma.vRFRequest.update({
          where: { requestId: vrfRequestId },
          data: {
            status: 'fulfilled',
            randomWord: randomWord,
            rarity: rarity
          }
        });

        console.log('🎉 VRF请求已履行并更新到数据库!');
        console.log('🎲 随机数:', randomWord);
        console.log('⭐ 稀有度:', rarity, ['普通', '稀有', '史诗', '传说', '神话'][rarity]);

      } catch (error) {
        console.error('❌ 更新VRF状态失败:', error);
      }
    }, 5000);

    return NextResponse.json({
      success: true,
      vrfRequestId,
      estimatedRevealTime: Date.now() + 5000
    });

  } catch (error) {
    console.error('❌ VRF请求创建失败:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create VRF request'
    }, { status: 500 });
  }
}
