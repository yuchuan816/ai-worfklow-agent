// lib/chroma.ts
import { ChromaClient } from 'chromadb';

const chromaClientSingleton = () => {
  return new ChromaClient({
    // 💡 这里的连接地址后面会优化
    host: process.env.CHROMA_HOST || 'localhost',
    port: parseInt(process.env.CHROMA_PORT || '8000', 10),
  });
};

declare const globalThis: {
  chromaGlobal?: ReturnType<typeof chromaClientSingleton>;
} & typeof global;

// 如果全局存在就用全局的，否则新建
export const chromaClient = globalThis.chromaGlobal ?? chromaClientSingleton();

// prod 环境没有热更新，只会创建一遍，所以不需要
if (process.env.NODE_ENV !== 'production') {
  globalThis.chromaGlobal = chromaClient;
}
