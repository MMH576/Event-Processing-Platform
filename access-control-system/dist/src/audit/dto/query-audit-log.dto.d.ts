export declare class QueryAuditLogDto {
    userId?: string;
    organizationId?: string;
    action?: string;
    resourceType?: string;
    result?: 'success' | 'failure';
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
}
