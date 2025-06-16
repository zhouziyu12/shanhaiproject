'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, Star } from 'lucide-react';
import { Rarity } from '@/types/nft';
import { RARITY_CONFIG } from '@/config/web3';
import { cn } from '@/lib/utils';

interface RarityFilterProps {
  selected: Rarity | null;
  onSelect: (rarity: Rarity | null) => void;
  counts?: number[];
  disabled?: boolean;
}

export function RarityFilter({
  selected,
  onSelect,
  counts,
  disabled = false
}: RarityFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <Filter className="h-4 w-4 text-white/60" />
      <span className="text-sm text-white/60 hidden sm:inline">稀有度：</span>
      
      <div className="flex gap-1">
        {/* 全部选项 */}
        <Button
          variant={selected === null ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onSelect(null)}
          disabled={disabled}
          className={cn(
            "text-xs",
            selected === null 
              ? "bg-white/20 text-white" 
              : "text-white/80 hover:text-white hover:bg-white/10"
          )}
        >
          全部
          {counts && (
            <Badge variant="secondary" className="ml-1 text-xs bg-white/20">
              {counts.reduce((a, b) => a + b, 0)}
            </Badge>
          )}
        </Button>

        {/* 稀有度选项 */}
        {RARITY_CONFIG.NAMES.map((name, index) => {
          const isSelected = selected === index;
          const count = counts?.[index] || 0;
          const hasItems = count > 0;
          
          return (
            <Button
              key={index}
              variant={isSelected ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onSelect(index as Rarity)}
              disabled={disabled || (!hasItems && counts !== undefined)}
              className={cn(
                "text-xs relative transition-all duration-200",
                isSelected 
                  ? cn(
                      "text-white shadow-lg",
                      RARITY_CONFIG.COLORS[index as keyof typeof RARITY_CONFIG.COLORS],
                      RARITY_CONFIG.GLOW[index as keyof typeof RARITY_CONFIG.GLOW]
                    )
                  : cn(
                      "text-white/80 hover:text-white hover:bg-white/10",
                      !hasItems && counts !== undefined && "opacity-50"
                    )
              )}
            >
              {/* 稀有度图标 */}
              <Star className={cn(
                "mr-1 h-3 w-3",
                isSelected && "text-yellow-300"
              )} />
              
              {/* 稀有度名称 */}
              <span className="hidden sm:inline">{name}</span>
              <span className="sm:hidden">{name.charAt(0)}</span>
              
              {/* 数量徽章 */}
              {counts !== undefined && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "ml-1 text-xs",
                    isSelected 
                      ? "bg-white/30 text-white" 
                      : "bg-white/20 text-white/80"
                  )}
                >
                  {count}
                </Badge>
              )}

              {/* 选中时的光环效果 */}
              {isSelected && (
                <div className={cn(
                  "absolute inset-0 rounded-md opacity-20 blur-sm -z-10",
                  RARITY_CONFIG.COLORS[index as keyof typeof RARITY_CONFIG.COLORS].replace('text-', 'bg-').replace('-600', '-500')
                )} />
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}