// lib/prisma.ts — singleton Prisma client with a deployment-safe SQLite fallback.
import fs from 'fs';
import os from 'os';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function ensureFallbackDbFile(targetPath: string) {
  try {
    if (fs.existsSync(targetPath)) return;

    const bundledDbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });

    if (fs.existsSync(bundledDbPath)) {
      fs.copyFileSync(bundledDbPath, targetPath);
      return;
    }

    fs.closeSync(fs.openSync(targetPath, 'a'));
  } catch (error) {
    console.warn('Failed to prepare fallback SQLite database:', error);
  }
}

function looksLikeRelativeSqlite(url: string) {
  return url.startsWith('file:./') || url.startsWith('file:../');
}

function resolveDatabaseUrl() {
  const configuredUrl = process.env.DATABASE_URL?.trim();
  const isProductionLike = Boolean(process.env.VERCEL || process.env.NODE_ENV === 'production');

  if (configuredUrl && configuredUrl.length > 0) {
    if (isProductionLike && looksLikeRelativeSqlite(configuredUrl)) {
      const tmpDbPath = path.join(os.tmpdir(), 'gut-check.db');
      ensureFallbackDbFile(tmpDbPath);
      return `file:${tmpDbPath}`;
    }
    return configuredUrl;
  }

  if (isProductionLike) {
    const tmpDbPath = path.join(os.tmpdir(), 'gut-check.db');
    ensureFallbackDbFile(tmpDbPath);
    return `file:${tmpDbPath}`;
  }

  return 'file:./dev.db';
}

const databaseUrl = resolveDatabaseUrl();

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
