#!/bin/bash

echo "🚀 开始部署VRF监控增强功能..."

# 1. 检查环境
echo "🔧 检查环境配置..."
if [ ! -f .env.local ]; then
    echo "⚠️ 未找到.env.local文件，请配置环境变量"
    exit 1
fi

# 2. 安装依赖
echo "📦 安装依赖..."
npm install

# 3. 构建项目
echo "🔨 构建项目..."
npm run build

# 4. 检查API路由
echo "🔍 检查API路由..."
if [ ! -f "src/app/api/vrf-request/route.ts" ]; then
    echo "❌ VRF请求路由不存在"
    exit 1
fi

if [ ! -f "src/app/api/vrf-monitor/route.ts" ]; then
    echo "❌ VRF监控路由不存在"
    exit 1
fi

# 5. 启动开发服务器
echo "🌟 启动开发服务器..."
npm run dev &
DEV_PID=$!

# 等待服务器启动
sleep 10

# 6. 运行测试
echo "🧪 运行集成测试..."
npm run vrf-test

# 7. 显示状态
echo "📊 显示VRF监控状态..."
npm run vrf-monitor-api

echo "✅ VRF监控增强功能部署完成！"
echo ""
echo "📋 可用的命令："
echo "  npm run vrf-test           - 运行VRF监控测试"
echo "  npm run vrf-monitor-api    - 查看VRF监控状态"
echo "  npm run vrf-status         - 查看VRF请求状态"
echo ""
echo "🌐 访问地址："
echo "  开发服务器: http://localhost:3000"
echo "  VRF监控API: http://localhost:3000/api/vrf-monitor"
echo "  VRF请求API: http://localhost:3000/api/vrf-request"

# 保持脚本运行
wait $DEV_PID
