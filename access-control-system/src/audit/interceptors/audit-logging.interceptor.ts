import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditService } from '../audit.service';
import { AUDIT_ACTION_KEY } from '../decorators/audit-action.decorator';

@Injectable()
export class AuditLoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    // Get custom action from decorator or use method:path format
    const customAction = this.reflector.getAllAndOverride<string>(
      AUDIT_ACTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    const action =
      customAction ||
      `${request.method}:${request.route?.path || request.path}`;

    // Extract user info (may be undefined for unauthenticated requests)
    const user = request.user;
    const organizationId = request.headers['x-organization-id'];

    // Extract resource info from params
    const resourceId = request.params?.id;
    const resourceType = this.extractResourceType(request.path);

    return next.handle().pipe(
      tap(() => {
        // Log successful request
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
      }),
      catchError((error) => {
        // Log failed request
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
      }),
    );
  }

  private extractResourceType(path: string): string | undefined {
    // Extract resource type from path like /roles, /permissions, /organizations
    const segments = path.split('/').filter(Boolean);
    if (segments.length > 0) {
      // Remove 'api' prefix if present and get the first meaningful segment
      const firstSegment = segments[0] === 'api' ? segments[1] : segments[0];
      // Convert plural to singular for resource type
      if (firstSegment) {
        return firstSegment.replace(/s$/, '');
      }
    }
    return undefined;
  }

  private logAudit(data: {
    userId?: string;
    userEmail?: string;
    organizationId?: string;
    action: string;
    resourceType?: string;
    resourceId?: string;
    result: 'success' | 'failure';
    reason?: string;
    metadata?: Record<string, unknown>;
  }): void {
    // Fire and forget - don't await to avoid slowing down responses
    this.auditService.create(data).catch((err) => {
      console.error('Failed to create audit log:', err);
    });
  }
}
