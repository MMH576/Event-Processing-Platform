import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private auditService: AuditService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, fullName } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Log failed registration attempt
      await this.auditService.create({
        userEmail: email,
        action: 'auth:register',
        result: 'failure',
        reason: 'User with this email already exists',
      });
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
      },
    });

    // Log successful registration
    await this.auditService.create({
      userId: user.id,
      userEmail: user.email,
      action: 'auth:register',
      result: 'success',
    });

    return this.generateTokenResponse(user);
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      // Log failed login attempt - user not found
      await this.auditService.create({
        userEmail: email,
        action: 'auth:login',
        result: 'failure',
        reason: 'Invalid credentials - user not found',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Log failed login attempt - wrong password
      await this.auditService.create({
        userId: user.id,
        userEmail: email,
        action: 'auth:login',
        result: 'failure',
        reason: 'Invalid credentials - wrong password',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      // Log failed login attempt - user deactivated
      await this.auditService.create({
        userId: user.id,
        userEmail: email,
        action: 'auth:login',
        result: 'failure',
        reason: 'User account is deactivated',
      });
      throw new UnauthorizedException('User account is deactivated');
    }

    // Log successful login
    await this.auditService.create({
      userId: user.id,
      userEmail: user.email,
      action: 'auth:login',
      result: 'success',
    });

    return this.generateTokenResponse(user);
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        organizations: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  }

  private generateTokenResponse(user: {
    id: string;
    email: string;
    fullName: string | null;
  }) {
    const payload = { sub: user.id, email: user.email };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
    };
  }
}
