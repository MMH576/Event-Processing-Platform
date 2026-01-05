/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPermission = {
    id: 'perm-123',
    resource: 'invoice',
    action: 'read',
    description: 'Read invoices',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        {
          provide: PrismaService,
          useValue: {
            permission: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
    prismaService = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new permission successfully', async () => {
      prismaService.permission.findUnique.mockResolvedValue(null);
      prismaService.permission.create.mockResolvedValue(mockPermission);

      const result = await service.create({
        resource: 'invoice',
        action: 'read',
        description: 'Read invoices',
      });

      expect(result).toEqual(mockPermission);
      expect(prismaService.permission.create).toHaveBeenCalledWith({
        data: {
          resource: 'invoice',
          action: 'read',
          description: 'Read invoices',
        },
      });
    });

    it('should throw ConflictException if permission already exists', async () => {
      prismaService.permission.findUnique.mockResolvedValue(mockPermission);

      await expect(
        service.create({
          resource: 'invoice',
          action: 'read',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all permissions sorted by resource and action', async () => {
      const permissions = [
        {
          ...mockPermission,
          id: 'perm-1',
          resource: 'invoice',
          action: 'read',
        },
        {
          ...mockPermission,
          id: 'perm-2',
          resource: 'invoice',
          action: 'write',
        },
        { ...mockPermission, id: 'perm-3', resource: 'user', action: 'read' },
      ];
      prismaService.permission.findMany.mockResolvedValue(permissions);

      const result = await service.findAll();

      expect(result).toHaveLength(3);
      expect(prismaService.permission.findMany).toHaveBeenCalledWith({
        orderBy: [{ resource: 'asc' }, { action: 'asc' }],
      });
    });
  });

  describe('findOne', () => {
    it('should return permission when found', async () => {
      prismaService.permission.findUnique.mockResolvedValue(mockPermission);

      const result = await service.findOne('perm-123');

      expect(result).toEqual(mockPermission);
      expect(result.resource).toBe('invoice');
      expect(result.action).toBe('read');
    });

    it('should throw NotFoundException when permission not found', async () => {
      prismaService.permission.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete permission successfully', async () => {
      prismaService.permission.findUnique.mockResolvedValue(mockPermission);
      prismaService.permission.delete.mockResolvedValue(mockPermission);

      const result = await service.remove('perm-123');

      expect(result).toEqual(mockPermission);
      expect(prismaService.permission.delete).toHaveBeenCalledWith({
        where: { id: 'perm-123' },
      });
    });

    it('should throw NotFoundException when trying to delete non-existent permission', async () => {
      prismaService.permission.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
