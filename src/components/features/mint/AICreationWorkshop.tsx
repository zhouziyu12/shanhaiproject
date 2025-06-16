'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AICreationWorkshopProps {
  onImageGenerated?: (result: any) => void;
}

type ArtStyle = 'classic' | 'modern' | 'fantasy' | 'ink';

interface GenerationResult {
  imageUrl: string;
  originalInput: string;
  optimizedPrompt: string;
  style: ArtStyle;
  source: string;
}

export function AICreationWorkshop({ onImageGenerated }: AICreationWorkshopProps) {
  const [userInput, setUserInput] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<ArtStyle>('classic');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);

  const styles = [
    {
      value: 'classic' as ArtStyle,
      name: '古典水墨',
      description: '传统山海经风格，水墨画意境',
      emoji: '🖌️',
      gradient: 'from-slate-600 to-slate-800'
    },
    {
      value: 'modern' as ArtStyle,
      name: '现代插画',
      description: '现代艺术风格，鲜艳色彩',
      emoji: '🎨',
      gradient: 'from-blue-600 to-purple-800'
    },
    {
      value: 'fantasy' as ArtStyle,
      name: '奇幻艺术',
      description: '魔幻仙侠风格，梦幻光效',
      emoji: '✨',
      gradient: 'from-purple-600 to-pink-800'
    },
    {
      value: 'ink' as ArtStyle,
      name: '水墨写意',
      description: '中国水墨画风，写意笔触',
      emoji: '🖋️',
      gradient: 'from-gray-600 to-black'
    }
  ];

  const inspirationTemplates = [
    '威武的金色神龙翱翔云海之间',
    '神秘的九尾狐仙月下起舞',
    '巨大的鲲鹏展翅遮天蔽日',
    '威严的白虎踏雪无痕',
    '火焰神兽，全身燃烧着烈火',
    '冰霜神兽，身披寒冰铠甲',
    '机械朋克风格的钢铁神龙',
    '星空图案的宇宙神兽'
  ];

  const handleOptimizePrompt = async () => {
    if (!userInput.trim()) {
      alert('请先输入神兽描述！');
      return;
    }

    setIsOptimizing(true);
    try {
      const response = await fetch('/api/optimize-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: userInput.trim(),
          style: selectedStyle
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setOptimizedPrompt(result.optimizedPrompt);
      } else {
        throw new Error(result.error || '优化失败');
      }
    } catch (error) {
      console.error('提示词优化失败:', error);
      alert('提示词优化失败，将使用原始输入');
      setOptimizedPrompt(userInput);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleGenerateImage = async () => {
    const finalPrompt = optimizedPrompt || userInput;
    
    if (!finalPrompt.trim()) {
      alert('请先输入神兽描述！');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput,
          optimizedPrompt: finalPrompt,
          style: selectedStyle
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        const generationData = {
          imageUrl: result.imageUrl,
          originalInput: result.originalInput,
          optimizedPrompt: result.optimizedPrompt,
          style: result.style,
          source: result.source
        };
        
        setGenerationResult(generationData);
        onImageGenerated?.(generationData);
      } else {
        throw new Error(result.error || '生成失败');
      }
    } catch (error) {
      console.error('图片生成失败:', error);
      alert('图片生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTemplateClick = (template: string) => {
    setUserInput(template);
    setOptimizedPrompt('');
    setGenerationResult(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* 标题 */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
          <span className="text-2xl">🎨</span>
          AI神兽创作工坊
        </h1>
        <p className="text-white/70">用AI技术重新演绎千年神话</p>
      </div>

      {/* 输入区域 */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <span className="text-xl">💭</span>
            描述你心中的神兽
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="例如：威武的金色神龙，龙鳞如熔岩般赤红，双目似星火燃烧..."
              rows={4}
              maxLength={500}
              className="w-full min-h-[100px] resize-none bg-white/5 border border-white/20 rounded-lg p-3 text-white placeholder:text-white/50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
            />
            <div className="flex justify-between items-center text-xs text-white/50">
              <span>💡 描述越详细，AI生成的效果越精准</span>
              <span>{userInput.length}/500</span>
            </div>
          </div>

          {/* 灵感模板 */}
          <div className="space-y-2">
            <div className="text-sm text-white/70">✨ 灵感模板：</div>
            <div className="flex flex-wrap gap-2">
              {inspirationTemplates.map((template, index) => (
                <button
                  key={index}
                  onClick={() => handleTemplateClick(template)}
                  className="text-xs px-3 py-1 bg-white/10 hover:bg-purple-500/20 border border-white/20 hover:border-purple-500/50 rounded-full text-white/80 hover:text-white transition-all"
                >
                  {template}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 风格选择 */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <span className="text-xl">🎭</span>
            选择艺术风格
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {styles.map((style) => (
              <div
                key={style.value}
                onClick={() => setSelectedStyle(style.value)}
                className={`cursor-pointer p-4 rounded-lg border transition-all duration-300 ${
                  selectedStyle === style.value
                    ? `bg-gradient-to-br ${style.gradient} border-white/30 shadow-lg`
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{style.emoji}</span>
                  <div>
                    <h3 className="font-semibold text-white">{style.name}</h3>
                    <p className="text-sm text-white/70">{style.description}</p>
                  </div>
                  {selectedStyle === style.value && (
                    <div className="ml-auto w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-white" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI工作流程 */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 步骤1：优化提示词 */}
            <div className="flex-1">
              <Button
                onClick={handleOptimizePrompt}
                disabled={!userInput.trim() || isOptimizing}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50"
              >
                {isOptimizing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    DeepSeek优化中...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🧠</span>
                    DeepSeek优化提示词
                  </>
                )}
              </Button>
            </div>

            <div className="flex items-center justify-center text-white/50">
              <span className="text-2xl">→</span>
            </div>

            {/* 步骤2：生成图片 */}
            <div className="flex-1">
              <Button
                onClick={handleGenerateImage}
                disabled={!userInput.trim() || isGenerating}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    智谱AI生成中...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🎨</span>
                    智谱AI生成图片
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* 优化后的提示词显示 */}
          {optimizedPrompt && (
            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="text-sm text-blue-400 mb-2">🧠 DeepSeek优化结果：</div>
              <div className="text-white/90 text-sm">{optimizedPrompt}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 生成结果 */}
      {generationResult && (
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-xl">🖼️</span>
              AI创作结果
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                生成成功
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-square relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <img
                src={generationResult.imageUrl}
                alt="AI生成的神兽"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/500x500/7c3aed/ffffff?text=生成中...';
                }}
              />
              
              {/* 风格标签 */}
              <Badge className="absolute top-3 left-3 bg-gradient-to-r from-purple-500 to-pink-500">
                {styles.find(s => s.value === generationResult.style)?.name}
              </Badge>

              {/* 来源标签 */}
              <Badge className="absolute top-3 right-3 bg-blue-500/20 text-blue-400 border-blue-500/30">
                {generationResult.source === 'zhipu' ? '智谱AI' : '预览模式'}
              </Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="text-white/60">原始描述：</span>
                <span className="text-white">{generationResult.originalInput}</span>
              </div>
              <div>
                <span className="text-white/60">优化后：</span>
                <span className="text-white">{generationResult.optimizedPrompt}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
