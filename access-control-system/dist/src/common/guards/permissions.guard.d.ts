import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesService } from '../../roles/roles.service';
import { PoliciesService } from '../../policies/policies.service';
export declare class PermissionsGuard implements CanActivate {
    private reflector;
    private rolesService;
    private policiesService?;
    constructor(reflector: Reflector, rolesService: RolesService, policiesService?: PoliciesService | undefined);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private buildPolicyContext;
}
