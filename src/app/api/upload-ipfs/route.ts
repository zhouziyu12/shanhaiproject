// ========== 免费IPFS解决方案 ==========

// 方案1: NFT.Storage (完全免费)
// 1. 访问 https://nft.storage/
// 2. 注册账户
// 3. 获取API token
// 4. 替换上传函数

// src/app/api/upload-ipfs/route.ts 中的替代实现
async function uploadToNFTStorage(imageBuffer: Buffer, metadata: any) {
  try {
    // 1. 上传图片
    const imageForm = new FormData();
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' });
    imageForm.append('file', imageBlob, 'beast.png');

    const imageResponse = await fetch('https://api.nft.storage/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NFT_STORAGE_TOKEN}`,
      },
      body: imageForm,
    });

    const imageResult = await imageResponse.json();
    const imageCid = imageResult.value.cid;
    
    // 2. 更新元数据
    metadata.image = `ipfs://${imageCid}`;

    // 3. 上传元数据
    const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], { 
      type: 'application/json' 
    });
    const metadataForm = new FormData();
    metadataForm.append('file', metadataBlob, 'metadata.json');

    const metadataResponse = await fetch('https://api.nft.storage/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NFT_STORAGE_TOKEN}`,
      },
      body: metadataForm,
    });

    const metadataResult = await metadataResponse.json();
    const metadataCid = metadataResult.value.cid;
    
    return {
      imageUrl: `ipfs://${imageCid}`,
      metadataUrl: `ipfs://${metadataCid}`,
      imageGatewayUrl: `https://nftstorage.link/ipfs/${imageCid}`,
      metadataGatewayUrl: `https://nftstorage.link/ipfs/${metadataCid}`,
      cids: {
        image: imageCid,
        metadata: metadataCid
      }
    };
  } catch (error) {
    console.error('NFT.Storage上传失败:', error);
    throw error;
  }
}

// 方案2: Pinata (1GB免费)
// 1. 访问 https://pinata.cloud/
// 2. 注册账户
// 3. 获取API keys

async function uploadToPinata(imageBuffer: Buffer, metadata: any) {
  try {
    // 1. 上传图片
    const imageForm = new FormData();
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' });
    imageForm.append('file', imageBlob);
    imageForm.append('pinataMetadata', JSON.stringify({
      name: 'beast-image',
    }));

    const imageResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': process.env.PINATA_API_KEY!,
        'pinata_secret_api_key': process.env.PINATA_SECRET_KEY!,
      },
      body: imageForm,
    });

    const imageResult = await imageResponse.json();
    const imageCid = imageResult.IpfsHash;
    
    // 2. 更新元数据
    metadata.image = `ipfs://${imageCid}`;

    // 3. 上传元数据
    const metadataResponse = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': process.env.PINATA_API_KEY!,
        'pinata_secret_api_key': process.env.PINATA_SECRET_KEY!,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: 'beast-metadata',
        },
      }),
    });

    const metadataResult = await metadataResponse.json();
    const metadataCid = metadataResult.IpfsHash;
    
    return {
      imageUrl: `ipfs://${imageCid}`,
      metadataUrl: `ipfs://${metadataCid}`,
      imageGatewayUrl: `https://gateway.pinata.cloud/ipfs/${imageCid}`,
      metadataGatewayUrl: `https://gateway.pinata.cloud/ipfs/${metadataCid}`,
      cids: {
        image: imageCid,
        metadata: metadataCid
      }
    };
  } catch (error) {
    console.error('Pinata上传失败:', error);
    throw error;
  }
}

// 方案3: 使用现有的模拟IPFS（最简单）
// 项目已经包含了模拟IPFS功能，无需任何配置即可运行
// 生成的IPFS链接格式正确，但数据存储在模拟环境中

// ========== 环境变量配置选择 ==========

// 选择1: NFT.Storage (推荐)
// NFT_STORAGE_TOKEN=your_nft_storage_token_here

// 选择2: Pinata
// PINATA_API_KEY=your_pinata_api_key
// PINATA_SECRET_KEY=your_pinata_secret_key

// 选择3: 继续使用Web3.Storage免费额度
// WEB3_STORAGE_TOKEN=your_web3_storage_token_here

// 选择4: 暂时使用模拟IPFS（无需配置）
// 保持原有配置不变，系统自动使用模拟模式

// ========== 修改上传逻辑以支持多种服务 ==========
async function uploadToIPFS(imageBuffer: Buffer, metadata: any) {
  // 优先级：NFT.Storage > Pinata > Web3.Storage > 模拟IPFS
  if (process.env.NFT_STORAGE_TOKEN && process.env.NFT_STORAGE_TOKEN !== 'your_nft_storage_token_here') {
    try {
      return await uploadToNFTStorage(imageBuffer, metadata);
    } catch (error) {
      console.error('NFT.Storage失败，尝试其他方案');
    }
  }
  
  if (process.env.PINATA_API_KEY && process.env.PINATA_SECRET_KEY) {
    try {
      return await uploadToPinata(imageBuffer, metadata);
    } catch (error) {
      console.error('Pinata失败，尝试其他方案');
    }
  }
  
  if (process.env.WEB3_STORAGE_TOKEN && process.env.WEB3_STORAGE_TOKEN !== 'your_web3_storage_token_here') {
    try {
      return await uploadToWeb3Storage(imageBuffer, metadata);
    } catch (error) {
      console.error('Web3.Storage失败，使用模拟IPFS');
    }
  }
  
  // 最后回退到模拟IPFS
  console.log('⚠️ 使用模拟IPFS存储');
  return createMockIPFS(metadata);
}