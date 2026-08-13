import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:./')) {
    return process.env.DATABASE_URL;
  }

  const dbName = 'dev.db';
  const tmpDbPath = path.join('/tmp', dbName);

  // Search possible paths for bundled dev.db on Vercel lambda
  const possiblePaths = [
    path.join(process.cwd(), 'prisma', dbName),
    path.join(process.cwd(), '.next', 'server', 'prisma', dbName),
    path.join(__dirname, '..', '..', '..', 'prisma', dbName),
  ];

  let bundledDbPath = possiblePaths.find((p) => fs.existsSync(p));

  if (bundledDbPath && !fs.existsSync(tmpDbPath)) {
    try {
      fs.copyFileSync(bundledDbPath, tmpDbPath);
      console.log(`[Prisma DB] Copied bundled DB from ${bundledDbPath} to writable ${tmpDbPath}`);
    } catch (e) {
      console.error('[Prisma DB] Copy error:', e);
    }
  }

  if (fs.existsSync(tmpDbPath)) {
    return `file:${tmpDbPath}`;
  }

  if (bundledDbPath) {
    return `file:${bundledDbPath}`;
  }

  return 'file:./prisma/dev.db';
}

const dbUrl = getDatabaseUrl();
process.env.DATABASE_URL = dbUrl;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;


