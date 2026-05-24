import { chromaClient } from '@/lib/chroma';
import { QwenEmbeddingFunction } from '@/lib/embeddings';

export class VectorService {
  private collectionName = 'spec_collection_v2';
  // 初始化时传入对应的参数
  private qwenEf = new QwenEmbeddingFunction({ model: 'qwen3-embedding:0.6b' });

  async queryKnowledge(queryText: string, limit = 3): Promise<string[]> {
    const collection = await chromaClient.getOrCreateCollection({
      name: this.collectionName,
      embeddingFunction: this.qwenEf,
    });

    const response = await collection.query({
      queryTexts: [queryText],
      nResults: limit,
    });

    return (response.documents[0] as string[]) || [];
  }
}
