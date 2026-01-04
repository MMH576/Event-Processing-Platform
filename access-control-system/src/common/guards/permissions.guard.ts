import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { RolesService } from '../../roles/roles.service';
import { PoliciesService } from '../../policies/policies.service';
import { AuditService } from '../../audit/audit.service';
import { PolicyContext } from '../../policies/interfaces/policy-context.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rolesService: RolesService,
    @Optional()
    @Inject(PoliciesService)
    private policiesService?: PoliciesService,
    @Optional() @Inject(AuditService) private auditService?: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const organizationId =
      request.headers['x-organization-id'] || request.query.organizationId;

    // PHASE 1: RBAC Check
    const userPermissions = await this.rolesService.getUserPermissions(
      user.id,
      organizationId,
    );

    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      // Log RBAC denial
      if (this.auditService) {
        await this.auditService.create({
          userId: user.id,
          userEmail: user.email,
          organizationId,
          action: 'access:denied',
          resourceType: 'permission',
          resourceId: request.params?.id,
          result: 'failure',
          reason: `Missing required permissions: ${requiredPermissions.join(', ')}`,
          metadata: {
            method: request.method,
            path: request.path,
            requiredPermissions,
            userPermissions,
          },
        });
      }
      throw new ForbiddenException(
        `Missing required permissions: ${requiredPermissions.join(', ')}`,
      );
    }

    // PHASE 2: ABAC Policy Check (if policies service is available and org is specified)
    if (this.policiesService && organizationId) {
      const policyContext = this.buildPolicyContext(
        request,
        user,
        organizationId,
      );

      for (const permission of requiredPermissions) {
        const result = await this.policiesService.evaluatePolicies(
          permission,
          organizationId,
          policyContext,
        );

        if (!result.allowed) {
          const reason = result.matchedPolicy
            ? `Policy '${result.matchedPolicy.name}' denied access: ${result.reason}`
            : result.reason;

          // Log ABAC policy denial
          if (this.auditService) {
            await this.auditService.create({
              userId: user.id,
              userEmail: user.email,
              organizationId,
              action: 'policy:deny',
              resourceType: 'policy',
              resourceId: result.matchedPolicy?.id,
              result: 'failure',
              reason: `Access denied by policy: ${reason}`,
              metadata: {
                method: request.method,
                path: request.path,
                permission,
                policyName: result.matchedPolicy?.name,
                policyEffect: result.matchedPolicy?.effect,
              },
            });
          }

          throw new ForbiddenException(`Access denied by policy: ${reason}`);
        }
      }
    }

    return true;
  }

  private buildPolicyContext(
    request: any,
    user: any,
    organizationId: string,
  ): PolicyContext {
    // Extract context from request body, query, or headers
    const body = request.body || {};
    const query = request.query || {};
    const headers = request.headers || {};

    return {
      userId: user.id,
      organizationId,
      resourceType: headers['x-resource-type'] || query.resourceType,
      resourceId: request.params?.id || query.resourceId,
      resourceOwnerId: headers['x-resource-owner-id'] || body.ownerId,
      amount: body.amount ? parseFloat(body.amount) : undefined,
      timestamp: new Date(),
      userDepartment: headers['x-user-department'] || user.department,
      metadata: {
        method: request.method,
        path: request.path,
        ip: request.ip,
      },
    };
  }
}
