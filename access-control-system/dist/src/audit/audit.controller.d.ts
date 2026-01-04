import { AuditService } from './audit.service';
import { QueryAuditLogDto } from './dto';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    findAll(query: QueryAuditLogDto): Promise<import("./interfaces/audit-log.interface").AuditLogQueryResult>;
    getStats(organizationId?: string): Promise<import("./interfaces/audit-log.interface").AuditLogStats>;
    findOne(id: string): Promise<{
        metadata: Record<string, unknown>;
        user: {
            id: string;
            email: string;
            fullName: string | null;
        } | null;
        organization: {
            id: string;
            name: string;
            slug: string;
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
}
