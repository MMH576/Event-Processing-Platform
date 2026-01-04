"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RolesService = class RolesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createRoleDto) {
        const existing = await this.prisma.role.findFirst({
            where: {
                name: createRoleDto.name,
                organizationId: createRoleDto.organizationId || null,
            },
        });
        if (existing) {
            throw new common_1.ConflictException(`Role "${createRoleDto.name}" already exists`);
        }
        return this.prisma.role.create({
            data: createRoleDto,
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
            },
        });
    }
    async findAll(organizationId) {
        return this.prisma.role.findMany({
            where: organizationId
                ? {
                    OR: [
                        { organizationId },
                        { organizationId: null, isSystemRole: true },
                    ],
                }
                : undefined,
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
    }
    async findOne(id) {
        const role = await this.prisma.role.findUnique({
            where: { id },
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
                users: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                fullName: true,
                            },
                        },
                    },
                },
            },
        });
        if (!role) {
            throw new common_1.NotFoundException(`Role with ID ${id} not found`);
        }
        return role;
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.role.delete({
            where: { id },
        });
    }
    async assignPermissions(roleId, dto) {
        await this.findOne(roleId);
        await this.prisma.rolePermission.deleteMany({
            where: { roleId },
        });
        if (dto.permissionIds.length > 0) {
            await this.prisma.rolePermission.createMany({
                data: dto.permissionIds.map((permissionId) => ({
                    roleId,
                    permissionId,
                })),
            });
        }
        return this.findOne(roleId);
    }
    async assignRoleToUser(userId, dto, assignedBy) {
        await this.findOne(dto.roleId);
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${userId} not found`);
        }
        const existing = await this.prisma.userRole.findUnique({
            where: {
                userId_roleId_organizationId: {
                    userId,
                    roleId: dto.roleId,
                    organizationId: dto.organizationId,
                },
            },
        });
        if (existing) {
            throw new common_1.ConflictException('User already has this role');
        }
        return this.prisma.userRole.create({
            data: {
                userId,
                roleId: dto.roleId,
                organizationId: dto.organizationId,
                assignedBy,
            },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                },
            },
        });
    }
    async removeRoleFromUser(userId, roleId, organizationId) {
        const userRole = await this.prisma.userRole.findUnique({
            where: {
                userId_roleId_organizationId: {
                    userId,
                    roleId,
                    organizationId,
                },
            },
        });
        if (!userRole) {
            throw new common_1.NotFoundException('User does not have this role');
        }
        return this.prisma.userRole.delete({
            where: { id: userRole.id },
        });
    }
    async getUserRoles(userId) {
        return this.prisma.userRole.findMany({
            where: { userId },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                },
            },
        });
    }
    async getUserPermissions(userId, organizationId) {
        const userRoles = await this.prisma.userRole.findMany({
            where: {
                userId,
                ...(organizationId && { organizationId }),
            },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                },
            },
        });
        const permissions = new Set();
        for (const userRole of userRoles) {
            for (const rp of userRole.role.permissions) {
                permissions.add(`${rp.permission.resource}:${rp.permission.action}`);
            }
        }
        return Array.from(permissions);
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RolesService);
//# sourceMappingURL=roles.service.js.map