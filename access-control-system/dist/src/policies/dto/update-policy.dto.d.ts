export declare class UpdatePolicyDto {
    name?: string;
    description?: string;
    conditions?: Record<string, unknown>;
    effect?: 'allow' | 'deny';
    priority?: number;
    isActive?: boolean;
}
