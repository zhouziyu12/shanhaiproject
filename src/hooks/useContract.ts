import { useState } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { parseEther } from 'viem';
import { sepolia } from 'wagmi/chains';

// NFT Contract ABI - only includes required functions
const PROMPT_NFT_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenURI', type: 'string' }
    ],
    name: 'mint',
    outputs: [{ name: 'tokenId', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'mintPrice',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

// Contract addresses
const CONTRACTS = {
  PROMPT_NFT: '0x9269C7b6BFe45143f899fdA45d5ba2C7aDD0367A' as `0x${string}`,
  SHT_TOKEN: '0xDd0C2E81D9134A914fcA7Db9655d9813C87D5701' as `0x${string}`,
  MARKETPLACE: '0x62c6FE18490398e9b77E6e1294D046e16bE1aEC4' as `0x${string}`
};

interface MintResult {
  success: boolean;
  tokenId?: number;
  transactionHash?: string;
  error?: string;
}

export function useContract() {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [isMinting, setIsMinting] = useState(false);
  const [mintResult, setMintResult] = useState<MintResult | null>(null);

  // Get mint price
  const getMintPrice = async (): Promise<bigint> => {
    try {
      const price = await publicClient?.readContract({
        address: CONTRACTS.PROMPT_NFT,
        abi: PROMPT_NFT_ABI,
        functionName: 'mintPrice'
      });
      return price || parseEther('0.001'); // Default 0.001 ETH
    } catch (error) {
      console.log('Failed to get mint price, using default value:', error);
      return parseEther('0.001');
    }
  };

  // Mint NFT (with discount support)
  const mintNFT = async (to: string, tokenURI: string, discountPercent: number = 0): Promise<MintResult> => {
    if (!walletClient || !publicClient) {
      return { success: false, error: 'Wallet not connected' };
    }

    setIsMinting(true);
    setMintResult(null);

    try {
      console.log('🚀 Starting NFT minting...');
      console.log('📝 Parameters:', { to, tokenURI, discountPercent });

      // Get base mint price
      const baseMintPrice = await getMintPrice();
      console.log('💰 Base mint price:', baseMintPrice.toString(), 'wei');

      // Calculate discounted price
      const actualPrice = baseMintPrice * BigInt(100 - discountPercent) / BigInt(100);
      console.log('💸 Discounted price:', actualPrice.toString(), 'wei', `(${discountPercent}% discount)`);

      // Send transaction
      const hash = await walletClient.writeContract({
        address: CONTRACTS.PROMPT_NFT,
        abi: PROMPT_NFT_ABI,
        functionName: 'mint',
        args: [to as `0x${string}`, tokenURI],
        value: actualPrice,
        chain: sepolia
      });

      console.log('📤 Transaction sent:', hash);

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1
      });

      console.log('✅ Transaction confirmed:', receipt);

      // Parse tokenId - get from event logs
      let tokenId = 0;
      if (receipt.logs && receipt.logs.length > 0) {
        // Transfer event topic0
        const transferEventSignature = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
        const transferLog = receipt.logs.find(log => 
          log.topics[0] === transferEventSignature
        );
        
        if (transferLog && transferLog.topics[3]) {
          // tokenId is in the 4th topic of Transfer event
          tokenId = parseInt(transferLog.topics[3], 16);
          console.log('🎯 Parsed Token ID:', tokenId);
        } else {
          // If unable to parse from logs, try reading totalSupply
          const totalSupply = await publicClient.readContract({
            address: CONTRACTS.PROMPT_NFT,
            abi: PROMPT_NFT_ABI,
            functionName: 'totalSupply'
          });
          tokenId = Number(totalSupply);
          console.log('📊 Inferred Token ID from totalSupply:', tokenId);
        }
      }

      const result = {
        success: true,
        tokenId,
        transactionHash: receipt.transactionHash
      };

      setMintResult(result);
      console.log('🎉 NFT minting successful!', result);
      
      return result;

    } catch (error: any) {
      console.error('❌ Minting failed:', error);
      
      let errorMessage = 'Minting failed';
      if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient balance, please ensure you have enough ETH for gas fees';
      } else if (error.message?.includes('user rejected')) {
        errorMessage = 'User cancelled the transaction';
      } else if (error.shortMessage) {
        errorMessage = error.shortMessage;
      }

      const result = {
        success: false,
        error: errorMessage
      };
      
      setMintResult(result);
      return result;
      
    } finally {
      setIsMinting(false);
    }
  };

  return {
    mintNFT,
    isMinting,
    mintResult,
    contracts: CONTRACTS
  };
}