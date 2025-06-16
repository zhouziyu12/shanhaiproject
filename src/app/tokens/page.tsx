export const metadata = {
  title: 'SHT代币中心 - 神图计划 ShanHaiVerse',
  description: '每日签到获取代币，连续签到奖励更丰厚',
};

export default function TokensPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center space-y-8 py-12">
        <div className="text-6xl">🪙</div>
        <h1 className="text-3xl font-bold text-white">SHT 代币中心</h1>
        <p className="text-white/70">每日签到获取代币，连续签到奖励更丰厚</p>
        <div className="inline-block bg-blue-500/20 border border-blue-500/30 rounded-lg p-6">
          <p className="text-blue-300">🚧 代币功能正在开发中，敬请期待！</p>
        </div>
      </div>
    </div>
  );
}
