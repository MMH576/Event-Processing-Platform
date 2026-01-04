import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePolicyDto, UpdatePolicyDto } from './dto';
import { Prisma } from '@prisma/client';
import {
  PolicyContext,
  PolicyEvaluationResult,
  PolicyConditions,
} from './interfaces/policy-context.interface';

@Injectable()
export class PoliciesService {
  constructor(private prisma: PrismaService) {}

  async create(createPolicyDto: CreatePolicyDto) {
    // Verify organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { id: createPolicyDto.organizationId },
    });

    if (!organization) {
      throw new NotFoundException(
        `Organization with ID ${createPolicyDto.organizationId} not found`,
      );
    }

    // Verify permission exists
    const permission = await this.prisma.permission.findUnique({
      where: { id: createPolicyDto.permissionId },
    });

    if (!permission) {
      throw new NotFoundException(
        `Permission with ID ${createPolicyDto.permissionId} not found`,
      );
    }

    return this.prisma.policy.create({
      data: {
        name: createPolicyDto.name,
        description: createPolicyDto.description,
        organizationId: createPolicyDto.organizationId,
        permissionId: createPolicyDto.permissionId,
        conditions: createPolicyDto.conditions as Prisma.InputJsonValue,
        effect: createPolicyDto.effect,
        priority: createPolicyDto.priority ?? 0,
        isActive: createPolicyDto.isActive ?? true,
      },
      include: {
        permission: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async findAll(organizationId?: string) {
    const where: Prisma.PolicyWhereInput = {};

    if (organizationId) {
      where.organizationId = organizationId;
    }

    return this.prisma.policy.findMany({
      where,
      include: {
        permission: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const policy = await this.prisma.policy.findUnique({
      where: { id },
      include: {
        permission: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!policy) {
      throw new NotFoundException(`Policy with ID ${id} not found`);
    }

    return policy;
  }

  async update(id: string, updatePolicyDto: UpdatePolicyDto) {
    await this.findOne(id);

    const data: Prisma.PolicyUpdateInput = {};

    if (updatePolicyDto.name !== undefined) {
      data.name = updatePolicyDto.name;
    }
    if (updatePolicyDto.description !== undefined) {
      data.description = updatePolicyDto.description;
    }
    if (updatePolicyDto.conditions !== undefined) {
      data.conditions = updatePolicyDto.conditions as Prisma.InputJsonValue;
    }
    if (updatePolicyDto.effect !== undefined) {
      data.effect = updatePolicyDto.effect;
    }
    if (updatePolicyDto.priority !== undefined) {
      data.priority = updatePolicyDto.priority;
    }
    if (updatePolicyDto.isActive !== undefined) {
      data.isActive = updatePolicyDto.isActive;
    }

    return this.prisma.policy.update({
      where: { id },
      data,
      include: {
        permission: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.policy.delete({
      where: { id },
    });
  }

  // Policy Evaluation Logic

  async evaluatePolicies(
    permissionKey: string,
    organizationId: string,
    context: PolicyContext,
  ): Promise<PolicyEvaluationResult> {
    // Parse permission key (format: "resource:action")
    const [resource, action] = permissionKey.split(':');

    // Find the permission
    const permission = await this.prisma.permission.findUnique({
      where: {
        resource_action: { resource, action },
      },
    });

    if (!permission) {
      // No permission found, default to allow (RBAC already checked)
      return { allowed: true, reason: 'No matching permission found for policy evaluation' };
    }

    // Get all active policies for this permission and organization
    const policies = await this.prisma.policy.findMany({
      where: {
        permissionId: permission.id,
        organizationId: organizationId,
        isActive: true,
      },
      orderBy: { priority: 'desc' },
    });

    if (policies.length === 0) {
      // No policies defined, allow by default (RBAC already passed)
      return { allowed: true, reason: 'No policies defined for this permission' };
    }

    // Evaluate each policy in priority order
    for (const policy of policies) {
      const conditions = policy.conditions as PolicyConditions;
      const conditionResult = this.evaluateConditions(conditions, context);

      if (conditionResult.matches) {
        // Conditions match, apply the policy effect
        const allowed = policy.effect === 'allow';
        return {
          allowed,
          reason: conditionResult.reason,
          matchedPolicy: {
            id: policy.id,
            name: policy.name,
            effect: policy.effect as 'allow' | 'deny',
          },
        };
      }
    }

    // No policy conditions matched, default to allow (RBAC already passed)
    return { allowed: true, reason: 'No policy conditions matched' };
  }

  private evaluateConditions(
    conditions: PolicyConditions,
    context: PolicyContext,
  ): { matches: boolean; reason: string } {
    // If no conditions specified, always match
    if (!conditions || Object.keys(conditions).length === 0) {
      return { matches: true, reason: 'No conditions specified' };
    }

    // Check amount limit
    if (conditions.amountLimit !== undefined) {
      if (context.amount === undefined) {
        return { matches: false, reason: 'Amount not provided in context' };
      }
      if (context.amount > conditions.amountLimit) {
        return {
          matches: true,
          reason: `Amount ${context.amount} exceeds limit ${conditions.amountLimit}`,
        };
      }
    }

    // Check time restriction
    if (conditions.timeRestriction) {
      const now = context.timestamp || new Date();
      const isBusinessHours = this.isBusinessHours(now);
      const isWeekend = this.isWeekend(now);

      switch (conditions.timeRestriction) {
        case 'business_hours':
          if (!isBusinessHours || isWeekend) {
            return {
              matches: true,
              reason: 'Access attempted outside business hours',
            };
          }
          break;
        case 'after_hours':
          if (isBusinessHours && !isWeekend) {
            return {
              matches: true,
              reason: 'Access attempted during business hours',
            };
          }
          break;
        case 'weekends_only':
          if (!isWeekend) {
            return {
              matches: true,
              reason: 'Access attempted on a weekday',
            };
          }
          break;
      }
    }

    // Check resource owner only
    if (conditions.resourceOwnerOnly) {
      if (!context.resourceOwnerId) {
        return { matches: false, reason: 'Resource owner not specified' };
      }
      if (context.userId !== context.resourceOwnerId) {
        return {
          matches: true,
          reason: 'User is not the resource owner',
        };
      }
    }

    // Check allowed departments
    if (conditions.allowedDepartments && conditions.allowedDepartments.length > 0) {
      if (!context.userDepartment) {
        return { matches: true, reason: 'User department not specified' };
      }
      if (!conditions.allowedDepartments.includes(context.userDepartment)) {
        return {
          matches: true,
          reason: `User department '${context.userDepartment}' not in allowed list`,
        };
      }
    }

    // All conditions passed without triggering a match
    return { matches: false, reason: 'All conditions passed' };
  }

  private isBusinessHours(date: Date): boolean {
    const hours = date.getHours();
    return hours >= 9 && hours < 17; // 9 AM to 5 PM
  }

  private isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }
}
