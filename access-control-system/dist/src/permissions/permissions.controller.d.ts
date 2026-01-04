import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto';
export declare class PermissionsController {
    private readonly permissionsService;
    constructor(permissionsService: PermissionsService);
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
