export interface PolicyContext {
    userId: string;
    organizationId?: string;
    resourceType?: string;
    resourceId?: string;
    resourceOwnerId?: string;
    amount?: number;
    timestamp?: Date;
    userDepartment?: string;
    metadata?: Record<string, unknown>;
}
export interface PolicyEvaluationResult {
    allowed: boolean;
    reason?: string;
    matchedPolicy?: {
        id: string;
        name: string;
        effect: 'allow' | 'deny';
    };
}
export interface PolicyConditions {
    amountLimit?: number;
    timeRestriction?: 'business_hours' | 'after_hours' | 'weekends_only';
    resourceOwnerOnly?: boolean;
    allowedDepartments?: string[];
}
