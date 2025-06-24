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
      name: 'Classical Ink',
      description: 'Traditional Shan Hai Jing style with ink painting aesthetics',
      features: ['Traditional Colors', 'Classical Aesthetic', 'Ink Techniques', 'Scholar Painting'],
      icon: Brush,
      gradient: 'from-slate-600 to-slate-800',
      textColor: 'text-slate-400',
      examples: ['Ink Dragon', 'Bamboo Beast', 'Freehand Bird']
    },
    {
      value: 'modern',
      name: 'Modern Illustration',
      description: 'Contemporary art style with vibrant colors',
      features: ['Vibrant Colors', 'Digital Art', 'Pop Elements', 'Fashion Design'],
      icon: Palette,
      gradient: 'from-blue-600 to-purple-800',
      textColor: 'text-blue-400',
      examples: ['Neon Beast', 'Cyber Dragon', 'Futuristic Bird']
    },
    {
      value: 'fantasy',
      name: 'Fantasy Art',
      description: 'Magical fantasy style with dreamlike effects',
      features: ['Magic Effects', 'Fairy Atmosphere', 'Dreamy Colors', 'Mystic Aura'],
      icon: Sparkles,
      gradient: 'from-purple-600 to-pink-800',
      textColor: 'text-purple-400',
      examples: ['Magic Beast', 'Fairy Dragon', 'Illusion Bird']
    },
    {
      value: 'ink',
      name: 'Ink Wash',
      description: 'Chinese ink wash painting with expressive brushstrokes',
      features: ['Splash Ink', 'Profound Aesthetics', 'Monochrome Tones', 'Zen Aesthetics'],
      icon: Mountain,
      gradient: 'from-gray-600 to-black',
      textColor: 'text-gray-400',
      examples: ['Freehand Dragon', 'Zen Deer', 'Ink Bird']
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-white">
        <Palette className="h-4 w-4" />
        <span className="font-medium">Art Style</span>
        <Badge variant="secondary" className="text-xs">
          Choose your preferred artistic expression
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
                  {/* Title area */}
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
                            Selected
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

                  {/* Description */}
                  <p className={cn(
                    "text-sm",
                    isSelected ? "text-white/90" : "text-white/70"
                  )}>
                    {style.description}
                  </p>

                  {/* Feature tags */}
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

                  {/* Examples */}
                  <div className="space-y-1">
                    <div className={cn(
                      "text-xs font-medium",
                      isSelected ? "text-white/90" : "text-white/60"
                    )}>
                      Example Effects:
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

      {/* Current selection details */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-purple-400 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium text-white">
                Current Style: {styles.find(s => s.value === selected)?.name}
              </h4>
              <p className="text-sm text-white/70">
                {styles.find(s => s.value === selected)?.description}
              </p>
              <div className="text-xs text-white/60">
                💡 Different styles affect the AI generation's visual effects, each style has unique artistic expression
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}