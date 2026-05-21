// src/services/ragService.ts
import { chromaClient } from '@/lib/chroma';

// 【硬编码测试规范文本】作为第一战役的盲跑靶子
const MOCK_REGULATION = `【AI研发规范第104条】所有全栈开发项目，必须严格关闭生产环境的 console.log 与 debugger。
同时，在使用 TypeScript 时，若开启了 exactOptionalPropertyTypes，
禁止显式对可选属性赋予 undefined 值，以杜绝底层的序列化数据隐式漏斗。`;

/**
 * 专门调用本地 Ollama 生成向量的原子函数
 * 基于 qwen3-embedding:0.6b
 */
async function getOllamaEmbedding(text: string): Promise<number[]> {
  const response = await fetch('http://127.0.0.1:11434/api/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen3-embedding:0.6b',
      prompt: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama 向量化失败: ${response.statusText}`);
  }

  const data = (await response.json()) as { embedding: number[] };
  return data.embedding;
}

// 符合 ChromaDB 最新 SDK 规范的自定义向量包装器
const customEmbeddingFunction = {
  generate: async (texts: string[]): Promise<number[][]> => {
    return Promise.all(texts.map((text) => getOllamaEmbedding(text)));
  },
};

/**
 * 盲跑核心服务：注入测试规范，并提供相似度检索
 */
export const ragService = {
  /**
   * 任务 A：硬编码将规范文本塞入向量库
   */
  async seedMockData(): Promise<void> {
    try {
      // 强行清理冲突的残留旧集合
      await chromaClient.deleteCollection({ name: 'spec_collection' });
      console.log('🧹 已成功清理冲突的旧向量集合');
    } catch (err) {
      console.error(err);
    }

    // 强行创建干净的全新向量集
    const collection = await chromaClient.createCollection({
      name: 'spec_collection',
      embeddingFunction: customEmbeddingFunction,
    });

    const embedding = await getOllamaEmbedding(MOCK_REGULATION);

    await collection.add({
      ids: ['reg_104'],
      embeddings: [embedding],
      documents: [MOCK_REGULATION],
    });
    console.log('🚀 新向量集合重建成功，种子数据注入完毕！');
  },

  /**
   * 任务 B：根据用户的提问，去向量库里捞出最相关的规范
   */
  async queryRelevantDocs(userQuery: string): Promise<string> {
    const collection = await chromaClient.getCollection({
      name: 'spec_collection',
      embeddingFunction: customEmbeddingFunction,
    });

    const queryEmbedding = await getOllamaEmbedding(userQuery);

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: 1,
    });

    if (results.documents && results.documents[0] && results.documents[0][0]) {
      return results.documents[0][0];
    }
    return '未找到相关规范。';
  },
};
