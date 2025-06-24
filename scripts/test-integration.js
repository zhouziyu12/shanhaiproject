// 测试VRF监控集成脚本
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000/api';

async function testVRFIntegration() {
  console.log('🧪 开始测试VRF监控集成...');
  
  try {
    // 1. 测试VRF监控API
    console.log('📡 测试VRF监控API...');
    
    const monitorResponse = await fetch(`${API_BASE}/vrf-monitor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokenId: 999,
        vrfRequestId: 'test_vrf_123',
        action: 'start'
      })
    });
    
    const monitorData = await monitorResponse.json();
    console.log('📊 VRF监控API响应:', monitorData);
    
    // 2. 测试VRF请求API
    console.log('🔗 测试VRF请求API...');
    
    const vrfResponse = await fetch(`${API_BASE}/vrf-request?requestId=test_vrf_123`);
    const vrfData = await vrfResponse.json();
    console.log('📋 VRF请求API响应:', vrfData);
    
    // 3. 测试状态查询
    console.log('📈 测试状态查询...');
    
    const statusResponse = await fetch(`${API_BASE}/vrf-monitor`);
    const statusData = await statusResponse.json();
    console.log('📊 状态查询响应:', statusData);
    
    console.log('✅ VRF监控集成测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  testVRFIntegration();
}

export { testVRFIntegration };
