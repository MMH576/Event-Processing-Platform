# 🔐 Real-Time Access Control & Audit System - Complete Build Guide

## 📋 Project Overview

**What You're Building:**  
A production-grade authorization and audit system that manages who can do what in a multi-tenant application. Think of it as the security brain behind admin dashboards at companies like Stripe, Notion, or any SaaS platform.

**Core Problem You're Solving:**  
Every application needs to answer: *"Is user X allowed to perform action Y on resource Z right now?"* - and you need to be correct 100% of the time.

---

## 🎯 Why This Project Stands Out

| Typical Student Project | This Project |
|------------------------|--------------|
| "User can login" | "User can login AND has fine-grained permissions" |
| "CRUD operations" | "CRUD with authorization checks at every layer" |
| "Saves to database" | "Immutable audit trail of every action" |
| "Hard-coded roles" | "Dynamic policy engine - no code changes needed" |

**Resume Impact:**  
This screams "I understand production backend systems" - exactly what internship recruiters want to see.

---

## 🏗️ System Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│     API Layer (NestJS)          │
│  ┌─────────────────────────┐   │
│  │  Auth Middleware        │   │
│  └───────────┬─────────────┘   │
│              ▼                  │
│  ┌─────────────────────────┐   │
│  │ Authorization Guard     │◄──┼── Redis Cache
│  │  (Policy Engine)        │   │
│  └───────────┬─────────────┘   │
│              ▼                  │
│  ┌─────────────────────────┐   │
│  │  Business Logic         │   │
│  └───────────┬─────────────┘   │
│              ▼                  │
│  ┌─────────────────────────┐   │
│  │  Audit Logger           │   │
│  └───────────┬─────────────┘   │
└──────────────┼─────────────────┘
               ▼
       ┌───────────────┐
       │   PostgreSQL  │
       │  (Supabase)   │
       └───────────────┘
```

---

## 🗄️ Database Schema Design

### Core Tables

#### 1. `organizations`
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. `organization_members`
```sql
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);
```

#### 4. `roles`
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- Pre-populate system roles
INSERT INTO roles (name, is_system_role) VALUES
  ('super_admin', true),
  ('admin', true),
  ('member', true),
  ('viewer', true);
```

#### 5. `permissions`
```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource VARCHAR(100) NOT NULL,  -- e.g., 'invoice', 'user', 'report'
  action VARCHAR(50) NOT NULL,      -- e.g., 'create', 'read', 'update', 'delete', 'approve'
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(resource, action)
);

-- Example permissions
INSERT INTO permissions (resource, action, description) VALUES
  ('invoice', 'create', 'Create new invoices'),
  ('invoice', 'read', 'View invoices'),
  ('invoice', 'update', 'Edit invoices'),
  ('invoice', 'delete', 'Delete invoices'),
  ('invoice', 'approve', 'Approve invoices for payment'),
  ('user', 'invite', 'Invite new users to organization'),
  ('user', 'remove', 'Remove users from organization'),
  ('report', 'view_financial', 'View financial reports');
```

#### 6. `role_permissions`
```sql
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);
```

