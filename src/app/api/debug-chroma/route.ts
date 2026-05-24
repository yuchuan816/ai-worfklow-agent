// app/api/debug-chroma/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { ChromaDebugService } from './service';

const service = new ChromaDebugService();

/**
 * 【GET】获取数据
 * - /api/debug-chroma            -> 查看所有集合
 * - /api/debug-chroma?name=xxx   -> 查看特定集合详情
 */
export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name');

  try {
    const data = name
      ? await service.getCollectionInfo(name)
      : await service.listAllCollections();

    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

/**
 * 【POST】初始化/添加测试集合与数据
 * - /api/debug-chroma
 */
export async function POST() {
  try {
    const result = await service.initTestCollection();
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

/**
 * 【DELETE】删除指定集合
 * - /api/debug-chroma?name=xxx
 */
export async function DELETE(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name');
  if (!name)
    return NextResponse.json(
      { success: false, error: '缺少 name 参数' },
      { status: 400 },
    );

  try {
    const result = await service.deleteCollection(name);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
