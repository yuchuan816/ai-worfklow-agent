// 基于 Prisma 的 MySQL 存储服务
import { prisma } from '@/lib/prisma';

export class MessageService {
  // 获取最近的对话上下文
  async getHistory(sessionId: string, limit = 6) {
    return await prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: -limit,
    });
  }

  // 原子化持久化 AI 的最终回答与深度思考链
  async saveAssistantMessage(sessionId: string, content: string, reasoning: string) {
    return await prisma.message.create({
      data: {
        sessionId,
        role: 'assistant',
        content,
        reasoning: reasoning || null,
      },
    });
  }
}
