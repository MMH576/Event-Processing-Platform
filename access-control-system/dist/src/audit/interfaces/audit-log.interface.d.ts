export interface AuditLogEntry {
    id: string;
    userId?: string | null;
    userEmail?: string | null;
    organizationId?: string | null;
    action: string;
    resourceType?: string | null;
    resourceId?: string | null;
    timestamp: Date;
    result: string;
    reason?: string | null;
    metadata: Record<string, unknown>;
    createdAt: Date;
}
export interface AuditLogStats {
    total: number;
    byAction: Record<string, number>;
    byResult: {
        success: number;
        failure: number;
    };
    byResourceType: Record<string, number>;
}
export interface AuditLogQueryResult {
    data: AuditLogEntry[];
    total: number;
    limit: number;
    offset: number;
}
