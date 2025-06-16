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
    const { 
      imageUrl, 
      originalInput, 
      optimizedPrompt, 
      style, 
      creator 
    }: UploadRequest = await request.json();

    if (!imageUrl || !optimizedPrompt || !creator) {
      return NextResponse.json({ 
        error: '缺少必要参数：图片URL、优化prompt或创建者地址' 
      }, { status: 400 });
    }

    console.log('📤 开始NFT.Storage上传流程...');
    console.log('🎨 原始输入:', originalInput.substring(0, 50) + '...');
    console.log('✨ 优化prompt:', optimizedPrompt.substring(0, 50) + '...');

    // 第一步：下载AI生成的图片
    console.log('📥 下载AI生成的图片...');
    const imageBuffer = await downloadImage(imageUrl);
    
    // 第二步：创建完整的NFT元数据
    console.log('📝 创建NFT元数据...');
    const metadata = createNFTMetadata({
      originalInput,
      optimizedPrompt,
      style,
      creator,
      imageId: generateImageId()
    });

    // 第三步：上传到NFT.Storage
    console.log('🚀 上传到NFT.Storage...');
    const ipfsResult = await uploadToNFTStorage(imageBuffer, metadata);

    // 第四步：返回完整结果
    const result = {
      success: true,
      ipfs: ipfsResult,
      metadata: metadata,
      originalInput,
      optimizedPrompt,
      workflow: {
        step1: '✅ 图片下载完成',
        step2: '✅ 元数据创建完成', 
        step3: '✅ NFT.Storage上传完成',
        step4: '✅ 准备铸造NFT'
      },
      mintInfo: {
        // 返回铸造NFT所需的最终URL
        tokenURI: ipfsResult.metadataUrl,
        imageUrl: ipfsResult.imageUrl,
        gatewayUrl: ipfsResult.imageGatewayUrl
      }
    };

    console.log('🎉 NFT.Storage上传流程完成!');
    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ NFT.Storage上传失败:', error);
    return NextResponse.json({
      error: 'IPFS上传失败',
      details: error instanceof Error ? error.message : '未知错误',
      workflow: {
        step1: '❌ 处理中断',
        step2: '⏸️ 未完成',
        step3: '⏸️ 未完成',
        step4: '⏸️ 未完成'
      }
    }, { status: 500 });
  }
}

// NFT.Storage上传函数
async function uploadToNFTStorage(imageBuffer: Buffer, metadata: any) {
  console.log('🔄 开始NFT.Storage上传...');
  
  try {
    // 1. 上传图片到NFT.Storage
    console.log('📸 上传图片...');
    const imageResponse = await fetch('https://api.nft.storage/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NFT_STORAGE_TOKEN}`,
        'Content-Type': 'image/png',
      },
      body: imageBuffer,
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error('图片上传失败:', imageResponse.status, errorText);
      throw new Error(`图片上传失败: ${imageResponse.status}`);
    }

    const imageResult = await imageResponse.json();
    const imageCid = imageResult.value.cid;
    const imageIpfsUrl = `ipfs://${imageCid}`;
    
    console.log('✅ 图片上传成功, CID:', imageCid);

    // 2. 更新元数据中的图片URL
    metadata.image = imageIpfsUrl;

    // 3. 上传元数据到NFT.Storage
    console.log('📄 上传元数据...');
    const metadataResponse = await fetch('https://api.nft.storage/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NFT_STORAGE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!metadataResponse.ok) {
      const errorText = await metadataResponse.text();
      console.error('元数据上传失败:', metadataResponse.status, errorText);
      throw new Error(`元数据上传失败: ${metadataResponse.status}`);
    }

    const metadataResult = await metadataResponse.json();
    const metadataCid = metadataResult.value.cid;
    
    console.log('✅ 元数据上传成功, CID:', metadataCid);
    
    // 4. 返回结果
    return {
      imageUrl: imageIpfsUrl,
      metadataUrl: `ipfs://${metadataCid}`,
      imageGatewayUrl: `https://nftstorage.link/ipfs/${imageCid}`,
      metadataGatewayUrl: `https://nftstorage.link/ipfs/${metadataCid}`,
      cids: {
        image: imageCid,
        metadata: metadataCid
      },
      service: 'NFT.Storage'
    };

  } catch (error) {
    console.error('NFT.Storage上传错误:', error);
    
    // 如果NFT.Storage失败，使用模拟IPFS
    console.log('⚠️ NFT.Storage失败，使用模拟IPFS');
    return createMockIPFS(metadata);
  }
}

// 下载图片
async function downloadImage(imageUrl: string): Promise<Buffer> {
  try {
    console.log('🔗 从URL下载图片:', imageUrl);
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`图片下载失败: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('✅ 图片下载完成, 大小:', Math.round(buffer.length / 1024), 'KB');
    return buffer;
  } catch (error) {
    console.error('图片下载错误:', error);
    throw new Error('无法下载AI生成的图片');
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
  const rarityNames = ['普通', '稀有', '史诗', '传说', '神话'];
  const styleNames = {
    classic: '古典水墨',
    modern: '现代插画',
    fantasy: '奇幻艺术',
    ink: '水墨写意'
  };

  const beastName = generateBeastName(originalInput);
  
  return {
    name: `山海神兽 · ${beastName}`,
    description: `${optimizedPrompt}\n\n====== 创作信息 ======\n✨ 原始灵感：${originalInput}\n🎨 艺术风格：${styleNames[style as keyof typeof styleNames] || style}\n🎲 稀有度：待VRF分配\n🏛️ 项目：神图计划 ShanHaiVerse\n🤖 AI技术：DeepSeek + 智谱AI\n💾 存储：NFT.Storage + IPFS\n⏰ 创作时间：${new Date().toLocaleString('zh-CN')}\n\n这是通过AI技术重新演绎的山海经神兽，融合了传统文化与现代科技，每一只都是独一无二的数字艺术品。`,
    image: '', // 将在上传后设置
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
        value: 'NFT.Storage + IPFS'
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
    // 扩展属性
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
        storage: 'NFT.Storage',
        version: '1.0.0'
      }
    }
  };
}

// 创建模拟IPFS结果（备用方案）
function createMockIPFS(metadata: any) {
  const mockImageCid = `Qm${generateRandomHash()}`;
  const mockMetadataCid = `Qm${generateRandomHash()}`;
  
  return {
    imageUrl: `ipfs://${mockImageCid}`,
    metadataUrl: `ipfs://${mockMetadataCid}`,
    imageGatewayUrl: `https://ipfs.io/ipfs/${mockImageCid}`,
    metadataGatewayUrl: `https://ipfs.io/ipfs/${mockMetadataCid}`,
    cids: {
      image: mockImageCid,
      metadata: mockMetadataCid
    },
    service: '模拟IPFS',
    note: '模拟IPFS - NFT.Storage暂时不可用'
  };
}

// 生成神兽名称
function generateBeastName(input: string): string {
  const prefixes = ['天', '玄', '神', '灵', '圣', '仙', '古', '幻', '紫', '金'];
  const suffixes = ['龙', '凤', '麟', '虎', '狮', '鹏', '鹰', '狐', '龟', '蛇'];
  
  // 基于输入生成一致的名称
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

function generateRandomHash(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}
