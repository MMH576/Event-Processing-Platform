import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({
    example: 'invoice',
    description: 'Resource name (e.g., invoice, user, report)',
  })
  @IsString()
  resource: string;

  @ApiProperty({
    example: 'create',
    description: 'Action name (e.g., create, read, update, delete)',
  })
  @IsString()
  action: string;

  @ApiPropertyOptional({
    example: 'Create new invoices',
    description: 'Permission description',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
