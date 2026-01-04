import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto, AssignPermissionsDto, AssignRoleDto } from './dto';
export declare class RolesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createRoleDto: CreateRoleDto): Promise<{
        permissions: ({
            permission: {
                resource: string;
                action: string;
                description: string | null;
                id: string;
                createdAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            roleId: string;
            permissionId: string;
        })[];
    } & {
        description: string | null;
        id: string;
        createdAt: Date;
        name: string;
        organizationId: string | null;
        isSystemRole: boolean;
    }>;
    findAll(organizationId?: string): Promise<({
        permissions: ({
            permission: {
                resource: string;
                action: string;
                description: string | null;
                id: string;
                createdAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            roleId: string;
            permissionId: string;
        })[];
    } & {
        description: string | null;
        id: string;
        createdAt: Date;
        name: string;
        organizationId: string | null;
        isSystemRole: boolean;
    })[]>;
    findOne(id: string): Promise<{
        permissions: ({
            permission: {
                resource: string;
                action: string;
                description: string | null;
                id: string;
                createdAt: Date;
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
            id: string;
            organizationId: string;
            roleId: string;
            userId: string;
            assignedAt: Date;
            assignedBy: string | null;
        })[];
    } & {
        description: string | null;
        id: string;
        createdAt: Date;
        name: string;
        organizationId: string | null;
        isSystemRole: boolean;
    }>;
    remove(id: string): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        name: string;
        organizationId: string | null;
        isSystemRole: boolean;
    }>;
    assignPermissions(roleId: string, dto: AssignPermissionsDto): Promise<{
        permissions: ({
            permission: {
                resource: string;
                action: string;
                description: string | null;
                id: string;
                createdAt: Date;
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
            id: string;
            organizationId: string;
            roleId: string;
            userId: string;
            assignedAt: Date;
            assignedBy: string | null;
        })[];
    } & {
        description: string | null;
        id: string;
        createdAt: Date;
        name: string;
        organizationId: string | null;
        isSystemRole: boolean;
    }>;
    assignRoleToUser(userId: string, dto: AssignRoleDto, assignedBy?: string): Promise<{
        role: {
            permissions: ({
                permission: {
                    resource: string;
                    action: string;
                    description: string | null;
                    id: string;
                    createdAt: Date;
                };
            } & {
                id: string;
                createdAt: Date;
                roleId: string;
                permissionId: string;
            })[];
        } & {
            description: string | null;
            id: string;
            createdAt: Date;
            name: string;
            organizationId: string | null;
            isSystemRole: boolean;
        };
    } & {
        id: string;
        organizationId: string;
        roleId: string;
        userId: string;
        assignedAt: Date;
        assignedBy: string | null;
    }>;
    removeRoleFromUser(userId: string, roleId: string, organizationId: string): Promise<{
        id: string;
        organizationId: string;
        roleId: string;
        userId: string;
        assignedAt: Date;
        assignedBy: string | null;
    }>;
    getUserRoles(userId: string): Promise<({
        role: {
            permissions: ({
                permission: {
                    resource: string;
                    action: string;
                    description: string | null;
                    id: string;
                    createdAt: Date;
                };
            } & {
                id: string;
                createdAt: Date;
                roleId: string;
                permissionId: string;
            })[];
        } & {
            description: string | null;
            id: string;
            createdAt: Date;
            name: string;
            organizationId: string | null;
            isSystemRole: boolean;
        };
    } & {
        id: string;
        organizationId: string;
        roleId: string;
        userId: string;
        assignedAt: Date;
        assignedBy: string | null;
    })[]>;
    getUserPermissions(userId: string, organizationId?: string): Promise<string[]>;
}
