export declare class CreatePolicyDto {
    name: string;
    description?: string;
    organizationId: string;
    permissionId: string;
    conditions: Record<string, unknown>;
    effect: 'allow' | 'deny';
    priority?: number;
    isActive?: boolean;
}
