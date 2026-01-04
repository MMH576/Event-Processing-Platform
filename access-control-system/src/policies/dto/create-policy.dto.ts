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

export class CreatePolicyDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  organizationId: string;

  @IsUUID()
  permissionId: string;

  @IsObject()
  conditions: Record<string, unknown>;

  @IsIn(['allow', 'deny'])
  effect: 'allow' | 'deny';

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
