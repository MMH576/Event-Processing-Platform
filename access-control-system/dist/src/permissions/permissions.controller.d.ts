import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto';
export declare class PermissionsController {
    private readonly permissionsService;
    constructor(permissionsService: PermissionsService);
    create(createPermissionDto: CreatePermissionDto): Promise<{
        id: string;
        createdAt: Date;
        resource: string;
        action: string;
        description: string | null;
    }>;
    findAll(): Promise<{
        id: string;
        createdAt: Date;
        resource: string;
        action: string;
        description: string | null;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        createdAt: Date;
        resource: string;
        action: string;
        description: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        resource: string;
        action: string;
        description: string | null;
    }>;
}
