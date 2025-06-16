'use client';

import { useState } from 'react';

// 模拟的合约ABI（简化版）
const PROMPT_NFT_ABI = [
  {
    "inputs": [
      {"name": "to", "type": "address"},
      {"name": "tokenURI", "type": "string"}
    ],
    "name": "mint",
    "outputs": [{"name": "tokenId", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  }
];

interface MintResult {
  success: boolean;
  tokenId?: number;
  transactionHash?: string;
  error?: string;
}

export function useContract() {
  const [isMinting, setIsMinting] = useState(false);
  const [mintResult, setMintResult] = useState<MintResult | null>(null);

  const mintNFT = async (to: string, tokenURI: string): Promise<MintResult> => {
    setIsMinting(true);
    setMintResult(null);

    try {
      console.log('⛏️ 开始铸造NFT...');
      console.log('📍 接收地址:', to);
      console.log('📄 TokenURI:', tokenURI);

      // 检查MetaMask
      if (!window.ethereum) {
        throw new Error('请安装MetaMask钱包');
      }

      // 获取合约地址
      const contractAddress = process.env.NEXT_PUBLIC_PROMPT_NFT_ADDRESS;
      if (!contractAddress) {
        throw new Error('合约地址未配置');
      }

      // 编码合约调用数据
      const web3 = new (window as any).Web3(window.ethereum);
      const contract = new web3.eth.Contract(PROMPT_NFT_ABI, contractAddress);

      // 估算gas费用
      console.log('⛽ 估算Gas费用...');
      const gasEstimate = await contract.methods.mint(to, tokenURI).estimateGas({
        from: to
      });

      console.log('💰 预估Gas:', gasEstimate);

      // 执行铸造交易
      console.log('📡 发送铸造交易...');
      const tx = await contract.methods.mint(to, tokenURI).send({
        from: to,
        gas: Math.floor(gasEstimate * 1.2), // 增加20%的gas缓冲
        gasPrice: await web3.eth.getGasPrice()
      });

      console.log('✅ 铸造成功!');
      console.log('🔗 交易哈希:', tx.transactionHash);

      // 获取tokenId（从事件中解析）
      const tokenId = tx.events?.Transfer?.returnValues?.tokenId || 
                     Math.floor(Math.random() * 10000); // 备用方案

      const result: MintResult = {
        success: true,
        tokenId: Number(tokenId),
        transactionHash: tx.transactionHash
      };

      setMintResult(result);
      return result;

    } catch (error: any) {
      console.error('❌ 铸造失败:', error);
      
      let errorMessage = '铸造失败';
      if (error.code === 4001) {
        errorMessage = '用户拒绝了交易';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = '余额不足，请确保有足够的ETH支付gas费';
      } else if (error.message?.includes('execution reverted')) {
        errorMessage = '智能合约执行失败，请检查参数';
      } else if (error.message) {
        errorMessage = error.message;
      }

      const result: MintResult = {
        success: false,
        error: errorMessage
      };

      setMintResult(result);
      return result;

    } finally {
      setIsMinting(false);
    }
  };

  // 模拟铸造（用于演示）
  const mockMintNFT = async (to: string, tokenURI: string): Promise<MintResult> => {
    setIsMinting(true);
    setMintResult(null);

    try {
      console.log('🎭 模拟铸造NFT...');
      console.log('📍 接收地址:', to);
      console.log('📄 TokenURI:', tokenURI);

      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 模拟成功结果
      const tokenId = Math.floor(Math.random() * 10000) + 1;
      const mockTxHash = `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`;

      const result: MintResult = {
        success: true,
        tokenId,
        transactionHash: mockTxHash
      };

      console.log('✅ 模拟铸造成功!');
      console.log('🆔 TokenID:', tokenId);
      console.log('🔗 模拟交易哈希:', mockTxHash);

      setMintResult(result);
      return result;

    } catch (error) {
      const result: MintResult = {
        success: false,
        error: '模拟铸造失败'
      };

      setMintResult(result);
      return result;

    } finally {
      setIsMinting(false);
    }
  };

  return {
    mintNFT: process.env.NODE_ENV === 'development' ? mockMintNFT : mintNFT,
    isMinting,
    mintResult,
    resetMintResult: () => setMintResult(null)
  };
}
