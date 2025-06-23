#!/bin/bash

echo "🔧 Fixing API imports..."

# 修复vrf-request路由
if grep -q "prisma" src/app/api/vrf-request/route.ts; then
    sed -i '1i import { prisma } from "@/lib/prisma";' src/app/api/vrf-request/route.ts
fi

# 修复nfts路由  
if grep -q "prisma" src/app/api/nfts/route.ts; then
    sed -i '1i import { prisma } from "@/lib/prisma";' src/app/api/nfts/route.ts
fi

echo "✅ API imports fixed!"
