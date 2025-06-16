'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RARITY_CONFIG, getRarityInfo, type RarityLevel } from '@/config/rarity';

interface RarityRevealProps {
  tokenId: number;
  vrfRequestId: string;
  onRevealComplete?: (rarity: RarityLevel) => void;
  onBack?: () => void;
}

interface VRFStatus {
  status: 'pending' | 'fulfilled' | 'failed';
  rarity?: RarityLevel;
  randomWord?: number;
  error?: string;
}

export function RarityReveal({ 
  tokenId, 
  vrfRequestId, 
  onRevealComplete,
  onBack 
}: RarityRevealProps) {
  const [vrfStatus, setVrfStatus] = useState<VRFStatus>({ status: 'pending' });
  const [countdown, setCountdown] = useState(8);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealedRarity, setRevealedRarity] = useState<RarityLevel | null>(null);

  // 轮询VRF状态
  useEffect(() => {
    const pollVRFStatus = async () => {
      try {
        const response = await fetch(`/api/vrf-request?requestId=${vrfRequestId}`);
        const data = await response.json();
        
        if (data.success) {
          setVrfStatus({
            status: data.status,
            rarity: data.rarity,
            randomWord: data.randomWord,
            error: data.error
          });

          // 如果VRF已履行，开始揭晓动画
          if (data.status === 'fulfilled' && !isRevealing) {
            setIsRevealing(true);
            setTimeout(() => {
              setRevealedRarity(data.rarity);
              onRevealComplete?.(data.rarity);
            }, 2000); // 2秒揭晓动画
          }
        }
      } catch (error) {
        console.error('轮询VRF状态失败:', error);
      }
    };

    // 立即执行一次
    pollVRFStatus();

    // 每2秒轮询一次
    const interval = setInterval(pollVRFStatus, 2000);

    return () => clearInterval(interval);
  }, [vrfRequestId, isRevealing, onRevealComplete]);

  // 倒计时效果
  useEffect(() => {
    if (vrfStatus.status === 'pending' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, vrfStatus.status]);

  // 获取当前显示的稀有度信息
  const getRarityDisplay = () => {
    if (revealedRarity !== null) {
      return getRarityInfo(revealedRarity);
    }
    return null;
  };

  const rarityInfo = getRarityDisplay();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* 标题 */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
          <span className="text-2xl">🎲</span>
          Chainlink VRF 稀有度分配
        </h1>
        <p className="text-white/70">使用链上随机数确保公平稀有度</p>
      </div>

      {/* VRF状态卡片 */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <span className="text-xl">⚡</span>
            Chainlink VRF 状态
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* VRF请求状态 */}
            <div className={`p-4 rounded-lg border ${
              vrfStatus.status === 'fulfilled' ? 'bg-green-500/10 border-green-500/30' : 
              vrfStatus.status === 'failed' ? 'bg-red-500/10 border-red-500/30' :
              'bg-blue-500/10 border-blue-500/30'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {vrfStatus.status === 'fulfilled' ? (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                ) : vrfStatus.status === 'failed' ? (
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✗</span>
                  </div>
                ) : (
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                )}
                <span className="text-white font-medium">VRF请求</span>
              </div>
              <div className="text-sm text-white/70">
                {vrfStatus.status === 'fulfilled' ? '✅ 随机数已生成' :
                 vrfStatus.status === 'failed' ? '❌ 请求失败' :
                 `🔄 等待Chainlink节点响应... ${countdown}s`}
              </div>
            </div>

            {/* 随机数生成 */}
            <div className={`p-4 rounded-lg border ${
              vrfStatus.randomWord ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/20'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  vrfStatus.randomWord ? 'bg-green-500' : 'bg-white/20'
                }`}>
                  <span className="text-white text-xs">{vrfStatus.randomWord ? '✓' : '2'}</span>
                </div>
                <span className="text-white font-medium">随机数</span>
              </div>
              <div className="text-sm text-white/70">
                {vrfStatus.randomWord ? 
                  `🎲 ${vrfStatus.randomWord}` : 
                  '等待链上随机数'}
              </div>
            </div>

            {/* 稀有度计算 */}
            <div className={`p-4 rounded-lg border ${
              revealedRarity !== null ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/20'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  revealedRarity !== null ? 'bg-green-500' : 'bg-white/20'
                }`}>
                  <span className="text-white text-xs">{revealedRarity !== null ? '✓' : '3'}</span>
                </div>
                <span className="text-white font-medium">稀有度</span>
              </div>
              <div className="text-sm text-white/70">
                {revealedRarity !== null ? 
                  '⭐ 已计算完成' : 
                  '等待稀有度计算'}
              </div>
            </div>
          </div>

          {/* VRF请求详情 */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-white/60">Token ID:</span>
                <span className="text-white ml-2">#{tokenId}</span>
              </div>
              <div>
                <span className="text-white/60">VRF Request ID:</span>
                <span className="text-white ml-2 font-mono text-xs">
                  {vrfRequestId.slice(0, 20)}...
                </span>
              </div>
              {vrfStatus.randomWord && (
                <div>
                  <span className="text-white/60">随机数:</span>
                  <span className="text-white ml-2 font-mono">{vrfStatus.randomWord}</span>
                </div>
              )}
              {revealedRarity !== null && (
                <div>
                  <span className="text-white/60">稀有度等级:</span>
                  <span className="text-white ml-2">{revealedRarity}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 稀有度揭晓区域 */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardContent className="p-8">
          {!isRevealing && vrfStatus.status === 'pending' && (
            <div className="text-center space-y-6">
              <div className="text-6xl animate-pulse">🎲</div>
              <h3 className="text-2xl font-bold text-white">正在生成稀有度...</h3>
              <div className="space-y-2">
                <p className="text-white/70">Chainlink VRF正在生成真正的随机数</p>
                <div className="flex justify-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
              
              {/* 稀有度概率展示 */}
              <div className="max-w-md mx-auto">
                <div className="text-sm text-white/60 mb-3">稀有度概率分布：</div>
                <div className="space-y-2">
                  {Object.entries(RARITY_CONFIG.LEVELS).map(([level, config]) => (
                    <div key={level} className="flex justify-between items-center">
                      <span className={`${config.color} text-sm`}>{config.name}</span>
                      <span className="text-white/60 text-sm">{config.probability}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {isRevealing && revealedRarity === null && (
            <div className="text-center space-y-6">
              <div className="text-8xl animate-spin">⭐</div>
              <h3 className="text-3xl font-bold text-white">稀有度揭晓中...</h3>
              <p className="text-white/70">准备见证您神兽的稀有程度！</p>
            </div>
          )}

          {revealedRarity !== null && rarityInfo && (
            <div className="text-center space-y-6">
              {/* 稀有度揭晓动画 */}
              <div className={`relative inline-block p-8 rounded-2xl ${rarityInfo.bgColor} ${rarityInfo.borderColor} border-2`}>
                <div className="text-8xl mb-4">
                  {revealedRarity === 4 ? '🌟' : 
                   revealedRarity === 3 ? '⭐' : 
                   revealedRarity === 2 ? '💜' : 
                   revealedRarity === 1 ? '💙' : '⚪'}
                </div>
                <Badge className={`text-2xl px-6 py-2 ${rarityInfo.bgColor} ${rarityInfo.color} ${rarityInfo.borderColor} border`}>
                  {rarityInfo.name}
                </Badge>
                
                {/* 特效标签 */}
                {RARITY_CONFIG.BONUSES[revealedRarity].special.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {RARITY_CONFIG.BONUSES[revealedRarity].special.map((effect, index) => (
                      <Badge key={index} className="bg-white/10 text-white/80 text-xs">
                        ✨ {effect}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className={`text-3xl font-bold ${rarityInfo.color}`}>
                  恭喜！您获得了{rarityInfo.name}神兽！
                </h3>
                <div className="text-white/70 space-y-2">
                  <p>🎲 随机数: {vrfStatus.randomWord}</p>
                  <p>📊 稀有度概率: {rarityInfo.probability}%</p>
                  <p>🔢 稀有度等级: {revealedRarity}</p>
                  <p>⚡ 属性倍率: {RARITY_CONFIG.BONUSES[revealedRarity].multiplier}x</p>
                </div>
              </div>

              {/* VRF技术说明 */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 max-w-2xl mx-auto">
                <div className="text-blue-400 text-sm font-medium mb-2">🔗 Chainlink VRF技术保证</div>
                <div className="text-blue-300/80 text-sm space-y-1">
                  <div>• 真正的链上随机性，无法预测或操控</div>
                  <div>• 透明的概率分配，所有人都能验证</div>
                  <div>• 去中心化的随机数生成，确保公平性</div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => window.open('/gallery', '_blank')}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  查看我的神兽
                </Button>
                <Button
                  onClick={() => window.location.href = '/mint'}
                  variant="outline"
                >
                  创造新神兽
                </Button>
              </div>
            </div>
          )}

          {vrfStatus.status === 'failed' && (
            <div className="text-center space-y-6">
              <div className="text-6xl">❌</div>
              <h3 className="text-2xl font-bold text-red-400">VRF请求失败</h3>
              <p className="text-red-300">{vrfStatus.error || '请重试稀有度分配'}</p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-red-500 hover:bg-red-600"
              >
                重新请求稀有度
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 返回按钮 */}
      {onBack && (
        <div className="text-center">
          <Button
            onClick={onBack}
            variant="outline"
            disabled={vrfStatus.status === 'pending'}
          >
            返回上一步
          </Button>
        </div>
      )}
    </div>
  );
}
