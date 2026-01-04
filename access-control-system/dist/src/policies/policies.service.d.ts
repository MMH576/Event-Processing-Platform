import { PrismaService } from '../prisma/prisma.service';
import { CreatePolicyDto, UpdatePolicyDto } from './dto';
import { Prisma } from '@prisma/client';
import { PolicyContext, PolicyEvaluationResult } from './interfaces/policy-context.interface';
export declare class PoliciesService {
    private prisma;
    constructor(prisma: PrismaService);
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
        conditions: Prisma.JsonValue;
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
        conditions: Prisma.JsonValue;
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
        conditions: Prisma.JsonValue;
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
        conditions: Prisma.JsonValue;
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
        conditions: Prisma.JsonValue;
        effect: string;
        priority: number;
    }>;
    evaluatePolicies(permissionKey: string, organizationId: string, context: PolicyContext): Promise<PolicyEvaluationResult>;
    private evaluateConditions;
    private isBusinessHours;
    private isWeekend;
}
