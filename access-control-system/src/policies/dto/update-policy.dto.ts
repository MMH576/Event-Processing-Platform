import {
  IsString,
  IsOptional,
  IsObject,
  IsIn,
  IsInt,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePolicyDto {
  @ApiPropertyOptional({
    example: 'Updated Policy Name',
    description: 'Policy name',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'Updated description',
    description: 'Policy description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: { amountLimit: 5000 },
    description: 'Policy conditions',
  })
  @IsOptional()
  @IsObject()
  conditions?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: 'allow',
    enum: ['allow', 'deny'],
    description: 'Policy effect',
  })
  @IsOptional()
  @IsIn(['allow', 'deny'])
  effect?: 'allow' | 'deny';

  @ApiPropertyOptional({ example: 2, description: 'Policy priority' })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether policy is active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
