#!/bin/bash

echo "🧹 Cleaning duplicate Prisma imports..."

# 清理所有API路由中的重复导入
for file in src/app/api/*/route.ts; do
    if [ -f "$file" ]; then
        echo "Cleaning $file..."
        
        # 移除所有Prisma相关导入
        sed -i '/import.*prisma.*from/d' "$file"
        
        # 检查文件是否使用了prisma
        if grep -q "prisma\." "$file"; then
            # 在文件开头添加正确的导入
            sed -i '1i import { prisma } from "@/lib/prisma";' "$file"
            echo "Added Prisma import to $file"
        fi
    fi
done

echo "✅ Prisma imports cleaned!"
