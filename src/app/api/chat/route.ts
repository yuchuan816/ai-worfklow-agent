import { NextResponse } from 'next/server';
import { ragService } from '@/services/ragService';

export async function GET() {
  try {
    // 1. 【注入种子数据】硬编码将测试规范塞入 Chroma 物理容器
    // await ragService.seedMockData();

    // 2. 【硬编码模拟用户提问】故意提问一个直击私有规范核心的问题
    const MOCK_USER_QUERY =
      '为什么我的 TypeScript 代码里，可选属性写了 undefined 会被狂轰报错啊？';

    // 3. 【执行 RAG 检索】调用 qwen3-embedding 计算提问向量，并去 Chroma 捞出最相关条文
    const relevantDoc = await ragService.queryRelevantDocs(MOCK_USER_QUERY);

    // 4. 【拼装工业级 Prompt】注入检索出来的上下文，彻底锁死大模型的幻觉
    const formattedPrompt = `你是一个严谨的全栈架构师导师。请结合给定的【内部规范】来回答用户的疑问。
如果用户的行为违反了规范，请严厉且精准地指出问题根源。

【内部规范开始】
${relevantDoc}
【内部规范结束】

【用户提问】：${MOCK_USER_QUERY}
`;

    // 5. 【驱动大模型推理】将组装好的 Prompt 发送给本地的 deepseek-r1:1.5b
    // 注意：关闭 stream 模式，方便我们在盲跑阶段在控制台一整块打印出来
    const ollamaResponse = await fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-r1:1.5b',
        prompt: formattedPrompt,
        stream: false,
      }),
    });

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama 推理失败: ${ollamaResponse.statusText}`);
    }

    const aiData = (await ollamaResponse.json()) as { response: string };

    // =======================================================
    // 🚨 终点线验证：直接在你的 Mac 终端（Terminal）里高亮打印结果
    // =======================================================
    console.log('=======================================================');
    console.log('📥 [用户输入]:', MOCK_USER_QUERY);
    console.log('📚 [RAG 捞出的规范]:\n', relevantDoc);
    console.log('🤖 [DeepSeek-R1 满血输出（含 <think> 思考链）]:\n');
    console.log(aiData.response);
    console.log('=======================================================\n');

    return NextResponse.json({
      success: true,
      message:
        '第一战役核心骨架管道全线打通！请看你的 VS Code 终端控制台输出。',
      data: aiData.response,
    });
  } catch (error) {
    const err = error as Error;
    console.error('❌ 盲跑管道发生崩溃:', err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
