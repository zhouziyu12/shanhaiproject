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
  placeholder = "描述你心中的神兽...",
  disabled = false,
  maxLength = 500
}: PromptInputProps) {
  const [showTemplates, setShowTemplates] = useState(false);

  // 灵感模板
  const templates = [
    {
      category: '古典神兽',
      prompts: [
        '威武的金色神龙翱翔云海之间',
        '神秘的九尾狐仙月下起舞',
        '巨大的鲲鹏展翅遮天蔽日',
        '威严的白虎踏雪无痕',
        '优雅的青龙腾云驾雾',
        '神圣的朱雀浴火重生',
        '古老的玄武守护四方',
        '祥瑞的麒麟踏云而来'
      ]
    },
    {
      category: '元素神兽',
      prompts: [
        '火焰神兽，全身燃烧着烈火',
        '冰霜神兽，身披寒冰铠甲',
        '雷电神兽，双眼闪烁电光',
        '风暴神兽，羽翼掀起狂风',
        '大地神兽，脚踏山川大地',
        '水晶神兽，身体透明如钻石',
        '暗影神兽，隐身于黑暗中',
        '光明神兽，散发神圣光辉'
      ]
    },
    {
      category: '奇幻创意',
      prompts: [
        '机械朋克风格的钢铁神龙',
        '星空图案的宇宙神兽',
        '花瓣组成的春之神鹿',
        '彩虹色羽毛的幻彩神鸟',
        '音符形状的音乐神兽',
        '书页翻飞的智慧神龟',
        '时钟齿轮的时间神兽',
        '云朵缭绕的天空神马'
      ]
    }
  ];

  // 随机获取灵感
  const getRandomTemplate = () => {
    const allPrompts = templates.flatMap(category => category.prompts);
    const randomPrompt = allPrompts[Math.floor(Math.random() * allPrompts.length)];
    onChange(randomPrompt);
  };

  // 字数统计
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
        
        {/* 字数统计 */}
        <div className="absolute bottom-2 right-2 text-xs text-white/50">
          <span className={cn(isOverLimit && "text-red-400")}>
            {wordCount}/{maxLength}
          </span>
        </div>
      </div>

      {/* 控制按钮 */}
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
            灵感模板
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={getRandomTemplate}
            disabled={disabled}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            随机灵感
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
            清空
          </Button>
        )}
      </div>

      {/* 灵感模板展示 */}
      {showTemplates && (
        <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center gap-2 text-white">
            <Wand2 className="h-4 w-4" />
            <span className="font-medium">选择灵感模板</span>
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

      {/* 提示信息 */}
      <div className="flex items-start gap-2 text-xs text-white/60">
        <Sparkles className="h-3 w-3 mt-0.5 flex-shrink-0" />
        <div>
          <div>💡 <strong>创作建议：</strong>描述神兽的外观、能力、环境，越详细越好</div>
          <div>🎨 <strong>风格提示：</strong>可以加入颜色、材质、光效等视觉元素</div>
          <div>⚡ <strong>AI增强：</strong>DeepSeek会自动优化你的描述，生成更专业的提示词</div>
        </div>
      </div>
    </div>
  );
}