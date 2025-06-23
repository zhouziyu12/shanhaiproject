'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RARITY_CONFIG, getRarityInfo, type RarityLevel } from '@/config/rarity';

interface RarityRevealProps {
  tokenId: number;
  vrfRequestId: string;
  mintData?: {
    originalInput: string;
    optimizedPrompt: string;
    style: string;
    creator: string;
    imageUrl: string;
    ipfsImageUrl: string;
    ipfsMetadataUrl: string;
    gatewayImageUrl: string;
  };
  onRevealComplete?: (rarity: RarityLevel) => void;
  onBack?: () => void;
}

interface VRFStatus {
  status: 'pending' | 'fulfilled' | 'failed' | 'timeout';
  rarity?: RarityLevel;
  randomWord?: number;
  isRealVRF?: boolean;
  error?: string;
  waitTime?: number;
  pollCount?: number;
  message?: string;
}

export function RarityReveal({ 
  tokenId, 
  vrfRequestId,
  mintData,
  onRevealComplete,
  onBack 
}: RarityRevealProps) {
  const [vrfStatus, setVrfStatus] = useState<VRFStatus>({ status: 'pending' });
  const [countdown, setCountdown] = useState(8);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealedRarity, setRevealedRarity] = useState<RarityLevel | null>(null);
  const [nftAddedToGallery, setNftAddedToGallery] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 🔧 直接调用API添加NFT到数据库
  const addNFTToDatabase = async (nftData: any) => {
    try {
      console.log('📚 添加NFT到数据库...', nftData);
      
      const response = await fetch('/api/nfts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: nftData.tokenId,
          name: `山海神兽 #${nftData.tokenId}`,
          originalInput: nftData.originalInput,
          optimizedPrompt: nftData.optimizedPrompt,
          style: nftData.style,
          creator: nftData.creator,
          imageUrl: nftData.imageUrl,
          ipfsImageUrl: nftData.ipfsImageUrl,
          ipfsMetadataUrl: nftData.ipfsMetadataUrl,
          gatewayImageUrl: nftData.gatewayImageUrl,
          rarity: nftData.rarity,
          vrfRequestId: nftData.vrfRequestId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API调用失败: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'API返回失败状态');
      }

      console.log('✅ NFT成功添加到数据库:', result);
      return result;
      
    } catch (error) {
      console.error('❌ 添加NFT到数据库失败:', error);
      throw error;
    }
  };

  // 🆕 增强的VRF状态轮询
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let pollCount = 0;
    const maxPolls = 60; // 最多轮询60次（3分钟）
    const startTime = Date.now();

    const pollVRFStatus = async () => {
      try {
        pollCount++;
        const waitTime = Date.now() - startTime;
        
        console.log(`🔄 增强轮询 ${pollCount}/${maxPolls} - Token ${tokenId} (${Math.round(waitTime/1000)}s)`);
        
        // 检查轮询次数限制
        if (pollCount > maxPolls) {
          console.log('⏰ 达到最大轮询次数，停止轮询');
          if (pollInterval) clearInterval(pollInterval);
          setVrfStatus({
            status: 'timeout',
            waitTime,
            pollCount,
            message: '等待超时，请手动检查或重试'
          });
          return;
        }

        const response = await fetch(`/api/vrf-request?requestId=${vrfRequestId}`);
        const data = await response.json();
        
        console.log('📊 增强VRF响应:', data);
        
        if (data.success) {
          const newStatus: VRFStatus = {
            status: data.status,
            rarity: data.rarity,
            randomWord: data.randomWord,
            isRealVRF: data.isRealVRF,
            error: data.error,
            waitTime,
            pollCount,
            message: data.message
          };
          
          setVrfStatus(newStatus);

          // 🎉 VRF完成处理
          if (data.status === 'fulfilled' && !isRevealing && revealedRarity === null) {
            console.log('🎲 增强VRF已完成，开始揭晓流程...', {
              tokenId,
              rarity: data.rarity,
              randomWord: data.randomWord,
              isRealVRF: data.isRealVRF
            });

            setIsRevealing(true);
            
            // 2秒后显示稀有度
            setTimeout(async () => {
              console.log('⭐ 设置揭晓稀有度:', data.rarity);
              setRevealedRarity(data.rarity);
              
              // 添加到图鉴
              if (mintData && !nftAddedToGallery) {
                console.log('📚 准备添加NFT到图鉴...');

                try {
                  await addNFTToDatabase({
                    tokenId,
                    originalInput: mintData.originalInput,
                    optimizedPrompt: mintData.optimizedPrompt,
                    style: mintData.style,
                    creator: mintData.creator,
                    imageUrl: mintData.imageUrl,
                    ipfsImageUrl: mintData.ipfsImageUrl,
                    ipfsMetadataUrl: mintData.ipfsMetadataUrl,
                    gatewayImageUrl: mintData.gatewayImageUrl,
                    rarity: data.rarity,
                    vrfRequestId: vrfRequestId
                  });
                  
                  setNftAddedToGallery(true);
                  setSaveError(null);
                  console.log('✅ NFT已成功添加到图鉴！');
                  
                } catch (error) {
                  console.error('❌ 添加NFT到图鉴失败:', error);
                  setSaveError(error instanceof Error ? error.message : '未知错误');
                }
              }
              
              // 通知父组件
              onRevealComplete?.(data.rarity);
            }, 2000);

            // 清除轮询
            if (pollInterval) {
              clearInterval(pollInterval);
            }
          }
          
          // 处理超时状态
          if (data.status === 'timeout') {
            console.log('⚠️ VRF请求超时');
            if (pollInterval) clearInterval(pollInterval);
          }
        }
      } catch (error) {
        console.error('❌ 增强轮询VRF状态失败:', error);
        pollCount++; // 错误也计入轮询次数
      }
    };

    // 立即执行一次
    pollVRFStatus();

    // 每3秒轮询一次（仅当状态为pending时）
    if (vrfStatus.status === 'pending') {
      pollInterval = setInterval(pollVRFStatus, 3000);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [vrfRequestId, isRevealing, revealedRarity, nftAddedToGallery, vrfStatus.status, mintData, onRevealComplete, tokenId]);

  // 手动保存NFT（备用方案）
  const manualSaveNFT = async () => {
    if (!mintData || revealedRarity === null) {
      alert('缺少必要数据，无法保存');
      return;
    }

    try {
      setSaveError(null);
      await addNFTToDatabase({
        tokenId,
        originalInput: mintData.originalInput,
        optimizedPrompt: mintData.optimizedPrompt,
        style: mintData.style,
        creator: mintData.creator,
        imageUrl: mintData.imageUrl,
        ipfsImageUrl: mintData.ipfsImageUrl,
        ipfsMetadataUrl: mintData.ipfsMetadataUrl,
        gatewayImageUrl: mintData.gatewayImageUrl,
        rarity: revealedRarity,
        vrfRequestId: vrfRequestId
      });
      
      setNftAddedToGallery(true);
      alert('NFT已成功保存到图鉴！');
      
    } catch (error) {
      console.error('手动保存失败:', error);
      setSaveError(error instanceof Error ? error.message : '未知错误');
      alert('保存失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 手动重试VRF
  const retryVRF = async () => {
    try {
      console.log('🔄 手动重试VRF请求...');
      setVrfStatus({ status: 'pending' });
      setIsRevealing(false);
      setRevealedRarity(null);
      setCountdown(8);
      
      // 重新开始轮询
      window.location.reload(); // 简单重启
      
    } catch (error) {
      console.error('❌ 重试失败:', error);
      alert('重试失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

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
          增强 Chainlink VRF 稀有度分配
        </h1>
        <p className="text-white/70">使用增强监控确保VRF成功完成</p>
      </div>

      {/* 🚨 保存错误提示 */}
      {saveError && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-red-400">
                <div className="font-medium">❌ 保存到图鉴失败</div>
                <div className="text-sm text-red-300/80">{saveError}</div>
              </div>
              <Button
                onClick={manualSaveNFT}
                className="bg-red-500 hover:bg-red-600 text-white"
                size="sm"
              >
                重试保存
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 增强VRF状态卡片 */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <span className="text-xl">⚡</span>
            增强 Chainlink VRF 监控状态
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* VRF请求状态 */}
            <div className={`p-4 rounded-lg border ${
              vrfStatus.status === 'fulfilled' ? 'bg-green-500/10 border-green-500/30' : 
              vrfStatus.status === 'failed' || vrfStatus.status === 'timeout' ? 'bg-red-500/10 border-red-500/30' :
              'bg-blue-500/10 border-blue-500/30'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {vrfStatus.status === 'fulfilled' ? (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                ) : vrfStatus.status === 'failed' || vrfStatus.status === 'timeout' ? (
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✗</span>
                  </div>
                ) : (
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                )}
                <span className="text-white font-medium">VRF状态</span>
              </div>
              <div className="text-sm text-white/70">
                {vrfStatus.status === 'fulfilled' ? '✅ 随机数已生成' :
                 vrfStatus.status === 'failed' ? '❌ 请求失败' :
                 vrfStatus.status === 'timeout' ? '⏰ 请求超时' :
                 `🔄 增强监控中... ${countdown}s`}
              </div>
            </div>

            {/* 随机数显示 */}
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

            {/* VRF类型 */}
            <div className={`p-4 rounded-lg border ${
              vrfStatus.isRealVRF ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/20'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  vrfStatus.isRealVRF ? 'bg-green-500' : 'bg-white/20'
                }`}>
                  <span className="text-white text-xs">{vrfStatus.isRealVRF ? '✓' : '3'}</span>
                </div>
                <span className="text-white font-medium">VRF类型</span>
              </div>
              <div className="text-sm text-white/70">
                {vrfStatus.isRealVRF ? '🔗 真实Chainlink VRF' : '⏳ 检测中...'}
              </div>
            </div>

            {/* 图鉴保存状态 */}
            <div className={`p-4 rounded-lg border ${
              nftAddedToGallery ? 'bg-green-500/10 border-green-500/30' : 
              saveError ? 'bg-red-500/10 border-red-500/30' :
              'bg-white/5 border-white/20'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  nftAddedToGallery ? 'bg-green-500' : 
                  saveError ? 'bg-red-500' : 'bg-white/20'
                }`}>
                  <span className="text-white text-xs">
                    {nftAddedToGallery ? '✓' : saveError ? '✗' : '4'}
                  </span>
                </div>
                <span className="text-white font-medium">图鉴保存</span>
              </div>
              <div className="text-sm text-white/70">
                {nftAddedToGallery ? '✅ 已保存到图鉴' : 
                 saveError ? '❌ 保存失败' :
                 '等待保存到图鉴'}
              </div>
            </div>
          </div>

          {/* 增强状态信息 */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-white/60">Token ID:</span>
                <span className="text-white ml-2">#{tokenId}</span>
              </div>
              <div>
                <span className="text-white/60">轮询次数:</span>
                <span className="text-white ml-2">{vrfStatus.pollCount || 0}</span>
              </div>
              <div>
                <span className="text-white/60">等待时间:</span>
                <span className="text-white ml-2">
                  {vrfStatus.waitTime ? `${Math.round(vrfStatus.waitTime/1000)}s` : '0s'}
                </span>
              </div>
              <div>
                <span className="text-white/60">监控消息:</span>
                <span className="text-white ml-2 text-xs">{vrfStatus.message || '监控中...'}</span>
              </div>
            </div>
          </div>

          {/* 错误或超时时的重试按钮 */}
          {(vrfStatus.status === 'timeout' || vrfStatus.status === 'failed') && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-yellow-400 font-medium">⚠️ VRF处理异常</div>
                  <div className="text-yellow-300/80 text-sm">
                    {vrfStatus.status === 'timeout' ? '等待超时，可能网络延迟' : '处理失败，请重试'}
                  </div>
                </div>
                <Button
                  onClick={retryVRF}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white"
                  size="sm"
                >
                  重试VRF
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 稀有度揭晓区域 */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardContent className="p-8">
          {!isRevealing && vrfStatus.status === 'pending' && (
            <div className="text-center space-y-6">
              <div className="text-6xl animate-pulse">🎲</div>
              <h3 className="text-2xl font-bold text-white">增强VRF监控进行中...</h3>
              <div className="space-y-2">
                <p className="text-white/70">Chainlink VRF正在生成真正的随机数</p>
                <p className="text-white/60 text-sm">轮询次数: {vrfStatus.pollCount || 0} | 等待时间: {vrfStatus.waitTime ? Math.round(vrfStatus.waitTime/1000) : 0}秒</p>
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
                
                {/* VRF验证标签 */}
                {vrfStatus.isRealVRF && (
                  <Badge className="absolute top-3 right-3 bg-green-500/20 text-green-400 border-green-500/30">
                    ✅ 真实VRF
                  </Badge>
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
                  <p>🔄 监控轮询: {vrfStatus.pollCount}次</p>
                  <p>⏱️ 总等待时间: {vrfStatus.waitTime ? Math.round(vrfStatus.waitTime/1000) : 0}秒</p>
                </div>
              </div>

              {/* 图鉴添加状态 */}
              {nftAddedToGallery ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 max-w-2xl mx-auto">
                  <div className="text-green-400 text-sm font-medium mb-2">📚 图鉴更新成功</div>
                  <div className="text-green-300/80 text-sm">
                    ✅ 您的神兽已自动添加到图鉴中，可以前往查看！
                  </div>
                </div>
              ) : saveError ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 max-w-2xl mx-auto">
                  <div className="text-red-400 text-sm font-medium mb-2">❌ 图鉴保存失败</div>
                  <div className="text-red-300/80 text-sm mb-3">{saveError}</div>
                  <Button
                    onClick={manualSaveNFT}
                    className="bg-red-500 hover:bg-red-600 text-white"
                    size="sm"
                  >
                    手动保存到图鉴
                  </Button>
                </div>
              ) : (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 max-w-2xl mx-auto">
                  <div className="text-yellow-400 text-sm font-medium mb-2">📚 图鉴更新中</div>
                  <div className="text-yellow-300/80 text-sm">
                    ⏳ 正在将您的神兽添加到图鉴...
                  </div>
                </div>
              )}

              {/* 增强VRF技术说明 */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 max-w-2xl mx-auto">
                <div className="text-blue-400 text-sm font-medium mb-2">🔗 增强Chainlink VRF技术</div>
                <div className="text-blue-300/80 text-sm space-y-1">
                  <div>• 真正的链上随机性，无法预测或操控</div>
                  <div>• 增强监控机制，确保VRF完成</div>
                  <div>• 智能重试机制，处理网络延迟</div>
                  <div>• 实时状态反馈，透明的执行过程</div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => window.open('/gallery', '_blank')}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  查看我的神兽图鉴
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

          {(vrfStatus.status === 'failed' || vrfStatus.status === 'timeout') && !isRevealing && (
            <div className="text-center space-y-6">
              <div className="text-6xl">❌</div>
              <h3 className="text-2xl font-bold text-red-400">VRF处理异常</h3>
              <p className="text-red-300">
                {vrfStatus.status === 'timeout' ? 
                  `监控超时 (等待${Math.round((vrfStatus.waitTime || 0)/1000)}秒)` : 
                  vrfStatus.error || 'VRF处理失败'}
              </p>
              <div className="space-y-2">
                <Button
                  onClick={retryVRF}
                  className="bg-red-500 hover:bg-red-600"
                >
                  重新监控VRF
                </Button>
                <div className="text-sm text-white/60">
                  或者联系支持团队获取帮助
                </div>
              </div>
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