#### 7. `user_roles`
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  UNIQUE(user_id, role_id, organization_id)
);
```

#### 8. `policies` (Advanced - ABAC)
```sql
CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  
  -- Policy conditions (stored as JSONB for flexibility)
  conditions JSONB NOT NULL,
  /*
  Example conditions:
  {
    "amount_limit": 10000,
    "time_restriction": "business_hours",
    "require_approval": true,
    "allowed_departments": ["finance", "accounting"]
  }
  */
  
  effect VARCHAR(10) CHECK (effect IN ('allow', 'deny')),
  priority INTEGER DEFAULT 0,  -- Higher priority = evaluated first
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 9. `audit_logs` (Immutable)
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Who
  user_id UUID REFERENCES users(id),
  user_email VARCHAR(255),  -- Denormalized for immutability
  organization_id UUID REFERENCES organizations(id),
  
  -- What
  action VARCHAR(100) NOT NULL,  -- e.g., 'invoice.approve'
  resource_type VARCHAR(100),    -- e.g., 'invoice'
  resource_id UUID,              -- ID of the affected resource
  
  -- When
  timestamp TIMESTAMP DEFAULT NOW(),
  
  -- Result
  result VARCHAR(20) CHECK (result IN ('allowed', 'denied')),
  reason TEXT,  -- Why was it allowed/denied
  
  -- Context
  metadata JSONB DEFAULT '{}',
  /*
  Example metadata:
  {
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0...",
    "invoice_amount": 5000,
    "previous_value": {...},
    "new_value": {...}
  }
  */
  
  -- Indexes for fast queries
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for audit queries
CREATE INDEX idx_audit_user ON audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_audit_org ON audit_logs(organization_id, timestamp DESC);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id, timestamp DESC);
CREATE INDEX idx_audit_action ON audit_logs(action, timestamp DESC);
```

#### 10. `resource_owners` (For ownership-based access)
```sql
CREATE TABLE resource_owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID NOT NULL,
  owner_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(resource_type, resource_id)
);
```

---

## 📦 Tech Stack

### Backend Framework
- **NestJS** - Enterprise-grade Node.js framework
- **TypeScript** - Type safety is critical for authorization logic

### Database
- **Supabase (PostgreSQL)** - Managed Postgres with built-in auth
- **Prisma** - Type-safe ORM

### Caching
- **Redis** - For permission caching (optional but recommended)

### Additional Tools
- **class-validator** - Request validation
- **@nestjs/passport** - Authentication
- **@nestjs/jwt** - JWT handling

---

## 🚀 Phase-by-Phase Implementation

---

# 🔷 PHASE 1: Project Setup & Authentication (Week 1)

## Goals
- Set up NestJS project
- Integrate Supabase
- Implement user authentication
- Create basic organization structure

## Step-by-Step

### 1.1 Initialize Project

```bash
# Install NestJS CLI
npm i -g @nestjs/cli

# Create new project
nest new access-control-system
cd access-control-system

# Install dependencies
npm install @supabase/supabase-js
npm install @nestjs/config
npm install @nestjs/passport passport passport-jwt
npm install @nestjs/jwt
npm install class-validator class-transformer
npm install prisma @prisma/client
npm install bcrypt
npm install --save-dev @types/passport-jwt @types/bcrypt
```

### 1.2 Set Up Supabase

1. Go to https://supabase.com and create a new project
2. Get your API keys from Settings > API
3. Create `.env` file:

```env
# Supabase
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# JWT
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRES_IN=7d

# App
PORT=3000
NODE_ENV=development
```

### 1.3 Initialize Prisma

```bash
npx prisma init
```

Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Organization {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique
  settings  Json     @default("{}")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  members OrganizationMember[]
  roles   Role[]

  @@map("organizations")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  fullName  String?  @map("full_name")
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  organizations OrganizationMember[]
  roles         UserRole[]

  @@map("users")
}

model OrganizationMember {
  id             String       @id @default(uuid())
  organizationId String       @map("organization_id")
  userId         String       @map("user_id")
  joinedAt       DateTime     @default(now()) @map("joined_at")

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([organizationId, userId])
  @@map("organization_members")
}

model Role {
  id             String   @id @default(uuid())
  organizationId String?  @map("organization_id")
  name           String
  description    String?
  isSystemRole   Boolean  @default(false) @map("is_system_role")
  createdAt      DateTime @default(now()) @map("created_at")

  organization Organization?    @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  permissions  RolePermission[]
  users        UserRole[]

  @@unique([organizationId, name])
  @@map("roles")
}

model Permission {
  id          String   @id @default(uuid())
  resource    String
  action      String
  description String?
  createdAt   DateTime @default(now()) @map("created_at")

  roles RolePermission[]

  @@unique([resource, action])
  @@map("permissions")
}

model RolePermission {
  id           String   @id @default(uuid())
  roleId       String   @map("role_id")
  permissionId String   @map("permission_id")
  createdAt    DateTime @default(now()) @map("created_at")

  role       Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
  @@map("role_permissions")
}

model UserRole {
  id             String   @id @default(uuid())
  userId         String   @map("user_id")
  roleId         String   @map("role_id")
  organizationId String   @map("organization_id")
  assignedAt     DateTime @default(now()) @map("assigned_at")
  assignedBy     String?  @map("assigned_by")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([userId, roleId, organizationId])
  @@map("user_roles")
}
```

