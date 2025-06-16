import { NFTGallery } from '@/components/features/gallery/NFTGallery';

export const metadata = {
  title: '神兽图鉴 - 神图计划 ShanHaiVerse',
  description: '查看和管理你的山海经神兽NFT收藏，浏览稀有度分布和详细信息',
};

export default function GalleryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <NFTGallery />
    </div>
  );
}