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
exports.PoliciesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PoliciesService = class PoliciesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createPolicyDto) {
        const organization = await this.prisma.organization.findUnique({
            where: { id: createPolicyDto.organizationId },
        });
        if (!organization) {
            throw new common_1.NotFoundException(`Organization with ID ${createPolicyDto.organizationId} not found`);
        }
        const permission = await this.prisma.permission.findUnique({
            where: { id: createPolicyDto.permissionId },
        });
        if (!permission) {
            throw new common_1.NotFoundException(`Permission with ID ${createPolicyDto.permissionId} not found`);
        }
        return this.prisma.policy.create({
            data: {
                name: createPolicyDto.name,
                description: createPolicyDto.description,
                organizationId: createPolicyDto.organizationId,
                permissionId: createPolicyDto.permissionId,
                conditions: createPolicyDto.conditions,
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
    async findAll(organizationId) {
        const where = {};
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
    async findOne(id) {
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
            throw new common_1.NotFoundException(`Policy with ID ${id} not found`);
        }
        return policy;
    }
    async update(id, updatePolicyDto) {
        await this.findOne(id);
        const data = {};
        if (updatePolicyDto.name !== undefined) {
            data.name = updatePolicyDto.name;
        }
        if (updatePolicyDto.description !== undefined) {
            data.description = updatePolicyDto.description;
        }
        if (updatePolicyDto.conditions !== undefined) {
            data.conditions = updatePolicyDto.conditions;
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
    async remove(id) {
        await this.findOne(id);
        return this.prisma.policy.delete({
            where: { id },
        });
    }
    async evaluatePolicies(permissionKey, organizationId, context) {
        const [resource, action] = permissionKey.split(':');
        const permission = await this.prisma.permission.findUnique({
            where: {
                resource_action: { resource, action },
            },
        });
        if (!permission) {
            return { allowed: true, reason: 'No matching permission found for policy evaluation' };
        }
        const policies = await this.prisma.policy.findMany({
            where: {
                permissionId: permission.id,
                organizationId: organizationId,
                isActive: true,
            },
            orderBy: { priority: 'desc' },
        });
        if (policies.length === 0) {
            return { allowed: true, reason: 'No policies defined for this permission' };
        }
        for (const policy of policies) {
            const conditions = policy.conditions;
            const conditionResult = this.evaluateConditions(conditions, context);
            if (conditionResult.matches) {
                const allowed = policy.effect === 'allow';
                return {
                    allowed,
                    reason: conditionResult.reason,
                    matchedPolicy: {
                        id: policy.id,
                        name: policy.name,
                        effect: policy.effect,
                    },
                };
            }
        }
        return { allowed: true, reason: 'No policy conditions matched' };
    }
    evaluateConditions(conditions, context) {
        if (!conditions || Object.keys(conditions).length === 0) {
            return { matches: true, reason: 'No conditions specified' };
        }
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
        return { matches: false, reason: 'All conditions passed' };
    }
    isBusinessHours(date) {
        const hours = date.getHours();
        return hours >= 9 && hours < 17;
    }
    isWeekend(date) {
        const day = date.getDay();
        return day === 0 || day === 6;
    }
};
exports.PoliciesService = PoliciesService;
exports.PoliciesService = PoliciesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PoliciesService);
//# sourceMappingURL=policies.service.js.map