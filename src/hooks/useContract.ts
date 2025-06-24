import { useState } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { parseEther } from 'viem';
import { sepolia } from 'wagmi/chains';

// NFT合约ABI - 只包含需要的函数
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

// 合约地址
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

  // 获取铸造价格
  const getMintPrice = async (): Promise<bigint> => {
    try {
      const price = await publicClient?.readContract({
        address: CONTRACTS.PROMPT_NFT,
        abi: PROMPT_NFT_ABI,
        functionName: 'mintPrice'
      });
      return price || parseEther('0.001'); // 默认0.001 ETH
    } catch (error) {
      console.log('获取铸造价格失败，使用默认值:', error);
      return parseEther('0.001');
    }
  };

  // 铸造NFT（支持折扣）
  const mintNFT = async (to: string, tokenURI: string, discountPercent: number = 0): Promise<MintResult> => {
    if (!walletClient || !publicClient) {
      return { success: false, error: '钱包未连接' };
    }

    setIsMinting(true);
    setMintResult(null);

    try {
      console.log('🚀 开始铸造NFT...');
      console.log('📝 参数:', { to, tokenURI, discountPercent });

      // 获取基础铸造价格
      const baseMintPrice = await getMintPrice();
      console.log('💰 基础铸造价格:', baseMintPrice.toString(), 'wei');

      // 计算折扣后的价格
      const actualPrice = baseMintPrice * BigInt(100 - discountPercent) / BigInt(100);
      console.log('💸 折扣后价格:', actualPrice.toString(), 'wei', `(${discountPercent}% 折扣)`);

      // 发送交易
      const hash = await walletClient.writeContract({
        address: CONTRACTS.PROMPT_NFT,
        abi: PROMPT_NFT_ABI,
        functionName: 'mint',
        args: [to as `0x${string}`, tokenURI],
        value: actualPrice,
        chain: sepolia
      });

      console.log('📤 交易已发送:', hash);

      // 等待交易确认
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1
      });

      console.log('✅ 交易确认:', receipt);

      // 解析tokenId - 从事件日志中获取
      let tokenId = 0;
      if (receipt.logs && receipt.logs.length > 0) {
        // Transfer事件的topic0
        const transferEventSignature = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
        const transferLog = receipt.logs.find(log => 
          log.topics[0] === transferEventSignature
        );
        
        if (transferLog && transferLog.topics[3]) {
          // tokenId在Transfer事件的第4个topic中
          tokenId = parseInt(transferLog.topics[3], 16);
          console.log('🎯 解析出Token ID:', tokenId);
        } else {
          // 如果无法从日志解析，尝试读取totalSupply
          const totalSupply = await publicClient.readContract({
            address: CONTRACTS.PROMPT_NFT,
            abi: PROMPT_NFT_ABI,
            functionName: 'totalSupply'
          });
          tokenId = Number(totalSupply);
          console.log('📊 从totalSupply推断Token ID:', tokenId);
        }
      }

      const result = {
        success: true,
        tokenId,
        transactionHash: receipt.transactionHash
      };

      setMintResult(result);
      console.log('🎉 NFT铸造成功!', result);
      
      return result;

    } catch (error: any) {
      console.error('❌ 铸造失败:', error);
      
      let errorMessage = '铸造失败';
      if (error.message?.includes('insufficient funds')) {
        errorMessage = '余额不足，请确保有足够的ETH支付gas费';
      } else if (error.message?.includes('user rejected')) {
        errorMessage = '用户取消了交易';
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
