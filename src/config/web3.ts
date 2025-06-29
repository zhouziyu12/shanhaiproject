import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

// ========== 增强版合约地址 ==========
export const SHT_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_SHT_TOKEN_ADDRESS as `0x${string}`) || '0xe2241E16949d01356bA43D9401D3775E29Ea9F4c';
export const PROMPT_NFT_ADDRESS = (process.env.NEXT_PUBLIC_PROMPT_NFT_ADDRESS as `0x${string}`) || '0xB6Cd40E35C212fA5b3064ba5834b4E0C264f91C3';
export const MARKETPLACE_ADDRESS = (process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as `0x${string}`) || '0xafC64D6c863aa7C54F07488fBf70cf9646a49963';

// 网络配置
export const targetChain = sepolia;

// RainbowKit配置 - 单例模式
let wagmiConfig: ReturnType<typeof getDefaultConfig> | null = null;

export const config = (() => {
  if (!wagmiConfig) {
    wagmiConfig = getDefaultConfig({
      appName: process.env.NEXT_PUBLIC_APP_NAME || '神图计划 ShanHaiVerse',
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '4f8e0411705d8593b875a29097a41c7a',
      chains: [sepolia],
      ssr: true,
    });
  }
  return wagmiConfig;
})();

// ========== 增强版 SHT Token ABI ==========
export const ENHANCED_SHT_TOKEN_ABI = [
  // 基础ERC20功能
  {
    "inputs": [{"internalType": "address","name": "account","type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  
  // 原有奖励功能
  {
    "inputs": [],
    "name": "claimDailyReward",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address","name": "user","type": "address"}],
    "name": "canClaimToday",
    "outputs": [{"internalType": "bool","name": "","type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  
  // ========== 🆕 新增功能 ==========
  
  // NFT持有者奖励
  {
    "inputs": [],
    "name": "claimNFTHolderReward",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address","name": "user","type": "address"}],
    "name": "canClaimNFTRewardToday",
    "outputs": [{"internalType": "bool","name": "","type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  
  // 一键领取所有奖励
  {
    "inputs": [],
    "name": "claimAllRewards",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // 增强查询功能
  {
    "inputs": [{"internalType": "address","name": "user","type": "address"}],
    "name": "getAvailableRewards",
    "outputs": [
      {"internalType": "bool","name": "canClaimDaily","type": "bool"},
      {"internalType": "bool","name": "canClaimNFT","type": "bool"},
      {"internalType": "uint256","name": "dailyAmount","type": "uint256"},
      {"internalType": "uint256","name": "nftAmount","type": "uint256"},
      {"internalType": "uint256","name": "nftBalance","type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  // 增强用户统计
  {
    "inputs": [{"internalType": "address","name": "user","type": "address"}],
    "name": "getUserStats",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256","name": "lastClaimTime","type": "uint256"},
          {"internalType": "uint256","name": "lastNFTClaimTime","type": "uint256"},
          {"internalType": "uint256","name": "consecutiveDays","type": "uint256"},
          {"internalType": "uint256","name": "totalClaimed","type": "uint256"},
          {"internalType": "uint256","name": "totalNFTRewards","type": "uint256"},
          {"internalType": "uint256","name": "mintCount","type": "uint256"}
        ],
        "internalType": "struct ShanHaiToken.UserStats",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  // 🎯 测试空投功能 (关键!)
  {
    "inputs": [
      {"internalType": "address[]","name": "recipients","type": "address[]"},
      {"internalType": "uint256[]","name": "amounts","type": "uint256[]"}
    ],
    "name": "airdrop",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // 时间查询
  {
    "inputs": [{"internalType": "address","name": "user","type": "address"}],
    "name": "getNextClaimTime",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address","name": "user","type": "address"}],
    "name": "getNextNFTClaimTime",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  
  // NFT合约地址
  {
    "inputs": [],
    "name": "shanHaiNFTAddress",
    "outputs": [{"internalType": "address","name": "","type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// NFT ABI (保持不变)
export const PROMPT_NFT_ABI = [
  {
    "inputs": [
      {"internalType": "address","name": "to","type": "address"},
      {"internalType": "string","name": "prompt","type": "string"}
    ],
    "name": "mint",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address","name": "owner","type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "tokenId","type": "uint256"}],
    "name": "getBeastInfo",
    "outputs": [
      {
        "components": [
          {"internalType": "string","name": "prompt","type": "string"},
          {"internalType": "string","name": "ipfsImageUrl","type": "string"},
          {"internalType": "string","name": "ipfsMetadataUrl","type": "string"},
          {"internalType": "uint8","name": "rarity","type": "uint8"},
          {"internalType": "uint256","name": "timestamp","type": "uint256"},
          {"internalType": "address","name": "creator","type": "address"},
          {"internalType": "bool","name": "rarityRevealed","type": "bool"},
          {"internalType": "bool","name": "hasIPFS","type": "bool"}
        ],
        "internalType": "struct ShanHaiNFT.ShanHaiBeast",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address","name": "user","type": "address"}],
    "name": "getUserBeasts",
    "outputs": [{"internalType": "uint256[]","name": "","type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getRarityDistribution",
    "outputs": [{"internalType": "uint256[5]","name": "","type": "uint256[5]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "tokenId","type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"internalType": "address","name": "","type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// ========== 兼容性别名 ==========
export const SHT_TOKEN_ABI = ENHANCED_SHT_TOKEN_ABI;

// 稀有度定义
export const RARITY_NAMES = ['普通', '稀有', '史诗', '传说', '神话'] as const;
export const RARITY_COLORS = {
  0: 'text-gray-600',   // 普通
  1: 'text-blue-600',   // 稀有  
  2: 'text-purple-600', // 史诗
  3: 'text-orange-600', // 传说
  4: 'text-red-600',    // 神话
} as const;
