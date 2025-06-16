import { NextRequest, NextResponse } from 'next/server';

interface VRFRequestBody {
  tokenId: number;
  requester: string;
}

// 简化的内存存储
const vrfRequests = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    console.log('🎲 VRF API接收到请求...');
    
    const body = await request.json();
    const { tokenId, requester }: VRFRequestBody = body;

    if (!tokenId || !requester) {
      console.error('❌ 缺少必要参数');
      return NextResponse.json({ 
        success: false,
        error: '缺少tokenId或requester参数' 
      }, { status: 400 });
    }

    console.log('🆔 Token ID:', tokenId);
    console.log('👤 请求者:', requester);

    // 生成VRF请求ID
    const vrfRequestId = `vrf_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    const vrfRequest = {
      requestId: vrfRequestId,
      tokenId,
      requester,
      timestamp: Date.now(),
      status: 'pending'
    };

    // 存储请求
    vrfRequests.set(vrfRequestId, vrfRequest);

    console.log('📡 VRF请求已创建, Request ID:', vrfRequestId);

    // 8秒后模拟VRF响应
    setTimeout(() => {
      fulfillVRFRequest(vrfRequestId);
    }, 8000);

    return NextResponse.json({
      success: true,
      vrfRequestId,
      tokenId,
      status: 'pending',
      estimatedRevealTime: Date.now() + 8000,
      message: '🎲 VRF随机数请求已发送，请等待Chainlink节点响应...'
    });

  } catch (error) {
    console.error('❌ VRF请求失败:', error);
    return NextResponse.json({
      success: false,
      error: 'VRF请求失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json({ 
        success: false,
        error: '缺少requestId参数' 
      }, { status: 400 });
    }

    const vrfRequest = vrfRequests.get(requestId);
    
    if (!vrfRequest) {
      return NextResponse.json({ 
        success: false,
        error: 'VRF请求不存在',
        requestId 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      ...vrfRequest
    });

  } catch (error) {
    console.error('❌ 获取VRF状态失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取VRF状态失败'
    }, { status: 500 });
  }
}

// 模拟VRF履行
function fulfillVRFRequest(requestId: string) {
  try {
    const vrfRequest = vrfRequests.get(requestId);
    if (!vrfRequest) {
      console.error('VRF请求不存在:', requestId);
      return;
    }

    // 生成随机数 (0-9999)
    const randomWord = Math.floor(Math.random() * 10000);
    
    // 计算稀有度
    let rarity = 0; // 默认普通
    if (randomWord < 6000) rarity = 0; // 普通 60%
    else if (randomWord < 8500) rarity = 1; // 稀有 25% 
    else if (randomWord < 9500) rarity = 2; // 史诗 10%
    else if (randomWord < 9900) rarity = 3; // 传说 4%
    else rarity = 4; // 神话 1%

    const rarityNames = ['普通', '稀有', '史诗', '传说', '神话'];

    // 更新请求状态
    const fulfilledRequest = {
      ...vrfRequest,
      status: 'fulfilled',
      randomWord,
      rarity,
      fulfilledAt: Date.now()
    };

    vrfRequests.set(requestId, fulfilledRequest);

    console.log('🎉 VRF请求已履行!');
    console.log('🎲 随机数:', randomWord);
    console.log('⭐ 稀有度:', rarity, `(${rarityNames[rarity]})`);

  } catch (error) {
    console.error('❌ VRF履行失败:', error);
    
    const vrfRequest = vrfRequests.get(requestId);
    if (vrfRequest) {
      vrfRequests.set(requestId, {
        ...vrfRequest,
        status: 'failed',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }
}
