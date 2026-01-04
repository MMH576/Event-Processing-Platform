import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(registerDto: RegisterDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            fullName: string | null;
        };
    }>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            fullName: string | null;
        };
    }>;
    validateUser(userId: string): Promise<({
        organizations: ({
            organization: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                slug: string;
                settings: import("@prisma/client/runtime/client").JsonValue;
            };
        } & {
            id: string;
            organizationId: string;
            userId: string;
            joinedAt: Date;
        })[];
    } & {
        id: string;
        email: string;
        password: string | null;
        fullName: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    private generateTokenResponse;
}
