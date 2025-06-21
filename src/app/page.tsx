'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConnectWallet, useWallet } from '@/components/web3/ConnectWallet';

export default function Home() {
  const { address, isConnected, balance, mounted } = useWallet();
  const [scrollY, setScrollY] = useState(0);
  const [currentStats, setCurrentStats] = useState({
    totalNFTs: 12847,
    activeUsers: 3256,
    totalVolume: 4521.8,
    rareMinted: 234
  });

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 模拟实时数据更新
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStats(prev => ({
        totalNFTs: prev.totalNFTs + Math.floor(Math.random() * 3),
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 5) - 2,
        totalVolume: prev.totalVolume + (Math.random() * 0.5),
        rareMinted: prev.rareMinted + (Math.random() > 0.95 ? 1 : 0)
      }));
    }, 5000);

    return () => clearInterval(interval);
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
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl animate-pulse" 
            style={{ animationDelay: '1s' }} 
          />
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
              <Link href="/mint" className="group">
                <Button size="lg" className="bg-white text-black hover:bg-gray-100 text-lg px-12 py-4 rounded-full transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-blue-500/25">
                  Start Creating
                  <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </Button>
              </Link>
              
              <Link href="/gallery" className="group">
                <Button variant="outline" size="lg" className="border-2 border-white/20 text-white hover:bg-white/10 text-lg px-12 py-4 rounded-full backdrop-blur-sm transition-all duration-300 group-hover:scale-105 group-hover:border-white/40">
                  Explore Gallery
                  <span className="ml-2 opacity-60">🔍</span>
                </Button>
              </Link>
            </div>

            {/* 钱包状态卡片 */}
            {mounted && isConnected && address && (
              <div className="mt-16 opacity-0 animate-[fadeInUp_0.8s_ease-out_1.2s_forwards]">
                <div className="inline-block bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-8 max-w-md">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                    <span className="text-gray-300 font-medium">Wallet Connected</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-400 mb-2">Wallet Address</div>
                      <div className="font-mono text-white text-lg bg-white/10 px-4 py-2 rounded-lg border border-white/20">
                        {address.slice(0, 8)}...{address.slice(-6)}
                      </div>
                    </div>

                    {balance && (
                      <div className="text-center">
                        <div className="text-sm text-gray-400 mb-2">Balance</div>
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

      {/* 实时数据展示区块 */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-light mb-4">
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Live Platform Stats
              </span>
            </h2>
            <p className="text-gray-400">Real-time platform statistics</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                value: currentStats.totalNFTs.toLocaleString(),
                label: "Total NFTs Created",
                subtitle: "神兽创造总数",
                icon: "🐉",
                color: "from-blue-500 to-cyan-500"
              },
              {
                value: currentStats.activeUsers.toLocaleString(),
                label: "Active Creators",
                subtitle: "活跃创作者数量",
                icon: "👥",
                color: "from-purple-500 to-pink-500"
              },
              {
                value: `${currentStats.totalVolume.toFixed(1)} ETH`,
                label: "Total Volume",
                subtitle: "平台交易总量",
                icon: "💎",
                color: "from-green-500 to-emerald-500"
              },
              {
                value: currentStats.rareMinted.toLocaleString(),
                label: "Legendary Beasts",
                subtitle: "传说级神兽",
                icon: "⭐",
                color: "from-yellow-500 to-orange-500"
              }
            ].map((stat, index) => (
              <div
                key={index}
                className="group relative bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 hover:bg-white/10 transition-all duration-500 hover:scale-105"
              >
                <div className="text-center">
                  <div className="text-3xl mb-3 filter drop-shadow-lg">
                    {stat.icon}
                  </div>
                  <div className={`text-2xl md:text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>
                    {stat.value}
                  </div>
                  <div className="text-white font-medium text-sm mb-1">
                    {stat.label}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {stat.subtitle}
                  </div>
                </div>
                
                {/* 实时更新指示器 */}
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            ))}
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
              Experience the next-generation AI-driven digital creation platform
            </p>
          </div>

          {/* 特色功能卡片 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "🤖",
                title: "Dual AI Systems",
                subtitle: "Dual AI Engine",
                description: "DeepSeek optimizes creative expression while ZhipuAI generates visual art. Two advanced AI systems work together to ensure every creation is a unique masterpiece.",
                gradient: "from-blue-500/20 to-cyan-500/20",
                border: "border-blue-500/30",
                stats: "98.7% Success Rate"
              },
              {
                icon: "🛡️",
                title: "Chainlink VRF",
                subtitle: "Fair Rarity System",
                description: "Using Chainlink Verifiable Random Function technology to ensure completely random and verifiable NFT rarity, eliminating any possibility of manipulation.",
                gradient: "from-purple-500/20 to-pink-500/20",
                border: "border-purple-500/30",
                stats: "100% Fairness Guarantee"
              },
              {
                icon: "🌐",
                title: "IPFS Storage",
                subtitle: "Permanent Distributed Storage",
                description: "Artworks and metadata are stored on the IPFS distributed network, ensuring your digital assets never get lost and achieving true permanent preservation.",
                gradient: "from-green-500/20 to-emerald-500/20",
                border: "border-green-500/30",
                stats: "99.99% Availability"
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
                  <p className="text-gray-300 leading-relaxed mb-4">
                    {feature.description}
                  </p>
                  <div className="text-xs text-green-400 font-medium">
                    ✅ {feature.stats}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 技术架构展示 */}
      <section className="py-32 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-light mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Technology Stack
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Built on cutting-edge blockchain and AI technologies
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: "DeepSeek AI", status: "Online", uptime: "99.9%" },
              { name: "ZhipuAI", status: "Online", uptime: "99.8%" },
              { name: "Chainlink VRF", status: "Online", uptime: "100%" },
              { name: "IPFS Network", status: "Online", uptime: "99.7%" },
              { name: "Ethereum", status: "Online", uptime: "99.9%" },
              { name: "Web3 Gateway", status: "Online", uptime: "99.5%" },
              { name: "Database Cluster", status: "Online", uptime: "99.9%" },
              { name: "CDN Network", status: "Online", uptime: "99.8%" }
            ].map((tech, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-xl p-4 text-center hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex items-center justify-center mb-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-green-400 text-xs">{tech.status}</span>
                </div>
                <div className="text-white font-medium text-sm mb-1">{tech.name}</div>
                <div className="text-gray-400 text-xs">Uptime: {tech.uptime}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 社区统计 */}
      <section className="py-20 bg-gradient-to-r from-blue-900/20 to-purple-900/20 backdrop-blur-xl">
        <div className="container mx-auto px-6 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="space-y-4">
              <div className="text-4xl font-bold text-blue-400">24/7</div>
              <div className="text-white">24/7 Service</div>
              <div className="text-gray-400 text-sm">Uninterrupted AI creation support</div>
            </div>
            <div className="space-y-4">
              <div className="text-4xl font-bold text-purple-400">5sec</div>
              <div className="text-white">Average Creation Time</div>
              <div className="text-gray-400 text-sm">Lightning-fast AI generation</div>
            </div>
            <div className="space-y-4">
              <div className="text-4xl font-bold text-green-400">0.001%</div>
              <div className="text-white">Failure Rate</div>
              <div className="text-gray-400 text-sm">High reliability guarantee</div>
            </div>
          </div>
        </div>
      </section>

      {/* 行动号召区块 */}
      <section className="py-32 relative">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-light mb-8">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Ready to Create?
              </span>
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
              Join thousands of creators using cutting-edge AI technology to create your unique digital mythical beasts
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link href="/mint" className="group">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-lg px-12 py-4 rounded-full transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-purple-500/25">
                  Start Creating Now
                  <span className="ml-2 group-hover:translate-x-1 transition-transform">🚀</span>
                </Button>
              </Link>
              
              {mounted && !isConnected && (
                <div className="text-center">
                  <ConnectWallet />
                  <p className="text-gray-400 text-sm mt-2">Connect wallet to start your creative journey</p>
                </div>
              )}
            </div>
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