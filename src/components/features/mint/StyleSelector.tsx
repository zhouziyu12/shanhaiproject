'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Palette, Sparkles, Brush, Mountain, Zap } from 'lucide-react';
import { ArtStyle } from '@/types/api';
import { getStyleInfo } from '@/config/web3';
import { cn } from '@/lib/utils';

interface StyleSelectorProps {
  selected: ArtStyle;
  onSelect: (style: ArtStyle) => void;
  disabled?: boolean;
}

export function StyleSelector({
  selected,
  onSelect,
  disabled = false
}: StyleSelectorProps) {
  const styles: Array<{
    value: ArtStyle;
    name: string;
    description: string;
    features: string[];
    icon: React.ComponentType<{ className?: string }>;
    gradient: string;
    textColor: string;
    examples: string[];
  }> = [
    {
      value: 'classic',
      name: '古典水墨',
      description: '传统山海经风格，水墨画意境',
      features: ['传统色彩', '古雅意境', '水墨技法', '文人画风'],
      icon: Brush,
      gradient: 'from-slate-600 to-slate-800',
      textColor: 'text-slate-400',
      examples: ['水墨龙', '墨竹神鹿', '写意神鸟']
    },
    {
      value: 'modern',
      name: '现代插画',
      description: '现代艺术风格，鲜艳色彩',
      features: ['鲜艳配色', '数字艺术', '流行元素', '时尚设计'],
      icon: Palette,
      gradient: 'from-blue-600 to-purple-800',
      textColor: 'text-blue-400',
      examples: ['霓虹神兽', '赛博神龙', '未来神鸟']
    },
    {
      value: 'fantasy',
      name: '奇幻艺术',
      description: '魔幻仙侠风格，梦幻光效',
      features: ['魔法光效', '仙侠氛围', '梦幻色彩', '神秘气息'],
      icon: Sparkles,
      gradient: 'from-purple-600 to-pink-800',
      textColor: 'text-purple-400',
      examples: ['魔法神兽', '仙界神龙', '幻境神鸟']
    },
    {
      value: 'ink',
      name: '水墨写意',
      description: '中国水墨画风，写意笔触',
      features: ['泼墨技法', '意境深远', '黑白灰调', '禅意美学'],
      icon: Mountain,
      gradient: 'from-gray-600 to-black',
      textColor: 'text-gray-400',
      examples: ['写意神龙', '禅意神鹿', '墨韵神鸟']
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-white">
        <Palette className="h-4 w-4" />
        <span className="font-medium">艺术风格</span>
        <Badge variant="secondary" className="text-xs">
          选择你喜欢的艺术表现形式
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {styles.map((style) => {
          const Icon = style.icon;
          const isSelected = selected === style.value;
          
          return (
            <Card
              key={style.value}
              className={cn(
                "cursor-pointer transition-all duration-300 hover:scale-105",
                "bg-white/5 border-white/10 hover:bg-white/10",
                isSelected && "bg-gradient-to-br ring-2 ring-purple-500/50 shadow-lg shadow-purple-500/20",
                isSelected && `bg-gradient-to-br ${style.gradient} border-transparent`,
                disabled && "cursor-not-allowed opacity-50"
              )}
              onClick={() => !disabled && onSelect(style.value)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* 标题区域 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "p-2 rounded-lg",
                        isSelected ? "bg-white/20" : "bg-white/10"
                      )}>
                        <Icon className={cn(
                          "h-4 w-4",
                          isSelected ? "text-white" : style.textColor
                        )} />
                      </div>
                      <div>
                        <h3 className={cn(
                          "font-semibold",
                          isSelected ? "text-white" : "text-white/90"
                        )}>
                          {style.name}
                        </h3>
                        {isSelected && (
                          <Badge className="bg-white/20 text-white text-xs">
                            已选择
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-white" />
                      </div>
                    )}
                  </div>

                  {/* 描述 */}
                  <p className={cn(
                    "text-sm",
                    isSelected ? "text-white/90" : "text-white/70"
                  )}>
                    {style.description}
                  </p>

                  {/* 特性标签 */}
                  <div className="flex flex-wrap gap-1">
                    {style.features.map((feature, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          isSelected 
                            ? "bg-white/20 text-white border-white/30" 
                            : "bg-white/10 text-white/70 border-white/20"
                        )}
                      >
                        {feature}
                      </Badge>
                    ))}
                  </div>

                  {/* 示例 */}
                  <div className="space-y-1">
                    <div className={cn(
                      "text-xs font-medium",
                      isSelected ? "text-white/90" : "text-white/60"
                    )}>
                      示例效果：
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {style.examples.map((example, index) => (
                        <span
                          key={index}
                          className={cn(
                            "text-xs px-2 py-1 rounded",
                            isSelected 
                              ? "bg-white/10 text-white/80" 
                              : "bg-white/5 text-white/60"
                          )}
                        >
                          {example}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 当前选择的详细信息 */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-purple-400 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium text-white">
                当前风格：{styles.find(s => s.value === selected)?.name}
              </h4>
              <p className="text-sm text-white/70">
                {styles.find(s => s.value === selected)?.description}
              </p>
              <div className="text-xs text-white/60">
                💡 不同风格会影响AI生成的视觉效果，每种风格都有独特的艺术表现力
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}