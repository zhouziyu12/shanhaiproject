'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  Clock, 
  User, 
  Eye, 
  ExternalLink,
  Share2,
  Download,
  MoreVertical,
  Copy,
  Sparkles,
  ImageIcon,
  Zap
} from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Beast } from '@/types/nft';
import { RARITY_CONFIG, formatAddress } from '@/config/web3';
import { formatTime, copyToClipboard } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface BeastCardProps {
  beast: Beast;
  viewMode: 'grid' | 'list';
  onSelect?: (beast: Beast) => void;
  showActions?: boolean;
}

export function BeastCard({ 
  beast, 
  viewMode, 
  onSelect,
  showActions = true 
}: BeastCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showActions, setShowActionsVisible] = useState(false);

  const rarityInfo = {
    name: RARITY_CONFIG.NAMES[beast.rarity] || '未知',
    color: RARITY_CONFIG.COLORS[beast.rarity as keyof typeof RARITY_CONFIG.COLORS] || RARITY_CONFIG.COLORS[0],
    glow: RARITY_CONFIG.GLOW[beast.rarity as keyof typeof RARITY_CONFIG.GLOW] || RARITY_CONFIG.GLOW[0],
  };

  // 卡片点击处理
  const handleCardClick = () => {
    if (onSelect) {
      onSelect(beast);
    }
  };

  // 分享处理
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/beast/${beast.tokenId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: beast.name || `神兽 #${beast.tokenId}`,
          text: beast.prompt.substring(0, 100) + '...',
          url: url,
        });
      } catch (error) {
        copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  // 下载处理
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (beast.imageGatewayUrl) {
      const link = document.createElement('a');
      link.href = beast.imageGatewayUrl;
      link.download = `${beast.name || `beast-${beast.tokenId}`}.png`;
      link.click();
    }
  };

  // 查看详情
  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 这里可以打开详情页面或模态框
    window.open(`/beast/${beast.tokenId}`, '_blank');
  };

  if (viewMode === 'list') {
    return (
      <Card 
        className={cn(
          "bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 cursor-pointer",
          rarityInfo.glow && `hover:shadow-lg ${rarityInfo.glow}`
        )}
        onClick={handleCardClick}
      >
        <div className="flex p-4 gap-4">
          {/* 缩略图 */}
          <div className="flex-shrink-0 relative">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg overflow-hidden">
              {beast.imageGatewayUrl ? (
                <img
                  src={beast.imageGatewayUrl}
                  alt={beast.name || `Beast ${beast.tokenId}`}
                  className={cn(
                    "w-full h-full object-cover transition-all duration-300",
                    imageLoaded ? "opacity-100" : "opacity-0"
                  )}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-white/40" />
                </div>
              )}
              
              {/* 稀有度角标 */}
              <Badge 
                className={cn(
                  "absolute -top-1 -right-1 text-xs px-1.5 py-0.5",
                  rarityInfo.color
                )}
              >
                <Star className="mr-1 h-2 w-2" />
                {rarityInfo.name}
              </Badge>
            </div>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-white truncate">
                  {beast.name || `神兽 #${beast.tokenId}`}
                </h3>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <span>#{beast.tokenId}</span>
                  <span>•</span>
                  <span>{formatTime.relative(beast.timestamp)}</span>
                </div>
              </div>
              
              {showActions && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={handleShare}>
                    <Share2 className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleViewDetails}>
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            <p className="text-sm text-white/70 line-clamp-2">
              {beast.prompt}
            </p>

            <div className="flex items-center justify-between text-xs text-white/50">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {formatAddress.short(beast.creator)}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime.date(beast.timestamp)}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {beast.rarityRevealed ? (
                  <Badge variant="success" className="text-xs">
                    已揭示
                  </Badge>
                ) : (
                  <Badge variant="warning" className="text-xs">
                    揭示中
                  </Badge>
                )}
                {beast.hasIPFS && (
                  <Badge variant="secondary" className="text-xs">
                    IPFS
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Grid模式
  return (
    <Card 
      className={cn(
        "group bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 cursor-pointer overflow-hidden",
        "hover:scale-105 hover:shadow-xl",
        rarityInfo.glow && `hover:${rarityInfo.glow}`
      )}
      onClick={handleCardClick}
    >
      <div className="relative">
        {/* 图片区域 */}
        <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20">
          {beast.imageGatewayUrl ? (
            <>
              <img
                src={beast.imageGatewayUrl}
                alt={beast.name || `Beast ${beast.tokenId}`}
                className={cn(
                  "w-full h-full object-cover transition-all duration-500 group-hover:scale-110",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
              
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-white/40">
                <ImageIcon className="h-16 w-16 mx-auto mb-2" />
                <p className="text-sm">AI生成中...</p>
              </div>
            </div>
          )}

          {/* 稀有度光环 */}
          <div className={cn(
            "absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300",
            `bg-gradient-radial from-${rarityInfo.color.split('-')[0]}-500/50 to-transparent`
          )} />

          {/* 稀有度标签 */}
          <Badge 
            className={cn(
              "absolute top-2 left-2 text-xs",
              rarityInfo.color
            )}
          >
            <Star className="mr-1 h-3 w-3" />
            {rarityInfo.name}
          </Badge>

          {/* AI标识 */}
          <Badge className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-xs">
            <Sparkles className="mr-1 h-3 w-3" />
            AI
          </Badge>

          {/* 悬浮操作按钮 */}
          {showActions && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300">
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={handleViewDetails}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {beast.imageGatewayUrl && (
                    <Button size="sm" variant="secondary" onClick={handleDownload}>
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="secondary" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ID角标 */}
          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
            #{beast.tokenId}
          </div>

          {/* 状态指示器 */}
          <div className="absolute bottom-2 right-2 flex gap-1">
            {beast.rarityRevealed ? (
              <div className="w-2 h-2 bg-green-400 rounded-full" title="稀有度已揭示" />
            ) : (
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" title="稀有度揭示中" />
            )}
            {beast.hasIPFS && (
              <div className="w-2 h-2 bg-blue-400 rounded-full" title="已上传IPFS" />
            )}
          </div>
        </div>

        {/* 内容区域 */}
        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-white truncate">
              {beast.name || `神兽 #${beast.tokenId}`}
            </h3>
            <p className="text-sm text-white/70 line-clamp-2 mt-1">
              {beast.prompt}
            </p>
          </div>

          {/* 属性信息 */}
          <div className="space-y-2 text-xs text-white/50">
            <div className="flex items-center justify-between">
              <span>创建时间</span>
              <span>{formatTime.date(beast.timestamp)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>创建者</span>
              <span>{formatAddress.short(beast.creator)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>状态</span>
              <div className="flex gap-1">
                {beast.rarityRevealed ? (
                  <Badge variant="success" className="text-xs">
                    已揭示
                  </Badge>
                ) : (
                  <Badge variant="warning" className="text-xs">
                    揭示中
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}