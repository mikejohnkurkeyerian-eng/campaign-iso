import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/campaign_iso';

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: ['error', 'warn'],
        datasources: {
            db: {
                url: connectionString,
            },
        },
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
