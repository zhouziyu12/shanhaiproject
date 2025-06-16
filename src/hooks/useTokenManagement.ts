'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/components/web3/ConnectWallet';

// 代币相关类型定义
export interface CheckInInfo {
  lastCheckInDay: number;
  consecutiveDays: number;
  totalCheckIns: number;
  totalEarned: string;
  canCheckInNow: boolean;
  nextReward: string;
}

export interface TokenInfo {
  name: string;
  symbol: string;
  balance: string;
  baseReward: string;
  maxConsecutiveBonus: number;
  discountRate: string;
  maxDiscount: number;
}

export interface MintDiscountInfo {
  discountPercent: number;
  actualShtUsed: string;
  maxShtForMaxDiscount: string;
}

export function useTokenManagement() {
  const { address, isConnected } = useWallet();
  const [tokenBalance, setTokenBalance] = useState('0');
  const [checkInInfo, setCheckInInfo] = useState<CheckInInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  // 从localStorage获取模拟数据
  const getStoredTokenData = useCallback(() => {
    if (!address || typeof window === 'undefined') return null;
    
    try {
      const key = `sht_token_${address.toLowerCase()}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('读取代币数据失败:', error);
      return null;
    }
  }, [address]);

  // 保存模拟数据到localStorage
  const saveTokenData = useCallback((data: any) => {
    if (!address || typeof window === 'undefined') return;
    
    try {
      const key = `sht_token_${address.toLowerCase()}`;
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('保存代币数据失败:', error);
    }
  }, [address]);

  // 获取当前日期（天数）
  const getCurrentDay = () => {
    return Math.floor(Date.now() / 86400000); // 86400000ms = 1天
  };

  // 计算签到奖励
  const calculateCheckInReward = (consecutiveDays: number): string => {
    const baseReward = 100; // 100 SHT
    const maxBonus = 7;
    const bonusPerDay = 20; // 20 SHT per day
    
    const effectiveDays = Math.min(consecutiveDays, maxBonus);
    const bonus = (effectiveDays - 1) * bonusPerDay;
    return (baseReward + bonus).toString();
  };

  // 加载代币数据
  const loadTokenData = useCallback(async () => {
    if (!isConnected || !address) {
      setTokenBalance('0');
      setCheckInInfo(null);
      return;
    }

    setIsLoading(true);

    try {
      // 模拟从区块链读取数据
      await new Promise(resolve => setTimeout(resolve, 1000));

      const storedData = getStoredTokenData();
      const currentDay = getCurrentDay();

      if (storedData) {
        // 使用存储的数据
        setTokenBalance(storedData.balance || '0');
        
        // 检查是否可以签到
        const canCheckInNow = storedData.checkInData.lastCheckInDay < currentDay;
        const nextConsecutive = canCheckInNow ? 
          (storedData.checkInData.lastCheckInDay === currentDay - 1 ? storedData.checkInData.consecutiveDays + 1 : 1) : 
          storedData.checkInData.consecutiveDays;

        setCheckInInfo({
          ...storedData.checkInData,
          canCheckInNow,
          nextReward: calculateCheckInReward(nextConsecutive)
        });
      } else {
        // 初始化新用户数据
        const initialData = {
          balance: '0',
          checkInData: {
            lastCheckInDay: 0,
            consecutiveDays: 0,
            totalCheckIns: 0,
            totalEarned: '0',
            canCheckInNow: true,
            nextReward: '100'
          }
        };

        setTokenBalance('0');
        setCheckInInfo(initialData.checkInData);
        saveTokenData(initialData);
      }
    } catch (error) {
      console.error('加载代币数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, getStoredTokenData, saveTokenData]);

  // 每日签到
  const dailyCheckIn = async (): Promise<boolean> => {
    if (!isConnected || !address || !checkInInfo?.canCheckInNow) {
      return false;
    }

    setIsCheckingIn(true);

    try {
      console.log('🎁 开始每日签到...');
      
      // 模拟区块链交易
      await new Promise(resolve => setTimeout(resolve, 2000));

      const currentDay = getCurrentDay();
      const storedData = getStoredTokenData() || { balance: '0', checkInData: checkInInfo };

      // 计算新的连续签到天数
      let newConsecutiveDays = 1;
      if (storedData.checkInData.lastCheckInDay === currentDay - 1) {
        newConsecutiveDays = storedData.checkInData.consecutiveDays + 1;
      }

      // 计算奖励
      const reward = calculateCheckInReward(newConsecutiveDays);
      const newBalance = (parseFloat(storedData.balance) + parseFloat(reward)).toString();

      // 更新数据
      const newData = {
        balance: newBalance,
        checkInData: {
          lastCheckInDay: currentDay,
          consecutiveDays: newConsecutiveDays,
          totalCheckIns: storedData.checkInData.totalCheckIns + 1,
          totalEarned: (parseFloat(storedData.checkInData.totalEarned) + parseFloat(reward)).toString(),
          canCheckInNow: false,
          nextReward: calculateCheckInReward(newConsecutiveDays + 1)
        }
      };

      // 保存数据
      saveTokenData(newData);
      setTokenBalance(newBalance);
      setCheckInInfo(newData.checkInData);

      console.log('✅ 签到成功！获得', reward, 'SHT');
      return true;

    } catch (error) {
      console.error('❌ 签到失败:', error);
      return false;
    } finally {
      setIsCheckingIn(false);
    }
  };

  // 计算铸造折扣
  const calculateMintDiscount = (shtAmount: string): MintDiscountInfo => {
    const amount = parseFloat(shtAmount || '0');
    const discountRate = 50; // 50 SHT = 1% 折扣
    const maxDiscount = 90; // 最大90%折扣
    
    if (amount === 0) {
      return {
        discountPercent: 0,
        actualShtUsed: '0',
        maxShtForMaxDiscount: (maxDiscount * discountRate).toString()
      };
    }

    let discountPercent = Math.floor(amount / discountRate);
    let actualShtUsed = shtAmount;

    if (discountPercent > maxDiscount) {
      discountPercent = maxDiscount;
      actualShtUsed = (maxDiscount * discountRate).toString();
    }

    return {
      discountPercent,
      actualShtUsed,
      maxShtForMaxDiscount: (maxDiscount * discountRate).toString()
    };
  };

  // 使用代币进行铸造折扣
  const useMintDiscount = async (shtAmount: string): Promise<{ success: boolean; discountPercent: number }> => {
    if (!isConnected || !address) {
      return { success: false, discountPercent: 0 };
    }

    const amount = parseFloat(shtAmount);
    const currentBalance = parseFloat(tokenBalance);

    if (amount > currentBalance) {
      throw new Error('SHT余额不足');
    }

    try {
      console.log('💰 使用SHT代币进行铸造折扣...', shtAmount);

      // 模拟区块链交易
      await new Promise(resolve => setTimeout(resolve, 1500));

      const discountInfo = calculateMintDiscount(shtAmount);
      const newBalance = (currentBalance - parseFloat(discountInfo.actualShtUsed)).toString();

      // 更新余额
      const storedData = getStoredTokenData() || { balance: tokenBalance, checkInData: checkInInfo };
      storedData.balance = newBalance;
      saveTokenData(storedData);
      setTokenBalance(newBalance);

      console.log('✅ 折扣使用成功！获得', discountInfo.discountPercent, '%折扣');
      return { success: true, discountPercent: discountInfo.discountPercent };

    } catch (error) {
      console.error('❌ 使用折扣失败:', error);
      throw error;
    }
  };

  // 获取代币基本信息
  const getTokenInfo = (): TokenInfo => {
    return {
      name: 'ShanHaiToken',
      symbol: 'SHT',
      balance: tokenBalance,
      baseReward: '100',
      maxConsecutiveBonus: 7,
      discountRate: '50',
      maxDiscount: 90
    };
  };

  // 格式化代币数量显示
  const formatTokenAmount = (amount: string, decimals: number = 2): string => {
    const num = parseFloat(amount || '0');
    return num.toLocaleString('zh-CN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    });
  };

  // 调试函数
  const debugTokenData = () => {
    console.log('🐛 SHT代币调试信息:', {
      address,
      isConnected,
      tokenBalance,
      checkInInfo,
      storedData: getStoredTokenData(),
      currentDay: getCurrentDay()
    });
  };

  // 清空代币数据（用于测试）
  const clearTokenData = () => {
    if (address) {
      const key = `sht_token_${address.toLowerCase()}`;
      localStorage.removeItem(key);
      setTokenBalance('0');
      setCheckInInfo({
        lastCheckInDay: 0,
        consecutiveDays: 0,
        totalCheckIns: 0,
        totalEarned: '0',
        canCheckInNow: true,
        nextReward: '100'
      });
      console.log('🧹 代币数据已清空');
    }
  };

  // 初始化加载
  useEffect(() => {
    loadTokenData();
  }, [loadTokenData]);

  return {
    // 状态
    tokenBalance,
    checkInInfo,
    isLoading,
    isCheckingIn,
    
    // 操作函数
    dailyCheckIn,
    calculateMintDiscount,
    useMintDiscount,
    
    // 工具函数
    getTokenInfo,
    formatTokenAmount,
    loadTokenData,
    
    // 调试函数
    debugTokenData,
    clearTokenData
  };
}
