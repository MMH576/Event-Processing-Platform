import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrganizationDto {
  @ApiPropertyOptional({
    example: 'Updated Organization Name',
    description: 'Organization name',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    example: { theme: 'light' },
    description: 'Organization settings',
  })
  @IsOptional()
  settings?: Record<string, unknown>;
}
