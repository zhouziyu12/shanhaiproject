// ========== src/types/workflow.ts ==========
export interface AIWorkflowState {
  step: 'idle' | 'optimizing' | 'generating' | 'uploading' | 'minting' | 'complete' | 'error';
  progress: number;
  message: string;
  currentAction?: string;
  // 数据
  userInput?: string;
  optimizedPrompt?: string;
  imageUrl?: string;
  ipfsData?: IPFSUploadResponse['ipfs'];
  metadata?: BeastMetadata;
  // 错误信息
  error?: string;
  errorDetails?: string;
  // 时间戳
  startTime?: number;
  endTime?: number;
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress?: number;
  error?: string;
  duration?: number;
}
