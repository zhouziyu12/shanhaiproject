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

  const handleMintNFT = async () => {
    if (!address) {
      alert('请先连接钱包');
      return;
    }

    try {
      // 第一步：上传到IPFS
      setIsUploadingIPFS(true);
      console.log('🚀 第一步：上传到IPFS...');
      
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

      if (mintResult.success) {
        const completeResult = {
          ...mintResult,
          ipfs: ipfsData.ipfs,
          metadata: ipfsData.metadata,
          generationData: generationResult
        };

        console.log('🎉 NFT铸造完成!', completeResult);
        onMintSuccess?.(completeResult);
      } else {
        throw new Error(mintResult.error || '铸造失败');
      }

    } catch (error) {
      console.error('❌ 铸造流程失败:', error);
      alert(`铸造失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsUploadingIPFS(false);
    }
  };

  const isProcessing = isUploadingIPFS || isMinting;

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
              
              {/* 风格标签 */}
              <Badge className="absolute top-3 left-3 bg-gradient-to-r from-purple-500 to-pink-500">
                {generationResult.style}
              </Badge>

              {/* AI标识 */}
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

      {/* 铸造流程 */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <span className="text-xl">🔄</span>
            铸造流程
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 步骤1：IPFS上传 */}
            <div className={`p-4 rounded-lg border ${
              ipfsResult ? 'bg-green-500/10 border-green-500/30' : 
              isUploadingIPFS ? 'bg-blue-500/10 border-blue-500/30' : 
              'bg-white/5 border-white/20'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {ipfsResult ? (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                ) : isUploadingIPFS ? (
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">1</span>
                  </div>
                )}
                <span className="text-white font-medium">IPFS存储</span>
              </div>
              <div className="text-sm text-white/70">
                {ipfsResult ? '✅ 上传完成' : 
                 isUploadingIPFS ? '🔄 上传中...' : 
                 '等待上传图片和元数据'}
              </div>
            </div>

            {/* 步骤2：NFT铸造 */}
            <div className={`p-4 rounded-lg border ${
              mintResult?.success ? 'bg-green-500/10 border-green-500/30' : 
              isMinting ? 'bg-blue-500/10 border-blue-500/30' : 
              'bg-white/5 border-white/20'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {mintResult?.success ? (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                ) : isMinting ? (
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">2</span>
                  </div>
                )}
                <span className="text-white font-medium">NFT铸造</span>
              </div>
              <div className="text-sm text-white/70">
                {mintResult?.success ? '✅ 铸造完成' : 
                 isMinting ? '⛏️ 铸造中...' : 
                 '等待区块链确认'}
              </div>
            </div>

            {/* 步骤3：VRF稀有度 */}
            <div className="p-4 rounded-lg border bg-white/5 border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">3</span>
                </div>
                <span className="text-white font-medium">稀有度分配</span>
              </div>
              <div className="text-sm text-white/70">
                Chainlink VRF随机分配
              </div>
            </div>
          </div>

          {/* 铸造按钮 */}
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
                  {isUploadingIPFS ? '上传IPFS中...' : '铸造NFT中...'}
                </>
              ) : (
                <>
                  <span className="mr-2">⛏️</span>
                  确认铸造NFT
                </>
              )}
            </Button>
          </div>

          {/* 费用提示 */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="text-blue-400 text-sm font-medium mb-2">💰 费用说明</div>
            <div className="text-blue-300/80 text-sm space-y-1">
              <div>• IPFS存储：免费（NFT.Storage赞助）</div>
              <div>• 智能合约铸造：约 0.005-0.01 ETH（Gas费）</div>
              <div>• VRF稀有度分配：约 0.002 ETH（Chainlink费用）</div>
              <div className="pt-1 font-medium">总计约：0.01-0.02 ETH</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 结果显示 */}
      {mintResult && (
        <Card className={`${mintResult.success ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
          <CardContent className="p-6 text-center">
            {mintResult.success ? (
              <div className="space-y-4">
                <div className="text-6xl">🎉</div>
                <h3 className="text-2xl font-bold text-green-400">铸造成功！</h3>
                <div className="space-y-2">
                  <div className="text-green-300">
                    Token ID: #{mintResult.tokenId}
                  </div>
                  {mintResult.transactionHash && (
                    <div className="text-green-300/80 text-sm font-mono">
                      交易哈希: {mintResult.transactionHash.slice(0, 10)}...{mintResult.transactionHash.slice(-8)}
                    </div>
                  )}
                </div>
                <p className="text-green-300/80">
                  🎲 稀有度将在几分钟内由Chainlink VRF分配
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-6xl">❌</div>
                <h3 className="text-2xl font-bold text-red-400">铸造失败</h3>
                <p className="text-red-300">{mintResult.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
