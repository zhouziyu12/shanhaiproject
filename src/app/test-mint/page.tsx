'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useContract } from '@/hooks/useContract';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function TestMintPage() {
  const { address, isConnected } = useAccount();
  const { mintNFT, isMinting, mintResult } = useContract();
  const [tokenURI, setTokenURI] = useState('ipfs://QmTest123456789');
  const [discountPercent, setDiscountPercent] = useState(0);

  const handleTestMint = async () => {
    if (!address) {
      alert('请先连接钱包');
      return;
    }

    console.log('开始测试铸造...');
    const result = await mintNFT(address, tokenURI, discountPercent);
    console.log('铸造结果:', result);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>NFT铸造测试页面</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 连接钱包 */}
          <div>
            <Label>钱包连接状态</Label>
            <div className="mt-2">
              <ConnectButton />
              {isConnected && (
                <Badge className="ml-2" variant="outline">
                  已连接: {address?.slice(0, 6)}...{address?.slice(-4)}
                </Badge>
              )}
            </div>
          </div>

          {/* Token URI输入 */}
          <div>
            <Label htmlFor="tokenURI">Token URI (IPFS地址)</Label>
            <Input
              id="tokenURI"
              value={tokenURI}
              onChange={(e) => setTokenURI(e.target.value)}
              placeholder="ipfs://..."
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">
              输入IPFS地址，例如: ipfs://QmXxx...
            </p>
          </div>

          {/* 折扣输入 */}
          <div>
            <Label htmlFor="discount">折扣百分比 (%)</Label>
            <Input
              id="discount"
              type="number"
              min="0"
              max="100"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(Number(e.target.value))}
              placeholder="0-100"
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">
              输入0-100之间的数字，表示折扣百分比
            </p>
          </div>

          {/* 铸造按钮 */}
          <Button
            onClick={handleTestMint}
            disabled={!isConnected || isMinting}
            className="w-full"
          >
            {isMinting ? '铸造中...' : '测试铸造NFT'}
          </Button>

          {/* 结果显示 */}
          {mintResult && (
            <Card className={mintResult.success ? 'bg-green-50' : 'bg-red-50'}>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">
                  {mintResult.success ? '✅ 铸造成功' : '❌ 铸造失败'}
                </h3>
                {mintResult.success ? (
                  <div className="space-y-1 text-sm">
                    <p>Token ID: #{mintResult.tokenId}</p>
                    <p>交易哈希: {mintResult.transactionHash?.slice(0, 10)}...</p>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${mintResult.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      查看交易详情 →
                    </a>
                  </div>
                ) : (
                  <p className="text-red-600 text-sm">{mintResult.error}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* 合约信息 */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">📋 合约信息</h3>
              <div className="space-y-1 text-sm font-mono">
                <p>NFT合约: 0x1C466dbDddb23e123760A2EDCce54b1709Fa735A</p>
                <p>网络: Sepolia测试网</p>
                <p>基础铸造费: 0.001 ETH</p>
                <p>{discountPercent > 0 && `折扣后: ${(0.001 * (100 - discountPercent) / 100).toFixed(6)} ETH`}</p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
