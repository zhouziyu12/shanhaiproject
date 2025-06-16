'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ConnectWallet, useWallet } from '@/components/web3/ConnectWallet';
import { Badge } from '@/components/ui/badge';

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isConnected, mounted } = useWallet();

  return (
    <nav className="relative z-20 border-b border-white/10 bg-black/20 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">神</span>
            </div>
            <span className="text-white font-bold text-xl">神图计划</span>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
              Beta
            </Badge>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-white/80 hover:text-white transition-colors">
              首页
            </Link>
            <Link href="/mint" className="text-white/80 hover:text-white transition-colors flex items-center gap-1">
              <span className="text-lg">🎨</span>
              创造神兽
            </Link>
            <Link href="/gallery" className="text-white/80 hover:text-white transition-colors flex items-center gap-1">
              <span className="text-lg">📚</span>
              神兽图鉴
            </Link>
            <Link href="/marketplace" className="text-white/80 hover:text-white transition-colors flex items-center gap-1">
              <span className="text-lg">🛒</span>
              交易市场
            </Link>
            <Link href="/tokens" className="text-white/80 hover:text-white transition-colors flex items-center gap-1">
              <span className="text-lg">🪙</span>
              代币中心
            </Link>
          </div>

          {/* Connect Button */}
          <div className="hidden md:flex items-center space-x-4">
            {mounted && isConnected && (
              <div className="flex items-center gap-2 text-sm text-white/70">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>已连接</span>
              </div>
            )}
            <ConnectWallet />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            <Link href="/" className="block text-white/80 hover:text-white py-2">
              🏠 首页
            </Link>
            <Link href="/mint" className="block text-white/80 hover:text-white py-2">
              🎨 创造神兽
            </Link>
            <Link href="/gallery" className="block text-white/80 hover:text-white py-2">
              📚 神兽图鉴
            </Link>
            <Link href="/marketplace" className="block text-white/80 hover:text-white py-2">
              🛒 交易市场
            </Link>
            <Link href="/tokens" className="block text-white/80 hover:text-white py-2">
              🪙 代币中心
            </Link>
            <div className="pt-4">
              <ConnectWallet />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
