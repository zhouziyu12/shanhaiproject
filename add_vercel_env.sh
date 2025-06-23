#!/bin/bash

echo "Adding environment variables to Vercel..."

# 区块链配置
echo "0xDd0C2E81D9134A914fcA7Db9655d9813C87D5701" | vercel env add NEXT_PUBLIC_SHT_TOKEN_ADDRESS production
echo "0x1C466dbDddb23e123760A2EDCce54b1709Fa735A" | vercel env add NEXT_PUBLIC_PROMPT_NFT_ADDRESS production
echo "0x62c6FE18490398e9b77E6e1294D046e16bE1aEC4" | vercel env add NEXT_PUBLIC_MARKETPLACE_ADDRESS production

# 网络配置
echo "11155111" | vercel env add NEXT_PUBLIC_CHAIN_ID production
echo "https://sepolia.infura.io/v3/315dbedded6b4b37a95b73281cb81e22" | vercel env add NEXT_PUBLIC_RPC_URL production
echo "315dbedded6b4b37a95b73281cb81e22" | vercel env add NEXT_PUBLIC_INFURA_API_KEY production

# 钱包连接
echo "4f8e0411705d8593b875a29097a41c7a" | vercel env add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID production

# AI服务配置
echo "sk-85bd61261aa743ab94b1bc89bf6e8ad5" | vercel env add NEXT_PUBLIC_DEEPSEEK_API_KEY production
echo "sk-85bd61261aa743ab94b1bc89bf6e8ad5" | vercel env add DEEPSEEK_API_KEY production
echo "https://api.deepseek.com" | vercel env add DEEPSEEK_API_URL production

echo "3b8103a7988e4d07ad1ec8fe809ec686.vwWinLC2gkVWrTq5" | vercel env add NEXT_PUBLIC_ZHIPU_API_KEY production
echo "3b8103a7988e4d07ad1ec8fe809ec686.vwWinLC2gkVWrTq5" | vercel env add ZHIPU_API_KEY production
echo "https://open.bigmodel.cn" | vercel env add ZHIPU_API_URL production

# IPFS配置
echo "c1ef174abb557056d209" | vercel env add PINATA_API_KEY production
echo "c1ef174abb557056d209" | vercel env add NEXT_PUBLIC_PINATA_API_KEY production
echo "24a0ea730fc6155b730f794c729f256da252bb55bea32ffa477addabd98dd1c5" | vercel env add PINATA_SECRET_API_KEY production
echo "24a0ea730fc6155b730f794c729f256da252bb55bea32ffa477addabd98dd1c5" | vercel env add NEXT_PUBLIC_PINATA_SECRET_API_KEY production

# 功能开关
echo "true" | vercel env add NEXT_PUBLIC_ENABLE_AI_GENERATION production
echo "true" | vercel env add NEXT_PUBLIC_ENABLE_MARKETPLACE production
echo "true" | vercel env add NEXT_PUBLIC_ENABLE_DAILY_CHECKIN production
echo "true" | vercel env add NEXT_PUBLIC_ENABLE_VRF_RARITY production

# 项目配置
echo "神图计划 ShanHaiVerse" | vercel env add NEXT_PUBLIC_APP_NAME production
echo "AI驱动的山海经神兽创作平台，用人工智能重新演绎千年神话" | vercel env add NEXT_PUBLIC_APP_DESCRIPTION production
echo "https://shanhaiverse.com" | vercel env add NEXT_PUBLIC_APP_URL production
echo "1.0.0" | vercel env add NEXT_PUBLIC_APP_VERSION production

# 数据库
echo "file:./dev.db" | vercel env add DATABASE_URL production

echo "All environment variables added successfully!"
