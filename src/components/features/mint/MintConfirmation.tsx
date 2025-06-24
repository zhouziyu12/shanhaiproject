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
      alert('Please connect your wallet first');
      return;
    }

    setError(null);

    try {
      console.log('🚀 Starting complete NFT minting process...');
      console.log('📊 Generation data:', generationResult);
      console.log('💰 Applied discount:', appliedDiscountPercent, '%');

      // Step 1: Upload to IPFS
      setIsUploadingIPFS(true);
      console.log('📦 Step 1: Uploading to Pinata IPFS...');
      
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

      // Check if response is JSON
      const contentType = ipfsResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await ipfsResponse.text();
        console.error('❌ API returned non-JSON response:', responseText.substring(0, 200));
        throw new Error('Server returned incorrect response format, please check API status');
      }

      const ipfsData = await ipfsResponse.json();
      
      if (!ipfsData.success) {
        throw new Error(ipfsData.error || 'IPFS upload failed');
      }

      setIpfsResult(ipfsData);
      setIsUploadingIPFS(false);

      console.log('✅ IPFS upload complete:', ipfsData.ipfs);

      // Step 2: Mint NFT (with discount)
      console.log('⛏️ Step 2: Minting NFT...');
      console.log('💰 Using discount:', appliedDiscountPercent, '%');
      const mintResult = await mintNFT(address, ipfsData.mintInfo.tokenURI, appliedDiscountPercent);

      if (!mintResult.success) {
        throw new Error(mintResult.error || 'Minting failed');
      }

      console.log('✅ NFT minting complete, Token ID:', mintResult.tokenId);

      // Step 3: Request VRF rarity assignment
      console.log('🎲 Step 3: Requesting Chainlink VRF rarity assignment...');
      setIsRequestingVRF(true);

      const vrfResponse = await fetch('/api/vrf-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: mintResult.tokenId,
          requester: address
        }),
      });

      // Check VRF response is JSON
      const vrfContentType = vrfResponse.headers.get('content-type');
      if (!vrfContentType || !vrfContentType.includes('application/json')) {
        const vrfResponseText = await vrfResponse.text();
        console.error('❌ VRF API returned non-JSON response:', vrfResponseText.substring(0, 200));
        throw new Error('VRF service returned incorrect response format');
      }

      const vrfData = await vrfResponse.json();
      
      if (!vrfData.success) {
        throw new Error(vrfData.error || 'VRF request failed');
      }

      setVrfRequestId(vrfData.vrfRequestId);
      setIsRequestingVRF(false);

      console.log('✅ VRF request complete, Request ID:', vrfData.vrfRequestId);

      // Critical: Build complete mintData to ensure gallery can receive correctly
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

      console.log('📋 Complete mintData built:', completeMintData);

      // Return complete result with all data needed by gallery
      const completeResult = {
        ...mintResult,
        ipfs: ipfsData.ipfs,
        metadata: ipfsData.metadata,
        generationData: generationResult,
        vrfRequestId: vrfData.vrfRequestId,
        estimatedRevealTime: vrfData.estimatedRevealTime,
        appliedDiscountPercent,
        // Most important: complete mintData
        mintData: completeMintData
      };

      console.log('🎉 Complete NFT minting process finished!', completeResult);
      
      // Trigger success callback immediately
      onMintSuccess?.(completeResult);

    } catch (error) {
      console.error('❌ Minting process failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      alert(`Minting failed: ${errorMessage}`);
    } finally {
      setIsUploadingIPFS(false);
      setIsRequestingVRF(false);
    }
  };

  const isProcessing = isUploadingIPFS || isMinting || isRequestingVRF;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
          <span className="text-2xl">⛏️</span>
          Confirm NFT Minting
        </h1>
        <p className="text-white/70">Mint your AI mythical beast as a permanent blockchain NFT</p>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-4">
            <div className="text-red-400 text-sm">
              ❌ {error}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SHT Token Discount Card */}
      <MintDiscount
        onDiscountApplied={(discountPercent, shtUsed) => {
          setAppliedDiscountPercent(discountPercent);
          console.log('💰 Discount applied:', discountPercent, '%，SHT used:', shtUsed);
        }}
        disabled={isProcessing}
      />

      {/* Preview Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image Preview */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-xl">🖼️</span>
              Beast Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-square relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <img
                src={generationResult.imageUrl}
                alt="AI Generated Mythical Beast"
                className="w-full h-full object-cover"
              />
              
              <Badge className="absolute top-3 left-3 bg-gradient-to-r from-purple-500 to-pink-500">
                {generationResult.style}
              </Badge>

              <Badge className="absolute top-3 right-3 bg-blue-500/20 text-blue-400 border-blue-500/30">
                AI Generated
              </Badge>

              {/* Discount indicator */}
              {appliedDiscountPercent > 0 && (
                <Badge className="absolute bottom-3 left-3 bg-green-500/20 text-green-400 border-green-500/30">
                  💰 {appliedDiscountPercent}% Discount
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Minting Information */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-xl">📋</span>
              Minting Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="text-sm text-white/60 mb-1">Original Description</div>
                <div className="text-white text-sm bg-white/5 p-3 rounded">
                  {generationResult.originalInput}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-white/60 mb-1">AI Optimized</div>
                <div className="text-white text-sm bg-white/5 p-3 rounded">
                  {generationResult.optimizedPrompt}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-white/60">Art Style</div>
                  <div className="text-white font-medium">{generationResult.style}</div>
                </div>
                <div>
                  <div className="text-white/60">Creator</div>
                  <div className="text-white font-mono text-xs">
                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not Connected'}
                  </div>
                </div>
              </div>

              {/* Fee Information */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <div className="text-blue-400 text-sm font-medium mb-2">💰 Minting Fee</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/70">Base Fee:</span>
                    <span className="text-white">0.001 ETH</span>
                  </div>
                  {appliedDiscountPercent > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-green-400">SHT Discount:</span>
                        <span className="text-green-400">-{appliedDiscountPercent}%</span>
                      </div>
                      <div className="flex justify-between border-t border-white/10 pt-1">
                        <span className="text-white font-medium">Actual Fee:</span>
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

      {/* Minting Process and Buttons */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardContent className="p-6">
          {/* Processing Steps Display */}
          {isProcessing && (
            <div className="mb-6 space-y-4">
              <div className="text-center">
                <h3 className="text-white font-medium mb-4">Minting Progress</h3>
              </div>
              
              <div className="space-y-3">
                {/* Step 1: IPFS Upload */}
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
                  <span className="text-white">Upload to IPFS</span>
                  {isUploadingIPFS && <span className="text-blue-400 text-sm">In Progress...</span>}
                  {ipfsResult && <span className="text-green-400 text-sm">Complete</span>}
                </div>

                {/* Step 2: NFT Minting */}
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
                  <span className="text-white">Mint NFT</span>
                  {isMinting && <span className="text-blue-400 text-sm">In Progress...</span>}
                  {mintResult && <span className="text-green-400 text-sm">Complete #{mintResult.tokenId}</span>}
                </div>

                {/* Step 3: VRF Request */}
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
                  <span className="text-white">Request VRF</span>
                  {isRequestingVRF && <span className="text-blue-400 text-sm">In Progress...</span>}
                  {vrfRequestId && <span className="text-green-400 text-sm">Complete</span>}
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
                Back to Edit
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
                  {isUploadingIPFS ? 'IPFS Uploading...' : 
                   isMinting ? 'NFT Minting...' : 
                   'Requesting VRF...'}
                </>
              ) : (
                <>
                  <span className="mr-2">⛏️</span>
                  Confirm Mint NFT
                  {appliedDiscountPercent > 0 && (
                    <span className="ml-2 text-green-300">
                      (Save {appliedDiscountPercent}%)
                    </span>
                  )}
                </>
              )}
            </Button>
          </div>

          {/* Success Notice */}
          {mintResult && mintResult.success && (
            <div className="mt-4 bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
              <div className="text-green-400 font-medium mb-2">🎉 Minting Successful!</div>
              <div className="text-green-300/80 text-sm space-y-1">
                <div>Token ID: #{mintResult.tokenId}</div>
                <div>Rarity assignment in progress, will be automatically added to gallery...</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}