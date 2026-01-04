import { PrismaService } from '../prisma/prisma.service';
import { CreateAuditLogDto, QueryAuditLogDto } from './dto';
import { Prisma } from '@prisma/client';
import { AuditLogStats, AuditLogQueryResult } from './interfaces/audit-log.interface';
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createAuditLogDto: CreateAuditLogDto): Promise<{
        userId: string | null;
        userEmail: string | null;
        organizationId: string | null;
        action: string;
        resourceType: string | null;
        resourceId: string | null;
        result: string;
        reason: string | null;
        metadata: Prisma.JsonValue;
        id: string;
        timestamp: Date;
        createdAt: Date;
    }>;
    findAll(query: QueryAuditLogDto): Promise<AuditLogQueryResult>;
    findOne(id: string): Promise<{
        metadata: Record<string, unknown>;
        organization: {
            id: string;
            name: string;
            slug: string;
        } | null;
        user: {
            id: string;
            email: string;
            fullName: string | null;
        } | null;
        userId: string | null;
        userEmail: string | null;
        organizationId: string | null;
        action: string;
        resourceType: string | null;
        resourceId: string | null;
        result: string;
        reason: string | null;
        id: string;
        timestamp: Date;
        createdAt: Date;
    }>;
    getStats(organizationId?: string): Promise<AuditLogStats>;
}
