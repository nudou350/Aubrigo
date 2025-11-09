import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        // Use in-memory cache for now (simpler, no external dependencies)
        // Can upgrade to Redis later if needed
        console.log('📦 Using in-memory cache');
        return {
          ttl: 600, // 10 minutes in seconds
          max: 100, // Maximum number of items in cache
        };
      },
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}
