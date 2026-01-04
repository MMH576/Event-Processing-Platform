import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuditLogDto, QueryAuditLogDto } from './dto';
import { Prisma } from '@prisma/client';
import {
  AuditLogStats,
  AuditLogQueryResult,
} from './interfaces/audit-log.interface';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async create(createAuditLogDto: CreateAuditLogDto) {
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
        metadata: (createAuditLogDto.metadata as Prisma.InputJsonValue) ?? {},
      },
    });
  }

  async findAll(query: QueryAuditLogDto): Promise<AuditLogQueryResult> {
    const where: Prisma.AuditLogWhereInput = {};

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
        metadata: log.metadata as Record<string, unknown>,
      })),
      total,
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
    };
  }

  async findOne(id: string) {
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
      throw new NotFoundException(`Audit log with ID ${id} not found`);
    }

    return {
      ...auditLog,
      metadata: auditLog.metadata as Record<string, unknown>,
    };
  }

  async getStats(organizationId?: string): Promise<AuditLogStats> {
    const where: Prisma.AuditLogWhereInput = {};

    if (organizationId) {
      where.organizationId = organizationId;
    }

    // Get total count
    const total = await this.prisma.auditLog.count({ where });

    // Get counts by action
    const actionCounts = await this.prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: { action: true },
    });

    const byAction: Record<string, number> = {};
    for (const item of actionCounts) {
      byAction[item.action] = item._count.action;
    }

    // Get counts by result
    const resultCounts = await this.prisma.auditLog.groupBy({
      by: ['result'],
      where,
      _count: { result: true },
    });

    const byResult = { success: 0, failure: 0 };
    for (const item of resultCounts) {
      if (item.result === 'success') {
        byResult.success = item._count.result;
      } else if (item.result === 'failure') {
        byResult.failure = item._count.result;
      }
    }

    // Get counts by resource type
    const resourceTypeCounts = await this.prisma.auditLog.groupBy({
      by: ['resourceType'],
      where: { ...where, resourceType: { not: null } },
      _count: { resourceType: true },
    });

    const byResourceType: Record<string, number> = {};
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
}
