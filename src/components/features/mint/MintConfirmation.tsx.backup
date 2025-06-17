'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/components/web3/ConnectWallet';
import { useContract } from '@/hooks/useContract';
import { MintDiscount } from '@/components/features/token/MintDiscount';

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
  const [appliedDiscountPercent, setAppliedDiscountPercent] = useState(0);

  const handleMintNFT = async () => {
    if (!address) {
      alert('请先连接钱包');
      return;
    }

    setError(null);

    try {
      console.log('🚀 开始完整的NFT铸造流程...');
      console.log('📊 生成数据:', generationResult);
      console.log('💰 应用折扣:', appliedDiscountPercent, '%');

      // 第一步：上传到IPFS
      setIsUploadingIPFS(true);
      console.log('📦 第一步：上传到Pinata IPFS...');
      
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

      // 关键：构建完整的mintData，确保图鉴能正确接收
      const completeMintData = {
        originalInput: generationResult.originalInput,
        optimizedPrompt: generationResult.optimizedPrompt,
        style: generationResult.style,
        creator: address,
        imageUrl: generationResult.imageUrl,
        ipfsImageUrl: ipfsData.ipfs.imageUrl,
        ipfsMetadataUrl: ipfsData.ipfs.metadataUrl,
        gatewayImageUrl: ipfsData.ipfs.imageGatewayUrl || ipfsData.ipfs.imageUrl
      };

      console.log('📋 完整的mintData构建完成:', completeMintData);

      // 返回完整结果，包含所有图鉴需要的数据
      const completeResult = {
        ...mintResult,
        ipfs: ipfsData.ipfs,
        metadata: ipfsData.metadata,
        generationData: generationResult,
        vrfRequestId: vrfData.vrfRequestId,
        estimatedRevealTime: vrfData.estimatedRevealTime,
        appliedDiscountPercent,
        // 最重要：完整的mintData
        mintData: completeMintData
      };

      console.log('🎉 完整的NFT铸造流程完成!', completeResult);
      
      // 立即触发成功回调
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

      {/* SHT代币折扣卡片 */}
      <MintDiscount
        onDiscountApplied={(discountPercent, shtUsed) => {
          setAppliedDiscountPercent(discountPercent);
          console.log('💰 折扣已应用:', discountPercent, '%，使用SHT:', shtUsed);
        }}
        disabled={isProcessing}
      />

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

              {/* 折扣标识 */}
              {appliedDiscountPercent > 0 && (
                <Badge className="absolute bottom-3 left-3 bg-green-500/20 text-green-400 border-green-500/30">
                  💰 {appliedDiscountPercent}% 折扣
                </Badge>
              )}
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

              {/* 费用信息 */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <div className="text-blue-400 text-sm font-medium mb-2">💰 铸造费用</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/70">基础费用:</span>
                    <span className="text-white">0.001 ETH</span>
                  </div>
                  {appliedDiscountPercent > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-green-400">SHT折扣:</span>
                        <span className="text-green-400">-{appliedDiscountPercent}%</span>
                      </div>
                      <div className="flex justify-between border-t border-white/10 pt-1">
                        <span className="text-white font-medium">实际费用:</span>
                        <span className="text-green-400 font-medium">
                          {(0.001 * (100 - appliedDiscountPercent) / 100).toFixed(6)} ETH
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 铸造流程和按钮 */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardContent className="p-6">
          {/* 处理步骤显示 */}
          {isProcessing && (
            <div className="mb-6 space-y-4">
              <div className="text-center">
                <h3 className="text-white font-medium mb-4">铸造进度</h3>
              </div>
              
              <div className="space-y-3">
                {/* 步骤1: IPFS上传 */}
                <div className={`flex items-center gap-3 p-3 rounded-lg ${
                  isUploadingIPFS ? 'bg-blue-500/20 border border-blue-500/30' :
                  ipfsResult ? 'bg-green-500/20 border border-green-500/30' :
                  'bg-white/5 border border-white/20'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isUploadingIPFS ? 'bg-blue-500' :
                    ipfsResult ? 'bg-green-500' :
                    'bg-white/20'
                  }`}>
                    {isUploadingIPFS ? (
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : ipfsResult ? (
                      <span className="text-white text-xs">✓</span>
                    ) : (
                      <span className="text-white text-xs">1</span>
                    )}
                  </div>
                  <span className="text-white">上传到IPFS</span>
                  {isUploadingIPFS && <span className="text-blue-400 text-sm">进行中...</span>}
                  {ipfsResult && <span className="text-green-400 text-sm">完成</span>}
                </div>

                {/* 步骤2: NFT铸造 */}
                <div className={`flex items-center gap-3 p-3 rounded-lg ${
                  isMinting ? 'bg-blue-500/20 border border-blue-500/30' :
                  mintResult ? 'bg-green-500/20 border border-green-500/30' :
                  'bg-white/5 border border-white/20'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isMinting ? 'bg-blue-500' :
                    mintResult ? 'bg-green-500' :
                    'bg-white/20'
                  }`}>
                    {isMinting ? (
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : mintResult ? (
                      <span className="text-white text-xs">✓</span>
                    ) : (
                      <span className="text-white text-xs">2</span>
                    )}
                  </div>
                  <span className="text-white">铸造NFT</span>
                  {isMinting && <span className="text-blue-400 text-sm">进行中...</span>}
                  {mintResult && <span className="text-green-400 text-sm">完成 #{mintResult.tokenId}</span>}
                </div>

                {/* 步骤3: VRF请求 */}
                <div className={`flex items-center gap-3 p-3 rounded-lg ${
                  isRequestingVRF ? 'bg-blue-500/20 border border-blue-500/30' :
                  vrfRequestId ? 'bg-green-500/20 border border-green-500/30' :
                  'bg-white/5 border border-white/20'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isRequestingVRF ? 'bg-blue-500' :
                    vrfRequestId ? 'bg-green-500' :
                    'bg-white/20'
                  }`}>
                    {isRequestingVRF ? (
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : vrfRequestId ? (
                      <span className="text-white text-xs">✓</span>
                    ) : (
                      <span className="text-white text-xs">3</span>
                    )}
                  </div>
                  <span className="text-white">请求VRF</span>
                  {isRequestingVRF && <span className="text-blue-400 text-sm">进行中...</span>}
                  {vrfRequestId && <span className="text-green-400 text-sm">完成</span>}
                </div>
              </div>
            </div>
          )}

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
                  {isUploadingIPFS ? 'IPFS上传中...' : 
                   isMinting ? 'NFT铸造中...' : 
                   '请求VRF中...'}
                </>
              ) : (
                <>
                  <span className="mr-2">⛏️</span>
                  确认铸造NFT
                  {appliedDiscountPercent > 0 && (
                    <span className="ml-2 text-green-300">
                      (省{appliedDiscountPercent}%)
                    </span>
                  )}
                </>
              )}
            </Button>
          </div>

          {/* 成功提示 */}
          {mintResult && mintResult.success && (
            <div className="mt-4 bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
              <div className="text-green-400 font-medium mb-2">🎉 铸造成功！</div>
              <div className="text-green-300/80 text-sm space-y-1">
                <div>Token ID: #{mintResult.tokenId}</div>
                <div>正在进行稀有度分配，即将自动添加到图鉴...</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}