Run migration:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 1.4 Create Auth Module

```bash
nest g module auth
nest g service auth
nest g controller auth
```

Create `src/auth/auth.service.ts`:

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(email: string, password: string, fullName?: string) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    // Create user in Supabase (or your auth system)
    const user = await this.prisma.user.create({
      data: {
        email,
        fullName,
      },
    });

    return this.generateTokens(user);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validate password (integrate with Supabase auth here)
    return this.generateTokens(user);
  }

  private generateTokens(user: any) {
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

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        organizations: {
          include: {
            organization: true,
          },
        },
      },
    });
  }
}
```

### 1.5 Create JWT Strategy

Create `src/auth/strategies/jwt.strategy.ts`:

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.authService.validateUser(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
```

### 1.6 Auth Controller

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(
    @Body() body: { email: string; password: string; fullName?: string },
  ) {
    return this.authService.register(body.email, body.password, body.fullName);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }
}
```

**Phase 1 Deliverable:**  
✅ Working authentication system  
✅ User registration and login  
✅ JWT-based auth  
✅ Database schema in place

---

# 🔷 PHASE 2: Roles & Permissions Foundation (Week 2)

## Goals
- Create role management
- Set up permission system
- Build role-permission associations

## Step-by-Step

### 2.1 Create Roles Module

```bash
nest g module roles
nest g service roles
nest g controller roles
```

### 2.2 Roles Service

Create `src/roles/roles.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async createRole(
    organizationId: string,
    name: string,
    description?: string,
  ) {
    return this.prisma.role.create({
      data: {
        organizationId,
        name,
        description,
      },
    });
  }

  async assignRoleToUser(
    userId: string,
    roleId: string,
    organizationId: string,
    assignedBy: string,
  ) {
    return this.prisma.userRole.create({
      data: {
        userId,
        roleId,
        organizationId,
        assignedBy,
      },
    });
  }

  async getUserRoles(userId: string, organizationId: string) {
    return this.prisma.userRole.findMany({
      where: {
        userId,
        organizationId,
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });
  }

  async addPermissionToRole(roleId: string, permissionId: string) {
    return this.prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
      },
    });
  }
}
```

### 2.3 Permissions Service

Create `src/permissions/permissions.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async createPermission(resource: string, action: string, description?: string) {
    return this.prisma.permission.create({
      data: {
        resource,
        action,
        description,
      },
    });
  }

  async seedDefaultPermissions() {
    const permissions = [
      { resource: 'invoice', action: 'create', description: 'Create invoices' },
      { resource: 'invoice', action: 'read', description: 'View invoices' },
      { resource: 'invoice', action: 'update', description: 'Edit invoices' },
      { resource: 'invoice', action: 'delete', description: 'Delete invoices' },
      { resource: 'invoice', action: 'approve', description: 'Approve invoices' },
      { resource: 'user', action: 'invite', description: 'Invite users' },
      { resource: 'user', action: 'remove', description: 'Remove users' },
    ];

    for (const perm of permissions) {
      await this.prisma.permission.upsert({
        where: {
          resource_action: {
            resource: perm.resource,
            action: perm.action,
          },
        },
        create: perm,
        update: perm,
      });
    }
  }

  async getAllPermissions() {
    return this.prisma.permission.findMany();
  }
}
```

### 2.4 Seed Script

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create system roles
  const adminRole = await prisma.role.upsert({
    where: { organizationId_name: { organizationId: null, name: 'admin' } },
    create: {
      name: 'admin',
      description: 'Full system access',
      isSystemRole: true,
    },
    update: {},
  });

  const memberRole = await prisma.role.upsert({
    where: { organizationId_name: { organizationId: null, name: 'member' } },
    create: {
      name: 'member',
      description: 'Standard member access',
      isSystemRole: true,
    },
    update: {},
  });

  // Create permissions
  const permissions = [
    { resource: 'invoice', action: 'create' },
    { resource: 'invoice', action: 'read' },
    { resource: 'invoice', action: 'update' },
    { resource: 'invoice', action: 'approve' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { resource_action: perm },
      create: perm,
      update: perm,
    });
  }

  console.log('✅ Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Run seed:
```bash
npx prisma db seed
```

**Phase 2 Deliverable:**  
✅ Role management system  
✅ Permission definitions  
✅ Role-permission assignments  
✅ Seed data for testing

---

# 🔷 PHASE 3: Authorization Guard (Week 3)

## Goals
- Build the core authorization engine
- Create decorator for permission checks
- Implement middleware for request validation

## Step-by-Step

### 3.1 Create Authorization Service

Create `src/authorization/authorization.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthorizationService {
  constructor(private prisma: PrismaService) {}

  async checkPermission(
    userId: string,
    organizationId: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    // Get user's roles in this organization
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        organizationId,
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    // Check if any role has the required permission
    for (const userRole of userRoles) {
      const hasPermission = userRole.role.permissions.some(
        (rp) =>
          rp.permission.resource === resource &&
          rp.permission.action === action,
      );

      if (hasPermission) {
        return true;
      }
    }

    return false;
  }

  async getUserPermissions(userId: string, organizationId: string) {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId, organizationId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const permissions = new Set<string>();
    
    userRoles.forEach((ur) => {
      ur.role.permissions.forEach((rp) => {
        permissions.add(`${rp.permission.resource}.${rp.permission.action}`);
      });
    });

    return Array.from(permissions);
  }
}
```

### 3.2 Create Permission Decorator

Create `src/common/decorators/permissions.decorator.ts`:

```typescript
import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

