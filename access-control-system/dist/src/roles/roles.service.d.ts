import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto, AssignPermissionsDto, AssignRoleDto } from './dto';
export declare class RolesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createRoleDto: CreateRoleDto): Promise<{
        permissions: ({
            permission: {
                action: string;
                id: string;
                createdAt: Date;
                description: string | null;
                resource: string;
            };
        } & {
            id: string;
            createdAt: Date;
            roleId: string;
            permissionId: string;
        })[];
    } & {
        organizationId: string | null;
        id: string;
        createdAt: Date;
        name: string;
        description: string | null;
        isSystemRole: boolean;
    }>;
    findAll(organizationId?: string): Promise<({
        permissions: ({
            permission: {
                action: string;
                id: string;
                createdAt: Date;
                description: string | null;
                resource: string;
            };
        } & {
            id: string;
            createdAt: Date;
            roleId: string;
            permissionId: string;
        })[];
    } & {
        organizationId: string | null;
        id: string;
        createdAt: Date;
        name: string;
        description: string | null;
        isSystemRole: boolean;
    })[]>;
    findOne(id: string): Promise<{
        permissions: ({
            permission: {
                action: string;
                id: string;
                createdAt: Date;
                description: string | null;
                resource: string;
            };
        } & {
            id: string;
            createdAt: Date;
            roleId: string;
            permissionId: string;
        })[];
        users: ({
            user: {
                id: string;
                email: string;
                fullName: string | null;
            };
        } & {
            userId: string;
            organizationId: string;
            id: string;
            roleId: string;
            assignedAt: Date;
            assignedBy: string | null;
        })[];
    } & {
        organizationId: string | null;
        id: string;
        createdAt: Date;
        name: string;
        description: string | null;
        isSystemRole: boolean;
    }>;
    remove(id: string): Promise<{
        organizationId: string | null;
        id: string;
        createdAt: Date;
        name: string;
        description: string | null;
        isSystemRole: boolean;
    }>;
    assignPermissions(roleId: string, dto: AssignPermissionsDto): Promise<{
        permissions: ({
            permission: {
                action: string;
                id: string;
                createdAt: Date;
                description: string | null;
                resource: string;
            };
        } & {
            id: string;
            createdAt: Date;
            roleId: string;
            permissionId: string;
        })[];
        users: ({
            user: {
                id: string;
                email: string;
                fullName: string | null;
            };
        } & {
            userId: string;
            organizationId: string;
            id: string;
            roleId: string;
            assignedAt: Date;
            assignedBy: string | null;
        })[];
    } & {
        organizationId: string | null;
        id: string;
        createdAt: Date;
        name: string;
        description: string | null;
        isSystemRole: boolean;
    }>;
    assignRoleToUser(userId: string, dto: AssignRoleDto, assignedBy?: string): Promise<{
        role: {
            permissions: ({
                permission: {
                    action: string;
                    id: string;
                    createdAt: Date;
                    description: string | null;
                    resource: string;
                };
            } & {
                id: string;
                createdAt: Date;
                roleId: string;
                permissionId: string;
            })[];
        } & {
            organizationId: string | null;
            id: string;
            createdAt: Date;
            name: string;
            description: string | null;
            isSystemRole: boolean;
        };
    } & {
        userId: string;
        organizationId: string;
        id: string;
        roleId: string;
        assignedAt: Date;
        assignedBy: string | null;
    }>;
    removeRoleFromUser(userId: string, roleId: string, organizationId: string): Promise<{
        userId: string;
        organizationId: string;
        id: string;
        roleId: string;
        assignedAt: Date;
        assignedBy: string | null;
    }>;
    getUserRoles(userId: string): Promise<({
        role: {
            permissions: ({
                permission: {
                    action: string;
                    id: string;
                    createdAt: Date;
                    description: string | null;
                    resource: string;
                };
            } & {
                id: string;
                createdAt: Date;
                roleId: string;
                permissionId: string;
            })[];
        } & {
            organizationId: string | null;
            id: string;
            createdAt: Date;
            name: string;
            description: string | null;
            isSystemRole: boolean;
        };
    } & {
        userId: string;
        organizationId: string;
        id: string;
        roleId: string;
        assignedAt: Date;
        assignedBy: string | null;
    })[]>;
    getUserPermissions(userId: string, organizationId?: string): Promise<string[]>;
}
