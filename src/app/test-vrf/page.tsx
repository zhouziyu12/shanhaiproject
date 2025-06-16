'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNFTData } from '@/hooks/useNFTData';
import { useWallet } from '@/components/web3/ConnectWallet';

export default function TestVRFPage() {
  const { address } = useWallet();
  const { addNFT, debugInfo } = useNFTData();
  const [vrfRequestId, setVrfRequestId] = useState('vrf_1750060711093_wti2xk8ura');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTestVRF = async () => {
    if (!address) {
      alert('请先连接钱包');
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      console.log('🧪 开始测试VRF处理...', vrfRequestId);
      
      // 1. 查询VRF状态
      const response = await fetch(`/api/vrf-request?requestId=${vrfRequestId}`);
      const vrfData = await response.json();
      
      console.log('📊 VRF响应数据:', vrfData);
      
      if (vrfData.success && vrfData.status === 'fulfilled') {
        // 2. 模拟mintData（因为我们没有真实的铸造数据）
        const mockMintData = {
          tokenId: 12345, // 使用一个测试Token ID
          originalInput: '测试神兽描述 - 来自VRF',
          optimizedPrompt: '这是一个通过VRF测试创建的神兽，用于验证稀有度分配功能正常工作...',
          style: 'modern',
          creator: address,
          imageUrl: 'https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=VRF+Test+Beast',
          ipfsImageUrl: 'https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=VRF+Test+Beast',
          ipfsMetadataUrl: 'ipfs://test-metadata-vrf',
          gatewayImageUrl: 'https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=VRF+Test+Beast',
          rarity: vrfData.rarity,
          vrfRequestId: vrfRequestId
        };

        console.log('🎨 模拟mintData:', mockMintData);

        // 3. 调用addNFT
        const success = await addNFT(mockMintData);
        
        setResult(success ? '✅ 成功添加到图鉴!' : '❌ 添加失败');
        
      } else {
        setResult(`❌ VRF状态: ${vrfData.status || '未知'}`);
      }

    } catch (error) {
      console.error('❌ 测试VRF失败:', error);
      setResult(`❌ 错误: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDirectAdd = async () => {
    if (!address) {
      alert('请先连接钱包');
      return;
    }

    const testNFT = {
      tokenId: Date.now(),
      originalInput: '直接添加测试神兽',
      optimizedPrompt: '这是一个直接添加的测试神兽，用于验证addNFT函数工作正常...',
      style: 'fantasy',
      creator: address,
      imageUrl: 'https://via.placeholder.com/400x400/4ECDC4/FFFFFF?text=Direct+Add+Beast',
      ipfsImageUrl: 'https://via.placeholder.com/400x400/4ECDC4/FFFFFF?text=Direct+Add+Beast',
      ipfsMetadataUrl: 'ipfs://test-metadata-direct',
      gatewayImageUrl: 'https://via.placeholder.com/400x400/4ECDC4/FFFFFF?text=Direct+Add+Beast',
      rarity: 2,
      vrfRequestId: 'direct-add-' + Date.now()
    };

    console.log('🎯 直接添加NFT:', testNFT);
    const success = await addNFT(testNFT);
    setResult(success ? '✅ 直接添加成功!' : '❌ 直接添加失败');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">🧪 VRF测试页面</h1>
          <p className="text-white/70">测试VRF处理和NFT添加功能</p>
        </div>

        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">🎲 VRF测试</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm mb-2">VRF Request ID:</label>
              <input
                type="text"
                value={vrfRequestId}
                onChange={(e) => setVrfRequestId(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                placeholder="输入VRF Request ID"
              />
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleTestVRF}
                disabled={isProcessing}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
              >
                {isProcessing ? '处理中...' : '🎲 测试VRF处理'}
              </Button>
              
              <Button
                onClick={handleDirectAdd}
                disabled={isProcessing}
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                🎯 直接添加NFT
              </Button>
            </div>

            {result && (
              <div className="bg-black/20 border border-white/20 rounded-lg p-4">
                <div className="text-white font-medium">结果:</div>
                <div className="text-white/80 text-sm">{result}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">🐛 调试工具</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button
                onClick={debugInfo}
                variant="outline"
                className="flex-1"
              >
                🐛 输出调试信息
              </Button>
              
              <Button
                onClick={() => window.open('/gallery', '_blank')}
                variant="outline"
                className="flex-1"
              >
                📚 查看图鉴
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <h3 className="text-yellow-400 font-bold mb-2">📝 使用说明</h3>
          <div className="text-yellow-300/80 text-sm space-y-1">
            <div>1. 使用您日志中的VRF Request ID进行测试</div>
            <div>2. 点击"测试VRF处理"会查询VRF状态并尝试添加NFT</div>
            <div>3. 点击"直接添加NFT"会跳过VRF直接添加一个测试NFT</div>
            <div>4. 查看控制台输出获取详细信息</div>
          </div>
        </div>
      </div>
    </div>
  );
}
