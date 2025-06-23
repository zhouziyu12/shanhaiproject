import { ethers } from 'ethers';

interface VRFMonitorConfig {
  rpcUrl: string;
  contractAddress: string;
  maxWaitTime?: number;
  pollInterval?: number;
  eventLookbackBlocks?: number;
  maxRetries?: number;
}

interface VRFResult {
  success: boolean;
  status: 'pending' | 'fulfilled' | 'timeout' | 'failed';
  tokenId: string;
  rarity?: number;
  randomWord?: number;
  isRealVRF?: boolean;
  vrfRequestId?: string;
  blockNumber?: number;
  txHash?: string;
  waitTime?: number;
  pollCount?: number;
  error?: string;
}

// 合约ABI - 与你的route.ts保持一致
const SHANHAI_NFT_ABI = [
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "beasts",
    "outputs": [
      {"name": "prompt", "type": "string"},
      {"name": "ipfsImageUrl", "type": "string"}, 
      {"name": "ipfsMetadataUrl", "type": "string"},
      {"name": "rarity", "type": "uint8"},
      {"name": "timestamp", "type": "uint256"},
      {"name": "creator", "type": "address"},
      {"name": "rarityRevealed", "type": "bool"},
      {"name": "hasIPFS", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "vrfPending",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "tokenId", "type": "uint256"},
      {"indexed": false, "name": "rarity", "type": "uint8"},
      {"indexed": false, "name": "randomValue", "type": "uint256"}
    ],
    "name": "RarityRevealed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "tokenId", "type": "uint256"},
      {"indexed": false, "name": "requestId", "type": "uint256"}
    ],
    "name": "RarityRequested",
    "type": "event"
  }
];

export class VRFMonitor {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;
  private config: Required<VRFMonitorConfig>;
  private activeMonitors = new Map<string, NodeJS.Timeout>();

  constructor(config: VRFMonitorConfig) {
    this.config = {
      maxWaitTime: 5 * 60 * 1000, // 5分钟
      pollInterval: 3000, // 3秒
      eventLookbackBlocks: 50000,
      maxRetries: 10,
      ...config
    };

    this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
    this.contract = new ethers.Contract(
      this.config.contractAddress,
      SHANHAI_NFT_ABI,
      this.provider
    );
  }

  // 🔄 启动VRF监控
  async startMonitoring(tokenId: number | string, vrfRequestId: string): Promise<VRFResult> {
    const tokenIdStr = tokenId.toString();
    const monitorId = `${tokenIdStr}_${Date.now()}`;
    
    console.log(`🔍 启动VRF监控 - Token ${tokenIdStr}, VRF Request: ${vrfRequestId}`);

    return new Promise((resolve) => {
      const startTime = Date.now();
      let pollCount = 0;

      const pollStatus = async () => {
        try {
          pollCount++;
          const waitTime = Date.now() - startTime;
          
          console.log(`🔄 轮询 ${pollCount} - Token ${tokenIdStr} (${Math.round(waitTime/1000)}s)`);

          // 检查超时
          if (waitTime > this.config.maxWaitTime) {
            this.stopMonitoring(monitorId);
            resolve({
              success: false,
              status: 'timeout',
              tokenId: tokenIdStr,
              waitTime,
              pollCount,
              error: 'VRF monitoring timeout'
            });
            return;
          }

          // 查询链上状态
          const result = await this.checkVRFStatus(tokenId);
          
          if (result.rarityRevealed) {
            console.log(`🎉 Token ${tokenIdStr} 稀有度已揭晓:`, result.rarity);
            
            // 查找VRF事件数据
            const vrfData = await this.findVRFEvents(tokenId);
            
            this.stopMonitoring(monitorId);
            resolve({
              success: true,
              status: 'fulfilled',
              tokenId: tokenIdStr,
              rarity: result.rarity,
              randomWord: vrfData.randomWord,
              isRealVRF: vrfData.isRealVRF,
              vrfRequestId,
              blockNumber: vrfData.blockNumber,
              txHash: vrfData.txHash,
              waitTime,
              pollCount
            });
            return;
          }

          // 继续等待
          console.log(`⏳ Token ${tokenIdStr} VRF仍在处理中...`);

        } catch (error) {
          console.error(`❌ 轮询错误:`, error);
          this.stopMonitoring(monitorId);
          resolve({
            success: false,
            status: 'failed',
            tokenId: tokenIdStr,
            error: error instanceof Error ? error.message : 'Unknown error',
            waitTime: Date.now() - startTime,
            pollCount
          });
        }
      };

      // 立即执行一次
      pollStatus();

      // 设置定时器
      const intervalId = setInterval(pollStatus, this.config.pollInterval);
      this.activeMonitors.set(monitorId, intervalId);
    });
  }

