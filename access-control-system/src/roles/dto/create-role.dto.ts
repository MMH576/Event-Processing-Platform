import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsBoolean()
  isSystemRole?: boolean;
}
