'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Image as ImageIcon, 
  Download, 
  ZoomIn, 
  Loader2, 
  Sparkles,
  Eye,
  Share2,
  RotateCcw
} from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ArtStyle } from '@/types/api';
import { getStyleInfo } from '@/config/web3';
import { cn } from '@/lib/utils';

interface AIPreviewProps {
  imageUrl?: string;
  isLoading?: boolean;
  style: ArtStyle;
  error?: string;
  onDownload?: () => void;
  onShare?: () => void;
  onRegenerate?: () => void;
}

export function AIPreview({
  imageUrl,
  isLoading = false,
  style,
  error,
  onDownload,
  onShare,
  onRegenerate
}: AIPreviewProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const styleInfo = getStyleInfo(style);

  // 加载状态组件
  const LoadingState = () => (
    <div className="aspect-square bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative">
          <Loader2 className="h-12 w-12 text-purple-400 animate-spin mx-auto" />
          <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping" />
        </div>
        <div className="space-y-2">
          <p className="text-white font-medium">AI正在创作中...</p>
          <p className="text-white/60 text-sm">这可能需要几秒钟</p>
        </div>
        <div className="flex justify-center space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );

  // 空状态组件
  const EmptyState = () => (
    <div className="aspect-square border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center">
      <div className="text-center space-y-4 p-8">
        <div className="relative">
          <ImageIcon className="h-16 w-16 text-white/30 mx-auto" />
          <Sparkles className="h-6 w-6 text-purple-400 absolute -top-1 -right-1" />
        </div>
        <div className="space-y-2">
          <p className="text-white/60 font-medium">AI生成的神兽将在这里显示</p>
          <p className="text-white/40 text-sm">输入描述开始创作你的专属神兽</p>
        </div>
      </div>
    </div>
  );

  // 错误状态组件
  const ErrorState = () => (
    <div className="aspect-square bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center">
      <div className="text-center space-y-4 p-8">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
          <ImageIcon className="h-8 w-8 text-red-400" />
        </div>
        <div className="space-y-2">
          <p className="text-red-400 font-medium">生成失败</p>
          <p className="text-red-300/80 text-sm">{error || '请重试或联系支持'}</p>
        </div>
        {onRegenerate && (
          <Button onClick={onRegenerate} size="sm" variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            重新生成
          </Button>
        )}
      </div>
    </div>
  );

  // 图片预览组件
  const ImagePreview = () => (
    <div className="relative group">
      <div className="aspect-square relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10">
        <img
          src={imageUrl}
          alt="AI Generated Beast"
          className={cn(
            "w-full h-full object-cover transition-all duration-500",
            imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
          )}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
        
        {/* 加载遮罩 */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}

        {/* 样式标签 */}
        <Badge 
          className={cn(
            "absolute top-3 left-3 transition-opacity",
            "bg-gradient-to-r", styleInfo.color
          )}
        >
          {styleInfo.name}
        </Badge>

        {/* AI标识 */}
        <Badge className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-pink-500">
          <Sparkles className="mr-1 h-3 w-3" />
          AI生成
        </Badge>

        {/* 操作按钮遮罩 */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300">
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex gap-2">
              {/* 放大查看 */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="secondary" className="bg-white/20 backdrop-blur-sm">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <div className="relative">
                    <img
                      src={imageUrl}
                      alt="AI Generated Beast - Full Size"
                      className="w-full h-auto rounded-lg"
                    />
                  </div>
                </DialogContent>
              </Dialog>

              {/* 下载 */}
              {onDownload && (
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={onDownload}
                  className="bg-white/20 backdrop-blur-sm"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}

              {/* 分享 */}
              {onShare && (
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={onShare}
                  className="bg-white/20 backdrop-blur-sm"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-white/70 border-white/20">
            <Eye className="mr-1 h-3 w-3" />
            1024x1024
          </Badge>
          <Badge variant="outline" className="text-white/70 border-white/20">
            PNG格式
          </Badge>
        </div>

        <div className="flex gap-2">
          {onDownload && (
            <Button size="sm" variant="ghost" onClick={onDownload}>
              <Download className="mr-1 h-3 w-3" />
              下载
            </Button>
          )}
          {onRegenerate && (
            <Button size="sm" variant="ghost" onClick={onRegenerate}>
              <RotateCcw className="mr-1 h-3 w-3" />
              重新生成
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* 标题 */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              AI创作预览
            </h3>
            {imageUrl && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                生成完成
              </Badge>
            )}
          </div>

          {/* 内容区域 */}
          <div>
            {isLoading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState />
            ) : imageError ? (
              <ErrorState />
            ) : imageUrl ? (
              <ImagePreview />
            ) : (
              <EmptyState />
            )}
          </div>

          {/* 提示信息 */}
          <div className="text-xs text-white/60 space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3 w-3" />
              <span>由智谱AI CogView-3模型生成</span>
            </div>
            <div>🎨 当前风格：{styleInfo.name} - {styleInfo.description}</div>
            <div>⚡ 生成的图片将作为NFT的封面图片永久保存</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}