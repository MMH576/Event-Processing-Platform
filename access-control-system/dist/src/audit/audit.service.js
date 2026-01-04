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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AuditService = class AuditService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createAuditLogDto) {
        return this.prisma.auditLog.create({
            data: {
                userId: createAuditLogDto.userId,
                userEmail: createAuditLogDto.userEmail,
                organizationId: createAuditLogDto.organizationId,
                action: createAuditLogDto.action,
                resourceType: createAuditLogDto.resourceType,
                resourceId: createAuditLogDto.resourceId,
                result: createAuditLogDto.result,
                reason: createAuditLogDto.reason,
                metadata: createAuditLogDto.metadata ?? {},
            },
        });
    }
    async findAll(query) {
        const where = {};
        if (query.userId) {
            where.userId = query.userId;
        }
        if (query.organizationId) {
            where.organizationId = query.organizationId;
        }
        if (query.action) {
            where.action = { contains: query.action, mode: 'insensitive' };
        }
        if (query.resourceType) {
            where.resourceType = query.resourceType;
        }
        if (query.result) {
            where.result = query.result;
        }
        if (query.startDate || query.endDate) {
            where.timestamp = {};
            if (query.startDate) {
                where.timestamp.gte = new Date(query.startDate);
            }
            if (query.endDate) {
                where.timestamp.lte = new Date(query.endDate);
            }
        }
        const [data, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                orderBy: { timestamp: 'desc' },
                take: query.limit,
                skip: query.offset,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            fullName: true,
                        },
                    },
                    organization: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                },
            }),
            this.prisma.auditLog.count({ where }),
        ]);
        return {
            data: data.map((log) => ({
                ...log,
                metadata: log.metadata,
            })),
            total,
            limit: query.limit ?? 50,
            offset: query.offset ?? 0,
        };
    }
    async findOne(id) {
        const auditLog = await this.prisma.auditLog.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                    },
                },
                organization: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
        });
        if (!auditLog) {
            throw new common_1.NotFoundException(`Audit log with ID ${id} not found`);
        }
        return {
            ...auditLog,
            metadata: auditLog.metadata,
        };
    }
    async getStats(organizationId) {
        const where = {};
        if (organizationId) {
            where.organizationId = organizationId;
        }
        const total = await this.prisma.auditLog.count({ where });
        const actionCounts = await this.prisma.auditLog.groupBy({
            by: ['action'],
            where,
            _count: { action: true },
        });
        const byAction = {};
        for (const item of actionCounts) {
            byAction[item.action] = item._count.action;
        }
        const resultCounts = await this.prisma.auditLog.groupBy({
            by: ['result'],
            where,
            _count: { result: true },
        });
        const byResult = { success: 0, failure: 0 };
        for (const item of resultCounts) {
            if (item.result === 'success') {
                byResult.success = item._count.result;
            }
            else if (item.result === 'failure') {
                byResult.failure = item._count.result;
            }
        }
        const resourceTypeCounts = await this.prisma.auditLog.groupBy({
            by: ['resourceType'],
            where: { ...where, resourceType: { not: null } },
            _count: { resourceType: true },
        });
        const byResourceType = {};
        for (const item of resourceTypeCounts) {
            if (item.resourceType) {
                byResourceType[item.resourceType] = item._count.resourceType;
            }
        }
        return {
            total,
            byAction,
            byResult,
            byResourceType,
        };
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
//# sourceMappingURL=audit.service.js.map