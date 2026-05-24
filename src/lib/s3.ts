// lib/s3.ts
import { S3Client } from '@aws-sdk/client-s3';

const accessKeyId = process.env.MINIO_ACCESS_KEY;
const secretAccessKey = process.env.MINIO_SECRET_KEY;

if (!accessKeyId || !secretAccessKey) {
  throw new Error(
    '❌ [Env Error]: 缺少必要的 MinIO 凭证配置。请检查环境变量 MINIO_ACCESS_KEY 和 MINIO_SECRET_KEY 是否正确注入。',
  );
}

// 2. 初始化 S3Client
export const s3Client = new S3Client({
  // 非核心配置项：使用空值合并操作符 (??) 提供本地 Docker 默认值兜底
  endpoint: process.env.MINIO_ENDPOINT ?? 'http://localhost:9000',
  region: 'us-east-1',
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: true,
});
