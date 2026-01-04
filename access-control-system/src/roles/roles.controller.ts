import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto, AssignPermissionsDto, AssignRoleDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  findAll(@Query('organizationId') organizationId?: string) {
    return this.rolesService.findAll(organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }

  @Post(':id/permissions')
  assignPermissions(
    @Param('id') id: string,
    @Body() dto: AssignPermissionsDto,
  ) {
    return this.rolesService.assignPermissions(id, dto);
  }

  @Post('users/:userId/assign')
  assignRoleToUser(
    @Param('userId') userId: string,
    @Body() dto: AssignRoleDto,
    @Request() req: { user: { sub: string } },
  ) {
    return this.rolesService.assignRoleToUser(userId, dto, req.user.sub);
  }

  @Delete('users/:userId/roles/:roleId')
  removeRoleFromUser(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.rolesService.removeRoleFromUser(userId, roleId, organizationId);
  }

  @Get('users/:userId/roles')
  getUserRoles(@Param('userId') userId: string) {
    return this.rolesService.getUserRoles(userId);
  }

  @Get('users/:userId/permissions')
  getUserPermissions(
    @Param('userId') userId: string,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.rolesService.getUserPermissions(userId, organizationId);
  }
}
