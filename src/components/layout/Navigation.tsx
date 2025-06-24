'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectWallet } from '@/components/web3/ConnectWallet';
import { useState, useEffect } from 'react';

export function Navigation() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Home', href: '/', icon: '◆' },
    { name: 'Create', href: '/mint', icon: '✦' },
    { name: 'Gallery', href: '/gallery', icon: '◇' },
    { name: 'Explore', href: '/explore', icon: '◈' },
    { name: 'Token', href: '/token', icon: '◉' },
  ];

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-black/80 backdrop-blur-xl border-b border-white/10' 
          : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                {/* Logo icon */}
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white font-bold text-lg">D</span>
                </div>
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg opacity-0 group-hover:opacity-20 blur-lg transition-opacity duration-300"></div>
              </div>
              <div className="hidden sm:block">
                <div className="text-xl font-light text-white group-hover:text-blue-400 transition-colors duration-300">
                  Divine Image Project
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">
                  ShanHaiVerse
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 ${
                    pathname === item.href
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {/* Background glow effect */}
                  {pathname === item.href && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full"></div>
                  )}
                  
                  <span className={`relative z-10 transition-all duration-300 ${
                    pathname === item.href ? 'text-blue-400' : 'group-hover:text-blue-400'
                  }`}>
                    {item.icon}
                  </span>
                  <span className="relative z-10 font-medium">{item.name}</span>
                  
                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-white/5 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                </Link>
              ))}
            </div>

            {/* Desktop wallet connection */}
            <div className="hidden lg:block">
              <ConnectWallet />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden relative w-10 h-10 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-300"
            >
              <div className="relative w-6 h-6 flex flex-col justify-center">
                <span className={`block h-0.5 bg-white transition-all duration-300 ${
                  mobileMenuOpen ? 'rotate-45 translate-y-0.5' : '-translate-y-1'
                }`}></span>
                <span className={`block h-0.5 bg-white transition-all duration-300 ${
                  mobileMenuOpen ? 'opacity-0' : 'opacity-100'
                }`}></span>
                <span className={`block h-0.5 bg-white transition-all duration-300 ${
                  mobileMenuOpen ? '-rotate-45 -translate-y-0.5' : 'translate-y-1'
                }`}></span>
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`lg:hidden fixed inset-0 z-40 transition-all duration-300 ${
        mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
      }`}>
        {/* Background overlay */}
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          onClick={() => setMobileMenuOpen(false)}
        />
        
        {/* Menu content */}
        <div className={`absolute top-0 right-0 w-80 h-full bg-black/90 backdrop-blur-xl border-l border-white/10 transform transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="p-6 pt-24">
            {/* Mobile navigation links */}
            <div className="space-y-4 mb-8">
              {navItems.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`group relative flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 ${
                    pathname === item.href
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <span className={`text-2xl transition-all duration-300 ${
                    pathname === item.href ? 'text-blue-400' : 'group-hover:text-blue-400'
                  }`}>
                    {item.icon}
                  </span>
                  <span className="text-lg font-medium">{item.name}</span>
                  
                  {pathname === item.href && (
                    <div className="absolute right-4 w-2 h-2 bg-blue-400 rounded-full"></div>
                  )}
                </Link>
              ))}
            </div>

            {/* Mobile wallet connection */}
            <div className="pt-6 border-t border-white/10">
              <ConnectWallet />
            </div>

            {/* Decorative elements */}
            <div className="absolute bottom-6 left-6 right-6">
              <div className="text-center text-gray-500 text-sm">
                <div>Next Generation</div>
                <div className="text-xs opacity-60">AI Platform</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="h-20"></div>
    </>
  );
}