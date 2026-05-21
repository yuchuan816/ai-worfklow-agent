import { NextResponse, type NextRequest } from 'next/server';
import { chromaClient } from '@/lib/chroma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    // 如果 collection 不存在，此处会抛出异常
    const collection = await chromaClient.getCollection({
      name: name ?? 'spec_collection',
    });

    const data = await collection.get({
      limit: 10,
      include: ['documents', 'metadatas'],
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
