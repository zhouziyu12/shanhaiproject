'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RARITY_CONFIG, getRarityInfo, type RarityLevel } from '@/config/rarity';

interface RarityRevealProps {
  tokenId: number;
  vrfRequestId: string;
  mintData?: {
    originalInput: string;
    optimizedPrompt: string;
    style: string;
    creator: string;
    imageUrl: string;
    ipfsImageUrl: string;
    ipfsMetadataUrl: string;
    gatewayImageUrl: string;
  };
  onRevealComplete?: (rarity: RarityLevel) => void;
  onBack?: () => void;
}

interface VRFStatus {
  status: 'pending' | 'fulfilled' | 'failed';
  rarity?: RarityLevel;
  randomWord?: number;
  error?: string;
}

export function RarityReveal({ 
  tokenId, 
  vrfRequestId,
  mintData,
  onRevealComplete,
  onBack 
}: RarityRevealProps) {
  const [vrfStatus, setVrfStatus] = useState<VRFStatus>({ status: 'pending' });
  const [countdown, setCountdown] = useState(8);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealedRarity, setRevealedRarity] = useState<RarityLevel | null>(null);
  const [nftAddedToGallery, setNftAddedToGallery] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 🔧 Directly call API to add NFT to database (replacing useNFTData hook)
  const addNFTToDatabase = async (nftData: any) => {
    try {
      console.log('📚 Directly calling API to add NFT to database...', nftData);
      
      const response = await fetch('/api/nfts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: nftData.tokenId,
          name: `Shan Hai Beast #${nftData.tokenId}`,
          originalInput: nftData.originalInput,
          optimizedPrompt: nftData.optimizedPrompt,
          style: nftData.style,
          creator: nftData.creator,
          imageUrl: nftData.imageUrl,
          ipfsImageUrl: nftData.ipfsImageUrl,
          ipfsMetadataUrl: nftData.ipfsMetadataUrl,
          gatewayImageUrl: nftData.gatewayImageUrl,
          rarity: nftData.rarity,
          vrfRequestId: nftData.vrfRequestId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API call failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'API returned failure status');
      }

      console.log('✅ NFT successfully added to database:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Failed to add NFT to database:', error);
      throw error;
    }
  };

  // Poll VRF status
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    const pollVRFStatus = async () => {
      try {
        console.log('🔄 Polling VRF status...', vrfRequestId);
        const response = await fetch(`/api/vrf-request?requestId=${vrfRequestId}`);
        const data = await response.json();
        
        console.log('📊 VRF status response:', data);
        
        if (data.success) {
          setVrfStatus({
            status: data.status,
            rarity: data.rarity,
            randomWord: data.randomWord,
            error: data.error
          });

          // If VRF is fulfilled and reveal hasn't started yet
          if (data.status === 'fulfilled' && !isRevealing && revealedRarity === null) {
            console.log('🎲 VRF completed, starting reveal process...', {
              tokenId,
              rarity: data.rarity,
              randomWord: data.randomWord
            });

            setIsRevealing(true);
            
            // Show rarity and add to gallery after 2 seconds
            setTimeout(async () => {
              console.log('⭐ Setting revealed rarity:', data.rarity);
              setRevealedRarity(data.rarity);
              
              // 🔧 Critical fix: Call API directly instead of relying on useNFTData hook
              if (mintData && !nftAddedToGallery) {
                console.log('📚 Preparing to add NFT to gallery...', {
                  tokenId,
                  rarity: data.rarity,
                  mintData: mintData
                });

                try {
                  // 🆕 Call database API directly
                  await addNFTToDatabase({
                    tokenId,
                    originalInput: mintData.originalInput,
                    optimizedPrompt: mintData.optimizedPrompt,
                    style: mintData.style,
                    creator: mintData.creator,
                    imageUrl: mintData.imageUrl,
                    ipfsImageUrl: mintData.ipfsImageUrl,
                    ipfsMetadataUrl: mintData.ipfsMetadataUrl,
                    gatewayImageUrl: mintData.gatewayImageUrl,
                    rarity: data.rarity,
                    vrfRequestId: vrfRequestId
                  });
                  
                  setNftAddedToGallery(true);
                  setSaveError(null); // Clear previous errors
                  console.log('✅ NFT successfully added to gallery!');
                  
                  // Trigger success event
                  if (typeof window !== 'undefined') {
                    const event = new CustomEvent('nftMintedAndAddedToGallery', {
                      detail: {
                        tokenId,
                        rarity: data.rarity,
                        success: true
                      }
                    });
                    window.dispatchEvent(event);
                  }
                  
                } catch (error) {
                  console.error('❌ Failed to add NFT to gallery:', error);
                  setSaveError(error instanceof Error ? error.message : 'Unknown error');
                }
              } else {
                console.warn('⚠️ mintData missing or NFT already added:', { 
                  hasMintData: !!mintData, 
                  alreadyAdded: nftAddedToGallery 
                });
              }
              
              // Notify parent component
              onRevealComplete?.(data.rarity);
            }, 2000);

            // Clear polling
            if (pollInterval) {
              clearInterval(pollInterval);
            }
          }
        }
      } catch (error) {
        console.error('❌ Failed to poll VRF status:', error);
      }
    };

    // Execute immediately once
    pollVRFStatus();

    // Poll every 2 seconds (only when status is pending)
    if (vrfStatus.status === 'pending') {
      pollInterval = setInterval(pollVRFStatus, 2000);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [vrfRequestId, isRevealing, revealedRarity, nftAddedToGallery, vrfStatus.status, mintData, onRevealComplete, tokenId]);

  // Manual save NFT (backup solution)
  const manualSaveNFT = async () => {
    if (!mintData || revealedRarity === null) {
      alert('Missing required data, cannot save');
      return;
    }

    try {
      setSaveError(null);
      await addNFTToDatabase({
        tokenId,
        originalInput: mintData.originalInput,
        optimizedPrompt: mintData.optimizedPrompt,
        style: mintData.style,
        creator: mintData.creator,
        imageUrl: mintData.imageUrl,
        ipfsImageUrl: mintData.ipfsImageUrl,
        ipfsMetadataUrl: mintData.ipfsMetadataUrl,
        gatewayImageUrl: mintData.gatewayImageUrl,
        rarity: revealedRarity,
        vrfRequestId: vrfRequestId
      });
      
      setNftAddedToGallery(true);
      alert('NFT successfully saved to gallery!');
      
    } catch (error) {
      console.error('Manual save failed:', error);
      setSaveError(error instanceof Error ? error.message : 'Unknown error');
      alert('Save failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Countdown effect
  useEffect(() => {
    if (vrfStatus.status === 'pending' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, vrfStatus.status]);

  // 🐛 Enhanced debug information
  useEffect(() => {
    console.log('🐛 RarityReveal detailed state:', {
      tokenId,
      vrfRequestId,
      vrfStatus,
      isRevealing,
      revealedRarity,
      nftAddedToGallery,
      saveError,
      mintData: mintData ? {
        hasAllRequiredFields: !!(
          mintData.originalInput &&
          mintData.optimizedPrompt &&
          mintData.style &&
          mintData.creator &&
          mintData.imageUrl &&
          mintData.ipfsImageUrl &&
          mintData.ipfsMetadataUrl
        ),
        fields: Object.keys(mintData)
      } : null
    });
  }, [tokenId, vrfRequestId, vrfStatus, isRevealing, revealedRarity, nftAddedToGallery, saveError, mintData]);

  // Get current rarity display information
  const getRarityDisplay = () => {
    if (revealedRarity !== null) {
      return getRarityInfo(revealedRarity);
    }
    return null;
  };

  const rarityInfo = getRarityDisplay();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
          <span className="text-2xl">🎲</span>
          Chainlink VRF Rarity Assignment
        </h1>
        <p className="text-white/70">Using on-chain random numbers to ensure fair rarity</p>
      </div>

      {/* 🚨 Save Error Alert */}
      {saveError && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-red-400">
                <div className="font-medium">❌ Failed to save to gallery</div>
                <div className="text-sm text-red-300/80">{saveError}</div>
              </div>
              <Button
                onClick={manualSaveNFT}
                className="bg-red-500 hover:bg-red-600 text-white"
                size="sm"
              >
                Retry Save
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* VRF Status Card */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <span className="text-xl">⚡</span>
            Chainlink VRF Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* VRF Request Status */}
            <div className={`p-4 rounded-lg border ${
              vrfStatus.status === 'fulfilled' ? 'bg-green-500/10 border-green-500/30' : 
              vrfStatus.status === 'failed' ? 'bg-red-500/10 border-red-500/30' :
              'bg-blue-500/10 border-blue-500/30'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {vrfStatus.status === 'fulfilled' ? (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                ) : vrfStatus.status === 'failed' ? (
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✗</span>
                  </div>
                ) : (
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                )}
                <span className="text-white font-medium">VRF Request</span>
              </div>
              <div className="text-sm text-white/70">
                {vrfStatus.status === 'fulfilled' ? '✅ Random number generated' :
                 vrfStatus.status === 'failed' ? '❌ Request failed' :
                 `🔄 Waiting for Chainlink node response... ${countdown}s`}
              </div>
            </div>

            {/* Random Number Generation */}
            <div className={`p-4 rounded-lg border ${
              vrfStatus.randomWord ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/20'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  vrfStatus.randomWord ? 'bg-green-500' : 'bg-white/20'
                }`}>
                  <span className="text-white text-xs">{vrfStatus.randomWord ? '✓' : '2'}</span>
                </div>
                <span className="text-white font-medium">Random Number</span>
              </div>
              <div className="text-sm text-white/70">
                {vrfStatus.randomWord ? 
                  `🎲 ${vrfStatus.randomWord}` : 
                  'Waiting for on-chain random number'}
              </div>
            </div>

            {/* Gallery Save Status */}
            <div className={`p-4 rounded-lg border ${
              nftAddedToGallery ? 'bg-green-500/10 border-green-500/30' : 
              saveError ? 'bg-red-500/10 border-red-500/30' :
              'bg-white/5 border-white/20'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  nftAddedToGallery ? 'bg-green-500' : 
                  saveError ? 'bg-red-500' : 'bg-white/20'
                }`}>
                  <span className="text-white text-xs">
                    {nftAddedToGallery ? '✓' : saveError ? '✗' : '3'}
                  </span>
                </div>
                <span className="text-white font-medium">Gallery Save</span>
              </div>
              <div className="text-sm text-white/70">
                {nftAddedToGallery ? '✅ Saved to gallery' : 
                 saveError ? '❌ Save failed' :
                 'Waiting to save to gallery'}
              </div>
            </div>
          </div>

          {/* VRF Request Details */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-white/60">Token ID:</span>
                <span className="text-white ml-2">#{tokenId}</span>
              </div>
              <div>
                <span className="text-white/60">VRF Request ID:</span>
                <span className="text-white ml-2 font-mono text-xs">
                  {vrfRequestId.slice(0, 20)}...
                </span>
              </div>
              {vrfStatus.randomWord && (
                <div>
                  <span className="text-white/60">Random Number:</span>
                  <span className="text-white ml-2 font-mono">{vrfStatus.randomWord}</span>
                </div>
              )}
              {revealedRarity !== null && (
                <div>
                  <span className="text-white/60">Rarity Level:</span>
                  <span className="text-white ml-2">{revealedRarity}</span>
                </div>
              )}
            </div>
          </div>

          {/* Debug Information Display */}
          <div className="bg-black/20 border border-white/10 rounded-lg p-3">
            <div className="text-xs text-white/60 space-y-1">
              <div>🐛 Debug: VRF Status={vrfStatus.status}, Is Revealing={isRevealing ? 'Yes' : 'No'}</div>
              <div>📊 Rarity={revealedRarity}, Added to Gallery={nftAddedToGallery ? 'Yes' : 'No'}</div>
              <div>📝 mintData={mintData ? 'Exists' : 'Missing'}, Save Error={saveError || 'None'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rarity Reveal Area */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardContent className="p-8">
          {!isRevealing && vrfStatus.status === 'pending' && (
            <div className="text-center space-y-6">
              <div className="text-6xl animate-pulse">🎲</div>
              <h3 className="text-2xl font-bold text-white">Generating Rarity...</h3>
              <div className="space-y-2">
                <p className="text-white/70">Chainlink VRF is generating true random numbers</p>
                <div className="flex justify-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
              
              {/* Rarity Probability Display */}
              <div className="max-w-md mx-auto">
                <div className="text-sm text-white/60 mb-3">Rarity Probability Distribution:</div>
                <div className="space-y-2">
                  {Object.entries(RARITY_CONFIG.LEVELS).map(([level, config]) => (
                    <div key={level} className="flex justify-between items-center">
                      <span className={`${config.color} text-sm`}>{config.name}</span>
                      <span className="text-white/60 text-sm">{config.probability}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {isRevealing && revealedRarity === null && (
            <div className="text-center space-y-6">
              <div className="text-8xl animate-spin">⭐</div>
              <h3 className="text-3xl font-bold text-white">Revealing Rarity...</h3>
              <p className="text-white/70">Prepare to witness your beast's rarity!</p>
            </div>
          )}

          {revealedRarity !== null && rarityInfo && (
            <div className="text-center space-y-6">
              {/* Rarity Reveal Animation */}
              <div className={`relative inline-block p-8 rounded-2xl ${rarityInfo.bgColor} ${rarityInfo.borderColor} border-2`}>
                <div className="text-8xl mb-4">
                  {revealedRarity === 4 ? '🌟' : 
                   revealedRarity === 3 ? '⭐' : 
                   revealedRarity === 2 ? '💜' : 
                   revealedRarity === 1 ? '💙' : '⚪'}
                </div>
                <Badge className={`text-2xl px-6 py-2 ${rarityInfo.bgColor} ${rarityInfo.color} ${rarityInfo.borderColor} border`}>
                  {rarityInfo.name}
                </Badge>
                
                {/* Special Effect Tags */}
                {RARITY_CONFIG.BONUSES[revealedRarity].special.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {RARITY_CONFIG.BONUSES[revealedRarity].special.map((effect, index) => (
                      <Badge key={index} className="bg-white/10 text-white/80 text-xs">
                        ✨ {effect}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className={`text-3xl font-bold ${rarityInfo.color}`}>
                  Congratulations! You got a {rarityInfo.name} beast!
                </h3>
                <div className="text-white/70 space-y-2">
                  <p>🎲 Random Number: {vrfStatus.randomWord}</p>
                  <p>📊 Rarity Probability: {rarityInfo.probability}%</p>
                  <p>🔢 Rarity Level: {revealedRarity}</p>
                  <p>⚡ Attribute Multiplier: {RARITY_CONFIG.BONUSES[revealedRarity].multiplier}x</p>
                </div>
              </div>

              {/* Gallery Addition Status */}
              {nftAddedToGallery ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 max-w-2xl mx-auto">
                  <div className="text-green-400 text-sm font-medium mb-2">📚 Gallery update successful</div>
                  <div className="text-green-300/80 text-sm">
                    ✅ Your mythical beast has been automatically added to your gallery. You can go check it out!
                  </div>
                </div>
              ) : saveError ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 max-w-2xl mx-auto">
                  <div className="text-red-400 text-sm font-medium mb-2">❌ Gallery save failed</div>
                  <div className="text-red-300/80 text-sm mb-3">{saveError}</div>
                  <Button
                    onClick={manualSaveNFT}
                    className="bg-red-500 hover:bg-red-600 text-white"
                    size="sm"
                  >
                    Manually Save to Gallery
                  </Button>
                </div>
              ) : (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 max-w-2xl mx-auto">
                  <div className="text-yellow-400 text-sm font-medium mb-2">📚 Gallery updating</div>
                  <div className="text-yellow-300/80 text-sm">
                    ⏳ Adding your mythical beast to the gallery...
                  </div>
                </div>
              )}

              {/* VRF Technology Explanation */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 max-w-2xl mx-auto">
                <div className="text-blue-400 text-sm font-medium mb-2">🔗 Chainlink VRF Technology Guarantee</div>
                <div className="text-blue-300/80 text-sm space-y-1">
                  <div>• True on-chain randomness, unpredictable and tamper-proof</div>
                  <div>• Transparent probability distribution, verifiable by everyone</div>
                  <div>• Decentralized random number generation ensures fairness</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => window.open('/gallery', '_blank')}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  View My Beast Gallery
                </Button>
                <Button
                  onClick={() => window.location.href = '/mint'}
                  variant="outline"
                >
                  Create New Beast
                </Button>
              </div>
            </div>
          )}

          {vrfStatus.status === 'failed' && (
            <div className="text-center space-y-6">
              <div className="text-6xl">❌</div>
              <h3 className="text-2xl font-bold text-red-400">VRF Request Failed</h3>
              <p className="text-red-300">{vrfStatus.error || 'Please retry rarity assignment'}</p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-red-500 hover:bg-red-600"
              >
                Request Rarity Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Back Button */}
      {onBack && (
        <div className="text-center">
          <Button
            onClick={onBack}
            variant="outline"
            disabled={vrfStatus.status === 'pending'}
          >
            Back to Previous Step
          </Button>
        </div>
      )}
    </div>
  );
}