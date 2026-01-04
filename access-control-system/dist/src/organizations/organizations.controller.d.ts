import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto, UpdateOrganizationDto, AddMemberDto } from './dto';
export declare class OrganizationsController {
    private readonly organizationsService;
    constructor(organizationsService: OrganizationsService);
    create(createOrganizationDto: CreateOrganizationDto, req: {
        user: {
            id: string;
        };
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        settings: import("@prisma/client/runtime/client").JsonValue;
    }>;
    findAll(req: {
        user: {
            id: string;
        };
    }): Promise<{
        joinedAt: Date;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        settings: import("@prisma/client/runtime/client").JsonValue;
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
        settings: import("@prisma/client/runtime/client").JsonValue;
    }>;
    update(id: string, updateOrganizationDto: UpdateOrganizationDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        settings: import("@prisma/client/runtime/client").JsonValue;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        settings: import("@prisma/client/runtime/client").JsonValue;
    }>;
    addMember(id: string, addMemberDto: AddMemberDto): Promise<{
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
    getMembers(id: string): Promise<({
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
    removeMember(id: string, userId: string): Promise<{
        id: string;
        organizationId: string;
        userId: string;
        joinedAt: Date;
    }>;
}
