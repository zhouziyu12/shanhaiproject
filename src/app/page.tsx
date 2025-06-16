'use client';

import { ConnectWallet, useWallet } from '@/components/web3/ConnectWallet';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { address, isConnected, balance, mounted } = useWallet();

  return (
    <div className="container mx-auto px-4 py-8 space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-8 py-12">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
            神图计划
            <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              ShanHaiVerse
            </span>
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            用人工智能重新演绎千年神话，DeepSeek + 智谱AI 双重技术加持，
            创造独特的山海神兽NFT，每一只都是独一无二的数字艺术品
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {mounted && isConnected ? (
            <>
              <Link href="/mint">
                <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-lg px-8">
                  <span className="mr-2">✨</span>
                  开始创造
                </Button>
              </Link>
              
              <Link href="/gallery">
                <Button variant="outline" size="lg" className="text-lg px-8 border-white/30 text-white hover:bg-white/10">
                  <span className="mr-2">🖼️</span>
                  浏览图鉴
                </Button>
              </Link>
            </>
          ) : (
            <div className="space-y-4">
              <ConnectWallet />
              <p className="text-white/60 text-sm">连接钱包开始您的神兽创作之旅</p>
            </div>
          )}
        </div>

        {/* 钱包连接状态 */}
        {mounted && isConnected && address && (
          <div className="max-w-md mx-auto bg-white/10 border border-white/20 backdrop-blur-sm rounded-lg p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white font-medium">钱包已连接</span>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-white/60 mb-1">钱包地址</div>
                <div className="font-mono text-white bg-white/10 px-3 py-1 rounded">
                  {address.slice(0, 10)}...{address.slice(-8)}
                </div>
              </div>

              {balance && (
                <div className="text-center">
                  <div className="text-sm text-white/60 mb-1">余额</div>
                  <div className="font-mono text-white bg-white/10 px-3 py-1 rounded">
                    {balance} ETH
                  </div>
                </div>
              )}

              <Badge className="w-full justify-center bg-green-500/20 text-green-400 border-green-500/30">
                ✅ 已连接到以太坊网络
              </Badge>
            </div>
          </div>
        )}
      </section>

      {/* 功能介绍 */}
      <section className="py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">平台特色</h2>
          <p className="text-white/70">为什么选择神图计划</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 p-8 text-center rounded-lg">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">双AI协作</h3>
            <p className="text-white/70">
              DeepSeek优化创意描述，智谱AI生成高质量图像，双重AI技术确保每只神兽都独一无二
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 p-8 text-center rounded-lg">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🛡️</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">公平稀有度</h3>
            <p className="text-white/70">
              使用Chainlink VRF确保稀有度分配的随机性和公平性，杜绝人为操控
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 p-8 text-center rounded-lg">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🌐</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">永久存储</h3>
            <p className="text-white/70">
              图片和元数据存储在IPFS上，确保你的神兽永不丢失，真正的数字收藏品
            </p>
          </div>
        </div>
      </section>

      {/* 状态提示 */}
      <section className="text-center py-8">
        <div className="inline-block bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg p-6">
          <h3 className="text-green-400 font-bold mb-2">🎉 Web3功能已集成！</h3>
          <p className="text-green-300/80 text-sm">
            {mounted && isConnected ? '钱包连接成功，准备开始创作！' : '请连接钱包开始使用'}
          </p>
        </div>
      </section>
    </div>
  )
}
