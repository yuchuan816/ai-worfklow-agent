import { streamText, convertToModelMessages } from 'ai';
import { ollama } from 'ollama-ai-provider-v2';
import { VectorService } from '@/services/vector.service';
import { MessageService } from '@/services/message.service';

const vectorService = new VectorService();
const messageService = new MessageService();

export async function POST(req: Request) {
  const { messages, sessionId } = await req.json();
  const latestUserMessage = messages[messages.length - 1]?.content || '';

  // 【知识检索】去本地 Chroma 寻找与当前用户提问语义相近的本地文档
  let contextDocs: string[] = [];
  try {
    contextDocs = await vectorService.queryKnowledge(latestUserMessage);
  } catch (err) {
    console.error('Chroma 检索失败，降级运行:', err);
  }

  // 将本地知识作为大模型的 System Prompt
  const systemPrompt = `你是一个基于本地知识库构建的 AI 助手。
  请结合以下参考资料回答用户的问题。如果资料中没有相关信息，请拒绝回答，不要胡乱编造。

  【参考资料】：
  ${contextDocs.join('\n---\n')}
  `;

  // 【调用 DeepSeek】启动流式渲染
  const result = streamText({
    model: ollama('deepseek-r1:1.5b'),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    // 流结束后的生命周期钩子，负责最终把结果 atomic 写进 MySQL
    onFinish: async ({ text, reasoningText }) => {
      // TODO 暂时关闭
      return;
      try {
        await messageService.saveAssistantMessage(
          sessionId,
          text,
          reasoningText ?? '',
        );
      } catch (dbErr) {
        console.error('MySQL 写入历史对白失败:', dbErr);
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
