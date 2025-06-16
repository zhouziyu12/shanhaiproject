// ========== next.config.ts ==========
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: [
      'via.placeholder.com',
      'ipfs.io',
      'w3s.link',
      'gateway.pinata.cloud',
      'cloudflare-ipfs.com',
      'nftstorage.link',
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 修复某些包的兼容性问题
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // 优化bundle大小
    if (!dev && !isServer) {
      if (config.optimization?.splitChunks) {
        config.optimization.splitChunks.chunks = 'all';
      }
    }

    return config;
  },
  // 重定向规则
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
  // 头部配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  // 压缩配置
  compress: true,
  // 构建输出
  output: 'standalone',
  // 性能优化
  swcMinify: true,
  // 严格模式
  reactStrictMode: true,
  // 电源偏好
  poweredByHeader: false,
  // TypeScript配置
  typescript: {
    // 构建时忽略类型错误（不推荐生产环境）
    ignoreBuildErrors: false,
  },
  // ESLint配置
  eslint: {
    // 构建时忽略ESLint错误（不推荐生产环境）
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;