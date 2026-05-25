import { type NextRequest } from 'next/server';
import { SessionsService } from '@/services/sessions.service';
import { withApiHandler, successResponse, badRequest } from '@/lib/api-handler';

interface SessionParams {
  id: string;
}

// 删除指定会话
export const DELETE = withApiHandler(
  async (req: NextRequest, context: { params: Promise<SessionParams> }) => {
    const { id: sessionId } = await context.params;

    if (!sessionId) return badRequest('缺少会话 ID');

    await SessionsService.deleteSession(sessionId);

    return successResponse({ message: '会话删除成功' });
  },
);
