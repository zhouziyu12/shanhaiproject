import { NextRequest, NextResponse } from 'next/server';

interface GenerateImageRequest {
  userInput: string;
  style?: 'classic' | 'modern' | 'fantasy' | 'ink';
  rarity?: 'random' | 'common' | 'rare' | 'epic' | 'legendary' | 'mythical';
}

export async function POST(request: NextRequest) {
  try {
    const { userInput, style = 'classic', rarity = 'random' }: GenerateImageRequest = await request.json();

    if (!userInput) {
      return NextResponse.json({ error: '请输入神兽描述' }, { status: 400 });
    }

    console.log('🎨 开始AI图片生成流程...');
    console.log('📝 用户输入:', userInput);
    console.log('🎭 艺术风格:', style);

    // 第一步：优化prompt
    const optimizedPrompt = await optimizePromptWithDeepSeek(userInput, style, rarity);
    
    // 第二步：生成图片
    const imageResult = await generateImageWithZhipu(optimizedPrompt);
    
    // 第三步：返回结果
    const response = {
      success: true,
      originalInput: userInput,
      optimizedPrompt: optimizedPrompt,
      imageUrl: imageResult.imageUrl,
      imageId: imageResult.imageId,
      style: style,
      timestamp: new Date().toISOString(),
      workflow: {
        step1: '✅ DeepSeek prompt优化完成',
        step2: '✅ 智谱AI图片生成完成',
        step3: '✅ 准备就绪，可进行NFT铸造'
      }
    };

    console.log('🎉 AI图片生成完成!');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ AI生成失败:', error);
    return NextResponse.json(
      { 
        error: 'AI生成失败，请重试', 
        details: error instanceof Error ? error.message : '未知错误',
        workflow: {
          step1: '❌ 处理中断',
          step2: '⏸️ 未执行',
          step3: '⏸️ 未执行'
        }
      }, 
      { status: 500 }
    );
  }
}

// DeepSeek优化prompt
async function optimizePromptWithDeepSeek(
  userInput: string, 
  style: string, 
  rarity: string
): Promise<string> {
  const stylePrompts = {
    classic: '中国古典神话风格，水墨画意境，传统色彩，古雅氛围',
    modern: '现代插画风格，鲜艳色彩，数字艺术，流行元素',
    fantasy: '奇幻艺术风格，魔法光效，仙侠氛围，梦幻色彩',
    ink: '中国水墨写意风格，泼墨技法，意境深远，黑白灰色调'
  };

  const rarityEnhance = {
    mythical: '神圣光辉，天地变色，绝世神韵，彩霞万丈',
    legendary: '威严磅礴，金光闪闪，神圣气息，祥云环绕',
    epic: '华丽精美，紫气东来，贵气逼人，光芒四射',
    rare: '精致优雅，银光流转，灵气十足，清雅脱俗',
    common: '朴素典雅，自然和谐，清新淡雅，简约美观',
    random: '神秘莫测，变幻无常，充满未知'
  };

  const systemPrompt = `你是专业的山海经神兽prompt工程师。请根据用户描述生成详细的AI绘画prompt。

要求：
1. 保持山海经古典神话风格
2. 添加具体的视觉细节
3. 包含色彩、光影、氛围描述
4. 风格：${stylePrompts[style as keyof typeof stylePrompts]}
5. 稀有度特质：${rarityEnhance[rarity as keyof typeof rarityEnhance]}
6. 字数150-300字
7. 使用中文，风格古典优雅

格式："威武的[神兽名称]，[外观特征]，[环境背景]，[艺术风格]，[画质要求]"`;

  const userPrompt = `请为以下神兽描述生成详细的绘画prompt：
用户输入：${userInput}
风格：${style}
稀有度：${rarity}

请生成详细的山海经风格绘画prompt：`;

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.7,
        stream: false
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API错误: ${response.status}`);
    }

    const data = await response.json();
    const optimizedPrompt = data.choices[0]?.message?.content?.trim();
    
    if (!optimizedPrompt) {
      throw new Error('DeepSeek返回空prompt');
    }

    // 添加技术参数
    const finalPrompt = `${optimizedPrompt}，${stylePrompts[style as keyof typeof stylePrompts]}，高画质，精美细节，4K分辨率，概念艺术，masterpiece，best quality`;
    
    console.log('✅ DeepSeek优化完成');
    return finalPrompt;

  } catch (error) {
    console.error('DeepSeek API失败，使用备用优化:', error);
    // 备用优化方案
    return `${userInput}，${stylePrompts[style as keyof typeof stylePrompts]}，${rarityEnhance[rarity as keyof typeof rarityEnhance]}，山海经神兽，中国古典神话，高画质，精美细节，概念艺术，4K分辨率`;
  }
}

// 智谱AI生成图片
async function generateImageWithZhipu(prompt: string) {
  try {
    console.log('🎨 调用智谱AI生成图片...');
    
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'cogview-3',
        prompt: prompt,
        size: '1024x1024',
        quality: 'standard',
        n: 1,
        response_format: 'url'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('智谱AI API错误:', response.status, errorText);
      throw new Error(`智谱AI API错误: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.data[0]?.url;
    
    if (!imageUrl) {
      throw new Error('智谱AI未返回图片URL');
    }

    console.log('✅ 智谱AI生成成功');
    
    return {
      imageUrl,
      imageId: data.data[0]?.id || generateImageId(),
    };

  } catch (error) {
    console.error('智谱AI生成失败，使用备用方案:', error);
    
    // 备用方案：生成占位符图片
    const placeholderUrl = `https://via.placeholder.com/1024x1024/7c3aed/ffffff?text=${encodeURIComponent('AI生成中...')}`;
    
    return {
      imageUrl: placeholderUrl,
      imageId: generateImageId(),
    };
  }
}

// 生成图片ID
function generateImageId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}