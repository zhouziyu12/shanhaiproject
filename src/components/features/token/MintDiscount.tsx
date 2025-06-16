'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTokenManagement } from '@/hooks/useTokenManagement';

interface MintDiscountProps {
  onDiscountApplied?: (discountPercent: number, shtUsed: string) => void;
  disabled?: boolean;
}

export function MintDiscount({ onDiscountApplied, disabled = false }: MintDiscountProps) {
  const {
    tokenBalance,
    calculateMintDiscount,
    useMintDiscount,
    formatTokenAmount
  } = useTokenManagement();

  const [shtAmount, setShtAmount] = useState('');
  const [discountPreview, setDiscountPreview] = useState({
    discountPercent: 0,
    actualShtUsed: '0',
    maxShtForMaxDiscount: '4500'
  });
  const [isApplying, setIsApplying] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<{
    percent: number;
    shtUsed: string;
  } | null>(null);

  // 实时计算折扣预览
  useEffect(() => {
    const preview = calculateMintDiscount(shtAmount);
    setDiscountPreview(preview);
  }, [shtAmount, calculateMintDiscount]);

  // 应用折扣
  const handleApplyDiscount = async () => {
    if (!shtAmount || parseFloat(shtAmount) <= 0) {
      alert('请输入有效的SHT数量');
      return;
    }

    if (parseFloat(shtAmount) > parseFloat(tokenBalance)) {
      alert('SHT余额不足');
      return;
    }

    setIsApplying(true);

    try {
      const result = await useMintDiscount(discountPreview.actualShtUsed);
      
      if (result.success) {
        setAppliedDiscount({
          percent: result.discountPercent,
          shtUsed: discountPreview.actualShtUsed
        });
        setShtAmount('');
        onDiscountApplied?.(result.discountPercent, discountPreview.actualShtUsed);
      }
    } catch (error) {
      console.error('应用折扣失败:', error);
      alert(`应用折扣失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsApplying(false);
    }
  };

  // 快捷设置SHT数量
  const setQuickAmount = (percent: number) => {
    const balance = parseFloat(tokenBalance);
    const amount = (balance * percent / 100).toString();
    setShtAmount(amount);
  };

  // 设置最大折扣
  const setMaxDiscount = () => {
    setShtAmount(discountPreview.maxShtForMaxDiscount);
  };

  // 清除折扣
  const clearDiscount = () => {
    setAppliedDiscount(null);
    setShtAmount('');
    onDiscountApplied?.(0, '0');
  };

  // 如果余额为0，显示提示
  if (parseFloat(tokenBalance) === 0) {
    return (
      <Card className="bg-yellow-500/10 border-yellow-500/20 backdrop-blur-sm">
        <CardContent className="p-6 text-center">
          <div className="text-4xl mb-3">🪙</div>
          <h3 className="text-lg font-bold text-yellow-400 mb-2">需要SHT代币</h3>
          <p className="text-yellow-300/80 text-sm mb-4">
            使用SHT代币可获得铸造费用折扣，快去每日签到获得代币吧！
          </p>
          <Button
            onClick={() => window.open('/token', '_blank')}
            className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30"
          >
            去签到获得SHT
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <span className="text-xl">💰</span>
          SHT代币折扣
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 当前余额显示 */}
        <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
          <span className="text-white/70">当前余额:</span>
          <span className="text-green-400 font-bold">
            {formatTokenAmount(tokenBalance)} SHT
          </span>
        </div>

        {appliedDiscount ? (
          /* 已应用折扣显示 */
          <div className="space-y-4">
            <div className="text-center bg-green-500/20 border border-green-500/30 rounded-lg p-4">
              <div className="text-3xl mb-2">✅</div>
              <h3 className="text-xl font-bold text-green-400 mb-2">折扣已应用</h3>
              <div className="space-y-1">
                <div className="text-green-300">
                  获得 <span className="font-bold">{appliedDiscount.percent}%</span> 折扣
                </div>
                <div className="text-green-300/80 text-sm">
                  使用了 {formatTokenAmount(appliedDiscount.shtUsed)} SHT
                </div>
              </div>
            </div>
            
            <Button
              onClick={clearDiscount}
              variant="outline"
              className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
              disabled={disabled}
            >
              清除折扣
            </Button>
          </div>
        ) : (
          /* 折扣设置界面 */
          <div className="space-y-4">
            {/* SHT数量输入 */}
            <div>
              <label className="block text-white/70 text-sm mb-2">
                使用SHT数量 (50 SHT = 1% 折扣)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={shtAmount}
                  onChange={(e) => setShtAmount(e.target.value)}
                  placeholder="输入SHT数量"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/50 focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 focus:outline-none"
                  disabled={disabled || isApplying}
                  max={tokenBalance}
                  min="0"
                  step="1"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 text-sm">
                  SHT
                </span>
              </div>
            </div>

            {/* 快捷按钮 */}
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setQuickAmount(25)}
                className="text-white/70 border-white/30 hover:bg-white/10"
                disabled={disabled || isApplying}
              >
                25%
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setQuickAmount(50)}
                className="text-white/70 border-white/30 hover:bg-white/10"
                disabled={disabled || isApplying}
              >
                50%
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setQuickAmount(100)}
                className="text-white/70 border-white/30 hover:bg-white/10"
                disabled={disabled || isApplying}
              >
                全部
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={setMaxDiscount}
                className="text-green-400 border-green-500/30 hover:bg-green-500/10"
                disabled={disabled || isApplying}
              >
                最大折扣 (90%)
              </Button>
            </div>

            {/* 折扣预览 */}
            {shtAmount && parseFloat(shtAmount) > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h4 className="text-blue-400 font-medium mb-3">折扣预览</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/70">使用SHT:</span>
                    <span className="text-white">{formatTokenAmount(discountPreview.actualShtUsed)} SHT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">获得折扣:</span>
                    <span className="text-green-400 font-bold">{discountPreview.discountPercent}%</span>
                  </div>
                  {parseFloat(shtAmount) > parseFloat(discountPreview.actualShtUsed) && (
                    <div className="text-yellow-400 text-xs">
                      注意: 超过最大折扣的SHT不会被使用
                    </div>
                  )}
                  {parseFloat(shtAmount) > parseFloat(tokenBalance) && (
                    <div className="text-red-400 text-xs">
                      错误: SHT余额不足
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 应用按钮 */}
            <Button
              onClick={handleApplyDiscount}
              disabled={
                disabled || 
                isApplying || 
                !shtAmount || 
                parseFloat(shtAmount) <= 0 || 
                parseFloat(shtAmount) > parseFloat(tokenBalance)
              }
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              {isApplying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  应用折扣中...
                </>
              ) : (
                <>
                  <span className="mr-2">💰</span>
                  应用SHT折扣
                </>
              )}
            </Button>

            {/* 折扣说明 */}
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-white/70 text-xs space-y-1">
                <div>• 50 SHT = 1% 铸造费用折扣</div>
                <div>• 最高可获得90%折扣 (需要4500 SHT)</div>
                <div>• 使用的SHT代币将被永久销毁</div>
                <div>• 每次铸造只能使用一次折扣</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
