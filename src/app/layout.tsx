import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { Web3Provider } from '@/components/web3/Web3Provider';
import { Navigation } from '@/components/layout/Navigation';
import './globals.css';

// Font configuration - Using modern font combinations
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'ShenTu Plan ShanHaiVerse - Next Generation AI-Powered Mythical Beast Creation Platform',
  description: 'Experience the next-generation AI-driven mythical beast creation platform. Dual AI technology with DeepSeek + Zhipu AI, Chainlink VRF for fair rarity, IPFS permanent storage. Where ancient mythology meets cutting-edge technology.',
  keywords: ['NFT', 'AI', 'Shan Hai Jing', 'Mythical Beasts', 'Blockchain', 'DeepSeek', 'Zhipu AI', 'Chainlink VRF', 'IPFS', 'Web3'],
  openGraph: {
    title: 'ShenTu Plan ShanHaiVerse',
    description: 'Next Generation AI-Powered Mythical Beast Creation Platform',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShenTu Plan ShanHaiVerse',
    description: 'Next Generation AI-Powered Mythical Beast Creation Platform',
  },
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#000000'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <Web3Provider>
          <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
            {/* Global background effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
              {/* Main background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
              
              {/* Dynamic grid background */}
              <div 
                className="absolute inset-0 opacity-[0.02]"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
                  `,
                  backgroundSize: '50px 50px'
                }}
              />
              
              {/* Noise texture */}
              <div 
                className="absolute inset-0 opacity-[0.015]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
              />

              {/* Ambient lighting effects */}
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/3 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Navigation bar */}
            <div className="relative z-50">
              <Navigation />
            </div>
            
            {/* Main content */}
            <main className="relative z-10">
              {children}
            </main>

            {/* Global cursor tracking effect */}
            <div 
              id="cursor-glow"
              className="fixed pointer-events-none z-30 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl transition-all duration-300 ease-out opacity-0"
              style={{ left: '-128px', top: '-128px' }}
            />
          </div>
        </Web3Provider>

        {/* Cursor tracking script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                
                let cursorGlow = null;
                let isTouch = false;

                function initCursorGlow() {
                  cursorGlow = document.getElementById('cursor-glow');
                  if (!cursorGlow) return;

                  // Detect if it's a touch device
                  isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
                  
                  if (isTouch) {
                    cursorGlow.style.display = 'none';
                    return;
                  }

                  let mouseX = 0, mouseY = 0;
                  let currentX = 0, currentY = 0;

                  function updateMousePosition(e) {
                    mouseX = e.clientX;
                    mouseY = e.clientY;
                  }

                  function animateCursor() {
                    currentX += (mouseX - currentX) * 0.1;
                    currentY += (mouseY - currentY) * 0.1;
                    
                    if (cursorGlow) {
                      cursorGlow.style.left = (currentX - 128) + 'px';
                      cursorGlow.style.top = (currentY - 128) + 'px';
                    }
                    
                    requestAnimationFrame(animateCursor);
                  }

                  document.addEventListener('mousemove', updateMousePosition);
                  document.addEventListener('mouseenter', () => {
                    if (cursorGlow) cursorGlow.style.opacity = '1';
                  });
                  document.addEventListener('mouseleave', () => {
                    if (cursorGlow) cursorGlow.style.opacity = '0';
                  });

                  animateCursor();
                }

                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', initCursorGlow);
                } else {
                  initCursorGlow();
                }
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}