import { type NextRequest, NextResponse } from 'next/server';
import { ChromaDebugService } from '@/services/debug-chroma.service';
import { withApiHandler } from '@/lib/api-handler';

const service = new ChromaDebugService();

/**
 * 【GET】获取数据
 * - /api/debug-chroma            -> 查看所有集合
 * - /api/debug-chroma?name=xxx   -> 查看特定集合详情
 */
export const GET = withApiHandler(async (req: NextRequest) => {
  const name = req.nextUrl.searchParams.get('name');
  const data = name ? await service.getCollectionInfo(name) : await service.listAllCollections();
  return NextResponse.json({ success: true, ...data });
});

/**
 * 【POST】初始化/添加测试集合与数据
 * - /api/debug-chroma
 */
export const POST = withApiHandler(async () => {
  const result = await service.initTestCollection();
  return NextResponse.json({ success: true, ...result });
});

/**
 * 【DELETE】删除指定集合
 * - /api/debug-chroma?name=xxx
 */
export const DELETE = withApiHandler(async (req: NextRequest) => {
  const name = req.nextUrl.searchParams.get('name');
  if (!name) return NextResponse.json({ success: false, error: '缺少 name 参数' }, { status: 400 });

  const result = await service.deleteCollection(name);
  return NextResponse.json({ success: true, ...result });
});
