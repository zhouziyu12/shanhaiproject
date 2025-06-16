export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-8 py-12">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
            神图计划
            <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              ShanHaiVerse
            </span>
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            用人工智能重新演绎千年神话，DeepSeek + 智谱AI 双重技术加持，
            创造独特的山海神兽NFT，每一只都是独一无二的数字艺术品
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg px-8 py-3 rounded-lg transition-all">
            <span className="mr-2">✨</span>
            开始创造
          </button>
          
          <button className="border border-white/30 text-white hover:bg-white/10 text-lg px-8 py-3 rounded-lg transition-all">
            <span className="mr-2">🖼️</span>
            浏览图鉴
          </button>
        </div>
      </section>

      {/* 功能介绍 */}
      <section className="py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">平台特色</h2>
          <p className="text-white/70">为什么选择神图计划</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 p-8 text-center rounded-lg">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">双AI协作</h3>
            <p className="text-white/70">
              DeepSeek优化创意描述，智谱AI生成高质量图像，双重AI技术确保每只神兽都独一无二
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 p-8 text-center rounded-lg">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🛡️</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">公平稀有度</h3>
            <p className="text-white/70">
              使用Chainlink VRF确保稀有度分配的随机性和公平性，杜绝人为操控
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 p-8 text-center rounded-lg">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🌐</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">永久存储</h3>
            <p className="text-white/70">
              图片和元数据存储在IPFS上，确保你的神兽永不丢失，真正的数字收藏品
            </p>
          </div>
        </div>
      </section>

      {/* 状态提示 */}
      <section className="text-center py-8">
        <div className="inline-block bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg p-6">
          <h3 className="text-green-400 font-bold mb-2">🎉 项目已成功启动！</h3>
          <p className="text-green-300/80 text-sm">
            基础功能正常运行，Web3功能将在后续步骤中集成
          </p>
        </div>
      </section>
    </div>
  )
}
