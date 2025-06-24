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

  // Debug output current state
  console.log('🎯 MintNFT component state:', {
    currentStep,
    hasGeneration: !!generationResult,
    hasMintResult: !!mintResult,
    tokenId: mintResult?.tokenId,
    vrfRequestId: mintResult?.vrfRequestId
  });

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-3xl font-bold text-white">Connect Wallet to Start Creating</h1>
          <p className="text-white/70">Please connect your wallet to begin your AI mythical beast creation journey</p>
          <ConnectWallet />
        </div>
      </div>
    );
  }

  const handleImageGenerated = (result: GenerationResult) => {
    console.log('🎨 Image generation complete:', result);
    setGenerationResult(result);
    setCurrentStep('confirm');
  };

  const handleMintSuccess = (result: MintSuccessResult) => {
    console.log('⛏️ Mint successful, preparing to jump to rarity reveal:', result);
    setMintResult(result);
    setCurrentStep('reveal');
  };

  const handleRarityReveal = (rarity: RarityLevel) => {
    console.log('⭐ Rarity reveal complete:', rarity);
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
      {/* Step Indicator */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="flex items-center justify-center space-x-2 md:space-x-4">
          <div className={`flex items-center gap-2 ${currentStep === 'create' ? 'text-purple-400' : (currentStep === 'confirm' || currentStep === 'reveal' || currentStep === 'success') ? 'text-green-400' : 'text-white/50'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'create' ? 'border-purple-400 bg-purple-400/20' : (currentStep === 'confirm' || currentStep === 'reveal' || currentStep === 'success') ? 'border-green-400 bg-green-400/20' : 'border-white/30'}`}>
              {(currentStep === 'confirm' || currentStep === 'reveal' || currentStep === 'success') ? '✓' : '1'}
            </div>
            <span className="hidden sm:inline text-sm">AI Creation</span>
          </div>
          
          <div className="w-4 md:w-8 h-0.5 bg-white/30"></div>
          
          <div className={`flex items-center gap-2 ${currentStep === 'confirm' ? 'text-purple-400' : (currentStep === 'reveal' || currentStep === 'success') ? 'text-green-400' : 'text-white/50'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'confirm' ? 'border-purple-400 bg-purple-400/20' : (currentStep === 'reveal' || currentStep === 'success') ? 'border-green-400 bg-green-400/20' : 'border-white/30'}`}>
              {(currentStep === 'reveal' || currentStep === 'success') ? '✓' : '2'}
            </div>
            <span className="hidden sm:inline text-sm">Confirm Mint</span>
          </div>
          
          <div className="w-4 md:w-8 h-0.5 bg-white/30"></div>
          
          <div className={`flex items-center gap-2 ${currentStep === 'reveal' ? 'text-purple-400' : currentStep === 'success' ? 'text-green-400' : 'text-white/50'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'reveal' ? 'border-purple-400 bg-purple-400/20' : currentStep === 'success' ? 'border-green-400 bg-green-400/20' : 'border-white/30'}`}>
              {currentStep === 'success' ? '✓' : '3'}
            </div>
            <span className="hidden sm:inline text-sm">Rarity Reveal</span>
          </div>
          
          <div className="w-4 md:w-8 h-0.5 bg-white/30"></div>
          
          <div className={`flex items-center gap-2 ${currentStep === 'success' ? 'text-green-400' : 'text-white/50'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'success' ? 'border-green-400 bg-green-400/20' : 'border-white/30'}`}>
              {currentStep === 'success' ? '✓' : '4'}
            </div>
            <span className="hidden sm:inline text-sm">Complete</span>
          </div>
        </div>
      </div>

      {/* Debug Information Display */}
      <div className="max-w-5xl mx-auto mb-4">
        <div className="bg-black/30 border border-white/20 rounded-lg p-3">
          <div className="text-xs text-white/70 space-y-1">
            <div>🐛 Current Step: {currentStep}</div>
            <div>🎨 Generation Result: {generationResult ? '✓' : '✗'}</div>
            <div>⛏️ Mint Result: {mintResult ? `✓ Token ID: ${mintResult.tokenId}` : '✗'}</div>
            <div>🎲 VRF Request: {mintResult?.vrfRequestId || 'None'}</div>
            <div>⭐ Final Rarity: {finalRarity !== null ? finalRarity : 'Not Revealed'}</div>
          </div>
        </div>
      </div>

      {/* Step Content */}
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
            <div className="text-green-400 font-bold">🎯 RarityReveal component about to render</div>
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
            <h1 className="text-4xl font-bold text-green-400">Mythical Beast Creation Complete!</h1>
            <div className="space-y-6">
              <p className="text-xl text-white/80">
                Congratulations! Your AI mythical beast has been successfully minted as an NFT and assigned a rarity!
              </p>
              
              {/* Final Beast Display */}
              <div className="max-w-md mx-auto bg-white/10 border border-white/20 rounded-lg p-6">
                <div className="aspect-square relative overflow-hidden rounded-lg mb-4">
                  <img
                    src={mintResult.generationData.imageUrl}
                    alt="Final Mythical Beast"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="text-white font-bold text-lg">
                    Shan Hai Beast #{mintResult.tokenId}
                  </div>
                  
                  <div className="flex justify-center">
                    <div className={`px-4 py-2 rounded-full ${
                      finalRarity === 4 ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      finalRarity === 3 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                      finalRarity === 2 ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                      finalRarity === 1 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {finalRarity === 4 ? '🌟 Mythical' :
                       finalRarity === 3 ? '⭐ Legendary' :
                       finalRarity === 2 ? '💜 Epic' :
                       finalRarity === 1 ? '💙 Rare' :
                       '⚪ Common'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Achievement Display */}
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-6 max-w-2xl mx-auto">
                <h3 className="text-green-400 font-bold mb-4">🏆 Technical Achievement</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="text-green-300">🤖 AI Technology: DeepSeek + ZhipuAI</div>
                    <div className="text-green-300">🔗 Blockchain: Ethereum NFT</div>
                    <div className="text-green-300">📦 Storage: Pinata IPFS</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-green-300">🎲 Randomness: Chainlink VRF</div>
                    <div className="text-green-300">🆔 Token ID: #{mintResult.tokenId}</div>
                    <div className="text-green-300">⭐ Rarity: {finalRarity}</div>
                  </div>
                </div>
              </div>

              {/* Gallery Update Notice */}
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 max-w-2xl mx-auto">
                <div className="text-purple-400 text-sm font-medium mb-2">📚 Gallery Update</div>
                <div className="text-purple-300/80 text-sm">
                  Your mythical beast should have been automatically added to your gallery. Go check out your collection!
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleCreateNew}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg transition-all"
              >
                Create New Beast
              </button>
              <button
                onClick={() => window.open('/gallery', '_blank')}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg transition-all"
              >
                View My Gallery
              </button>
              <button
                onClick={() => {
                  const shareText = `I created a ${finalRarity === 4 ? 'Mythical' : finalRarity === 3 ? 'Legendary' : finalRarity === 2 ? 'Epic' : finalRarity === 1 ? 'Rare' : 'Common'}-tier Shan Hai mythical beast NFT in the Divine Image Project! #DivineImageProject #ShanHaiVerse #ChainlinkVRF`;
                  if (navigator.share) {
                    navigator.share({ text: shareText });
                  } else {
                    navigator.clipboard.writeText(shareText);
                    alert('Share content copied to clipboard!');
                  }
                }}
                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-6 py-3 rounded-lg transition-all"
              >
                Share Achievement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}