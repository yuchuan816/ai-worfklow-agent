import { type NextRequest } from 'next/server';
import { SessionsService } from '@/services/sessions.service';
import { withApiHandler, successResponse, badRequest } from '@/lib/api-handler';
import { MessageService } from '@/services/message.service';

interface SessionParams {
  id: string;
}

// 获取指定会话的历史消息列表
export const GET = withApiHandler(
  async (req: NextRequest, context: { params: Promise<SessionParams> }) => {
    const { id: sessionId } = await context.params;

    if (!sessionId) return badRequest('缺少会话 ID');

    const messages = await MessageService.getHistory(sessionId);

    return successResponse(messages);
  },
);

// 删除指定会话
export const DELETE = withApiHandler(
  async (req: NextRequest, context: { params: Promise<SessionParams> }) => {
    const { id: sessionId } = await context.params;

    if (!sessionId) return badRequest('缺少会话 ID');

    await SessionsService.deleteSession(sessionId);

    return successResponse({ message: '会话删除成功' });
  },
);
