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
        error: 'Please provide a description' 
      }, { status: 400 });
    }

    console.log('🎨 Zhipu AI image generation starting...');
    console.log('🖼️ Generation prompt:', finalPrompt);

    // Zhipu AI API call
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
      console.error('Zhipu AI API error:', zhipuResponse.status, errorText);
      
      // If API fails, return placeholder image
      const placeholderUrl = createPlaceholderImage(finalPrompt);
      return NextResponse.json({
        success: true,
        imageUrl: placeholderUrl,
        originalInput: userInput,
        optimizedPrompt: finalPrompt,
        style,
        source: 'placeholder',
        note: 'Zhipu AI API temporarily unavailable, showing preview image'
      });
    }

    const result = await zhipuResponse.json();
    const imageUrl = result.data[0]?.url;

    if (!imageUrl) {
      throw new Error('Failed to obtain image URL');
    }

    console.log('✅ Zhipu AI image generation completed');
    console.log('🔗 Image URL:', imageUrl);

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
    console.error('❌ Image generation failed:', error);
    
    // Return placeholder on error
    const requestData = await request.json();
    const placeholderUrl = createPlaceholderImage(requestData.optimizedPrompt || requestData.userInput);
    
    return NextResponse.json({
      success: true,
      imageUrl: placeholderUrl,
      originalInput: requestData.userInput,
      optimizedPrompt: requestData.optimizedPrompt || requestData.userInput,
      style: requestData.style,
      source: 'placeholder',
      note: 'Image generation failed, showing preview image'
    });
  }
}

// Create placeholder image URL
function createPlaceholderImage(prompt: string): string {
  // Use placeholder service to create dynamic image
  const encodedPrompt = encodeURIComponent(prompt.substring(0, 50));
  const colors = ['7c3aed', 'ec4899', '3b82f6', '10b981', 'f59e0b'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  
  return `https://via.placeholder.com/1024x1024/${randomColor}/ffffff?text=${encodedPrompt}`;
}