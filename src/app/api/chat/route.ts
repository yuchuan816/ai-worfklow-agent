import { type NextRequest } from 'next/server';
import { ChatService } from '@/services/chat.service';
import { withApiHandler, badRequest } from '@/lib/api-handler';

export const POST = withApiHandler(async (req: NextRequest) => {
  const { messages, sessionId } = await req.json();

  if (!sessionId) return badRequest('sessionId 不能为空');
  if (!(messages?.length > 0)) return badRequest('消息体不能为空');

  const chatStreamResult = await ChatService.streamChatFlow(sessionId, messages);
  return chatStreamResult.toUIMessageStreamResponse();
});
