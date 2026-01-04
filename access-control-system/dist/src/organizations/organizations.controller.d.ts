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
        name: string;
        updatedAt: Date;
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
        name: string;
        updatedAt: Date;
        slug: string;
        settings: import("@prisma/client/runtime/client").JsonValue;
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
        settings: import("@prisma/client/runtime/client").JsonValue;
    }>;
    update(id: string, updateOrganizationDto: UpdateOrganizationDto): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        slug: string;
        settings: import("@prisma/client/runtime/client").JsonValue;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        slug: string;
        settings: import("@prisma/client/runtime/client").JsonValue;
    }>;
    addMember(id: string, addMemberDto: AddMemberDto): Promise<{
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
    getMembers(id: string): Promise<({
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
    removeMember(id: string, userId: string): Promise<{
        userId: string;
        organizationId: string;
        id: string;
        joinedAt: Date;
    }>;
}
