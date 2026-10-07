import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly configService: ConfigService) {
    const connectionString = configService.get<string>('DATABASE_URL');

    if (!connectionString) {
      throw new Error('DATABASE_URL is not configured');
    }

    const adapter = new PrismaPg({
      connectionString,

      // Render external PostgreSQL requires TLS.
      ssl: {
        rejectUnauthorized: false,
      },

      // Keep the database connection reliable.
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 60_000,
      keepAlive: true,
      max: 10,
    });

    super({
      adapter,
    });
  }

  async onModuleInit() {
    await this.$connect();

    // Force a real database query during startup.
    await this.$queryRaw`SELECT 1`;

    console.log('✅ Prisma PostgreSQL connection verified.');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
