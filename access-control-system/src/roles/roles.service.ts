import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateRoleDto, AssignPermissionsDto, AssignRoleDto } from './dto';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

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
    // Verify role exists
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

    // Invalidate cache for all users with this role
    const usersWithRole = await this.prisma.userRole.findMany({
      where: { roleId },
      select: { userId: true, organizationId: true },
    });

    for (const { userId, organizationId } of usersWithRole) {
      await this.invalidateUserPermissions(userId, organizationId);
    }
    this.logger.debug(
      `Invalidated cache for ${usersWithRole.length} users after role permission change`,
    );

    return this.findOne(roleId);
  }

  async assignRoleToUser(
    userId: string,
    dto: AssignRoleDto,
    assignedBy?: string,
  ) {
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

    const result = await this.prisma.userRole.create({
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

    // Invalidate user's permission cache
    await this.invalidateUserPermissions(userId, dto.organizationId);

    return result;
  }

  async removeRoleFromUser(
    userId: string,
    roleId: string,
    organizationId: string,
  ) {
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

    const result = await this.prisma.userRole.delete({
      where: { id: userRole.id },
    });

    // Invalidate user's permission cache
    await this.invalidateUserPermissions(userId, organizationId);

    return result;
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
    const cacheKey = `perm:${userId}:${organizationId || 'all'}`;

    // Check cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for permissions: ${cacheKey}`);
      return JSON.parse(cached);
    }

    this.logger.debug(`Cache miss for permissions: ${cacheKey}`);

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

    const permissionArray = Array.from(permissions);

    // Cache the result
    await this.redis.set(
      cacheKey,
      JSON.stringify(permissionArray),
      this.CACHE_TTL,
    );
    this.logger.debug(`Cached permissions for: ${cacheKey}`);

    return permissionArray;
  }

  async invalidateUserPermissions(userId: string, organizationId?: string) {
    if (organizationId) {
      await this.redis.del(`perm:${userId}:${organizationId}`);
    }
    // Also invalidate the 'all' cache
    await this.redis.del(`perm:${userId}:all`);
    this.logger.debug(`Invalidated permission cache for user: ${userId}`);
  }
}