  // 📊 检查VRF状态
  private async checkVRFStatus(tokenId: number | string) {
    const beastInfo = await this.contract.beasts(BigInt(tokenId));
    const isPending = await this.contract.vrfPending(BigInt(tokenId));
    
    return {
      rarityRevealed: beastInfo.rarityRevealed,
      rarity: parseInt(beastInfo.rarity.toString()),
      isPending
    };
  }

  // 🎲 查找VRF事件
  private async findVRFEvents(tokenId: number | string) {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - this.config.eventLookbackBlocks);
      
      console.log(`🔍 搜索VRF事件 Token ${tokenId}, 区块范围: ${fromBlock} - ${currentBlock}`);

      // 查找RarityRevealed事件
      const revealedFilter = this.contract.filters.RarityRevealed(tokenId);
      const revealedEvents = await this.contract.queryFilter(revealedFilter, fromBlock, currentBlock);
      
      if (revealedEvents.length > 0) {
        const event = revealedEvents[revealedEvents.length - 1];
        const randomValue = event.args?.randomValue;
        
        console.log(`🎲 找到RarityRevealed事件:`, {
          randomValue: randomValue?.toString(),
          rarity: event.args?.rarity,
          blockNumber: event.blockNumber
        });
        
        return {
          randomWord: randomValue ? parseInt(randomValue.toString()) : null,
          isRealVRF: true,
          blockNumber: event.blockNumber,
          txHash: event.transactionHash
        };
      }

      // 查找RarityRequested事件
      const requestedFilter = this.contract.filters.RarityRequested(tokenId);
      const requestedEvents = await this.contract.queryFilter(requestedFilter, fromBlock, currentBlock);
      
      if (requestedEvents.length > 0) {
        const event = requestedEvents[requestedEvents.length - 1];
        console.log(`📝 找到RarityRequested事件:`, {
          requestId: event.args?.requestId?.toString(),
          blockNumber: event.blockNumber
        });
      }

      return {
        randomWord: null,
        isRealVRF: false,
        blockNumber: null,
        txHash: null
      };

    } catch (error) {
      console.error('❌ 查找VRF事件失败:', error);
      return {
        randomWord: null,
        isRealVRF: false,
        blockNumber: null,
        txHash: null
      };
    }
  }

  // 🛑 停止监控
  private stopMonitoring(monitorId: string) {
    const intervalId = this.activeMonitors.get(monitorId);
    if (intervalId) {
      clearInterval(intervalId);
      this.activeMonitors.delete(monitorId);
      console.log(`🛑 停止监控: ${monitorId}`);
    }
  }

  // 🧹 清理所有监控
  cleanup() {
    for (const [id, intervalId] of this.activeMonitors) {
      clearInterval(intervalId);
    }
    this.activeMonitors.clear();
    console.log('🧹 清理所有VRF监控任务');
  }

  // 📈 获取监控状态
  getActiveMonitors() {
    return {
      count: this.activeMonitors.size,
      monitors: Array.from(this.activeMonitors.keys())
    };
  }
}

// 🏭 工厂函数
export function createVRFMonitor() {
  const config = {
    rpcUrl: process.env.SEPOLIA_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL!,
    contractAddress: process.env.SHANHAI_NFT_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_PROMPT_NFT_ADDRESS!
  };

  return new VRFMonitor(config);
}

// 默认导出
export default VRFMonitor;
