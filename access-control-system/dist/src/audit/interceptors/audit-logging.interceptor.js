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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const operators_1 = require("rxjs/operators");
const audit_service_1 = require("../audit.service");
const audit_action_decorator_1 = require("../decorators/audit-action.decorator");
let AuditLoggingInterceptor = class AuditLoggingInterceptor {
    auditService;
    reflector;
    constructor(auditService, reflector) {
        this.auditService = auditService;
        this.reflector = reflector;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const startTime = Date.now();
        const customAction = this.reflector.getAllAndOverride(audit_action_decorator_1.AUDIT_ACTION_KEY, [context.getHandler(), context.getClass()]);
        const action = customAction || `${request.method}:${request.route?.path || request.path}`;
        const user = request.user;
        const organizationId = request.headers['x-organization-id'];
        const resourceId = request.params?.id;
        const resourceType = this.extractResourceType(request.path);
        return next.handle().pipe((0, operators_1.tap)(() => {
            const duration = Date.now() - startTime;
            this.logAudit({
                userId: user?.id,
                userEmail: user?.email,
                organizationId,
                action,
                resourceType,
                resourceId,
                result: 'success',
                metadata: {
                    method: request.method,
                    path: request.path,
                    ip: request.ip,
                    userAgent: request.headers['user-agent'],
                    duration,
                },
            });
        }), (0, operators_1.catchError)((error) => {
            const duration = Date.now() - startTime;
            this.logAudit({
                userId: user?.id,
                userEmail: user?.email,
                organizationId,
                action,
                resourceType,
                resourceId,
                result: 'failure',
                reason: error.message,
                metadata: {
                    method: request.method,
                    path: request.path,
                    ip: request.ip,
                    userAgent: request.headers['user-agent'],
                    duration,
                    errorName: error.name,
                    statusCode: error.status || error.statusCode,
                },
            });
            throw error;
        }));
    }
    extractResourceType(path) {
        const segments = path.split('/').filter(Boolean);
        if (segments.length > 0) {
            const firstSegment = segments[0] === 'api' ? segments[1] : segments[0];
            if (firstSegment) {
                return firstSegment.replace(/s$/, '');
            }
        }
        return undefined;
    }
    logAudit(data) {
        this.auditService.create(data).catch((err) => {
            console.error('Failed to create audit log:', err);
        });
    }
};
exports.AuditLoggingInterceptor = AuditLoggingInterceptor;
exports.AuditLoggingInterceptor = AuditLoggingInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [audit_service_1.AuditService,
        core_1.Reflector])
], AuditLoggingInterceptor);
//# sourceMappingURL=audit-logging.interceptor.js.map