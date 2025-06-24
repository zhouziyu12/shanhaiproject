'use client';

// 导入增强版本的RarityReveal组件
export { RarityReveal } from './RarityReveal.enhanced';

// 如果需要保持向后兼容，也可以这样导出
import { RarityReveal as EnhancedRarityReveal } from './RarityReveal.enhanced';
export default EnhancedRarityReveal;
