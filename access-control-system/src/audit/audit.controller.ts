import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { QueryAuditLogDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('audit')
@ApiBearerAuth('JWT-auth')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Query audit logs' })
  @ApiResponse({ status: 200, description: 'Returns list of audit logs' })
  findAll(@Query() query: QueryAuditLogDto) {
    return this.auditService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get audit log statistics' })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    description: 'Filter by organization ID',
  })
  @ApiResponse({ status: 200, description: 'Returns audit statistics' })
  getStats(@Query('organizationId') organizationId?: string) {
    return this.auditService.getStats(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get audit log entry by ID' })
  @ApiParam({ name: 'id', description: 'Audit log ID' })
  @ApiResponse({ status: 200, description: 'Returns audit log entry' })
  @ApiResponse({ status: 404, description: 'Audit log entry not found' })
  findOne(@Param('id') id: string) {
    return this.auditService.findOne(id);
  }
}
