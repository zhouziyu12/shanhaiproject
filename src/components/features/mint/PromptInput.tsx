'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Sparkles, RefreshCw, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
}

export function PromptInput({
  value,
  onChange,
  placeholder = "Describe your vision of the mythical beast...",
  disabled = false,
  maxLength = 500
}: PromptInputProps) {
  const [showTemplates, setShowTemplates] = useState(false);

  // Inspiration templates
  const templates = [
    {
      category: 'Classical Beasts',
      prompts: [
        'Majestic golden dragon soaring through clouds',
        'Mysterious nine-tailed fox dancing under the moon',
        'Giant Kunpeng spreading wings to cover the sky',
        'Mighty white tiger walking on snow without leaving traces',
        'Elegant azure dragon riding clouds and mist',
        'Sacred vermillion bird reborn from flames',
        'Ancient black tortoise guardian of the four directions',
        'Auspicious qilin stepping on clouds'
      ]
    },
    {
      category: 'Elemental Beasts',
      prompts: [
        'Fire beast with body engulfed in flames',
        'Frost beast wearing armor of ice',
        'Lightning beast with eyes flashing electricity',
        'Storm beast with wings stirring up fierce winds',
        'Earth beast treading on mountains and rivers',
        'Crystal beast with transparent diamond-like body',
        'Shadow beast hidden in darkness',
        'Light beast radiating sacred brilliance'
      ]
    },
    {
      category: 'Fantasy Concepts',
      prompts: [
        'Steampunk-style mechanical steel dragon',
        'Cosmic beast with starry patterns',
        'Spring deer composed of flower petals',
        'Rainbow bird with iridescent feathers',
        'Musical beast shaped like musical notes',
        'Wisdom turtle with flying book pages',
        'Time beast with clockwork gears',
        'Sky horse surrounded by swirling clouds'
      ]
    }
  ];

  // Get random inspiration
  const getRandomTemplate = () => {
    const allPrompts = templates.flatMap(category => category.prompts);
    const randomPrompt = allPrompts[Math.floor(Math.random() * allPrompts.length)];
    onChange(randomPrompt);
  };

  // Character count
  const wordCount = value.length;
  const isOverLimit = wordCount > maxLength;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          rows={4}
          className={cn(
            "min-h-[100px] resize-none bg-white/5 border-white/20 text-white placeholder:text-white/50",
            "focus:border-purple-500/50 focus:ring-purple-500/20",
            isOverLimit && "border-red-500/50 focus:border-red-500/50"
          )}
        />
        
        {/* Character count */}
        <div className="absolute bottom-2 right-2 text-xs text-white/50">
          <span className={cn(isOverLimit && "text-red-400")}>
            {wordCount}/{maxLength}
          </span>
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTemplates(!showTemplates)}
            disabled={disabled}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <Lightbulb className="mr-1 h-3 w-3" />
            Inspiration Templates
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={getRandomTemplate}
            disabled={disabled}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            Random Inspiration
          </Button>
        </div>

        {value.trim() && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange('')}
            disabled={disabled}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Inspiration template display */}
      {showTemplates && (
        <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center gap-2 text-white">
            <Wand2 className="h-4 w-4" />
            <span className="font-medium">Choose Inspiration Template</span>
          </div>
          
          {templates.map((category) => (
            <div key={category.category} className="space-y-2">
              <h4 className="text-sm font-medium text-white/80">{category.category}</h4>
              <div className="flex flex-wrap gap-2">
                {category.prompts.map((prompt, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className={cn(
                      "cursor-pointer text-xs transition-all",
                      "bg-white/10 hover:bg-purple-500/20 border-white/20 hover:border-purple-500/50",
                      "text-white/80 hover:text-white",
                      disabled && "cursor-not-allowed opacity-50"
                    )}
                    onClick={() => !disabled && onChange(prompt)}
                  >
                    {prompt}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tips */}
      <div className="flex items-start gap-2 text-xs text-white/60">
        <Sparkles className="h-3 w-3 mt-0.5 flex-shrink-0" />
        <div>
          <div>💡 <strong>Creation Tips:</strong> Describe the beast's appearance, abilities, and environment - the more detailed, the better</div>
          <div>🎨 <strong>Style Hints:</strong> Include colors, materials, lighting effects and other visual elements</div>
          <div>⚡ <strong>AI Enhancement:</strong> DeepSeek will automatically optimize your description for more professional prompts</div>
        </div>
      </div>
    </div>
  );
}