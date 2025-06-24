'use client';

import { useEffect } from 'react';
import { NFTGallery } from '@/components/features/gallery/NFTGallery';

export default function GalleryPage() {
  // 监听NFT添加事件
  useEffect(() => {
    const handleNFTAdded = (event: CustomEvent) => {
      console.log('🎉 The album page received an NFT addition event:', event.detail);
      // 可以在这里添加通知或者强制刷新
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('nftMintedAndAddedToGallery', handleNFTAdded as EventListener);
      return () => {
        window.removeEventListener('nftMintedAndAddedToGallery', handleNFTAdded as EventListener);
      };
    }
  }, []);

  return <NFTGallery />;
}
