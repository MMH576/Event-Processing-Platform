import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto, AssignPermissionsDto, AssignRoleDto } from './dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto) {
    const existing = await this.prisma.role.findFirst({
      where: {
        name: createRoleDto.name,
        organizationId: createRoleDto.organizationId || null,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Role "${createRoleDto.name}" already exists`,
      );
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

  async findAll(organizationId?: string) {
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

  async findOne(id: string) {
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
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.role.delete({
      where: { id },
    });
  }

  async assignPermissions(roleId: string, dto: AssignPermissionsDto) {
    await this.findOne(roleId);

    // Remove existing permissions
    await this.prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    // Add new permissions
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

  async assignRoleToUser(userId: string, dto: AssignRoleDto, assignedBy?: string) {
    // Check if role exists
    await this.findOne(dto.roleId);

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if already assigned
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
      throw new ConflictException('User already has this role');
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

  async removeRoleFromUser(userId: string, roleId: string, organizationId: string) {
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
      throw new NotFoundException('User does not have this role');
    }

    return this.prisma.userRole.delete({
      where: { id: userRole.id },
    });
  }

  async getUserRoles(userId: string) {
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

  async getUserPermissions(userId: string, organizationId?: string) {
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

    const permissions = new Set<string>();
    for (const userRole of userRoles) {
      for (const rp of userRole.role.permissions) {
        permissions.add(`${rp.permission.resource}:${rp.permission.action}`);
      }
    }

    return Array.from(permissions);
  }
}
