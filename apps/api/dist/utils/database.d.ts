import { PrismaClient } from '@prisma/client';
declare global {
    var __prisma: PrismaClient | undefined;
}
export declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export declare const testDatabaseConnection: () => Promise<boolean>;
export declare const getDatabaseHealth: () => Promise<{
    status: string;
    connection: string;
    responseTime: string;
    timestamp: string;
    error?: undefined;
} | {
    status: string;
    connection: string;
    error: string;
    timestamp: string;
    responseTime?: undefined;
}>;
export declare const connectWithRetry: (maxRetries?: number, baseDelay?: number) => Promise<boolean>;
export declare const disconnectDatabase: () => Promise<void>;
//# sourceMappingURL=database.d.ts.map