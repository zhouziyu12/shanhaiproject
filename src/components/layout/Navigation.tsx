'use client';

import Link from 'next/link';
import { useState } from 'react';

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-white/80 hover:text-white transition-colors">
              首页
            </Link>
            <Link href="/mint" className="text-white/80 hover:text-white transition-colors">
              创造神兽
            </Link>
            <Link href="/gallery" className="text-white/80 hover:text-white transition-colors">
              神兽图鉴
            </Link>
            <Link href="/marketplace" className="text-white/80 hover:text-white transition-colors">
              交易市场
            </Link>
            <Link href="/tokens" className="text-white/80 hover:text-white transition-colors">
              代币中心
            </Link>
          </div>

          {/* Connect Button */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg transition-all">
              连接钱包
            </button>
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
              首页
            </Link>
            <Link href="/mint" className="block text-white/80 hover:text-white py-2">
              创造神兽
            </Link>
            <Link href="/gallery" className="block text-white/80 hover:text-white py-2">
              神兽图鉴
            </Link>
            <Link href="/marketplace" className="block text-white/80 hover:text-white py-2">
              交易市场
            </Link>
            <Link href="/tokens" className="block text-white/80 hover:text-white py-2">
              代币中心
            </Link>
            <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg mt-4">
              连接钱包
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
