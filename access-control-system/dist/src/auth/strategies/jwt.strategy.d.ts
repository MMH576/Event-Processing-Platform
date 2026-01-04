import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private authService;
    constructor(configService: ConfigService, authService: AuthService);
    validate(payload: {
        sub: string;
        email: string;
    }): Promise<{
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
    }>;
}
export {};
