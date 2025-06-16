'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectWallet } from '@/components/web3/ConnectWallet';

export function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { name: '首页', href: '/', icon: '🏠' },
    { name: '创作', href: '/mint', icon: '🎨' },
    { name: '我的图鉴', href: '/gallery', icon: '📚' },
    { name: '探索', href: '/explore', icon: '🌐' },
    { name: '代币', href: '/token', icon: '🪙' },
  ];

  return (
    <nav className="bg-black/20 backdrop-blur-sm border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🎨</span>
            <span className="text-xl font-bold text-white">神图计划</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Wallet Connection */}
          <ConnectWallet />
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <div className="flex justify-around py-3 border-t border-white/10">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'text-purple-400'
                    : 'text-white/70'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs">{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
