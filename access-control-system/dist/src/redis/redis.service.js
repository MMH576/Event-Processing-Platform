"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
let RedisService = RedisService_1 = class RedisService {
    configService;
    client;
    logger = new common_1.Logger(RedisService_1.name);
    constructor(configService) {
        this.configService = configService;
    }
    onModuleInit() {
        const redisUrl = this.configService.get('REDIS_URL');
        if (redisUrl) {
            this.client = new ioredis_1.default(redisUrl, {
                tls: redisUrl.startsWith('rediss://') ? {} : undefined,
                retryStrategy: (times) => {
                    if (times > 3) {
                        this.logger.warn('Redis connection failed after 3 retries');
                        return null;
                    }
                    return Math.min(times * 100, 3000);
                },
                maxRetriesPerRequest: null,
            });
            this.client.on('connect', () => {
                this.logger.log('Connected to Redis via URL');
            });
        }
        else {
            const host = this.configService.get('REDIS_HOST') || 'localhost';
            const port = parseInt(this.configService.get('REDIS_PORT') || '6379');
            this.client = new ioredis_1.default({
                host,
                port,
                retryStrategy: (times) => {
                    if (times > 3) {
                        this.logger.warn('Redis connection failed after 3 retries');
                        return null;
                    }
                    return Math.min(times * 100, 3000);
                },
            });
            this.client.on('connect', () => {
                this.logger.log(`Connected to Redis at ${host}:${port}`);
            });
        }
        this.client.on('error', (err) => {
            this.logger.error('Redis connection error:', err.message);
        });
    }
    onModuleDestroy() {
        if (this.client) {
            this.client.disconnect();
        }
    }
    async get(key) {
        try {
            return await this.client.get(key);
        }
        catch (error) {
            this.logger.error(`Redis GET error for key ${key}:`, error.message);
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        try {
            if (ttlSeconds) {
                await this.client.setex(key, ttlSeconds, value);
            }
            else {
                await this.client.set(key, value);
            }
        }
        catch (error) {
            this.logger.error(`Redis SET error for key ${key}:`, error.message);
        }
    }
    async del(key) {
        try {
            await this.client.del(key);
        }
        catch (error) {
            this.logger.error(`Redis DEL error for key ${key}:`, error.message);
        }
    }
    async keys(pattern) {
        try {
            return await this.client.keys(pattern);
        }
        catch (error) {
            this.logger.error(`Redis KEYS error for pattern ${pattern}:`, error.message);
            return [];
        }
    }
    async invalidatePattern(pattern) {
        try {
            const keys = await this.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(...keys);
                this.logger.debug(`Invalidated ${keys.length} keys matching pattern: ${pattern}`);
            }
        }
        catch (error) {
            this.logger.error(`Redis invalidatePattern error for ${pattern}:`, error.message);
        }
    }
    isConnected() {
        return this.client?.status === 'ready';
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map