import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto, UpdateOrganizationDto, AddMemberDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async create(createOrganizationDto: CreateOrganizationDto, userId: string) {
    // Check if slug already exists
    const existing = await this.prisma.organization.findUnique({
      where: { slug: createOrganizationDto.slug },
    });

    if (existing) {
      throw new ConflictException(
        `Organization with slug "${createOrganizationDto.slug}" already exists`,
      );
    }

    // Create organization and add creator as member in a transaction
    return this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: createOrganizationDto.name,
          slug: createOrganizationDto.slug,
          settings: (createOrganizationDto.settings || {}) as Prisma.InputJsonValue,
        },
      });

      // Add creator as member
      await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: userId,
        },
      });

      return organization;
    });
  }

  async findAllForUser(userId: string) {
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

  async findOne(id: string) {
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
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    return organization;
  }

  async findBySlug(slug: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { slug },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with slug "${slug}" not found`);
    }

    return organization;
  }

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto) {
    await this.findOne(id);

    const data: Prisma.OrganizationUpdateInput = {
      name: updateOrganizationDto.name,
    };

    if (updateOrganizationDto.settings !== undefined) {
      data.settings = updateOrganizationDto.settings as Prisma.InputJsonValue;
    }

    return this.prisma.organization.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.organization.delete({
      where: { id },
    });
  }

  // Membership management
  async addMember(organizationId: string, addMemberDto: AddMemberDto) {
    // Check organization exists
    await this.findOne(organizationId);

    // Check user exists
    const user = await this.prisma.user.findUnique({
      where: { id: addMemberDto.userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${addMemberDto.userId} not found`);
    }

    // Check if already a member
    const existingMember = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: addMemberDto.userId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this organization');
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

  async getMembers(organizationId: string) {
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

  async removeMember(organizationId: string, userId: string) {
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('User is not a member of this organization');
    }

    // Check if this is the last member
    const memberCount = await this.prisma.organizationMember.count({
      where: { organizationId },
    });

    if (memberCount === 1) {
      throw new ForbiddenException(
        'Cannot remove the last member. Delete the organization instead.',
      );
    }

    // Remove user roles in this organization
    await this.prisma.userRole.deleteMany({
      where: {
        userId,
        organizationId,
      },
    });

    // Remove membership
    return this.prisma.organizationMember.delete({
      where: { id: member.id },
    });
  }

  async isMember(organizationId: string, userId: string): Promise<boolean> {
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
}
