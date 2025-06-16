'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Upload, 
  Loader2, 
  Coins, 
  Clock, 
  Shield, 
  Zap,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MintButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  estimatedFee?: string;
  estimatedTime?: string;
}

export function MintButton({
  onClick,
  disabled = false,
  loading = false,
  loadingText = '铸造中...',
  estimatedFee = '免费',
  estimatedTime = '1-2分钟'
}: MintButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="space-y-4">
      {/* 铸造信息卡片 */}
      <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
        <CardContent className="p-4">
          <div className="space-y-3">
            <h4 className="font-medium text-white flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-400" />
              铸造信息
            </h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="text-white/60">铸造费用</div>
                <div className="flex items-center gap-1 text-white">
                  <Coins className="h-3 w-3 text-green-400" />
                  <span className="font-medium">{estimatedFee}</span>
                  {estimatedFee === '免费' && (
                    <Badge variant="success" className="text-xs ml-1">
                      限时免费
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-white/60">预计时间</div>
                <div className="flex items-center gap-1 text-white">
                  <Clock className="h-3 w-3 text-blue-400" />
                  <span className="font-medium">{estimatedTime}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs text-white/70">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-400" />
                <span>图片和元数据将永久存储在IPFS</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-400" />
                <span>铸造成功后获得50 SHT代币奖励</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-400" />
                <span>稀有度由VRF随机确定，公平公正</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 主要铸造按钮 */}
      <Button
        onClick={onClick}
        disabled={disabled || loading}
        className={cn(
          "w-full h-14 text-lg font-semibold transition-all duration-300",
          "bg-gradient-to-r from-green-500 to-emerald-500",
          "hover:from-green-600 hover:to-emerald-600",
          "shadow-lg shadow-green-500/25 hover:shadow-green-500/40",
          "border-0 relative overflow-hidden group",
          loading && "cursor-not-allowed",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 背景动效 */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 transition-opacity duration-300",
          isHovered && !loading && !disabled && "opacity-20"
        )} />
        
        {/* 按钮内容 */}
        <div className="relative flex items-center justify-center gap-3">
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{loadingText}</span>
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              <span>铸造神兽NFT</span>
              <Zap className="h-4 w-4 text-yellow-300" />
            </>
          )}
        </div>

        {/* 成功动效 */}
        {loading && (
          <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 animate-pulse" />
        )}
      </Button>

      {/* 风险提示 */}
      <Card className="bg-yellow-500/10 border-yellow-500/20">
        <CardContent className="p-3">
          <div className="flex items-start gap-2 text-xs">
            <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1 text-yellow-200/80">
              <div className="font-medium">铸造须知</div>
              <div>• 铸造过程不可逆，请确保AI生成的图片符合预期</div>
              <div>• 稀有度将在铸造后随机确定，无法人为干预</div>
              <div>• 请确保钱包中有足够的ETH支付gas费用</div>
              <div>• 铸造成功后NFT将立即出现在你的钱包中</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 加载状态额外信息 */}
      {loading && (
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-blue-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="font-medium">铸造进行中...</span>
              </div>
              
              <div className="space-y-2 text-sm text-blue-200/80">
                <div>🔄 正在处理交易，请勿关闭页面</div>
                <div>⏳ 区块链确认需要一些时间，请耐心等待</div>
                <div>🎯 稀有度将在确认后自动分配</div>
              </div>

              {/* 进度动画 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-blue-300">
                  <span>处理进度</span>
                  <span>确认中...</span>
                </div>
                <div className="w-full bg-blue-500/20 rounded-full h-1">
                  <div className="bg-gradient-to-r from-blue-400 to-blue-500 h-1 rounded-full animate-pulse w-3/4"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}