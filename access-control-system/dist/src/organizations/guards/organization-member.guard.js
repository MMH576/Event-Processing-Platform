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
exports.OrganizationMemberGuard = void 0;
const common_1 = require("@nestjs/common");
const organizations_service_1 = require("../organizations.service");
let OrganizationMemberGuard = class OrganizationMemberGuard {
    organizationsService;
    constructor(organizationsService) {
        this.organizationsService = organizationsService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const organizationId = request.params.id;
        if (!user) {
            throw new common_1.ForbiddenException('User not authenticated');
        }
        if (!organizationId) {
            throw new common_1.NotFoundException('Organization ID not provided');
        }
        const isMember = await this.organizationsService.isMember(organizationId, user.id);
        if (!isMember) {
            throw new common_1.ForbiddenException('You are not a member of this organization');
        }
        return true;
    }
};
exports.OrganizationMemberGuard = OrganizationMemberGuard;
exports.OrganizationMemberGuard = OrganizationMemberGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [organizations_service_1.OrganizationsService])
], OrganizationMemberGuard);
//# sourceMappingURL=organization-member.guard.js.map