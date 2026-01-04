"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const permissions_decorator_1 = require("../decorators/permissions.decorator");
const roles_service_1 = require("../../roles/roles.service");
const policies_service_1 = require("../../policies/policies.service");
const audit_service_1 = require("../../audit/audit.service");
let PermissionsGuard = class PermissionsGuard {
    reflector;
    rolesService;
    policiesService;
    auditService;
    constructor(reflector, rolesService, policiesService, auditService) {
        this.reflector = reflector;
        this.rolesService = rolesService;
        this.policiesService = policiesService;
        this.auditService = auditService;
    }
    async canActivate(context) {
        const requiredPermissions = this.reflector.getAllAndOverride(permissions_decorator_1.PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.ForbiddenException('User not authenticated');
        }
        const organizationId = request.headers['x-organization-id'] || request.query.organizationId;
        const userPermissions = await this.rolesService.getUserPermissions(user.id, organizationId);
        const hasPermission = requiredPermissions.every((permission) => userPermissions.includes(permission));
        if (!hasPermission) {
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
            throw new common_1.ForbiddenException(`Missing required permissions: ${requiredPermissions.join(', ')}`);
        }
        if (this.policiesService && organizationId) {
            const policyContext = this.buildPolicyContext(request, user, organizationId);
            for (const permission of requiredPermissions) {
                const result = await this.policiesService.evaluatePolicies(permission, organizationId, policyContext);
                if (!result.allowed) {
                    const reason = result.matchedPolicy
                        ? `Policy '${result.matchedPolicy.name}' denied access: ${result.reason}`
                        : result.reason;
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
                    throw new common_1.ForbiddenException(`Access denied by policy: ${reason}`);
                }
            }
        }
        return true;
    }
    buildPolicyContext(request, user, organizationId) {
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
};
exports.PermissionsGuard = PermissionsGuard;
exports.PermissionsGuard = PermissionsGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Optional)()),
    __param(2, (0, common_1.Inject)(policies_service_1.PoliciesService)),
    __param(3, (0, common_1.Optional)()),
    __param(3, (0, common_1.Inject)(audit_service_1.AuditService)),
    __metadata("design:paramtypes", [core_1.Reflector,
        roles_service_1.RolesService,
        policies_service_1.PoliciesService,
        audit_service_1.AuditService])
], PermissionsGuard);
//# sourceMappingURL=permissions.guard.js.map