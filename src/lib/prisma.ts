import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  console.log('[Prisma] DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.log('[Prisma] Connecting to:', process.env.DATABASE_URL?.split('@')[1]?.split('/')[0]); // Log host only

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
