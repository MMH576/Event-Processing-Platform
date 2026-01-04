import { PrismaService } from '../prisma/prisma.service';
import { CreatePermissionDto } from './dto';
export declare class PermissionsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createPermissionDto: CreatePermissionDto): Promise<{
        action: string;
        id: string;
        createdAt: Date;
        resource: string;
        description: string | null;
    }>;
    findAll(): Promise<{
        action: string;
        id: string;
        createdAt: Date;
        resource: string;
        description: string | null;
    }[]>;
    findOne(id: string): Promise<{
        action: string;
        id: string;
        createdAt: Date;
        resource: string;
        description: string | null;
    }>;
    remove(id: string): Promise<{
        action: string;
        id: string;
        createdAt: Date;
        resource: string;
        description: string | null;
    }>;
}
