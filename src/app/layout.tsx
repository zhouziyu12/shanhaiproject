import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Web3Provider } from '@/components/web3/Web3Provider';
import { Navigation } from '@/components/layout/Navigation';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '神图计划 ShanHaiVerse - AI驱动的山海经神兽创作平台',
  description: '用人工智能重新演绎千年神话，DeepSeek + 智谱AI 双重技术，创造独特的山海神兽NFT',
  keywords: ['NFT', 'AI', '山海经', '神兽', '区块链', 'DeepSeek', '智谱AI'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" className="dark">
      <body className={inter.className}>
        <Web3Provider>
          <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
            {/* 背景装饰 */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* 导航栏 */}
            <Navigation />
            
            {/* 主要内容 */}
            <main className="relative z-10">
              {children}
            </main>
          </div>
        </Web3Provider>
      </body>
    </html>
  );
}
