import { useState, useEffect, useCallback } from 'react';

interface VRFMonitorResult {
  status: 'idle' | 'monitoring' | 'fulfilled' | 'timeout' | 'failed';
  rarity?: number;
  randomWord?: number;
  isRealVRF?: boolean;
  waitTime?: number;
  pollCount?: number;
  error?: string;
  startMonitoring: (tokenId: number, vrfRequestId: string) => void;
  stopMonitoring: () => void;
  retryMonitoring: () => void;
}

export function useVRFMonitor(): VRFMonitorResult {
  const [status, setStatus] = useState<VRFMonitorResult['status']>('idle');
  const [rarity, setRarity] = useState<number>();
  const [randomWord, setRandomWord] = useState<number>();
  const [isRealVRF, setIsRealVRF] = useState<boolean>();
  const [waitTime, setWaitTime] = useState<number>();
  const [pollCount, setPollCount] = useState<number>();
  const [error, setError] = useState<string>();
  
  const [currentTokenId, setCurrentTokenId] = useState<number>();
  const [currentVrfRequestId, setCurrentVrfRequestId] = useState<string>();
  const [startTime, setStartTime] = useState<number>();
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout>();

  // 开始监控
  const startMonitoring = useCallback((tokenId: number, vrfRequestId: string) => {
    console.log('🔍 开始VRF监控:', { tokenId, vrfRequestId });
    
    setCurrentTokenId(tokenId);
    setCurrentVrfRequestId(vrfRequestId);
    setStartTime(Date.now());
    setStatus('monitoring');
    setPollCount(0);
    setError(undefined);
    
    // 立即开始轮询
    pollVRFStatus(tokenId, vrfRequestId);
  }, []);

  // 停止监控
  const stopMonitoring = useCallback(() => {
    console.log('🛑 停止VRF监控');
    
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(undefined);
    }
    
    setStatus('idle');
    setCurrentTokenId(undefined);
    setCurrentVrfRequestId(undefined);
    setStartTime(undefined);
  }, [intervalId]);

  // 重试监控
  const retryMonitoring = useCallback(() => {
    if (currentTokenId && currentVrfRequestId) {
      console.log('🔄 重试VRF监控');
      stopMonitoring();
      setTimeout(() => {
        startMonitoring(currentTokenId, currentVrfRequestId);
      }, 1000);
    }
  }, [currentTokenId, currentVrfRequestId, startMonitoring, stopMonitoring]);

  // 轮询VRF状态
  const pollVRFStatus = async (tokenId: number, vrfRequestId: string) => {
    try {
      const currentTime = Date.now();
      const elapsed = startTime ? currentTime - startTime : 0;
      const currentPollCount = (pollCount || 0) + 1;
      
      setPollCount(currentPollCount);
      setWaitTime(elapsed);
      
      console.log(`🔄 VRF轮询 ${currentPollCount} - Token ${tokenId} (${Math.round(elapsed/1000)}s)`);

      // 检查超时 (5分钟)
      if (elapsed > 5 * 60 * 1000) {
        console.log('⏰ VRF监控超时');
        setStatus('timeout');
        setError('VRF监控超时');
        return;
      }

      // 查询VRF状态
      const response = await fetch(`/api/vrf-request?requestId=${vrfRequestId}`);
      const data = await response.json();

      if (data.success) {
        if (data.status === 'fulfilled') {
          console.log('🎉 VRF已完成:', data);
          
          setStatus('fulfilled');
          setRarity(data.rarity);
          setRandomWord(data.randomWord);
          setIsRealVRF(data.isRealVRF);
          
          if (intervalId) {
            clearInterval(intervalId);
            setIntervalId(undefined);
          }
          
          return;
        } else if (data.status === 'timeout') {
          console.log('⚠️ VRF请求超时');
          setStatus('timeout');
          setError('VRF请求超时');
          return;
        }
      } else {
        console.error('❌ VRF查询失败:', data.error);
        setError(data.error);
      }

      // 继续轮询
      const newIntervalId = setTimeout(() => {
        pollVRFStatus(tokenId, vrfRequestId);
      }, 3000);
      
      setIntervalId(newIntervalId);

    } catch (error) {
      console.error('❌ VRF轮询错误:', error);
      setStatus('failed');
      setError(error instanceof Error ? error.message : '轮询失败');
    }
  };

  // 清理副作用
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  return {
    status,
    rarity,
    randomWord,
    isRealVRF,
    waitTime,
    pollCount,
    error,
    startMonitoring,
    stopMonitoring,
    retryMonitoring
  };
}
