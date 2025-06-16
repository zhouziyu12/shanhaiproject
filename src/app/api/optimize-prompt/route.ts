import { NextRequest, NextResponse } from 'next/server';

interface OptimizeRequest {
  userInput: string;
  style: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userInput, style }: OptimizeRequest = await request.json();

    if (!userInput.trim()) {
      return NextResponse.json({ 
        error: '请输入神兽描述' 
      }, { status: 400 });
    }

    console.log('🧠 DeepSeek优化开始...');
    console.log('📝 原始输入:', userInput);
    console.log('🎨 选择风格:', style);

    // DeepSeek API 调用
    const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一个专业的AI绘画提示词优化专家，专门为山海经神兽创作优化描述。

任务：将用户的简单描述转换为详细、生动的绘画提示词。

要求：
1. 保持山海经神话风格
2. 添加具体的视觉细节
3. 包含环境、光效、材质描述
4. 风格要符合：${style}
5. 字数控制在100-200字
6. 语言生动，富有画面感

示例风格特点：
- classic（古典水墨）：水墨画意境，传统色彩，古雅气息
- modern（现代插画）：鲜艳色彩，数字艺术风格，现代感
- fantasy（奇幻艺术）：魔法光效，梦幻色彩，仙侠氛围
- ink（水墨写意）：黑白灰调，泼墨技法，禅意美学

请直接输出优化后的提示词，不要添加解释。`
          },
          {
            role: 'user',
            content: userInput
          }
        ],
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    if (!deepseekResponse.ok) {
      const errorText = await deepseekResponse.text();
      console.error('DeepSeek API错误:', deepseekResponse.status, errorText);
      
      // 如果API失败，返回增强版的用户输入
      const fallbackPrompt = createFallbackPrompt(userInput, style);
      return NextResponse.json({
        success: true,
        optimizedPrompt: fallbackPrompt,
        originalInput: userInput,
        source: 'fallback',
        note: 'DeepSeek API暂时不可用，使用本地增强'
      });
    }

    const result = await deepseekResponse.json();
    const optimizedPrompt = result.choices[0]?.message?.content || userInput;

    console.log('✅ DeepSeek优化完成');
    console.log('✨ 优化结果:', optimizedPrompt);

    return NextResponse.json({
      success: true,
      optimizedPrompt: optimizedPrompt.trim(),
      originalInput: userInput,
      source: 'deepseek',
      usage: result.usage
    });

  } catch (error) {
    console.error('❌ 提示词优化失败:', error);
    
    // 错误时返回增强版输入
    const fallbackPrompt = createFallbackPrompt(
      (await request.json()).userInput, 
      (await request.json()).style
    );
    
    return NextResponse.json({
      success: true,
      optimizedPrompt: fallbackPrompt,
      originalInput: (await request.json()).userInput,
      source: 'fallback',
      note: '使用本地提示词增强'
    });
  }
}

// 备用提示词增强函数
function createFallbackPrompt(userInput: string, style: string): string {
  const styleEnhancements = {
    classic: '传统水墨画风格，古典色彩，水墨晕染效果，古雅意境',
    modern: '现代数字艺术风格，鲜艳色彩，高饱和度，时尚设计感',
    fantasy: '奇幻魔法风格，梦幻光效，仙侠氛围，神秘气息',
    ink: '水墨写意风格，黑白灰调，泼墨技法，禅意美学'
  };

  const enhancement = styleEnhancements[style as keyof typeof styleEnhancements] || '精美艺术风格';
  
  return `${userInput}，${enhancement}，高质量渲染，详细刻画，艺术大师级作品，完美构图，柔和光影`;
}
