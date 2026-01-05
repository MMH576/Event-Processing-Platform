# Access Control System

A production-grade authorization and audit system that manages **who can do what** in a multi-tenant application.

## What It Does

This system answers the critical question every application needs: *"Is user X allowed to perform action Y on resource Z?"*

**Core Capabilities:**
- **RBAC (Role-Based Access Control)** - Assign roles like "Admin" or "Viewer" with specific permissions
- **ABAC (Attribute-Based Access Control)** - Context-aware rules like "approve invoices under $10,000"
- **Multi-Tenant Support** - Users can have different roles in different organizations
- **Audit Logging** - Track every action for security and compliance
- **Redis Caching** - Fast permission lookups for high-performance apps

## Why Use It

| Problem | Solution |
|---------|----------|
| Hard-coded user roles | Dynamic roles with granular permissions |
| No audit trail | Every action logged with user, time, and result |
| Single-tenant only | Organization-scoped access control |
| Slow permission checks | Redis-cached lookups |

## Quick Start

```bash
# 1. Start PostgreSQL & Redis
docker-compose up -d

# 2. Install dependencies
npm install

# 3. Setup database
npx prisma migrate dev

# 4. Run the app
npm run start:dev
```

## Access Points

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Frontend Dashboard |
| http://localhost:3000/api/docs | Swagger API Documentation |
| http://localhost:3000/health | System Health Check |

## Environment Setup

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/access_control
JWT_SECRET=your-secret-key-minimum-32-characters
REDIS_HOST=localhost
REDIS_PORT=6379
```

## API Overview

| Endpoint | Purpose |
|----------|---------|
| `/auth` | Register, login, get profile |
| `/permissions` | Create and manage permissions (e.g., `invoice:read`) |
| `/roles` | Create roles and assign permissions to them |
| `/organizations` | Manage organizations and members |
| `/policies` | ABAC policies with conditions |
| `/audit` | Query action logs |
| `/health` | Database and Redis status |

## How It Works

1. **User registers/logs in** → Gets a JWT token
2. **Admin creates permissions** → e.g., `invoice:read`, `invoice:approve`
3. **Admin creates roles** → e.g., "Accountant" with invoice permissions
4. **Roles assigned to users** → User inherits all role permissions
5. **Optional: Add policies** → Fine-grained rules like time restrictions
6. **Every action is logged** → Full audit trail

## License

MIT
