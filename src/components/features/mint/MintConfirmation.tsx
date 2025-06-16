'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/components/web3/ConnectWallet';
import { useContract } from '@/hooks/useContract';

interface MintConfirmationProps {
  generationResult: {
    imageUrl: string;
    originalInput: string;
    optimizedPrompt: string;
    style: string;
    source: string;
  };
  onMintSuccess?: (result: any) => void;
  onBack?: () => void;
}

export function MintConfirmation({ 
  generationResult, 
  onMintSuccess,
  onBack 
}: MintConfirmationProps) {
  const { address } = useWallet();
  const { mintNFT, isMinting, mintResult } = useContract();
  const [isUploadingIPFS, setIsUploadingIPFS] = useState(false);
  const [ipfsResult, setIpfsResult] = useState<any>(null);
  const [isRequestingVRF, setIsRequestingVRF] = useState(false);
  const [vrfRequestId, setVrfRequestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMintNFT = async () => {
    if (!address) {
      alert('请先连接钱包');
      return;
    }

    setError(null);

    try {
      // 第一步：上传到IPFS
      setIsUploadingIPFS(true);
      console.log('🚀 第一步：上传到Pinata IPFS...');
      
      const ipfsResponse = await fetch('/api/upload-ipfs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: generationResult.imageUrl,
          originalInput: generationResult.originalInput,
          optimizedPrompt: generationResult.optimizedPrompt,
          style: generationResult.style,
          creator: address
        }),
      });

      // 检查响应是否为JSON
      const contentType = ipfsResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await ipfsResponse.text();
        console.error('❌ API返回非JSON响应:', responseText.substring(0, 200));
        throw new Error('服务器返回了错误的响应格式，请检查API状态');
      }

      const ipfsData = await ipfsResponse.json();
      
      if (!ipfsData.success) {
        throw new Error(ipfsData.error || 'IPFS上传失败');
      }

      setIpfsResult(ipfsData);
      setIsUploadingIPFS(false);

      console.log('✅ IPFS上传完成:', ipfsData.ipfs);

      // 第二步：铸造NFT
      console.log('⛏️ 第二步：铸造NFT...');
      const mintResult = await mintNFT(address, ipfsData.mintInfo.tokenURI);

      if (!mintResult.success) {
        throw new Error(mintResult.error || '铸造失败');
      }

      console.log('✅ NFT铸造完成, Token ID:', mintResult.tokenId);

      // 第三步：请求VRF稀有度分配
      console.log('🎲 第三步：请求Chainlink VRF稀有度分配...');
      setIsRequestingVRF(true);

      const vrfResponse = await fetch('/api/vrf-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: mintResult.tokenId,
          requester: address
        }),
      });

      // 检查VRF响应是否为JSON
      const vrfContentType = vrfResponse.headers.get('content-type');
      if (!vrfContentType || !vrfContentType.includes('application/json')) {
        const vrfResponseText = await vrfResponse.text();
        console.error('❌ VRF API返回非JSON响应:', vrfResponseText.substring(0, 200));
        throw new Error('VRF服务返回了错误的响应格式');
      }

      const vrfData = await vrfResponse.json();
      
      if (!vrfData.success) {
        throw new Error(vrfData.error || 'VRF请求失败');
      }

      setVrfRequestId(vrfData.vrfRequestId);
      setIsRequestingVRF(false);

      console.log('✅ VRF请求完成, Request ID:', vrfData.vrfRequestId);

      // 返回完整结果
      const completeResult = {
        ...mintResult,
        ipfs: ipfsData.ipfs,
        metadata: ipfsData.metadata,
        generationData: generationResult,
        vrfRequestId: vrfData.vrfRequestId,
        estimatedRevealTime: vrfData.estimatedRevealTime
      };

      console.log('🎉 完整的NFT铸造流程完成!', completeResult);
      onMintSuccess?.(completeResult);

    } catch (error) {
      console.error('❌ 铸造流程失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setError(errorMessage);
      alert(`铸造失败: ${errorMessage}`);
    } finally {
      setIsUploadingIPFS(false);
      setIsRequestingVRF(false);
    }
  };

  const isProcessing = isUploadingIPFS || isMinting || isRequestingVRF;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* 标题 */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
          <span className="text-2xl">⛏️</span>
          确认铸造NFT
        </h1>
        <p className="text-white/70">将您的AI神兽铸造为永久的区块链NFT</p>
      </div>

      {/* 错误显示 */}
      {error && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-4">
            <div className="text-red-400 text-sm">
              ❌ {error}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 预览区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 图片预览 */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-xl">🖼️</span>
              神兽预览
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-square relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <img
                src={generationResult.imageUrl}
                alt="AI生成的神兽"
                className="w-full h-full object-cover"
              />
              
              <Badge className="absolute top-3 left-3 bg-gradient-to-r from-purple-500 to-pink-500">
                {generationResult.style}
              </Badge>

              <Badge className="absolute top-3 right-3 bg-blue-500/20 text-blue-400 border-blue-500/30">
                AI生成
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* 铸造信息 */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-xl">📋</span>
              铸造信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="text-sm text-white/60 mb-1">原始描述</div>
                <div className="text-white text-sm bg-white/5 p-3 rounded">
                  {generationResult.originalInput}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-white/60 mb-1">AI优化后</div>
                <div className="text-white text-sm bg-white/5 p-3 rounded">
                  {generationResult.optimizedPrompt}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-white/60">艺术风格</div>
                  <div className="text-white font-medium">{generationResult.style}</div>
                </div>
                <div>
                  <div className="text-white/60">创建者</div>
                  <div className="text-white font-mono text-xs">
                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '未连接'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 铸造流程和按钮 */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex gap-4">
            {onBack && (
              <Button
                onClick={onBack}
                variant="outline"
                disabled={isProcessing}
                className="flex-1"
              >
                返回修改
              </Button>
            )}
            
            <Button
              onClick={handleMintNFT}
              disabled={isProcessing || !address}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  {isUploadingIPFS ? '上传IPFS中...' : 
                   isMinting ? '铸造NFT中...' : 
                   '请求VRF中...'}
                </>
              ) : (
                <>
                  <span className="mr-2">⛏️</span>
                  确认铸造NFT
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 调试信息 */}
      <details className="bg-white/5 border border-white/10 rounded-lg p-4">
        <summary className="text-white/70 cursor-pointer">🔧 调试信息</summary>
        <div className="mt-2 text-xs text-white/60 space-y-1">
          <div>图片URL: {generationResult.imageUrl}</div>
          <div>钱包地址: {address || '未连接'}</div>
          <div>API状态: 检查控制台日志</div>
        </div>
      </details>
    </div>
  );
}
