import {
  IsString,
  IsOptional,
  IsUUID,
  IsObject,
  IsIn,
  IsInt,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePolicyDto {
  @ApiProperty({
    example: 'High-Value Invoice Restriction',
    description: 'Policy name',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Deny invoice approval over $10,000',
    description: 'Policy description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Organization ID',
  })
  @IsUUID()
  organizationId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Permission ID this policy applies to',
  })
  @IsUUID()
  permissionId: string;

  @ApiProperty({
    example: { amountLimit: 10000, timeRestriction: 'business_hours' },
    description:
      'Policy conditions (amountLimit, timeRestriction, resourceOwnerOnly, etc.)',
  })
  @IsObject()
  conditions: Record<string, unknown>;

  @ApiProperty({
    example: 'deny',
    enum: ['allow', 'deny'],
    description: 'Policy effect',
  })
  @IsIn(['allow', 'deny'])
  effect: 'allow' | 'deny';

  @ApiPropertyOptional({
    example: 1,
    description: 'Policy priority (higher = evaluated first)',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether policy is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
