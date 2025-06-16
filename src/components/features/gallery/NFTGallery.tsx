'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function NFTGallery() {
  const [isConnected, setIsConnected] = useState(false);

  if (!isConnected) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold mb-2 text-white">神兽图鉴</h2>
            <p className="text-white/60 mb-6">
              连接钱包查看你的神兽收藏
            </p>
            <Button 
              onClick={() => setIsConnected(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500"
            >
              连接钱包
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
          <span className="text-2xl">📚</span>
          神兽图鉴
        </h1>
        <p className="text-white/70">你创造的山海经神兽收藏</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['我的神兽', '普通', '稀有', '史诗'].map((label, index) => (
          <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">0</div>
              <div className="text-sm text-white/60">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardContent className="p-12 text-center">
          <div className="text-4xl mb-4">✨</div>
          <h3 className="text-xl font-bold text-white mb-2">还没有神兽</h3>
          <p className="text-white/60 mb-6">快去创造你的第一只山海神兽吧！</p>
          <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
            开始创造
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
