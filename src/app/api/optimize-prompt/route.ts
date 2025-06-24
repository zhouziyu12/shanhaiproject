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
        error: 'Please enter a mythical beast description'
      }, { status: 400 });
    }

    console.log('🧠 DeepSeek optimization started...');
    console.log('📝 Original input:', userInput);
    console.log('🎨 Selected style:', style);

    // DeepSeek API call
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
            content: `You are a professional AI art prompt optimization expert, specializing in creating optimized descriptions for Shan Hai Jing (Classic of Mountains and Seas) mythical beasts.

Task: Convert user's simple descriptions into detailed, vivid art prompts.

Requirements:
1. Maintain the Shan Hai Jing mythological style
2. Add specific visual details
3. Include environment, lighting, and material descriptions
4. Style should conform to: ${style}
5. Word count controlled between 100-200 words
6. Language should be vivid and rich in visual imagery

Example style characteristics:
- classic (classical ink wash): Ink wash painting mood, traditional colors, elegant atmosphere
- modern (modern illustration): Vibrant colors, digital art style, contemporary feel
- fantasy (fantasy art): Magical light effects, dreamy colors, immortal cultivation atmosphere
- ink (ink wash freehand): Black, white and gray tones, ink splashing technique, zen aesthetics

Please output the optimized prompt directly without additional explanations.`
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
      console.error('DeepSeek API error:', deepseekResponse.status, errorText);
      
      // If API fails, return enhanced version of user input
      const fallbackPrompt = createFallbackPrompt(userInput, style);
      return NextResponse.json({
        success: true,
        optimizedPrompt: fallbackPrompt,
        originalInput: userInput,
        source: 'fallback',
        note: 'DeepSeek API temporarily unavailable, using local enhancement'
      });
    }

    const result = await deepseekResponse.json();
    const optimizedPrompt = result.choices[0]?.message?.content || userInput;

    console.log('✅ DeepSeek optimization completed');
    console.log('✨ Optimization result:', optimizedPrompt);

    return NextResponse.json({
      success: true,
      optimizedPrompt: optimizedPrompt.trim(),
      originalInput: userInput,
      source: 'deepseek',
      usage: result.usage
    });

  } catch (error) {
    console.error('❌ Prompt optimization failed:', error);
    
    // Return enhanced input on error
    const fallbackPrompt = createFallbackPrompt(
      (await request.json()).userInput, 
      (await request.json()).style
    );
    
    return NextResponse.json({
      success: true,
      optimizedPrompt: fallbackPrompt,
      originalInput: (await request.json()).userInput,
      source: 'fallback',
      note: 'Using local prompt enhancement'
    });
  }
}

// Fallback prompt enhancement function
function createFallbackPrompt(userInput: string, style: string): string {
  const styleEnhancements = {
    classic: 'traditional ink wash painting style, classical colors, ink wash rendering effects, elegant artistic mood',
    modern: 'modern digital art style, vibrant colors, high saturation, fashionable design sense',
    fantasy: 'fantasy magical style, dreamy light effects, immortal cultivation atmosphere, mysterious aura',
    ink: 'ink wash freehand style, black white and gray tones, ink splashing technique, zen aesthetics'
  };

  const enhancement = styleEnhancements[style as keyof typeof styleEnhancements] || 'exquisite artistic style';
  
  return `${userInput}, ${enhancement}, high-quality rendering, detailed depiction, master-level artwork, perfect composition, soft lighting and shadows`;
}