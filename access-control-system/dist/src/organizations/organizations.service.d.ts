import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto, UpdateOrganizationDto, AddMemberDto } from './dto';
import { Prisma } from '@prisma/client';
export declare class OrganizationsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createOrganizationDto: CreateOrganizationDto, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        settings: Prisma.JsonValue;
    }>;
    findAllForUser(userId: string): Promise<{
        joinedAt: Date;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        settings: Prisma.JsonValue;
    }[]>;
    findOne(id: string): Promise<{
        members: ({
            user: {
                email: string;
                fullName: string | null;
                id: string;
            };
        } & {
            id: string;
            organizationId: string;
            userId: string;
            joinedAt: Date;
        })[];
        _count: {
            roles: number;
            members: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        settings: Prisma.JsonValue;
    }>;
    findBySlug(slug: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        settings: Prisma.JsonValue;
    }>;
    update(id: string, updateOrganizationDto: UpdateOrganizationDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        settings: Prisma.JsonValue;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        settings: Prisma.JsonValue;
    }>;
    addMember(organizationId: string, addMemberDto: AddMemberDto): Promise<{
        user: {
            email: string;
            fullName: string | null;
            id: string;
        };
    } & {
        id: string;
        organizationId: string;
        userId: string;
        joinedAt: Date;
    }>;
    getMembers(organizationId: string): Promise<({
        user: {
            email: string;
            fullName: string | null;
            id: string;
            isActive: boolean;
        };
    } & {
        id: string;
        organizationId: string;
        userId: string;
        joinedAt: Date;
    })[]>;
    removeMember(organizationId: string, userId: string): Promise<{
        id: string;
        organizationId: string;
        userId: string;
        joinedAt: Date;
    }>;
    isMember(organizationId: string, userId: string): Promise<boolean>;
}
