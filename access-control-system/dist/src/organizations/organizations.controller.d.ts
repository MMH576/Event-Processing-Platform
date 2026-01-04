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
        name: string;
        slug: string;
        settings: import("@prisma/client/runtime/client").JsonValue;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(req: {
        user: {
            id: string;
        };
    }): Promise<{
        joinedAt: Date;
        id: string;
        name: string;
        slug: string;
        settings: import("@prisma/client/runtime/client").JsonValue;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(id: string): Promise<{
        members: ({
            user: {
                id: string;
                email: string;
                fullName: string | null;
            };
        } & {
            id: string;
            organizationId: string;
            userId: string;
            joinedAt: Date;
        })[];
        _count: {
            members: number;
            roles: number;
        };
    } & {
        id: string;
        name: string;
        slug: string;
        settings: import("@prisma/client/runtime/client").JsonValue;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, updateOrganizationDto: UpdateOrganizationDto): Promise<{
        id: string;
        name: string;
        slug: string;
        settings: import("@prisma/client/runtime/client").JsonValue;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        slug: string;
        settings: import("@prisma/client/runtime/client").JsonValue;
        createdAt: Date;
        updatedAt: Date;
    }>;
    addMember(id: string, addMemberDto: AddMemberDto): Promise<{
        user: {
            id: string;
            email: string;
            fullName: string | null;
        };
    } & {
        id: string;
        organizationId: string;
        userId: string;
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
