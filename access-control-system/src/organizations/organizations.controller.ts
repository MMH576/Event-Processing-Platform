import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  AddMemberDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationMemberGuard } from './guards/organization-member.guard';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  create(
    @Body() createOrganizationDto: CreateOrganizationDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.organizationsService.create(createOrganizationDto, req.user.id);
  }

  @Get()
  findAll(@Request() req: { user: { id: string } }) {
    return this.organizationsService.findAllForUser(req.user.id);
  }

  @Get(':id')
  @UseGuards(OrganizationMemberGuard)
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(OrganizationMemberGuard)
  update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, updateOrganizationDto);
  }

  @Delete(':id')
  @UseGuards(OrganizationMemberGuard)
  remove(@Param('id') id: string) {
    return this.organizationsService.remove(id);
  }

  // Membership endpoints
  @Post(':id/members')
  @UseGuards(OrganizationMemberGuard)
  addMember(@Param('id') id: string, @Body() addMemberDto: AddMemberDto) {
    return this.organizationsService.addMember(id, addMemberDto);
  }

  @Get(':id/members')
  @UseGuards(OrganizationMemberGuard)
  getMembers(@Param('id') id: string) {
    return this.organizationsService.getMembers(id);
  }

  @Delete(':id/members/:userId')
  @UseGuards(OrganizationMemberGuard)
  removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.organizationsService.removeMember(id, userId);
  }
}