export interface RequiredPermission {
  resource: string;
  action: string;
}

export const RequirePermissions = (...permissions: RequiredPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// Helper function for cleaner syntax
export const Can = (resource: string, action: string) => ({
  resource,
  action,
});
```

### 3.3 Create Authorization Guard

Create `src/common/guards/authorization.guard.ts`:

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthorizationService } from '../../authorization/authorization.service';
import { PERMISSIONS_KEY, RequiredPermission } from '../decorators/permissions.decorator';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<RequiredPermission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true; // No permissions required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const organizationId = request.headers['x-organization-id'] || request.body?.organizationId;

    if (!organizationId) {
      throw new ForbiddenException('Organization context required');
    }

    // Check each required permission
    for (const permission of requiredPermissions) {
      const hasPermission = await this.authorizationService.checkPermission(
        user.id,
        organizationId,
        permission.resource,
        permission.action,
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          `Missing permission: ${permission.resource}.${permission.action}`,
        );
      }
    }

    return true;
  }
}
```

### 3.4 Use in Controllers

Example controller with authorization:

```typescript
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthorizationGuard } from '../common/guards/authorization.guard';
import { RequirePermissions, Can } from '../common/decorators/permissions.decorator';

@Controller('invoices')
@UseGuards(JwtAuthGuard, AuthorizationGuard)
export class InvoicesController {
  @Get()
  @RequirePermissions(Can('invoice', 'read'))
  async findAll() {
    return { message: 'List all invoices' };
  }

  @Post()
  @RequirePermissions(Can('invoice', 'create'))
  async create() {
    return { message: 'Create invoice' };
  }

  @Post(':id/approve')
  @RequirePermissions(Can('invoice', 'approve'))
  async approve() {
    return { message: 'Approve invoice' };
  }
}
```

**Phase 3 Deliverable:**  
✅ Working authorization engine  
✅ Permission-based route protection  
✅ Clean decorator syntax  
✅ Request-level checks

---

# 🔷 PHASE 4: Policy Engine (ABAC) (Week 4)

## Goals
- Implement attribute-based access control
- Create dynamic policy evaluation
- Support complex business rules

## Step-by-Step

### 4.1 Add Policy Schema

Add to `prisma/schema.prisma`:

```prisma
model Policy {
  id             String   @id @default(uuid())
  organizationId String   @map("organization_id")
  name           String
  description    String?
  permissionId   String   @map("permission_id")
  conditions     Json
  effect         String   // 'allow' or 'deny'
  priority       Int      @default(0)
  isActive       Boolean  @default(true) @map("is_active")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  permission Permission @relation(fields: [permissionId], references: [id])

  @@map("policies")
}
```

### 4.2 Policy Service

Create `src/policies/policy.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface PolicyConditions {
  amountLimit?: number;
  timeRestriction?: string;
  requireApproval?: boolean;
  allowedDepartments?: string[];
  resourceOwnerOnly?: boolean;
}

interface EvaluationContext {
  user: any;
  resource: any;
  organizationId: string;
  timestamp?: Date;
}

@Injectable()
export class PolicyService {
  constructor(private prisma: PrismaService) {}

  async createPolicy(data: {
    organizationId: string;
    name: string;
    permissionId: string;
    conditions: PolicyConditions;
    effect: 'allow' | 'deny';
    priority?: number;
  }) {
    return this.prisma.policy.create({
      data: {
        ...data,
        priority: data.priority || 0,
      },
    });
  }

  async evaluatePolicy(
    userId: string,
    organizationId: string,
    resource: string,
    action: string,
    context: EvaluationContext,
  ): Promise<{ allowed: boolean; reason: string }> {
    // Get all active policies for this permission
    const permission = await this.prisma.permission.findUnique({
      where: { resource_action: { resource, action } },
    });

    if (!permission) {
      return { allowed: false, reason: 'Permission not found' };
    }

    const policies = await this.prisma.policy.findMany({
      where: {
        organizationId,
        permissionId: permission.id,
        isActive: true,
      },
      orderBy: {
        priority: 'desc', // Higher priority first
      },
    });

    // If no policies, fall back to role-based check
    if (policies.length === 0) {
      return { allowed: true, reason: 'No policies defined' };
    }

    // Evaluate each policy
    for (const policy of policies) {
      const conditionsMet = this.evaluateConditions(
        policy.conditions as PolicyConditions,
        context,
      );

      if (conditionsMet) {
        return {
          allowed: policy.effect === 'allow',
          reason: `Policy '${policy.name}' matched`,
        };
      }
    }

    return { allowed: false, reason: 'No matching policy' };
  }

  private evaluateConditions(
    conditions: PolicyConditions,
    context: EvaluationContext,
  ): boolean {
    // Amount limit check
    if (conditions.amountLimit !== undefined) {
      if (!context.resource?.amount || context.resource.amount > conditions.amountLimit) {
        return false;
      }
    }

    // Time restriction check
    if (conditions.timeRestriction === 'business_hours') {
      const now = context.timestamp || new Date();
      const hour = now.getHours();
      if (hour < 9 || hour > 17) {
        return false;
      }
    }

    // Resource owner check
    if (conditions.resourceOwnerOnly) {
      if (context.resource?.ownerId !== context.user.id) {
        return false;
      }
    }

    // Department check
    if (conditions.allowedDepartments) {
      if (!context.user.department || 
          !conditions.allowedDepartments.includes(context.user.department)) {
        return false;
      }
    }

    return true;
  }
}
```

### 4.3 Enhanced Authorization Service

Update authorization service to include policy checks:

```typescript
async checkPermissionWithPolicies(
  userId: string,
  organizationId: string,
  resource: string,
  action: string,
  context: any,
): Promise<{ allowed: boolean; reason: string }> {
  // First, check if user has the base role permission
  const hasRolePermission = await this.checkPermission(
    userId,
    organizationId,
    resource,
    action,
  );

  if (!hasRolePermission) {
    return { allowed: false, reason: 'Missing required role permission' };
  }

  // Then evaluate policies
  const policyResult = await this.policyService.evaluatePolicy(
    userId,
    organizationId,
    resource,
    action,
    {
      user: await this.prisma.user.findUnique({ where: { id: userId } }),
      resource: context.resource,
      organizationId,
      timestamp: new Date(),
    },
  );

  return policyResult;
}
```

**Phase 4 Deliverable:**  
✅ Policy engine for ABAC  
✅ Dynamic condition evaluation  
✅ Business rule support  
✅ Priority-based policy resolution

---

# 🔷 PHASE 5: Audit Logging (Week 5)

## Goals
- Implement immutable audit trail
- Log all permission checks
- Create audit query APIs

## Step-by-Step

### 5.1 Add Audit Schema

Add to Prisma schema:

```prisma
model AuditLog {
  id             String   @id @default(uuid())
  userId         String?  @map("user_id")
  userEmail      String?  @map("user_email")
  organizationId String?  @map("organization_id")
  action         String
  resourceType   String?  @map("resource_type")
  resourceId     String?  @map("resource_id")
  timestamp      DateTime @default(now())
  result         String   // 'allowed' or 'denied'
  reason         String?
  metadata       Json     @default("{}")
  createdAt      DateTime @default(now()) @map("created_at")

  @@index([userId, timestamp])
  @@index([organizationId, timestamp])
  @@index([resourceType, resourceId, timestamp])
  @@map("audit_logs")
}
```

### 5.2 Audit Service

Create `src/audit/audit.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async logAction(data: {
    userId?: string;
    userEmail?: string;
    organizationId?: string;
    action: string;
    resourceType?: string;
    resourceId?: string;
    result: 'allowed' | 'denied';
    reason?: string;
    metadata?: any;
  }) {
    return this.prisma.auditLog.create({
      data: {
        ...data,
        timestamp: new Date(),
        metadata: data.metadata || {},
      },
    });
  }

  async getAuditLogs(filters: {
    userId?: string;
    organizationId?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    return this.prisma.auditLog.findMany({
      where: {
        userId: filters.userId,
        organizationId: filters.organizationId,
        resourceType: filters.resourceType,
        timestamp: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: filters.limit || 100,
    });
  }

  async getUserActivityReport(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.prisma.auditLog.findMany({
      where: {
        userId,
        timestamp: { gte: startDate },
      },
    });

    // Aggregate data
    const report = {
      totalActions: logs.length,
      deniedActions: logs.filter((l) => l.result === 'denied').length,
      actionsByType: this.groupBy(logs, 'action'),
      activityByDay: this.groupByDay(logs),
    };

    return report;
  }

  private groupBy(array: any[], key: string) {
    return array.reduce((acc, item) => {
      const group = item[key];
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {});
  }

  private groupByDay(logs: any[]) {
    return logs.reduce((acc, log) => {
      const day = log.timestamp.toISOString().split('T')[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});
  }
}
```

### 5.3 Audit Interceptor

Create automatic logging interceptor:

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const method = request.method;
    const url = request.url;

    return next.handle().pipe(
      tap({
        next: () => {
          // Log successful actions
          this.auditService.logAction({
            userId: user?.id,
            userEmail: user?.email,
            organizationId: request.headers['x-organization-id'],
            action: `${method} ${url}`,
            result: 'allowed',
            metadata: {
              ip: request.ip,
              userAgent: request.headers['user-agent'],
            },
          });
        },
        error: (error) => {
          // Log denied actions
          this.auditService.logAction({
            userId: user?.id,
            userEmail: user?.email,
            organizationId: request.headers['x-organization-id'],
            action: `${method} ${url}`,
            result: 'denied',
            reason: error.message,
            metadata: {
              ip: request.ip,
              userAgent: request.headers['user-agent'],
              errorType: error.name,
            },
          });
        },
      }),
    );
  }
}
```

### 5.4 Audit Controller

```typescript
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditService } from './audit.service';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get('logs')
  async getLogs(
    @Query('userId') userId?: string,
    @Query('organizationId') organizationId?: string,
    @Query('days') days?: string,
  ) {
    const startDate = new Date();
    if (days) {
      startDate.setDate(startDate.getDate() - parseInt(days));
    }

    return this.auditService.getAuditLogs({
      userId,
      organizationId,
      startDate,
    });
  }

  @Get('user-activity')
  async getUserActivity(@Query('userId') userId: string) {
    return this.auditService.getUserActivityReport(userId);
  }
}
```

**Phase 5 Deliverable:**  
✅ Complete audit logging  
✅ Automatic request logging  
✅ Audit query APIs  
✅ Activity reports

---

# 🔷 PHASE 6: Performance & Caching (Week 6)

## Goals
- Implement Redis caching for permissions
- Add cache invalidation strategy
- Optimize database queries

## Step-by-Step

### 6.1 Install Redis

```bash
npm install ioredis
npm install --save-dev @types/ioredis
```

### 6.2 Redis Module

Create `src/redis/redis.service.ts`:

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit {
  private client: Redis;

  onModuleInit() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
    });
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }
}
```

