import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto';
export declare class PermissionsController {
    private readonly permissionsService;
    constructor(permissionsService: PermissionsService);
    create(createPermissionDto: CreatePermissionDto): Promise<{
        resource: string;
        action: string;
        description: string | null;
        id: string;
        createdAt: Date;
    }>;
    findAll(): Promise<{
        resource: string;
        action: string;
        description: string | null;
        id: string;
        createdAt: Date;
    }[]>;
    findOne(id: string): Promise<{
        resource: string;
        action: string;
        description: string | null;
        id: string;
        createdAt: Date;
    }>;
    remove(id: string): Promise<{
        resource: string;
        action: string;
        description: string | null;
        id: string;
        createdAt: Date;
    }>;
}
