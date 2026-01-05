/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PoliciesService } from './policies.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PoliciesService', () => {
  let service: PoliciesService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockOrganization = {
    id: 'org-123',
    name: 'Test Org',
    slug: 'test-org',
  };

  const mockPermission = {
    id: 'perm-123',
    resource: 'invoice',
    action: 'approve',
    description: 'Approve invoices',
  };

  const mockPolicy = {
    id: 'policy-123',
    name: 'High Value Approval',
    description: 'Deny approvals over 10000',
    organizationId: 'org-123',
    permissionId: 'perm-123',
    conditions: { amountLimit: 10000 },
    effect: 'deny',
    priority: 10,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    permission: mockPermission,
    organization: mockOrganization,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PoliciesService,
        {
          provide: PrismaService,
          useValue: {
            policy: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            organization: {
              findUnique: jest.fn(),
            },
            permission: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<PoliciesService>(PoliciesService);
    prismaService = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new policy successfully', async () => {
      prismaService.organization.findUnique.mockResolvedValue(mockOrganization);
      prismaService.permission.findUnique.mockResolvedValue(mockPermission);
      prismaService.policy.create.mockResolvedValue(mockPolicy);

      const result = await service.create({
        name: 'High Value Approval',
        description: 'Deny approvals over 10000',
        organizationId: 'org-123',
        permissionId: 'perm-123',
        conditions: { amountLimit: 10000 },
        effect: 'deny',
        priority: 10,
      });

      expect(result).toEqual(mockPolicy);
      expect(prismaService.policy.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when organization not found', async () => {
      prismaService.organization.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          name: 'Test Policy',
          organizationId: 'invalid-org',
          permissionId: 'perm-123',
          conditions: {},
          effect: 'allow',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when permission not found', async () => {
      prismaService.organization.findUnique.mockResolvedValue(mockOrganization);
      prismaService.permission.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          name: 'Test Policy',
          organizationId: 'org-123',
          permissionId: 'invalid-perm',
          conditions: {},
          effect: 'allow',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return policy when found', async () => {
      prismaService.policy.findUnique.mockResolvedValue(mockPolicy);

      const result = await service.findOne('policy-123');

      expect(result).toEqual(mockPolicy);
    });

    it('should throw NotFoundException when policy not found', async () => {
      prismaService.policy.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('evaluatePolicies', () => {
    it('should allow when no policies exist', async () => {
      prismaService.permission.findUnique.mockResolvedValue(mockPermission);
      prismaService.policy.findMany.mockResolvedValue([]);

      const result = await service.evaluatePolicies(
        'invoice:approve',
        'org-123',
        {
          userId: 'user-123',
          amount: 5000,
        },
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('No policies defined for this permission');
    });

    it('should allow when no matching permission found', async () => {
      prismaService.permission.findUnique.mockResolvedValue(null);

      const result = await service.evaluatePolicies(
        'unknown:action',
        'org-123',
        {
          userId: 'user-123',
        },
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe(
        'No matching permission found for policy evaluation',
      );
    });

    it('should deny when amount exceeds limit', async () => {
      prismaService.permission.findUnique.mockResolvedValue(mockPermission);
      prismaService.policy.findMany.mockResolvedValue([mockPolicy]);

      const result = await service.evaluatePolicies(
        'invoice:approve',
        'org-123',
        {
          userId: 'user-123',
          amount: 15000,
        },
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('exceeds limit');
      expect(result.matchedPolicy?.name).toBe('High Value Approval');
    });

    it('should allow when amount is within limit', async () => {
      prismaService.permission.findUnique.mockResolvedValue(mockPermission);
      prismaService.policy.findMany.mockResolvedValue([mockPolicy]);

      const result = await service.evaluatePolicies(
        'invoice:approve',
        'org-123',
        {
          userId: 'user-123',
          amount: 5000,
        },
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('No policy conditions matched');
    });

    it('should deny access outside business hours with time restriction policy', async () => {
      const businessHoursPolicy = {
        ...mockPolicy,
        id: 'policy-bh',
        name: 'Business Hours Only',
        conditions: { timeRestriction: 'business_hours' },
        effect: 'deny',
      };

      prismaService.permission.findUnique.mockResolvedValue(mockPermission);
      prismaService.policy.findMany.mockResolvedValue([businessHoursPolicy]);

      // Create a date at 10 PM (outside business hours)
      const nightTime = new Date();
      nightTime.setHours(22, 0, 0, 0);
      // Make sure it's a weekday
      while (nightTime.getDay() === 0 || nightTime.getDay() === 6) {
        nightTime.setDate(nightTime.getDate() + 1);
      }

      const result = await service.evaluatePolicies(
        'invoice:approve',
        'org-123',
        {
          userId: 'user-123',
          timestamp: nightTime,
        },
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Access attempted outside business hours');
    });

    it('should enforce priority-based policy resolution', async () => {
      const lowPriorityAllow = {
        ...mockPolicy,
        id: 'policy-low',
        name: 'Low Priority Allow',
        conditions: {},
        effect: 'allow',
        priority: 1,
      };

      const highPriorityDeny = {
        ...mockPolicy,
        id: 'policy-high',
        name: 'High Priority Deny',
        conditions: {},
        effect: 'deny',
        priority: 100,
      };

      prismaService.permission.findUnique.mockResolvedValue(mockPermission);
      // Policies are returned in priority order (highest first)
      prismaService.policy.findMany.mockResolvedValue([
        highPriorityDeny,
        lowPriorityAllow,
      ]);

      const result = await service.evaluatePolicies(
        'invoice:approve',
        'org-123',
        {
          userId: 'user-123',
        },
      );

      expect(result.allowed).toBe(false);
      expect(result.matchedPolicy?.name).toBe('High Priority Deny');
    });

    it('should deny when user is not resource owner with resourceOwnerOnly policy', async () => {
      const ownerOnlyPolicy = {
        ...mockPolicy,
        id: 'policy-owner',
        name: 'Owner Only',
        conditions: { resourceOwnerOnly: true },
        effect: 'deny',
      };

      prismaService.permission.findUnique.mockResolvedValue(mockPermission);
      prismaService.policy.findMany.mockResolvedValue([ownerOnlyPolicy]);

      const result = await service.evaluatePolicies(
        'invoice:approve',
        'org-123',
        {
          userId: 'user-123',
          resourceOwnerId: 'other-user-456',
        },
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('User is not the resource owner');
    });

    it('should deny when user department not in allowed list', async () => {
      const departmentPolicy = {
        ...mockPolicy,
        id: 'policy-dept',
        name: 'Department Restriction',
        conditions: { allowedDepartments: ['finance', 'accounting'] },
        effect: 'deny',
      };

      prismaService.permission.findUnique.mockResolvedValue(mockPermission);
      prismaService.policy.findMany.mockResolvedValue([departmentPolicy]);

      const result = await service.evaluatePolicies(
        'invoice:approve',
        'org-123',
        {
          userId: 'user-123',
          userDepartment: 'engineering',
        },
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not in allowed list');
    });
  });

  describe('update', () => {
    it('should update policy successfully', async () => {
      prismaService.policy.findUnique.mockResolvedValue(mockPolicy);
      prismaService.policy.update.mockResolvedValue({
        ...mockPolicy,
        name: 'Updated Policy Name',
      });

      const result = await service.update('policy-123', {
        name: 'Updated Policy Name',
      });

      expect(result.name).toBe('Updated Policy Name');
    });

    it('should throw NotFoundException when updating non-existent policy', async () => {
      prismaService.policy.findUnique.mockResolvedValue(null);

      await expect(
        service.update('invalid-id', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete policy successfully', async () => {
      prismaService.policy.findUnique.mockResolvedValue(mockPolicy);
      prismaService.policy.delete.mockResolvedValue(mockPolicy);

      const result = await service.remove('policy-123');

      expect(result).toEqual(mockPolicy);
    });

    it('should throw NotFoundException when deleting non-existent policy', async () => {
      prismaService.policy.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
