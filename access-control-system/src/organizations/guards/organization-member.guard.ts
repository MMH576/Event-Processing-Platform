import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { OrganizationsService } from '../organizations.service';

@Injectable()
export class OrganizationMemberGuard implements CanActivate {
  constructor(private organizationsService: OrganizationsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const organizationId = request.params.id;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!organizationId) {
      throw new NotFoundException('Organization ID not provided');
    }

    const isMember = await this.organizationsService.isMember(
      organizationId,
      user.id,
    );

    if (!isMember) {
      throw new ForbiddenException(
        'You are not a member of this organization',
      );
    }

    return true;
  }
}