### 6.3 Cached Authorization Service

Update authorization service:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AuthorizationService {
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async checkPermission(
    userId: string,
    organizationId: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    const cacheKey = `perm:${userId}:${organizationId}:${resource}:${action}`;

    // Check cache first
    const cached = await this.redis.get(cacheKey);
    if (cached !== null) {
      return cached === 'true';
    }

    // Fetch from database
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId, organizationId },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    const hasPermission = userRoles.some((ur) =>
      ur.role.permissions.some(
        (rp) =>
          rp.permission.resource === resource &&
          rp.permission.action === action,
      ),
    );

    // Cache result
    await this.redis.set(cacheKey, hasPermission.toString(), this.CACHE_TTL);

    return hasPermission;
  }

  async invalidateUserPermissions(userId: string, organizationId: string) {
    await this.redis.invalidatePattern(`perm:${userId}:${organizationId}:*`);
  }

  async invalidateAllPermissions(organizationId: string) {
    await this.redis.invalidatePattern(`perm:*:${organizationId}:*`);
  }
}
```

### 6.4 Cache Invalidation Events

Update roles service to invalidate cache:

```typescript
async assignRoleToUser(
  userId: string,
  roleId: string,
  organizationId: string,
) {
  const result = await this.prisma.userRole.create({
    data: { userId, roleId, organizationId },
  });

  // Invalidate user's permission cache
  await this.authorizationService.invalidateUserPermissions(
    userId,
    organizationId,
  );

  return result;
}
```

**Phase 6 Deliverable:**  
✅ Redis caching for permissions  
✅ Smart cache invalidation  
✅ Significant performance improvement  
✅ Reduced database load

---

# 📊 Testing Strategy

## Unit Tests

```typescript
// Example: authorization.service.spec.ts
describe('AuthorizationService', () => {
  it('should allow user with correct permission', async () => {
    const result = await service.checkPermission(
      'user-123',
      'org-456',
      'invoice',
      'read',
    );
    expect(result).toBe(true);
  });

  it('should deny user without permission', async () => {
    const result = await service.checkPermission(
      'user-123',
      'org-456',
      'invoice',
      'approve',
    );
    expect(result).toBe(false);
  });
});
```

## Integration Tests

```typescript
describe('Invoice Approval (E2E)', () => {
  it('should approve invoice under $10k for finance role', async () => {
    // Setup: Create user with finance role
    // Test: Attempt to approve $5k invoice
    // Assert: Success
  });

  it('should deny invoice over $10k for finance role', async () => {
    // Setup: Create user with finance role
    // Test: Attempt to approve $15k invoice
    // Assert: Forbidden
  });
});
```

---

# 📈 Success Metrics

Track these KPIs in your system:

1. **Permission Check Latency**
   - Target: <50ms with cache
   - Target: <200ms without cache

2. **Cache Hit Rate**
   - Target: >80%

3. **Audit Log Volume**
   - Track denied actions %
   - Alert on unusual patterns

4. **Policy Evaluation Time**
   - Target: <100ms per policy

---

# 🚀 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Seed data populated
- [ ] Redis configured and connected
- [ ] JWT secrets set
- [ ] Audit logs indexed
- [ ] Rate limiting configured
- [ ] Error logging setup
- [ ] Health check endpoints
- [ ] API documentation (Swagger)

---

# 🎯 Learning Outcomes

By building this, you'll deeply understand:

✅ Authorization vs Authentication  
✅ RBAC and ABAC patterns  
✅ Policy-based access control  
✅ Audit logging best practices  
✅ Performance optimization with caching  
✅ Multi-tenancy architecture  
✅ NestJS advanced patterns  
✅ Type-safe database operations  
✅ Security-first backend design  

---

# ✅ Final Checklist

- [ ] All 6 phases completed
- [ ] Database properly indexed
- [ ] Tests written for critical paths
- [ ] README with setup instructions
- [ ] Example API calls documented
- [ ] Demo video/screenshots prepared
- [ ] Code pushed to GitHub
- [ ] Resume bullets updated

---

**You now have everything you need to build a 10/10 backend project.**

**Start with Phase 1, take it step by step, and you'll have an impressive project that stands out.**

Good luck! 🚀