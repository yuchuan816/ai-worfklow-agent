import { streamText, convertToModelMessages } from 'ai';
import { ollama } from 'ollama-ai-provider-v2';
import { prisma } from '@/lib/prisma'; // 导入我们之前重构的 Prisma 全局单例
import { VectorService } from '@/services/vector.service';

const vectorService = new VectorService();

export class ChatService {
  /**
   * 核心业务：控制并编排整个 RAG（检索增强生成）聊天流
   * @param sessionId 聊天会话 ID
   * @param messages 前端传过来的完整历史对白（包含用户刚输入的最后一条消息）
   */
  static async streamChatFlow(sessionId: string, messages: any[]) {
    // 获取用户当前最新发送的那条文本
    const lastMessage = messages[messages.length - 1];
    const lastUserContent = lastMessage?.parts?.find((p: any) => p.type === 'text')?.text ?? '';

    if (lastUserContent) {
      await prisma.message.create({
        data: {
          sessionId,
          role: 'user',
          content: lastUserContent,
        },
      });
    }

    //【知识检索】去本地 Chroma 寻找与用户提问语义相近的本地文档
    let contextDocs: string[] = [];
    try {
      contextDocs = await vectorService.queryKnowledge(lastUserContent);
    } catch (err) {
      console.error('[Chroma_Error] 知识库检索失败，系统自动降级运行:', err);
    }

    // 组装符合 RAG 规范的 System Prompt
    const systemPrompt = `你是一个基于本地知识库构建的 AI 助手。
请结合以下参考资料回答用户的问题。如果资料中没有相关信息，请拒绝回答，不要胡乱编造。

【参考资料】：
${contextDocs.join('\n---\n')}
`;

    //【调用大模型】启动 DeepSeek 流式渲染并返回 result 对象
    return streamText({
      model: ollama('deepseek-r1:1.5b'),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),

      // 流结束后的生命周期钩子：当大模型吐完最后一个字时，由它负责把 AI 的回答存入 MySQL
      onFinish: async ({ text, reasoningText }) => {
        try {
          // 使用 Prisma 事务：同时保存 AI 消息并更新 Session 的最后活跃时间（updatedAt）
          await prisma.$transaction([
            prisma.message.create({
              data: {
                sessionId,
                role: 'assistant',
                content: text,
                reasoning: reasoningText ?? null, // 支持 deepseek 的思考模型字段
              },
            }),
            prisma.chatSession.update({
              where: { id: sessionId },
              data: { updatedAt: new Date() }, // 强行触发更新时间，让侧边栏聊天框排序上升
            }),
          ]);
        } catch (dbErr) {
          console.error('[MySQL_Error] 写入 AI 历史对白或更新会话失败:', dbErr);
        }
      },
    });
  }
}
