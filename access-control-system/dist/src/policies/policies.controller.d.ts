import { PoliciesService } from './policies.service';
import { CreatePolicyDto, UpdatePolicyDto } from './dto';
export declare class PoliciesController {
    private readonly policiesService;
    constructor(policiesService: PoliciesService);
    create(createPolicyDto: CreatePolicyDto): Promise<{
        organization: {
            name: string;
            id: string;
            slug: string;
        };
        permission: {
            description: string | null;
            id: string;
            createdAt: Date;
            resource: string;
            action: string;
        };
    } & {
        name: string;
        description: string | null;
        organizationId: string;
        permissionId: string;
        conditions: import("@prisma/client/runtime/client").JsonValue;
        effect: string;
        priority: number;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(organizationId?: string): Promise<({
        organization: {
            name: string;
            id: string;
            slug: string;
        };
        permission: {
            description: string | null;
            id: string;
            createdAt: Date;
            resource: string;
            action: string;
        };
    } & {
        name: string;
        description: string | null;
        organizationId: string;
        permissionId: string;
        conditions: import("@prisma/client/runtime/client").JsonValue;
        effect: string;
        priority: number;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(id: string): Promise<{
        organization: {
            name: string;
            id: string;
            slug: string;
        };
        permission: {
            description: string | null;
            id: string;
            createdAt: Date;
            resource: string;
            action: string;
        };
    } & {
        name: string;
        description: string | null;
        organizationId: string;
        permissionId: string;
        conditions: import("@prisma/client/runtime/client").JsonValue;
        effect: string;
        priority: number;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, updatePolicyDto: UpdatePolicyDto): Promise<{
        organization: {
            name: string;
            id: string;
            slug: string;
        };
        permission: {
            description: string | null;
            id: string;
            createdAt: Date;
            resource: string;
            action: string;
        };
    } & {
        name: string;
        description: string | null;
        organizationId: string;
        permissionId: string;
        conditions: import("@prisma/client/runtime/client").JsonValue;
        effect: string;
        priority: number;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        name: string;
        description: string | null;
        organizationId: string;
        permissionId: string;
        conditions: import("@prisma/client/runtime/client").JsonValue;
        effect: string;
        priority: number;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
