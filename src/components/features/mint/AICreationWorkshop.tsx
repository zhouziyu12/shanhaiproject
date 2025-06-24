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
      name: 'Classical Ink',
      description: 'Traditional Shan Hai Jing style with ink painting aesthetics',
      emoji: '🖌️',
      gradient: 'from-slate-600 to-slate-800'
    },
    {
      value: 'modern' as ArtStyle,
      name: 'Modern Illustration',
      description: 'Contemporary art style with vibrant colors',
      emoji: '🎨',
      gradient: 'from-blue-600 to-purple-800'
    },
    {
      value: 'fantasy' as ArtStyle,
      name: 'Fantasy Art',
      description: 'Magical fantasy style with dreamlike effects',
      emoji: '✨',
      gradient: 'from-purple-600 to-pink-800'
    },
    {
      value: 'ink' as ArtStyle,
      name: 'Ink Painting',
      description: 'Chinese ink wash painting with expressive brushstrokes',
      emoji: '🖋️',
      gradient: 'from-gray-600 to-black'
    }
  ];

  const inspirationTemplates = [
    'Majestic golden dragon soaring through clouds',
    'Mysterious nine-tailed fox dancing under the moon',
    'Giant Kunpeng spreading wings to cover the sky',
    'Mighty white tiger walking on snow without leaving traces',
    'Fire beast with body engulfed in flames',
    'Frost beast wearing armor of ice',
    'Steampunk-style mechanical steel dragon',
    'Cosmic beast with starry patterns'
  ];

  const handleOptimizePrompt = async () => {
    if (!userInput.trim()) {
      alert('Please enter a beast description first!');
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
        throw new Error(result.error || 'Optimization failed');
      }
    } catch (error) {
      console.error('Prompt optimization failed:', error);
      alert('Prompt optimization failed, will use original input');
      setOptimizedPrompt(userInput);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleGenerateImage = async () => {
    const finalPrompt = optimizedPrompt || userInput;
    
    if (!finalPrompt.trim()) {
      alert('Please enter a beast description first!');
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
        throw new Error(result.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Image generation failed:', error);
      alert('Image generation failed, please try again');
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
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
          <span className="text-2xl">🎨</span>
          AI Mythical Beast Workshop
        </h1>
        <p className="text-white/70">Reimagining ancient myths with AI technology</p>
      </div>

      {/* Input Area */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <span className="text-xl">💭</span>
            Describe Your Vision
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="e.g., Majestic golden dragon with scales like molten lava, eyes burning like starfire..."
              rows={4}
              maxLength={500}
              className="w-full min-h-[100px] resize-none bg-white/5 border border-white/20 rounded-lg p-3 text-white placeholder:text-white/50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
            />
            <div className="flex justify-between items-center text-xs text-white/50">
              <span>💡 The more detailed your description, the more precise the AI generation</span>
              <span>{userInput.length}/500</span>
            </div>
          </div>

          {/* Inspiration Templates */}
          <div className="space-y-2">
            <div className="text-sm text-white/70">✨ Inspiration Templates:</div>
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

      {/* Style Selection */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <span className="text-xl">🎭</span>
            Choose Art Style
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

      {/* AI Workflow */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Step 1: Optimize Prompt */}
            <div className="flex-1">
              <Button
                onClick={handleOptimizePrompt}
                disabled={!userInput.trim() || isOptimizing}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50"
              >
                {isOptimizing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    DeepSeek Optimizing...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🧠</span>
                    DeepSeek Prompt Optimization
                  </>
                )}
              </Button>
            </div>

            <div className="flex items-center justify-center text-white/50">
              <span className="text-2xl">→</span>
            </div>

            {/* Step 2: Generate Image */}
            <div className="flex-1">
              <Button
                onClick={handleGenerateImage}
                disabled={!userInput.trim() || isGenerating}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    ZhipuAI Generating...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🎨</span>
                    ZhipuAI Image Generation
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Optimized Prompt Display */}
          {optimizedPrompt && (
            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="text-sm text-blue-400 mb-2">🧠 DeepSeek Optimization Result:</div>
              <div className="text-white/90 text-sm">{optimizedPrompt}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generation Result */}
      {generationResult && (
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-xl">🖼️</span>
              AI Creation Result
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                Generation Successful
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-square relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <img
                src={generationResult.imageUrl}
                alt="AI Generated Mythical Beast"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/500x500/7c3aed/ffffff?text=Generating...';
                }}
              />
              
              {/* Style Tag */}
              <Badge className="absolute top-3 left-3 bg-gradient-to-r from-purple-500 to-pink-500">
                {styles.find(s => s.value === generationResult.style)?.name}
              </Badge>

              {/* Source Tag */}
              <Badge className="absolute top-3 right-3 bg-blue-500/20 text-blue-400 border-blue-500/30">
                {generationResult.source === 'zhipu' ? 'ZhipuAI' : 'Preview Mode'}
              </Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="text-white/60">Original Description:</span>
                <span className="text-white ml-2">{generationResult.originalInput}</span>
              </div>
              <div>
                <span className="text-white/60">Optimized:</span>
                <span className="text-white ml-2">{generationResult.optimizedPrompt}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}