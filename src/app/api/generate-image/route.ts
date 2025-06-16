import { NextRequest, NextResponse } from 'next/server';

interface GenerateRequest {
  userInput: string;
  optimizedPrompt?: string;
  style: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userInput, optimizedPrompt, style }: GenerateRequest = await request.json();

    const finalPrompt = optimizedPrompt || userInput;

    if (!finalPrompt.trim()) {
      return NextResponse.json({ 
        error: '请提供神兽描述' 
      }, { status: 400 });
    }

    console.log('🎨 智谱AI图片生成开始...');
    console.log('🖼️ 生成提示词:', finalPrompt);

    // 智谱AI API 调用
    const zhipuResponse = await fetch('https://open.bigmodel.cn/api/paas/v4/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'cogview-3',
        prompt: finalPrompt,
        size: '1024x1024',
        quality: 'standard',
        n: 1,
      }),
    });

    if (!zhipuResponse.ok) {
      const errorText = await zhipuResponse.text();
      console.error('智谱AI API错误:', zhipuResponse.status, errorText);
      
      // 如果API失败，返回占位符图片
      const placeholderUrl = createPlaceholderImage(finalPrompt);
      return NextResponse.json({
        success: true,
        imageUrl: placeholderUrl,
        originalInput: userInput,
        optimizedPrompt: finalPrompt,
        style,
        source: 'placeholder',
        note: '智谱AI API暂时不可用，显示预览图片'
      });
    }

    const result = await zhipuResponse.json();
    const imageUrl = result.data[0]?.url;

    if (!imageUrl) {
      throw new Error('未获取到图片URL');
    }

    console.log('✅ 智谱AI图片生成完成');
    console.log('🔗 图片URL:', imageUrl);

    return NextResponse.json({
      success: true,
      imageUrl,
      originalInput: userInput,
      optimizedPrompt: finalPrompt,
      style,
      source: 'zhipu',
      usage: result.usage
    });

  } catch (error) {
    console.error('❌ 图片生成失败:', error);
    
    // 错误时返回占位符
    const requestData = await request.json();
    const placeholderUrl = createPlaceholderImage(requestData.optimizedPrompt || requestData.userInput);
    
    return NextResponse.json({
      success: true,
      imageUrl: placeholderUrl,
      originalInput: requestData.userInput,
      optimizedPrompt: requestData.optimizedPrompt || requestData.userInput,
      style: requestData.style,
      source: 'placeholder',
      note: '图片生成失败，显示预览图片'
    });
  }
}

// 创建占位符图片URL
function createPlaceholderImage(prompt: string): string {
  // 使用placeholder服务创建动态图片
  const encodedPrompt = encodeURIComponent(prompt.substring(0, 50));
  const colors = ['7c3aed', 'ec4899', '3b82f6', '10b981', 'f59e0b'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  
  return `https://via.placeholder.com/1024x1024/${randomColor}/ffffff?text=${encodedPrompt}`;
}
