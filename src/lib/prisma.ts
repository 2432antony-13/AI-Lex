import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// 延迟初始化：只有真正调用时才连接数据库
function createPrismaClient() {
  try {
    return new PrismaClient({
      log: ["error"],
      // 连接超时 3 秒，避免长时间阻塞
      datasources: { db: { url: process.env.DATABASE_URL } },
    });
  } catch {
    console.warn("[Lex] PrismaClient 初始化失败，持久化功能将降级");
    return null as unknown as PrismaClient;
  }
}

export const prisma: PrismaClient =
  globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * 安全持久化包裹函数
 * 数据库不可达时静默降级，不抛异常，不阻塞主流程
 *
 * @returns null 表示降级（数据库不可达或操作失败）
 */
export async function safePersist<T>(
  fn: (p: PrismaClient) => Promise<T>
): Promise<T | null> {
  try {
    if (!process.env.DATABASE_URL) {
      console.warn("[Lex] DATABASE_URL 未配置，跳过持久化");
      return null;
    }
    return await fn(prisma);
  } catch (error) {
    console.warn("[Lex] 数据库操作降级，错误:", (error as Error).message);
    return null;
  }
}
