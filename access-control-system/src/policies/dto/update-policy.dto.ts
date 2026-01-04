import {
  IsString,
  IsOptional,
  IsObject,
  IsIn,
  IsInt,
  IsBoolean,
  Min,
} from 'class-validator';

export class UpdatePolicyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  conditions?: Record<string, unknown>;

  @IsOptional()
  @IsIn(['allow', 'deny'])
  effect?: 'allow' | 'deny';

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
