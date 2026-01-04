import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePermissionDto } from './dto';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async create(createPermissionDto: CreatePermissionDto) {
    const existing = await this.prisma.permission.findUnique({
      where: {
        resource_action: {
          resource: createPermissionDto.resource,
          action: createPermissionDto.action,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Permission ${createPermissionDto.resource}:${createPermissionDto.action} already exists`,
      );
    }

    return this.prisma.permission.create({
      data: createPermissionDto,
    });
  }

  async findAll() {
    return this.prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
  }

  async findOne(id: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    return permission;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.permission.delete({
      where: { id },
    });
  }
}
