'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/components/web3/ConnectWallet';

// Token-related type definitions
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

  // Get simulated data from localStorage
  const getStoredTokenData = useCallback(() => {
    if (!address || typeof window === 'undefined') return null;
    
    try {
      const key = `sht_token_${address.toLowerCase()}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to read token data:', error);
      return null;
    }
  }, [address]);

  // Save simulated data to localStorage
  const saveTokenData = useCallback((data: any) => {
    if (!address || typeof window === 'undefined') return;
    
    try {
      const key = `sht_token_${address.toLowerCase()}`;
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save token data:', error);
    }
  }, [address]);

  // Get current date (in days)
  const getCurrentDay = () => {
    return Math.floor(Date.now() / 86400000); // 86400000ms = 1 day
  };

  // Calculate check-in reward
  const calculateCheckInReward = (consecutiveDays: number): string => {
    const baseReward = 100; // 100 SHT
    const maxBonus = 7;
    const bonusPerDay = 20; // 20 SHT per day
    
    const effectiveDays = Math.min(consecutiveDays, maxBonus);
    const bonus = (effectiveDays - 1) * bonusPerDay;
    return (baseReward + bonus).toString();
  };

  // Load token data
  const loadTokenData = useCallback(async () => {
    if (!isConnected || !address) {
      setTokenBalance('0');
      setCheckInInfo(null);
      return;
    }

    setIsLoading(true);

    try {
      // Simulate reading data from blockchain
      await new Promise(resolve => setTimeout(resolve, 1000));

      const storedData = getStoredTokenData();
      const currentDay = getCurrentDay();

      if (storedData) {
        // Use stored data
        setTokenBalance(storedData.balance || '0');
        
        // Check if can check in
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
        // Initialize new user data
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
      console.error('Failed to load token data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, getStoredTokenData, saveTokenData]);

  // Daily check-in
  const dailyCheckIn = async (): Promise<boolean> => {
    if (!isConnected || !address || !checkInInfo?.canCheckInNow) {
      return false;
    }

    setIsCheckingIn(true);

    try {
      console.log('🎁 Starting daily check-in...');
      
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000));

      const currentDay = getCurrentDay();
      const storedData = getStoredTokenData() || { balance: '0', checkInData: checkInInfo };

      // Calculate new consecutive days
      let newConsecutiveDays = 1;
      if (storedData.checkInData.lastCheckInDay === currentDay - 1) {
        newConsecutiveDays = storedData.checkInData.consecutiveDays + 1;
      }

      // Calculate reward
      const reward = calculateCheckInReward(newConsecutiveDays);
      const newBalance = (parseFloat(storedData.balance) + parseFloat(reward)).toString();

      // Update data
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

      // Save data
      saveTokenData(newData);
      setTokenBalance(newBalance);
      setCheckInInfo(newData.checkInData);

      console.log('✅ Check-in successful! Earned', reward, 'SHT');
      return true;

    } catch (error) {
      console.error('❌ Check-in failed:', error);
      return false;
    } finally {
      setIsCheckingIn(false);
    }
  };

  // Calculate mint discount
  const calculateMintDiscount = (shtAmount: string): MintDiscountInfo => {
    const amount = parseFloat(shtAmount || '0');
    const discountRate = 50; // 50 SHT = 1% discount
    const maxDiscount = 90; // Maximum 90% discount
    
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

  // Use tokens for mint discount
  const useMintDiscount = async (shtAmount: string): Promise<{ success: boolean; discountPercent: number }> => {
    if (!isConnected || !address) {
      return { success: false, discountPercent: 0 };
    }

    const amount = parseFloat(shtAmount);
    const currentBalance = parseFloat(tokenBalance);

    if (amount > currentBalance) {
      throw new Error('Insufficient SHT balance');
    }

    try {
      console.log('💰 Using SHT tokens for mint discount...', shtAmount);

      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 1500));

      const discountInfo = calculateMintDiscount(shtAmount);
      const newBalance = (currentBalance - parseFloat(discountInfo.actualShtUsed)).toString();

      // Update balance
      const storedData = getStoredTokenData() || { balance: tokenBalance, checkInData: checkInInfo };
      storedData.balance = newBalance;
      saveTokenData(storedData);
      setTokenBalance(newBalance);

      console.log('✅ Discount used successfully! Got', discountInfo.discountPercent, '% discount');
      return { success: true, discountPercent: discountInfo.discountPercent };

    } catch (error) {
      console.error('❌ Failed to use discount:', error);
      throw error;
    }
  };

  // Get token basic information
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

  // Format token amount display
  const formatTokenAmount = (amount: string, decimals: number = 2): string => {
    const num = parseFloat(amount || '0');
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    });
  };

  // Debug function
  const debugTokenData = () => {
    console.log('🐛 SHT token debug info:', {
      address,
      isConnected,
      tokenBalance,
      checkInInfo,
      storedData: getStoredTokenData(),
      currentDay: getCurrentDay()
    });
  };

  // Clear token data (for testing)
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
      console.log('🧹 Token data cleared');
    }
  };

  // Initialize loading
  useEffect(() => {
    loadTokenData();
  }, [loadTokenData]);

  return {
    // State
    tokenBalance,
    checkInInfo,
    isLoading,
    isCheckingIn,
    
    // Action functions
    dailyCheckIn,
    calculateMintDiscount,
    useMintDiscount,
    
    // Utility functions
    getTokenInfo,
    formatTokenAmount,
    loadTokenData,
    
    // Debug functions
    debugTokenData,
    clearTokenData
  };
}