import { PrismaClient } from '@prisma/client';
import { config } from './environment.js';

let prismaInstance;

export function getPrismaClient() {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: config.env === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  return prismaInstance;
}

export const prisma = getPrismaClient();
