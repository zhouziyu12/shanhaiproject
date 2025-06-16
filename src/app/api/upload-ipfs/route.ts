import { NextRequest, NextResponse } from 'next/server';

interface UploadRequest {
  imageUrl: string;
  originalInput: string;
  optimizedPrompt: string;
  style: string;
  creator: string;
}

export async function POST(request: NextRequest) {
  try {
    // 添加请求体解析错误处理
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('❌ 请求体解析失败:', parseError);
      return NextResponse.json({ 
        error: '请求格式错误',
        details: 'Invalid JSON in request body'
      }, { status: 400 });
    }

    const { 
      imageUrl, 
      originalInput, 
      optimizedPrompt, 
      style, 
      creator 
    }: UploadRequest = body;

    if (!imageUrl || !optimizedPrompt || !creator) {
      return NextResponse.json({ 
        error: '缺少必要参数：图片URL、优化prompt或创建者地址' 
      }, { status: 400 });
    }

    console.log('📤 开始Pinata IPFS上传流程...');
    console.log('🎨 原始输入:', originalInput?.substring(0, 50) + '...');
    console.log('✨ 优化prompt:', optimizedPrompt?.substring(0, 50) + '...');

    // 第一步：下载AI生成的图片
    console.log('📥 下载AI生成的图片...');
    const imageBuffer = await downloadImage(imageUrl);
    
    // 第二步：创建完整的NFT元数据
    console.log('📝 创建NFT元数据...');
    const metadata = createNFTMetadata({
      originalInput: originalInput || '',
      optimizedPrompt,
      style: style || 'modern',
      creator,
      imageId: generateImageId()
    });

    // 第三步：上传到Pinata IPFS
    console.log('🚀 上传到Pinata IPFS...');
    const ipfsResult = await uploadToPinata(imageBuffer, metadata);

    // 第四步：返回完整结果
    const result = {
      success: true,
      ipfs: ipfsResult,
      metadata: metadata,
      originalInput: originalInput || '',
      optimizedPrompt,
      workflow: {
        step1: '✅ 图片下载完成',
        step2: '✅ 元数据创建完成', 
        step3: '✅ Pinata IPFS上传完成',
        step4: '✅ 准备铸造NFT'
      },
      mintInfo: {
        tokenURI: ipfsResult.metadataUrl,
        imageUrl: ipfsResult.imageUrl,
        gatewayUrl: ipfsResult.imageGatewayUrl
      }
    };

    console.log('🎉 Pinata IPFS上传流程完成!');
    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Pinata IPFS上传失败:', error);
    
    // 返回详细的错误信息
    return NextResponse.json({
      success: false,
      error: 'IPFS上传失败',
      details: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : undefined,
      workflow: {
        step1: '❌ 处理中断',
        step2: '⏸️ 未完成',
        step3: '⏸️ 未完成',
        step4: '⏸️ 未完成'
      }
    }, { status: 500 });
  }
}

// Pinata IPFS上传函数
async function uploadToPinata(imageBuffer: Buffer, metadata: any) {
  console.log('🔄 开始Pinata IPFS上传...');
  
  try {
    // 检查Pinata JWT Token
    const pinataJWT = process.env.PINATA_JWT;
    if (!pinataJWT) {
      throw new Error('PINATA_JWT环境变量未配置');
    }

    // 1. 上传图片到Pinata
    console.log('📸 上传图片到Pinata...');
    
    const imageFormData = new FormData();
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' });
    imageFormData.append('file', imageBlob, 'beast.png');
    
    // 添加Pinata选项
    const pinataImageOptions = JSON.stringify({
      cidVersion: 1,
      customPinPolicy: {
        regions: [
          { id: 'FRA1', desiredReplicationCount: 1 },
          { id: 'NYC1', desiredReplicationCount: 1 }
        ]
      }
    });
    imageFormData.append('pinataOptions', pinataImageOptions);

    const imageMetadata = JSON.stringify({
      name: `ShanHaiVerse Beast ${Date.now()}`,
      keyvalues: {
        type: 'beast-image',
        project: 'shanhaiverse'
      }
    });
    imageFormData.append('pinataMetadata', imageMetadata);

    const imageResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pinataJWT}`,
      },
      body: imageFormData,
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error('Pinata图片上传失败:', imageResponse.status, errorText);
      throw new Error(`Pinata图片上传失败: ${imageResponse.status} - ${errorText}`);
    }

    const imageResult = await imageResponse.json();
    const imageCid = imageResult.IpfsHash;
    const imageIpfsUrl = `ipfs://${imageCid}`;
    
    console.log('✅ 图片上传成功到Pinata, CID:', imageCid);

    // 2. 更新元数据中的图片URL
    metadata.image = imageIpfsUrl;

    // 3. 上传元数据到Pinata
    console.log('📄 上传元数据到Pinata...');
    
    const metadataResponse = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pinataJWT}`,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataOptions: {
          cidVersion: 1,
          customPinPolicy: {
            regions: [
              { id: 'FRA1', desiredReplicationCount: 1 },
              { id: 'NYC1', desiredReplicationCount: 1 }
            ]
          }
        },
        pinataMetadata: {
          name: `ShanHaiVerse Metadata ${Date.now()}`,
          keyvalues: {
            type: 'beast-metadata',
            project: 'shanhaiverse'
          }
        }
      }),
    });

    if (!metadataResponse.ok) {
      const errorText = await metadataResponse.text();
      console.error('Pinata元数据上传失败:', metadataResponse.status, errorText);
      throw new Error(`Pinata元数据上传失败: ${metadataResponse.status} - ${errorText}`);
    }

    const metadataResult = await metadataResponse.json();
    const metadataCid = metadataResult.IpfsHash;
    
    console.log('✅ 元数据上传成功到Pinata, CID:', metadataCid);
    
    // 4. 返回结果
    return {
      imageUrl: imageIpfsUrl,
      metadataUrl: `ipfs://${metadataCid}`,
      imageGatewayUrl: `https://gateway.pinata.cloud/ipfs/${imageCid}`,
      metadataGatewayUrl: `https://gateway.pinata.cloud/ipfs/${metadataCid}`,
      cids: {
        image: imageCid,
        metadata: metadataCid
      },
      service: 'Pinata IPFS',
      verificationUrls: {
        imageIPFS: `https://ipfs.io/ipfs/${imageCid}`,
        metadataIPFS: `https://ipfs.io/ipfs/${metadataCid}`,
        imagePinata: `https://gateway.pinata.cloud/ipfs/${imageCid}`,
        metadataPinata: `https://gateway.pinata.cloud/ipfs/${metadataCid}`
      }
    };

  } catch (error) {
    console.error('Pinata IPFS上传错误:', error);
    throw error;
  }
}

