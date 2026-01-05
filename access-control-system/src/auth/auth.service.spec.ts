/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: jest.Mocked<PrismaService>;
  let auditService: jest.Mocked<AuditService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashedPassword',
    fullName: 'Test User',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
        {
          provide: AuditService,
          useValue: {
            create: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    auditService = module.get(AuditService);

    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: 'test@example.com',
        password: 'password',
      });

      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.user.email).toBe('test@example.com');
      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ result: 'success', action: 'auth:login' }),
      );
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'invalid@example.com', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ result: 'failure' }),
      );
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          result: 'failure',
          reason: 'Invalid credentials - wrong password',
        }),
      );
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.login({ email: 'test@example.com', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          result: 'failure',
          reason: 'User account is deactivated',
        }),
      );
    });
  });

  describe('register', () => {
    it('should create user and return tokens', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const result = await service.register({
        email: 'new@example.com',
        password: 'password123',
        fullName: 'New User',
      });

      expect(result.access_token).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: 'new@example.com',
          password: 'hashedPassword',
          fullName: 'New User',
        },
      });
      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ result: 'success', action: 'auth:register' }),
      );
    });

    it('should throw ConflictException for existing user', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);

      expect(auditService.create).toHaveBeenCalledWith(
        expect.objectContaining({ result: 'failure' }),
      );
    });
  });

  describe('validateUser', () => {
    it('should return user if found and active', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        organizations: [],
      });

      const result = await service.validateUser('user-123');

      expect(result).toBeDefined();
      expect(result?.email).toBe('test@example.com');
    });

    it('should return null if user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('invalid-id');

      expect(result).toBeNull();
    });

    it('should return null if user is inactive', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        isActive: false,
        organizations: [],
      });

      const result = await service.validateUser('user-123');

      expect(result).toBeNull();
    });
  });
});
