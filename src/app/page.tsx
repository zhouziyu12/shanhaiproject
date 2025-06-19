'use client';

import { ConnectWallet, useWallet } from '@/components/web3/ConnectWallet';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export default function Home() {
  const { address, isConnected, balance, mounted } = useWallet();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-black text-white overflow-hidden">
      {/* Hero Section - 全屏幕高度 */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* 动态背景 */}
        <div className="absolute inset-0">
          {/* 主背景渐变 */}
          <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
          
          {/* 动态网格 */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              transform: `translateY(${scrollY * 0.1}px)`,
              backgroundImage: `
                linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '100px 100px'
            }}
          />
          
          {/* 光效粒子 */}
          <div className="absolute inset-0">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-blue-500 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 3}s`
                }}
              />
            ))}
          </div>

          {/* 中心光晕 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* 主要内容 */}
        <div className="relative z-10 text-center max-w-6xl mx-auto px-6">
          {/* 标题动画 */}
          <div className="space-y-8">
            <div className="inline-block">
              <div className="text-sm text-blue-400 uppercase tracking-[0.3em] mb-4 opacity-0 animate-[fadeInUp_0.8s_ease-out_0.2s_forwards]">
                Next Generation AI Platform
              </div>
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-thin leading-tight opacity-0 animate-[fadeInUp_0.8s_ease-out_0.4s_forwards]">
                神图计划
              </h1>
              <div className="text-3xl md:text-5xl lg:text-6xl font-light mt-4 opacity-0 animate-[fadeInUp_0.8s_ease-out_0.6s_forwards]">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  ShanHaiVerse
                </span>
              </div>
            </div>
            
            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed opacity-0 animate-[fadeInUp_0.8s_ease-out_0.8s_forwards]">
              Where ancient mythology meets cutting-edge AI technology.
              <br />
              Create unique digital artifacts with dual AI systems.
            </p>

            {/* CTA按钮 */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-12 opacity-0 animate-[fadeInUp_0.8s_ease-out_1s_forwards]">
              {mounted && isConnected ? (
                <>
                  <Link href="/mint" className="group">
                    <Button size="lg" className="bg-white text-black hover:bg-gray-100 text-lg px-12 py-4 rounded-full transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-blue-500/25">
                      开始创造
                      <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                    </Button>
                  </Link>
                  
                  <Link href="/gallery" className="group">
                    <Button variant="outline" size="lg" className="border-2 border-white/20 text-white hover:bg-white/10 text-lg px-12 py-4 rounded-full backdrop-blur-sm transition-all duration-300 group-hover:scale-105 group-hover:border-white/40">
                      探索图鉴
                      <span className="ml-2 opacity-60">🔍</span>
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="space-y-6">
                  <ConnectWallet />
                  <p className="text-gray-400 text-sm">连接钱包解锁全部功能</p>
                </div>
              )}
            </div>

            {/* 钱包状态卡片 */}
            {mounted && isConnected && address && (
              <div className="mt-16 opacity-0 animate-[fadeInUp_0.8s_ease-out_1.2s_forwards]">
                <div className="inline-block bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-8 max-w-md">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                    <span className="text-gray-300 font-medium">钱包已连接</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-400 mb-2">钱包地址</div>
                      <div className="font-mono text-white text-lg bg-white/10 px-4 py-2 rounded-lg border border-white/20">
                        {address.slice(0, 8)}...{address.slice(-6)}
                      </div>
                    </div>

                    {balance && (
                      <div className="text-center">
                        <div className="text-sm text-gray-400 mb-2">余额</div>
                        <div className="font-mono text-white text-lg bg-white/10 px-4 py-2 rounded-lg border border-white/20">
                          {balance} ETH
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 滚动指示器 */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* 功能特色区块 */}
      <section className="py-32 relative">
        <div className="container mx-auto px-6">
          {/* 区块标题 */}
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-light mb-6">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Revolutionary Features
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              体验下一代AI驱动的数字创作平台
            </p>
          </div>

          {/* 特色功能卡片 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "🤖",
                title: "Dual AI Systems",
                subtitle: "双AI协作引擎",
                description: "DeepSeek优化创意表达，智谱AI生成视觉艺术。两大AI系统协同工作，确保每个作品都是独一无二的艺术杰作。",
                gradient: "from-blue-500/20 to-cyan-500/20",
                border: "border-blue-500/30"
              },
              {
                icon: "🛡️",
                title: "Chainlink VRF",
                subtitle: "公平稀有度系统",
                description: "采用Chainlink可验证随机函数技术，确保每个NFT的稀有度完全随机且可验证，杜绝任何人为操控。",
                gradient: "from-purple-500/20 to-pink-500/20",
                border: "border-purple-500/30"
              },
              {
                icon: "🌐",
                title: "IPFS Storage",
                subtitle: "永久分布式存储",
                description: "作品与元数据存储在IPFS分布式网络上，确保您的数字资产永不丢失，真正实现永久保存。",
                gradient: "from-green-500/20 to-emerald-500/20",
                border: "border-green-500/30"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className={`group relative bg-gradient-to-br ${feature.gradient} border ${feature.border} backdrop-blur-xl rounded-3xl p-8 hover:scale-105 transition-all duration-500 hover:shadow-2xl`}
              >
                {/* 卡片光效 */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  <div className="text-6xl mb-6 filter drop-shadow-lg">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-light text-white mb-2">
                    {feature.title}
                  </h3>
                  <div className="text-sm text-gray-400 uppercase tracking-wide mb-4">
                    {feature.subtitle}
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 状态展示区块 */}
      <section className="py-32 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 text-center">
          <div className="inline-block bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 backdrop-blur-xl rounded-3xl p-12">
            <div className="text-6xl mb-6">✦</div>
            <h3 className="text-3xl font-light text-green-400 mb-4">
              Platform Status: Online
            </h3>
            <p className="text-green-300/80 text-lg">
              {mounted && isConnected ? 
                '系统就绪 • 准备创作您的首个数字神兽' : 
                '连接钱包以访问全部功能'
              }
            </p>
          </div>
        </div>
      </section>

      {/* 自定义CSS动画 */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}