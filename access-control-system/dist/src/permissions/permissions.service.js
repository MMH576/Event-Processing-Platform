"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PermissionsService = class PermissionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createPermissionDto) {
        const existing = await this.prisma.permission.findUnique({
            where: {
                resource_action: {
                    resource: createPermissionDto.resource,
                    action: createPermissionDto.action,
                },
            },
        });
        if (existing) {
            throw new common_1.ConflictException(`Permission ${createPermissionDto.resource}:${createPermissionDto.action} already exists`);
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
    async findOne(id) {
        const permission = await this.prisma.permission.findUnique({
            where: { id },
        });
        if (!permission) {
            throw new common_1.NotFoundException(`Permission with ID ${id} not found`);
        }
        return permission;
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.permission.delete({
            where: { id },
        });
    }
};
exports.PermissionsService = PermissionsService;
exports.PermissionsService = PermissionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PermissionsService);
//# sourceMappingURL=permissions.service.js.map