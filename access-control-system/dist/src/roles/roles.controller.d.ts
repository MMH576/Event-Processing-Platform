import { RolesService } from './roles.service';
import { CreateRoleDto, AssignPermissionsDto, AssignRoleDto } from './dto';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    create(createRoleDto: CreateRoleDto): Promise<{
        permissions: ({
            permission: {
                id: string;
                createdAt: Date;
                resource: string;
                action: string;
                description: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            roleId: string;
            permissionId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        name: string;
        organizationId: string | null;
        description: string | null;
        isSystemRole: boolean;
    }>;
    findAll(organizationId?: string): Promise<({
        permissions: ({
            permission: {
                id: string;
                createdAt: Date;
                resource: string;
                action: string;
                description: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            roleId: string;
            permissionId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        name: string;
        organizationId: string | null;
        description: string | null;
        isSystemRole: boolean;
    })[]>;
    findOne(id: string): Promise<{
        permissions: ({
            permission: {
                id: string;
                createdAt: Date;
                resource: string;
                action: string;
                description: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            roleId: string;
            permissionId: string;
        })[];
        users: ({
            user: {
                email: string;
                fullName: string | null;
                id: string;
            };
        } & {
            id: string;
            organizationId: string;
            userId: string;
            roleId: string;
            assignedAt: Date;
            assignedBy: string | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        name: string;
        organizationId: string | null;
        description: string | null;
        isSystemRole: boolean;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        organizationId: string | null;
        description: string | null;
        isSystemRole: boolean;
    }>;
    assignPermissions(id: string, dto: AssignPermissionsDto): Promise<{
        permissions: ({
            permission: {
                id: string;
                createdAt: Date;
                resource: string;
                action: string;
                description: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            roleId: string;
            permissionId: string;
        })[];
        users: ({
            user: {
                email: string;
                fullName: string | null;
                id: string;
            };
        } & {
            id: string;
            organizationId: string;
            userId: string;
            roleId: string;
            assignedAt: Date;
            assignedBy: string | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        name: string;
        organizationId: string | null;
        description: string | null;
        isSystemRole: boolean;
    }>;
    assignRoleToUser(userId: string, dto: AssignRoleDto, req: {
        user: {
            sub: string;
        };
    }): Promise<{
        role: {
            permissions: ({
                permission: {
                    id: string;
                    createdAt: Date;
                    resource: string;
                    action: string;
                    description: string | null;
                };
            } & {
                id: string;
                createdAt: Date;
                roleId: string;
                permissionId: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            name: string;
            organizationId: string | null;
            description: string | null;
            isSystemRole: boolean;
        };
    } & {
        id: string;
        organizationId: string;
        userId: string;
        roleId: string;
        assignedAt: Date;
        assignedBy: string | null;
    }>;
    removeRoleFromUser(userId: string, roleId: string, organizationId: string): Promise<{
        id: string;
        organizationId: string;
        userId: string;
        roleId: string;
        assignedAt: Date;
        assignedBy: string | null;
    }>;
    getUserRoles(userId: string): Promise<({
        role: {
            permissions: ({
                permission: {
                    id: string;
                    createdAt: Date;
                    resource: string;
                    action: string;
                    description: string | null;
                };
            } & {
                id: string;
                createdAt: Date;
                roleId: string;
                permissionId: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            name: string;
            organizationId: string | null;
            description: string | null;
            isSystemRole: boolean;
        };
    } & {
        id: string;
        organizationId: string;
        userId: string;
        roleId: string;
        assignedAt: Date;
        assignedBy: string | null;
    })[]>;
    getUserPermissions(userId: string, organizationId?: string): Promise<string[]>;
}
