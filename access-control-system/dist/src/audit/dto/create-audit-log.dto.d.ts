export declare class CreateAuditLogDto {
    userId?: string;
    userEmail?: string;
    organizationId?: string;
    action: string;
    resourceType?: string;
    resourceId?: string;
    result: 'success' | 'failure';
    reason?: string;
    metadata?: Record<string, unknown>;
}