// 下载图片
async function downloadImage(imageUrl: string): Promise<Buffer> {
  try {
    console.log('🔗 从URL下载图片:', imageUrl);
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`图片下载失败: ${response.status} - ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('✅ 图片下载完成, 大小:', Math.round(buffer.length / 1024), 'KB');
    return buffer;
  } catch (error) {
    console.error('图片下载错误:', error);
    throw new Error(`无法下载AI生成的图片: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

// 创建NFT元数据
function createNFTMetadata({
  originalInput,
  optimizedPrompt,
  style,
  creator,
  imageId
}: {
  originalInput: string;
  optimizedPrompt: string;
  style: string;
  creator: string;
  imageId: string;
}) {
  const styleNames = {
    classic: '古典水墨',
    modern: '现代插画',
    fantasy: '奇幻艺术',
    ink: '水墨写意'
  };

  const beastName = generateBeastName(originalInput);
  
  return {
    name: `山海神兽 · ${beastName}`,
    description: `${optimizedPrompt}\n\n====== 创作信息 ======\n✨ 原始灵感：${originalInput}\n🎨 艺术风格：${styleNames[style as keyof typeof styleNames] || style}\n🎲 稀有度：待VRF分配\n🏛️ 项目：神图计划 ShanHaiVerse\n🤖 AI技术：DeepSeek + 智谱AI\n💾 存储：Pinata IPFS\n⏰ 创作时间：${new Date().toLocaleString('zh-CN')}\n\n这是通过AI技术重新演绎的山海经神兽，融合了传统文化与现代科技，每一只都是独一无二的数字艺术品。`,
    image: '',
    external_url: 'https://shanhaiverse.com',
    background_color: '7c3aed',
    attributes: [
      {
        trait_type: '艺术风格',
        value: styleNames[style as keyof typeof styleNames] || style
      },
      {
        trait_type: '创作者',
        value: creator
      },
      {
        trait_type: '生成方式',
        value: 'AI生成'
      },
      {
        trait_type: 'AI模型',
        value: 'DeepSeek + 智谱AI'
      },
      {
        trait_type: '存储方式',
        value: 'Pinata IPFS'
      },
      {
        trait_type: '创作时间',
        value: new Date().toISOString().split('T')[0]
      },
      {
        trait_type: '项目版本',
        value: 'V1.0'
      },
      {
        trait_type: '图片ID',
        value: imageId
      }
    ],
    properties: {
      originalInput: originalInput,
      optimizedPrompt: optimizedPrompt,
      style: style,
      creator: creator,
      imageId: imageId,
      generatedAt: new Date().toISOString(),
      aiWorkflow: {
        promptOptimizer: 'DeepSeek',
        imageGenerator: '智谱AI',
        storage: 'Pinata IPFS',
        version: '1.0.0'
      }
    }
  };
}

// 生成神兽名称
function generateBeastName(input: string): string {
  const prefixes = ['天', '玄', '神', '灵', '圣', '仙', '古', '幻', '紫', '金'];
  const suffixes = ['龙', '凤', '麟', '虎', '狮', '鹏', '鹰', '狐', '龟', '蛇'];
  
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const prefix = prefixes[Math.abs(hash) % prefixes.length];
  const suffix = suffixes[Math.abs(hash >> 8) % suffixes.length];
  
  return `${prefix}${suffix}`;
}

// 辅助函数
function generateImageId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}
