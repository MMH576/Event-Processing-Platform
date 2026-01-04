import { CanActivate, ExecutionContext } from '@nestjs/common';
import { OrganizationsService } from '../organizations.service';
export declare class OrganizationMemberGuard implements CanActivate {
    private organizationsService;
    constructor(organizationsService: OrganizationsService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
