import { PoliciesService } from './policies.service';
import { CreatePolicyDto, UpdatePolicyDto } from './dto';
export declare class PoliciesController {
    private readonly policiesService;
    constructor(policiesService: PoliciesService);
    create(createPolicyDto: CreatePolicyDto): Promise<{
        organization: {
            id: string;
            name: string;
            slug: string;
        };
        permission: {
            id: string;
            createdAt: Date;
            resource: string;
            action: string;
            description: string | null;
        };
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        organizationId: string;
        description: string | null;
        permissionId: string;
        conditions: import("@prisma/client/runtime/client").JsonValue;
        effect: string;
        priority: number;
    }>;
    findAll(organizationId?: string): Promise<({
        organization: {
            id: string;
            name: string;
            slug: string;
        };
        permission: {
            id: string;
            createdAt: Date;
            resource: string;
            action: string;
            description: string | null;
        };
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        organizationId: string;
        description: string | null;
        permissionId: string;
        conditions: import("@prisma/client/runtime/client").JsonValue;
        effect: string;
        priority: number;
    })[]>;
    findOne(id: string): Promise<{
        organization: {
            id: string;
            name: string;
            slug: string;
        };
        permission: {
            id: string;
            createdAt: Date;
            resource: string;
            action: string;
            description: string | null;
        };
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        organizationId: string;
        description: string | null;
        permissionId: string;
        conditions: import("@prisma/client/runtime/client").JsonValue;
        effect: string;
        priority: number;
    }>;
    update(id: string, updatePolicyDto: UpdatePolicyDto): Promise<{
        organization: {
            id: string;
            name: string;
            slug: string;
        };
        permission: {
            id: string;
            createdAt: Date;
            resource: string;
            action: string;
            description: string | null;
        };
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        organizationId: string;
        description: string | null;
        permissionId: string;
        conditions: import("@prisma/client/runtime/client").JsonValue;
        effect: string;
        priority: number;
    }>;
    remove(id: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        organizationId: string;
        description: string | null;
        permissionId: string;
        conditions: import("@prisma/client/runtime/client").JsonValue;
        effect: string;
        priority: number;
    }>;
}
