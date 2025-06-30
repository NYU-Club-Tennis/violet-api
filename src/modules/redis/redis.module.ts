import { DynamicModule, Module } from '@nestjs/common';
import Redis from 'ioredis';
import { env } from 'src/constants/environment.constant';
import { REDIS_CLIENT, REDIS_KEY_PREFIX } from 'src/constants/redis.constant';
import { AppLogger } from '../logger/logger.service';

@Module({})
export class RedisModule {
  static forRoot(): DynamicModule {
    return {
      module: RedisModule,
      providers: [
        {
          provide: REDIS_CLIENT,
          useFactory: () => {
            const logger = new AppLogger('Redis');
            const client = new Redis({
              host: env.redis.host,
              port: env.redis.port,
              username: env.redis.username,
              password: env.redis.password,
              db: env.redis.db,
              keyPrefix: REDIS_KEY_PREFIX,
              retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
              },
              maxRetriesPerRequest: 3,
            });

            client.on('error', (error) => {
              logger.error('Redis Client Error:', error.message);
            });

            client.on('connect', () => {
              logger.log('Successfully connected to Redis');
            });

            return client;
          },
        },
      ],
      exports: [REDIS_CLIENT],
      global: true,
    };
  }
}
