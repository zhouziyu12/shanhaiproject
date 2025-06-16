'use client';

import { useState } from 'react';
import { AICreationWorkshop } from './AICreationWorkshop';
import { MintConfirmation } from './MintConfirmation';
import { RarityReveal } from './RarityReveal';
import { useWallet } from '@/components/web3/ConnectWallet';
import { ConnectWallet } from '@/components/web3/ConnectWallet';
import type { RarityLevel } from '@/config/rarity';

type MintStep = 'create' | 'confirm' | 'reveal' | 'success';

interface GenerationResult {
  imageUrl: string;
  originalInput: string;
  optimizedPrompt: string;
  style: string;
  source: string;
}

interface MintSuccessResult {
  tokenId: number;
  transactionHash: string;
  vrfRequestId: string;
  ipfs: any;
  metadata: any;
  generationData: GenerationResult;
  estimatedRevealTime: number;
  mintData: {
    originalInput: string;
    optimizedPrompt: string;
    style: string;
    creator: string;
    imageUrl: string;
    ipfsImageUrl: string;
    ipfsMetadataUrl: string;
    gatewayImageUrl: string;
  };
}

export function MintNFT() {
  const { isConnected, mounted } = useWallet();
  const [currentStep, setCurrentStep] = useState<MintStep>('create');
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [mintResult, setMintResult] = useState<MintSuccessResult | null>(null);
  const [finalRarity, setFinalRarity] = useState<RarityLevel | null>(null);

  // 调试输出当前状态
  console.log('🎯 MintNFT组件状态:', {
    currentStep,
    hasGeneration: !!generationResult,
    hasMintResult: !!mintResult,
    tokenId: mintResult?.tokenId,
    vrfRequestId: mintResult?.vrfRequestId
  });

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-white">加载中...</div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-3xl font-bold text-white">连接钱包开始创作</h1>
          <p className="text-white/70">请先连接您的钱包，然后开始AI神兽创作之旅</p>
          <ConnectWallet />
        </div>
      </div>
    );
  }

  const handleImageGenerated = (result: GenerationResult) => {
    console.log('🎨 图片生成完成:', result);
    setGenerationResult(result);
    setCurrentStep('confirm');
  };

  const handleMintSuccess = (result: MintSuccessResult) => {
    console.log('⛏️ 铸造成功，准备跳转到稀有度揭晓:', result);
    setMintResult(result);
    setCurrentStep('reveal');
  };

  const handleRarityReveal = (rarity: RarityLevel) => {
    console.log('⭐ 稀有度揭晓完成:', rarity);
    setFinalRarity(rarity);
    setCurrentStep('success');
  };

  const handleBackToCreate = () => {
    setCurrentStep('create');
    setGenerationResult(null);
  };

  const handleBackToConfirm = () => {
    setCurrentStep('confirm');
    setMintResult(null);
  };

  const handleCreateNew = () => {
    setCurrentStep('create');
    setGenerationResult(null);
    setMintResult(null);
    setFinalRarity(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 步骤指示器 */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="flex items-center justify-center space-x-2 md:space-x-4">
          <div className={`flex items-center gap-2 ${currentStep === 'create' ? 'text-purple-400' : (currentStep === 'confirm' || currentStep === 'reveal' || currentStep === 'success') ? 'text-green-400' : 'text-white/50'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'create' ? 'border-purple-400 bg-purple-400/20' : (currentStep === 'confirm' || currentStep === 'reveal' || currentStep === 'success') ? 'border-green-400 bg-green-400/20' : 'border-white/30'}`}>
              {(currentStep === 'confirm' || currentStep === 'reveal' || currentStep === 'success') ? '✓' : '1'}
            </div>
            <span className="hidden sm:inline text-sm">AI创作</span>
          </div>
          
          <div className="w-4 md:w-8 h-0.5 bg-white/30"></div>
          
          <div className={`flex items-center gap-2 ${currentStep === 'confirm' ? 'text-purple-400' : (currentStep === 'reveal' || currentStep === 'success') ? 'text-green-400' : 'text-white/50'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'confirm' ? 'border-purple-400 bg-purple-400/20' : (currentStep === 'reveal' || currentStep === 'success') ? 'border-green-400 bg-green-400/20' : 'border-white/30'}`}>
              {(currentStep === 'reveal' || currentStep === 'success') ? '✓' : '2'}
            </div>
            <span className="hidden sm:inline text-sm">确认铸造</span>
          </div>
          
          <div className="w-4 md:w-8 h-0.5 bg-white/30"></div>
          
          <div className={`flex items-center gap-2 ${currentStep === 'reveal' ? 'text-purple-400' : currentStep === 'success' ? 'text-green-400' : 'text-white/50'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'reveal' ? 'border-purple-400 bg-purple-400/20' : currentStep === 'success' ? 'border-green-400 bg-green-400/20' : 'border-white/30'}`}>
              {currentStep === 'success' ? '✓' : '3'}
            </div>
            <span className="hidden sm:inline text-sm">稀有度揭晓</span>
          </div>
          
          <div className="w-4 md:w-8 h-0.5 bg-white/30"></div>
          
          <div className={`flex items-center gap-2 ${currentStep === 'success' ? 'text-green-400' : 'text-white/50'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'success' ? 'border-green-400 bg-green-400/20' : 'border-white/30'}`}>
              {currentStep === 'success' ? '✓' : '4'}
            </div>
            <span className="hidden sm:inline text-sm">完成</span>
          </div>
        </div>
      </div>

      {/* 调试信息显示 */}
      <div className="max-w-5xl mx-auto mb-4">
        <div className="bg-black/30 border border-white/20 rounded-lg p-3">
          <div className="text-xs text-white/70 space-y-1">
            <div>🐛 当前步骤: {currentStep}</div>
            <div>🎨 生成结果: {generationResult ? '✓' : '✗'}</div>
            <div>⛏️ 铸造结果: {mintResult ? `✓ Token ID: ${mintResult.tokenId}` : '✗'}</div>
            <div>🎲 VRF请求: {mintResult?.vrfRequestId || '无'}</div>
            <div>⭐ 最终稀有度: {finalRarity !== null ? finalRarity : '未揭晓'}</div>
          </div>
        </div>
      </div>

      {/* 步骤内容 */}
      {currentStep === 'create' && (
        <AICreationWorkshop onImageGenerated={handleImageGenerated} />
      )}

      {currentStep === 'confirm' && generationResult && (
        <MintConfirmation
          generationResult={generationResult}
          onMintSuccess={handleMintSuccess}
          onBack={handleBackToCreate}
        />
      )}

      {currentStep === 'reveal' && mintResult && (
        <div>
          <div className="text-center mb-4">
            <div className="text-green-400 font-bold">🎯 RarityReveal组件即将渲染</div>
            <div className="text-white/70 text-sm">Token ID: {mintResult.tokenId}, VRF: {mintResult.vrfRequestId}</div>
          </div>
          <RarityReveal
            tokenId={mintResult.tokenId}
            vrfRequestId={mintResult.vrfRequestId}
            mintData={mintResult.mintData}
            onRevealComplete={handleRarityReveal}
            onBack={handleBackToConfirm}
          />
        </div>
      )}

      {currentStep === 'success' && mintResult && finalRarity !== null && (
        <div className="w-full max-w-4xl mx-auto">
          <div className="text-center space-y-8 py-12">
            <div className="text-8xl mb-4">🎉</div>
            <h1 className="text-4xl font-bold text-green-400">神兽创作完成！</h1>
            <div className="space-y-6">
              <p className="text-xl text-white/80">
                恭喜！您的AI神兽已成功铸造为NFT，并获得了稀有度！
              </p>
              
              {/* 最终神兽展示 */}
              <div className="max-w-md mx-auto bg-white/10 border border-white/20 rounded-lg p-6">
                <div className="aspect-square relative overflow-hidden rounded-lg mb-4">
                  <img
                    src={mintResult.generationData.imageUrl}
                    alt="最终神兽"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="text-white font-bold text-lg">
                    山海神兽 #{mintResult.tokenId}
                  </div>
                  
                  <div className="flex justify-center">
                    <div className={`px-4 py-2 rounded-full ${
                      finalRarity === 4 ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      finalRarity === 3 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                      finalRarity === 2 ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                      finalRarity === 1 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {finalRarity === 4 ? '🌟 神话' :
                       finalRarity === 3 ? '⭐ 传说' :
                       finalRarity === 2 ? '💜 史诗' :
                       finalRarity === 1 ? '💙 稀有' :
                       '⚪ 普通'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 技术成果展示 */}
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-6 max-w-2xl mx-auto">
                <h3 className="text-green-400 font-bold mb-4">🏆 技术成果</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="text-green-300">🤖 AI技术：DeepSeek + 智谱AI</div>
                    <div className="text-green-300">🔗 区块链：以太坊NFT</div>
                    <div className="text-green-300">📦 存储：Pinata IPFS</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-green-300">🎲 随机性：Chainlink VRF</div>
                    <div className="text-green-300">🆔 Token ID：#{mintResult.tokenId}</div>
                    <div className="text-green-300">⭐ 稀有度：{finalRarity}</div>
                  </div>
                </div>
              </div>

              {/* 图鉴提示 */}
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 max-w-2xl mx-auto">
                <div className="text-purple-400 text-sm font-medium mb-2">📚 图鉴更新</div>
                <div className="text-purple-300/80 text-sm">
                  您的神兽应该已经自动添加到图鉴中了，快去查看您的收藏吧！
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleCreateNew}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg transition-all"
              >
                创造新神兽
              </button>
              <button
                onClick={() => window.open('/gallery', '_blank')}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg transition-all"
              >
                查看我的图鉴
              </button>
              <button
                onClick={() => {
                  const shareText = `我在神图计划创造了一只${finalRarity === 4 ? '神话' : finalRarity === 3 ? '传说' : finalRarity === 2 ? '史诗' : finalRarity === 1 ? '稀有' : '普通'}级别的山海神兽NFT！#神图计划 #ShanHaiVerse #ChainlinkVRF`;
                  if (navigator.share) {
                    navigator.share({ text: shareText });
                  } else {
                    navigator.clipboard.writeText(shareText);
                    alert('分享内容已复制到剪贴板！');
                  }
                }}
                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-6 py-3 rounded-lg transition-all"
              >
                分享成果
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
