#!/bin/bash

echo "🔧 Fixing contract addresses with newline issues..."

# 删除可能有换行符问题的地址
echo "Removing problematic addresses..."
vercel env rm NEXT_PUBLIC_PROMPT_NFT_ADDRESS production 2>/dev/null
vercel env rm NEXT_PUBLIC_SHT_TOKEN_ADDRESS production 2>/dev/null
vercel env rm NEXT_PUBLIC_MARKETPLACE_ADDRESS production 2>/dev/null
vercel env rm VRF_COORDINATOR_ADDRESS production 2>/dev/null
vercel env rm NEXT_PUBLIC_VRF_COORDINATOR_ADDRESS production 2>/dev/null

# 重新添加正确的地址（确保没有换行符）
echo "Adding clean addresses..."
printf "0x1C466dbDddb23e123760A2EDCce54b1709Fa735A" | vercel env add NEXT_PUBLIC_PROMPT_NFT_ADDRESS production
printf "0xDd0C2E81D9134A914fcA7Db9655d9813C87D5701" | vercel env add NEXT_PUBLIC_SHT_TOKEN_ADDRESS production
printf "0x62c6FE18490398e9b77E6e1294D046e16bE1aEC4" | vercel env add NEXT_PUBLIC_MARKETPLACE_ADDRESS production
printf "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B" | vercel env add VRF_COORDINATOR_ADDRESS production
printf "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B" | vercel env add NEXT_PUBLIC_VRF_COORDINATOR_ADDRESS production

echo "✅ Addresses fixed! Redeploying..."
