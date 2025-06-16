export const metadata = {
  title: '交易市场 - 神图计划 ShanHaiVerse',
  description: '买卖独特的山海经神兽NFT',
};

export default function MarketplacePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center space-y-8 py-12">
        <div className="text-6xl">🛒</div>
        <h1 className="text-3xl font-bold text-white">神兽交易市场</h1>
        <p className="text-white/70">买卖独特的山海经神兽NFT</p>
        <div className="inline-block bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-6">
          <p className="text-yellow-300">🚧 市场功能正在开发中，敬请期待！</p>
        </div>
      </div>
    </div>
  );
}
