import { NextRequest, NextResponse } from 'next/server';
import { createVRFMonitor } from '@/lib/vrf-monitor';

export async function POST(request: NextRequest) {
  try {
    const { tokenId, vrfRequestId, action } = await request.json();
    
    if (!tokenId || !vrfRequestId) {
      return NextResponse.json({
        success: false,
        error: 'Missing tokenId or vrfRequestId'
      }, { status: 400 });
    }

    const monitor = createVRFMonitor();
    
    switch (action) {
      case 'start':
        console.log(`🔍 API: 启动VRF监控 - Token ${tokenId}`);
        
        const result = await monitor.startMonitoring(tokenId, vrfRequestId);
        
        return NextResponse.json({
          success: true,
          data: result
        });
        
      case 'status':
        const status = monitor.getActiveMonitors();
        
        return NextResponse.json({
          success: true,
          data: status
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ VRF监控API错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const monitor = createVRFMonitor();
    const status = monitor.getActiveMonitors();
    
    return NextResponse.json({
      success: true,
      data: status,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('❌ 获取VRF监控状态失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
