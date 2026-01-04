import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto, UpdateOrganizationDto, AddMemberDto } from './dto';
import { Prisma } from '@prisma/client';
export declare class OrganizationsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createOrganizationDto: CreateOrganizationDto, userId: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        slug: string;
        settings: Prisma.JsonValue;
    }>;
    findAllForUser(userId: string): Promise<{
        joinedAt: Date;
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        slug: string;
        settings: Prisma.JsonValue;
    }[]>;
    findOne(id: string): Promise<{
        _count: {
            roles: number;
            members: number;
        };
        members: ({
            user: {
                id: string;
                email: string;
                fullName: string | null;
            };
        } & {
            userId: string;
            organizationId: string;
            id: string;
            joinedAt: Date;
        })[];
    } & {
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        slug: string;
        settings: Prisma.JsonValue;
    }>;
    findBySlug(slug: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        slug: string;
        settings: Prisma.JsonValue;
    }>;
    update(id: string, updateOrganizationDto: UpdateOrganizationDto): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        slug: string;
        settings: Prisma.JsonValue;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        slug: string;
        settings: Prisma.JsonValue;
    }>;
    addMember(organizationId: string, addMemberDto: AddMemberDto): Promise<{
        user: {
            id: string;
            email: string;
            fullName: string | null;
        };
    } & {
        userId: string;
        organizationId: string;
        id: string;
        joinedAt: Date;
    }>;
    getMembers(organizationId: string): Promise<({
        user: {
            id: string;
            email: string;
            fullName: string | null;
            isActive: boolean;
        };
    } & {
        userId: string;
        organizationId: string;
        id: string;
        joinedAt: Date;
    })[]>;
    removeMember(organizationId: string, userId: string): Promise<{
        userId: string;
        organizationId: string;
        id: string;
        joinedAt: Date;
    }>;
    isMember(organizationId: string, userId: string): Promise<boolean>;
}
