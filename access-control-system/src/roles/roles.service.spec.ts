/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { RolesService } from './roles.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

describe('RolesService', () => {
  let service: RolesService;
  let prismaService: jest.Mocked<PrismaService>;
  let redisService: jest.Mocked<RedisService>;

  const mockRole = {
    id: 'role-123',
    name: 'Admin',
    description: 'Administrator role',
    organizationId: 'org-123',
    isSystemRole: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    permissions: [],
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    fullName: 'Test User',
  };

  const mockUserRole = {
    id: 'user-role-123',
    userId: 'user-123',
    roleId: 'role-123',
    organizationId: 'org-123',
    assignedBy: null,
    assignedAt: new Date(),
    role: mockRole,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: PrismaService,
          useValue: {
            role: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
            userRole: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
            },
            rolePermission: {
              deleteMany: jest.fn(),
              createMany: jest.fn(),
            },
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    prismaService = module.get(PrismaService);
    redisService = module.get(RedisService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new role successfully', async () => {
      prismaService.role.findFirst.mockResolvedValue(null);
      prismaService.role.create.mockResolvedValue(mockRole);

      const result = await service.create({
        name: 'Admin',
        description: 'Administrator role',
        organizationId: 'org-123',
      });

      expect(result).toEqual(mockRole);
      expect(prismaService.role.create).toHaveBeenCalledWith({
        data: {
          name: 'Admin',
          description: 'Administrator role',
          organizationId: 'org-123',
        },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });
    });

    it('should throw ConflictException if role already exists', async () => {
      prismaService.role.findFirst.mockResolvedValue(mockRole);

      await expect(
        service.create({
          name: 'Admin',
          organizationId: 'org-123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return role when found', async () => {
      prismaService.role.findUnique.mockResolvedValue({
        ...mockRole,
        users: [],
      });

      const result = await service.findOne('role-123');

      expect(result.id).toBe('role-123');
      expect(result.name).toBe('Admin');
    });

    it('should throw NotFoundException when role not found', async () => {
      prismaService.role.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('assignRoleToUser', () => {
    it('should assign role to user successfully', async () => {
      prismaService.role.findUnique.mockResolvedValue({
        ...mockRole,
        users: [],
      });
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.userRole.findUnique.mockResolvedValue(null);
      prismaService.userRole.create.mockResolvedValue(mockUserRole);

      const result = await service.assignRoleToUser('user-123', {
        roleId: 'role-123',
        organizationId: 'org-123',
      });

      expect(result).toEqual(mockUserRole);
      expect(redisService.del).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      prismaService.role.findUnique.mockResolvedValue({
        ...mockRole,
        users: [],
      });
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.assignRoleToUser('invalid-user', {
          roleId: 'role-123',
          organizationId: 'org-123',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when role already assigned', async () => {
      prismaService.role.findUnique.mockResolvedValue({
        ...mockRole,
        users: [],
      });
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.userRole.findUnique.mockResolvedValue(mockUserRole);

      await expect(
        service.assignRoleToUser('user-123', {
          roleId: 'role-123',
          organizationId: 'org-123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getUserPermissions', () => {
    it('should return cached permissions on cache hit', async () => {
      const cachedPermissions = ['invoice:read', 'invoice:write'];
      redisService.get.mockResolvedValue(JSON.stringify(cachedPermissions));

      const result = await service.getUserPermissions('user-123', 'org-123');

      expect(result).toEqual(cachedPermissions);
      expect(prismaService.userRole.findMany).not.toHaveBeenCalled();
    });

    it('should fetch from DB and cache on cache miss', async () => {
      redisService.get.mockResolvedValue(null);
      prismaService.userRole.findMany.mockResolvedValue([
        {
          ...mockUserRole,
          role: {
            ...mockRole,
            permissions: [
              {
                permission: {
                  id: 'perm-1',
                  resource: 'invoice',
                  action: 'read',
                },
              },
              {
                permission: {
                  id: 'perm-2',
                  resource: 'invoice',
                  action: 'write',
                },
              },
            ],
          },
        },
      ]);

      const result = await service.getUserPermissions('user-123', 'org-123');

      expect(result).toContain('invoice:read');
      expect(result).toContain('invoice:write');
      expect(redisService.set).toHaveBeenCalled();
    });
  });

  describe('assignPermissions', () => {
    it('should assign permissions and invalidate cache', async () => {
      prismaService.role.findUnique.mockResolvedValue({
        ...mockRole,
        users: [],
      });
      prismaService.rolePermission.deleteMany.mockResolvedValue({ count: 0 });
      prismaService.rolePermission.createMany.mockResolvedValue({ count: 2 });
      prismaService.userRole.findMany.mockResolvedValue([
        { userId: 'user-123', organizationId: 'org-123' },
      ]);

      await service.assignPermissions('role-123', {
        permissionIds: ['perm-1', 'perm-2'],
      });

      expect(prismaService.rolePermission.deleteMany).toHaveBeenCalledWith({
        where: { roleId: 'role-123' },
      });
      expect(prismaService.rolePermission.createMany).toHaveBeenCalled();
      expect(redisService.del).toHaveBeenCalled();
    });
  });

  describe('removeRoleFromUser', () => {
    it('should remove role from user and invalidate cache', async () => {
      prismaService.userRole.findUnique.mockResolvedValue(mockUserRole);
      prismaService.userRole.delete.mockResolvedValue(mockUserRole);

      await service.removeRoleFromUser('user-123', 'role-123', 'org-123');

      expect(prismaService.userRole.delete).toHaveBeenCalledWith({
        where: { id: 'user-role-123' },
      });
      expect(redisService.del).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user does not have role', async () => {
      prismaService.userRole.findUnique.mockResolvedValue(null);

      await expect(
        service.removeRoleFromUser('user-123', 'role-123', 'org-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
