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
exports.OrganizationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let OrganizationsService = class OrganizationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createOrganizationDto, userId) {
        const existing = await this.prisma.organization.findUnique({
            where: { slug: createOrganizationDto.slug },
        });
        if (existing) {
            throw new common_1.ConflictException(`Organization with slug "${createOrganizationDto.slug}" already exists`);
        }
        return this.prisma.$transaction(async (tx) => {
            const organization = await tx.organization.create({
                data: {
                    name: createOrganizationDto.name,
                    slug: createOrganizationDto.slug,
                    settings: (createOrganizationDto.settings || {}),
                },
            });
            await tx.organizationMember.create({
                data: {
                    organizationId: organization.id,
                    userId: userId,
                },
            });
            return organization;
        });
    }
    async findAllForUser(userId) {
        const memberships = await this.prisma.organizationMember.findMany({
            where: { userId },
            include: {
                organization: true,
            },
            orderBy: {
                joinedAt: 'desc',
            },
        });
        return memberships.map((m) => ({
            ...m.organization,
            joinedAt: m.joinedAt,
        }));
    }
    async findOne(id) {
        const organization = await this.prisma.organization.findUnique({
            where: { id },
            include: {
                members: {
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
                _count: {
                    select: {
                        members: true,
                        roles: true,
                    },
                },
            },
        });
        if (!organization) {
            throw new common_1.NotFoundException(`Organization with ID ${id} not found`);
        }
        return organization;
    }
    async findBySlug(slug) {
        const organization = await this.prisma.organization.findUnique({
            where: { slug },
        });
        if (!organization) {
            throw new common_1.NotFoundException(`Organization with slug "${slug}" not found`);
        }
        return organization;
    }
    async update(id, updateOrganizationDto) {
        await this.findOne(id);
        const data = {
            name: updateOrganizationDto.name,
        };
        if (updateOrganizationDto.settings !== undefined) {
            data.settings = updateOrganizationDto.settings;
        }
        return this.prisma.organization.update({
            where: { id },
            data,
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.organization.delete({
            where: { id },
        });
    }
    async addMember(organizationId, addMemberDto) {
        await this.findOne(organizationId);
        const user = await this.prisma.user.findUnique({
            where: { id: addMemberDto.userId },
        });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${addMemberDto.userId} not found`);
        }
        const existingMember = await this.prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId,
                    userId: addMemberDto.userId,
                },
            },
        });
        if (existingMember) {
            throw new common_1.ConflictException('User is already a member of this organization');
        }
        return this.prisma.organizationMember.create({
            data: {
                organizationId,
                userId: addMemberDto.userId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                    },
                },
            },
        });
    }
    async getMembers(organizationId) {
        await this.findOne(organizationId);
        return this.prisma.organizationMember.findMany({
            where: { organizationId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                        isActive: true,
                    },
                },
            },
            orderBy: {
                joinedAt: 'asc',
            },
        });
    }
    async removeMember(organizationId, userId) {
        const member = await this.prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId,
                    userId,
                },
            },
        });
        if (!member) {
            throw new common_1.NotFoundException('User is not a member of this organization');
        }
        const memberCount = await this.prisma.organizationMember.count({
            where: { organizationId },
        });
        if (memberCount === 1) {
            throw new common_1.ForbiddenException('Cannot remove the last member. Delete the organization instead.');
        }
        await this.prisma.userRole.deleteMany({
            where: {
                userId,
                organizationId,
            },
        });
        return this.prisma.organizationMember.delete({
            where: { id: member.id },
        });
    }
    async isMember(organizationId, userId) {
        const member = await this.prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId,
                    userId,
                },
            },
        });
        return !!member;
    }
};
exports.OrganizationsService = OrganizationsService;
exports.OrganizationsService = OrganizationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrganizationsService);
//# sourceMappingURL=organizations.service.js.map