'use client';

import { useState } from 'react';
import { AICreationWorkshop } from './AICreationWorkshop';
import { MintConfirmation } from './MintConfirmation';
import { useWallet } from '@/components/web3/ConnectWallet';
import { ConnectWallet } from '@/components/web3/ConnectWallet';

type MintStep = 'create' | 'confirm' | 'success';

interface GenerationResult {
  imageUrl: string;
  originalInput: string;
  optimizedPrompt: string;
  style: string;
  source: string;
}

export function MintNFT() {
  const { isConnected, mounted } = useWallet();
  const [currentStep, setCurrentStep] = useState<MintStep>('create');
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [mintResult, setMintResult] = useState<any>(null);

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
    setGenerationResult(result);
    setCurrentStep('confirm');
  };

  const handleMintSuccess = (result: any) => {
    setMintResult(result);
    setCurrentStep('success');
  };

  const handleBackToCreate = () => {
    setCurrentStep('create');
    setGenerationResult(null);
  };

  const handleCreateNew = () => {
    setCurrentStep('create');
    setGenerationResult(null);
    setMintResult(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 步骤指示器 */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-center space-x-4">
          <div className={`flex items-center gap-2 ${currentStep === 'create' ? 'text-purple-400' : currentStep === 'confirm' || currentStep === 'success' ? 'text-green-400' : 'text-white/50'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'create' ? 'border-purple-400 bg-purple-400/20' : currentStep === 'confirm' || currentStep === 'success' ? 'border-green-400 bg-green-400/20' : 'border-white/30'}`}>
              {currentStep === 'confirm' || currentStep === 'success' ? '✓' : '1'}
            </div>
            <span className="hidden sm:inline">AI创作</span>
          </div>
          
          <div className="w-8 h-0.5 bg-white/30"></div>
          
          <div className={`flex items-center gap-2 ${currentStep === 'confirm' ? 'text-purple-400' : currentStep === 'success' ? 'text-green-400' : 'text-white/50'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'confirm' ? 'border-purple-400 bg-purple-400/20' : currentStep === 'success' ? 'border-green-400 bg-green-400/20' : 'border-white/30'}`}>
              {currentStep === 'success' ? '✓' : '2'}
            </div>
            <span className="hidden sm:inline">确认铸造</span>
          </div>
          
          <div className="w-8 h-0.5 bg-white/30"></div>
          
          <div className={`flex items-center gap-2 ${currentStep === 'success' ? 'text-green-400' : 'text-white/50'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'success' ? 'border-green-400 bg-green-400/20' : 'border-white/30'}`}>
              {currentStep === 'success' ? '✓' : '3'}
            </div>
            <span className="hidden sm:inline">完成</span>
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

      {currentStep === 'success' && mintResult && (
        <div className="w-full max-w-4xl mx-auto">
          <div className="text-center space-y-8 py-12">
            <div className="text-8xl mb-4">🎉</div>
            <h1 className="text-4xl font-bold text-green-400">神兽铸造成功！</h1>
            <div className="space-y-4">
              <p className="text-xl text-white/80">
                恭喜！您的AI神兽已成功铸造为NFT
              </p>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 max-w-md mx-auto">
                <div className="space-y-2 text-green-300">
                  <div>🆔 Token ID: #{mintResult.tokenId}</div>
                  <div>🎲 稀有度: 由VRF分配中...</div>
                  <div>📦 IPFS: 已永久存储</div>
                  {mintResult.transactionHash && (
                    <div className="text-sm font-mono">
                      🔗 {mintResult.transactionHash.slice(0, 10)}...{mintResult.transactionHash.slice(-8)}
                    </div>
                  )}
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
                查看图鉴
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
