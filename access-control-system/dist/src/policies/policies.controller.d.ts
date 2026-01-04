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
            action: string;
            id: string;
            createdAt: Date;
            description: string | null;
            resource: string;
        };
    } & {
        organizationId: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
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
            action: string;
            id: string;
            createdAt: Date;
            description: string | null;
            resource: string;
        };
    } & {
        organizationId: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
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
            action: string;
            id: string;
            createdAt: Date;
            description: string | null;
            resource: string;
        };
    } & {
        organizationId: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
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
            action: string;
            id: string;
            createdAt: Date;
            description: string | null;
            resource: string;
        };
    } & {
        organizationId: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        permissionId: string;
        conditions: import("@prisma/client/runtime/client").JsonValue;
        effect: string;
        priority: number;
    }>;
    remove(id: string): Promise<{
        organizationId: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        permissionId: string;
        conditions: import("@prisma/client/runtime/client").JsonValue;
        effect: string;
        priority: number;
    }>;
}
