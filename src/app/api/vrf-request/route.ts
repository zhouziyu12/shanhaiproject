import { NextRequest, NextResponse } from 'next/server';

// 模拟的VRF请求存储
const vrfRequests = new Map();

// 初始化您的VRF请求数据
vrfRequests.set('vrf_1750060711093_wti2xk8ura', {
  requestId: 'vrf_1750060711093_wti2xk8ura',
  status: 'fulfilled',
  randomWord: 4561,
  rarity: 0,
  timestamp: Date.now()
});

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

  // 查找VRF请求
  const vrfData = vrfRequests.get(requestId);
  
  if (!vrfData) {
    console.log('❌ VRF请求未找到:', requestId);
    return NextResponse.json({
      success: false,
      error: 'VRF request not found'
    }, { status: 404 });
  }

  console.log('✅ VRF请求找到:', vrfData);

  return NextResponse.json({
    success: true,
    requestId: vrfData.requestId,
    status: vrfData.status,
    randomWord: vrfData.randomWord,
    rarity: vrfData.rarity,
    timestamp: vrfData.timestamp
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenId, requester } = body;

    console.log('🎲 创建VRF请求:', { tokenId, requester });

    // 生成新的VRF请求ID
    const vrfRequestId = `vrf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 模拟VRF处理（5秒后自动完成）
    setTimeout(() => {
      const randomWord = Math.floor(Math.random() * 10000);
      let rarity = 0; // 默认普通
      
      // 简单的稀有度分配逻辑
      if (randomWord < 500) rarity = 4; // 5% 神话
      else if (randomWord < 1500) rarity = 3; // 10% 传说
      else if (randomWord < 3500) rarity = 2; // 20% 史诗
      else if (randomWord < 6500) rarity = 1; // 30% 稀有
      // 其余35%为普通
      
      vrfRequests.set(vrfRequestId, {
        requestId: vrfRequestId,
        status: 'fulfilled',
        randomWord,
        rarity,
        timestamp: Date.now()
      });

      console.log('🎉 VRF请求已履行!');
      console.log('🎲 随机数:', randomWord);
      console.log('⭐ 稀有度:', rarity, ['普通', '稀有', '史诗', '传说', '神话'][rarity]);
    }, 5000);

    // 立即保存pending状态
    vrfRequests.set(vrfRequestId, {
      requestId: vrfRequestId,
      status: 'pending',
      randomWord: null,
      rarity: null,
      timestamp: Date.now()
    });

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
