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
    // Add request body parsing error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('❌ Request body parsing failed:', parseError);
      return NextResponse.json({ 
        error: 'Request format error',
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
        error: 'Missing required parameters: image URL, optimized prompt, or creator address' 
      }, { status: 400 });
    }

    console.log('📤 Starting Pinata IPFS upload workflow...');
    console.log('🎨 Original input:', originalInput?.substring(0, 50) + '...');
    console.log('✨ Optimized prompt:', optimizedPrompt?.substring(0, 50) + '...');

    // Step 1: Download AI-generated image
    console.log('📥 Downloading AI-generated image...');
    const imageBuffer = await downloadImage(imageUrl);
    
    // Step 2: Create complete NFT metadata
    console.log('📝 Creating NFT metadata...');
    const metadata = createNFTMetadata({
      originalInput: originalInput || '',
      optimizedPrompt,
      style: style || 'modern',
      creator,
      imageId: generateImageId()
    });

    // Step 3: Upload to Pinata IPFS
    console.log('🚀 Uploading to Pinata IPFS...');
    const ipfsResult = await uploadToPinata(imageBuffer, metadata);

    // Step 4: Return complete result
    const result = {
      success: true,
      ipfs: ipfsResult,
      metadata: metadata,
      originalInput: originalInput || '',
      optimizedPrompt,
      workflow: {
        step1: '✅ Image download completed',
        step2: '✅ Metadata creation completed', 
        step3: '✅ Pinata IPFS upload completed',
        step4: '✅ Ready to mint NFT'
      },
      mintInfo: {
        tokenURI: ipfsResult.metadataUrl,
        imageUrl: ipfsResult.imageUrl,
        gatewayUrl: ipfsResult.imageGatewayUrl
      }
    };

    console.log('🎉 Pinata IPFS upload workflow completed!');
    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Pinata IPFS upload failed:', error);
    
    // Return detailed error information
    return NextResponse.json({
      success: false,
      error: 'IPFS upload failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      workflow: {
        step1: '❌ Processing interrupted',
        step2: '⏸️ Not completed',
        step3: '⏸️ Not completed',
        step4: '⏸️ Not completed'
      }
    }, { status: 500 });
  }
}

// Pinata IPFS upload function
async function uploadToPinata(imageBuffer: Buffer, metadata: any) {
  console.log('🔄 Starting Pinata IPFS upload...');
  
  try {
    // Check Pinata JWT Token
    const pinataJWT = process.env.PINATA_JWT;
    if (!pinataJWT) {
      throw new Error('PINATA_JWT environment variable not configured');
    }

    // 1. Upload image to Pinata
    console.log('📸 Uploading image to Pinata...');
    
    const imageFormData = new FormData();
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' });
    imageFormData.append('file', imageBlob, 'beast.png');
    
    // Add Pinata options
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
      console.error('Pinata image upload failed:', imageResponse.status, errorText);
      throw new Error(`Pinata image upload failed: ${imageResponse.status} - ${errorText}`);
    }

    const imageResult = await imageResponse.json();
    const imageCid = imageResult.IpfsHash;
    const imageIpfsUrl = `ipfs://${imageCid}`;
    
    console.log('✅ Image successfully uploaded to Pinata, CID:', imageCid);

    // 2. Update image URL in metadata
    metadata.image = imageIpfsUrl;

    // 3. Upload metadata to Pinata
    console.log('📄 Uploading metadata to Pinata...');
    
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
      console.error('Pinata metadata upload failed:', metadataResponse.status, errorText);
      throw new Error(`Pinata metadata upload failed: ${metadataResponse.status} - ${errorText}`);
    }

    const metadataResult = await metadataResponse.json();
    const metadataCid = metadataResult.IpfsHash;
    
    console.log('✅ Metadata successfully uploaded to Pinata, CID:', metadataCid);
    
    // 4. Return result
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
    console.error('Pinata IPFS upload error:', error);
    throw error;
  }
}

// Download image
async function downloadImage(imageUrl: string): Promise<Buffer> {
  try {
    console.log('🔗 Downloading image from URL:', imageUrl);
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Image download failed: ${response.status} - ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('✅ Image download completed, size:', Math.round(buffer.length / 1024), 'KB');
    return buffer;
  } catch (error) {
    console.error('Image download error:', error);
    throw new Error(`Unable to download AI-generated image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Create NFT metadata
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
    classic: 'Classical Ink Wash',
    modern: 'Modern Illustration',
    fantasy: 'Fantasy Art',
    ink: 'Ink Wash Freehand'
  };

  const beastName = generateBeastName(originalInput);
  
  return {
    name: `Shan Hai Mythical Beast · ${beastName}`,
    description: `${optimizedPrompt}\n\n====== Creation Information ======\n✨ Original Inspiration: ${originalInput}\n🎨 Art Style: ${styleNames[style as keyof typeof styleNames] || style}\n🎲 Rarity: Awaiting VRF allocation\n🏛️ Project: ShenTu Plan ShanHaiVerse\n🤖 AI Technology: DeepSeek + Zhipu AI\n💾 Storage: Pinata IPFS\n⏰ Creation Time: ${new Date().toLocaleString('en-US')}\n\nThis is a Shan Hai Jing mythical beast reinterpreted through AI technology, blending traditional culture with modern technology. Each one is a unique digital artwork.`,
    image: '',
    external_url: 'https://shanhaiverse.com',
    background_color: '7c3aed',
    attributes: [
      {
        trait_type: 'Art Style',
        value: styleNames[style as keyof typeof styleNames] || style
      },
      {
        trait_type: 'Creator',
        value: creator
      },
      {
        trait_type: 'Generation Method',
        value: 'AI Generated'
      },
      {
        trait_type: 'AI Model',
        value: 'DeepSeek + Zhipu AI'
      },
      {
        trait_type: 'Storage Method',
        value: 'Pinata IPFS'
      },
      {
        trait_type: 'Creation Date',
        value: new Date().toISOString().split('T')[0]
      },
      {
        trait_type: 'Project Version',
        value: 'V1.0'
      },
      {
        trait_type: 'Image ID',
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
        imageGenerator: 'Zhipu AI',
        storage: 'Pinata IPFS',
        version: '1.0.0'
      }
    }
  };
}

// Generate beast name
function generateBeastName(input: string): string {
  const prefixes = ['Sky', 'Mystic', 'Divine', 'Spirit', 'Sacred', 'Immortal', 'Ancient', 'Phantom', 'Purple', 'Golden'];
  const suffixes = ['Dragon', 'Phoenix', 'Qilin', 'Tiger', 'Lion', 'Roc', 'Eagle', 'Fox', 'Turtle', 'Serpent'];
  
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const prefix = prefixes[Math.abs(hash) % prefixes.length];
  const suffix = suffixes[Math.abs(hash >> 8) % suffixes.length];
  
  return `${prefix}${suffix}`;
}

// Helper functions
function generateImageId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}
