// src/app/api/upload/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { FileService } from '@/services/file.service';
import { VectorService } from '@/services/vector.service';
import { MarkdownTextSplitter } from '@langchain/textsplitters';
import { withApiHandler } from '@/lib/api-handler'; // 引入高阶函数

const vectorService = new VectorService();

// 使用高阶函数包裹逻辑
export const POST = withApiHandler(async (req: NextRequest) => {
  const fileId = crypto.randomUUID();
  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file || !file.name.endsWith('.md')) {
    // 客户端输入错误，依然可以手动返回 400
    return NextResponse.json(
      { success: false, error: '请上传有效的 Markdown 文件' },
      { status: 400 },
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);
  const rawText = fileBuffer.toString('utf-8');

  const splitter = new MarkdownTextSplitter({
    chunkSize: 600,
    chunkOverlap: 60,
  });
  const textChunks = await splitter.splitText(rawText);

  if (textChunks.length === 0) {
    return NextResponse.json(
      { success: false, error: '未能从文件中切分出任何有效内容' },
      { status: 400 },
    );
  }

  const dbFile = await FileService.createFileRecord({
    id: fileId,
    fileName: file.name,
    fileSize: file.size,
    fileBuffer,
    textChunksCount: textChunks.length,
  });

  // 内部特定业务的补偿机制，保留独立的 try-catch 负责回滚事务
  try {
    const chunksPayload = dbFile.chunks.map((chunk, idx) => ({
      id: chunk.id,
      chunkIndex: chunk.chunkIndex,
      text: textChunks[idx],
    }));

    await vectorService.addFileChunks({ fileId, chunks: chunksPayload });
  } catch (vectorError: unknown) {
    console.error('❌ 向量化阶段失败，正在执行逆向事务补偿清理...', vectorError);
    await FileService.deleteFileRecord(fileId);

    // 抛出错误，外层 withApiHandler 会自动捕获并响应 500
    const errorMsg = vectorError instanceof Error ? vectorError.message : 'ChromaDB 同步超时';
    throw new Error(`知识库向量化失败: ${errorMsg}，已自动回滚文件实体。`);
  }

  return NextResponse.json({
    success: true,
    data: { fileId, fileName: file.name, chunksCount: textChunks.length },
  });
});
