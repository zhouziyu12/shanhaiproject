'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Upload, 
  Loader2, 
  Coins, 
  Clock, 
  Shield, 
  Zap,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MintButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  estimatedFee?: string;
  estimatedTime?: string;
}

export function MintButton({
  onClick,
  disabled = false,
  loading = false,
  loadingText = 'Minting...',
  estimatedFee = 'Free',
  estimatedTime = '1-2 minutes'
}: MintButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="space-y-4">
      {/* Minting Information Card */}
      <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
        <CardContent className="p-4">
          <div className="space-y-3">
            <h4 className="font-medium text-white flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-400" />
              Minting Information
            </h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="text-white/60">Minting Fee</div>
                <div className="flex items-center gap-1 text-white">
                  <Coins className="h-3 w-3 text-green-400" />
                  <span className="font-medium">{estimatedFee}</span>
                  {estimatedFee === 'Free' && (
                    <Badge variant="success" className="text-xs ml-1">
                      Limited Time
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-white/60">Estimated Time</div>
                <div className="flex items-center gap-1 text-white">
                  <Clock className="h-3 w-3 text-blue-400" />
                  <span className="font-medium">{estimatedTime}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs text-white/70">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-400" />
                <span>Images and metadata will be permanently stored on IPFS</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-400" />
                <span>Receive 50 SHT token rewards after successful minting</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-400" />
                <span>Rarity determined by VRF randomness, fair and transparent</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Mint Button */}
      <Button
        onClick={onClick}
        disabled={disabled || loading}
        className={cn(
          "w-full h-14 text-lg font-semibold transition-all duration-300",
          "bg-gradient-to-r from-green-500 to-emerald-500",
          "hover:from-green-600 hover:to-emerald-600",
          "shadow-lg shadow-green-500/25 hover:shadow-green-500/40",
          "border-0 relative overflow-hidden group",
          loading && "cursor-not-allowed",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Background animation */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 transition-opacity duration-300",
          isHovered && !loading && !disabled && "opacity-20"
        )} />
        
        {/* Button content */}
        <div className="relative flex items-center justify-center gap-3">
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{loadingText}</span>
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              <span>Mint Beast NFT</span>
              <Zap className="h-4 w-4 text-yellow-300" />
            </>
          )}
        </div>

        {/* Success animation */}
        {loading && (
          <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 animate-pulse" />
        )}
      </Button>

      {/* Risk Notice */}
      <Card className="bg-yellow-500/10 border-yellow-500/20">
        <CardContent className="p-3">
          <div className="flex items-start gap-2 text-xs">
            <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1 text-yellow-200/80">
              <div className="font-medium">Minting Guidelines</div>
              <div>• Minting process is irreversible, please ensure the AI-generated image meets expectations</div>
              <div>• Rarity will be randomly determined after minting, cannot be manually influenced</div>
              <div>• Please ensure your wallet has sufficient ETH to pay gas fees</div>
              <div>• NFT will appear in your wallet immediately after successful minting</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Loading State Information */}
      {loading && (
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-blue-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="font-medium">Minting in Progress...</span>
              </div>
              
              <div className="space-y-2 text-sm text-blue-200/80">
                <div>🔄 Transaction processing, please do not close this page</div>
                <div>⏳ Blockchain confirmation takes time, please be patient</div>
                <div>🎯 Rarity will be automatically assigned after confirmation</div>
              </div>

              {/* Progress animation */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-blue-300">
                  <span>Processing Progress</span>
                  <span>Confirming...</span>
                </div>
                <div className="w-full bg-blue-500/20 rounded-full h-1">
                  <div className="bg-gradient-to-r from-blue-400 to-blue-500 h-1 rounded-full animate-pulse w-3/4"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}