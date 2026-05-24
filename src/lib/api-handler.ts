import { NextResponse, type NextRequest } from 'next/server';

type RouteHandler = (req: NextRequest, context: any) => Promise<Response> | Response;

export function withApiHandler(handler: RouteHandler) {
  return async (req: NextRequest, context: any) => {
    const startTime = Date.now();
    try {
      // 执行原路由逻辑
      const response = await handler(req, context);

      return response;
    } catch (error: unknown) {
      // 统一错误日志记录
      console.error(`[API_ERROR_INTERCEPTED] [${req.method}] ${req.nextUrl.pathname}:`, error);

      const errorMessage = error instanceof Error ? error.message : '服务器内部异常';

      // 统一错误响应格式
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: 500 },
      );
    } finally {
      // 统一耗时监控
      console.log(`[API_PERF] ${req.method} ${req.nextUrl.pathname} - ${Date.now() - startTime}ms`);
    }
  };
}
