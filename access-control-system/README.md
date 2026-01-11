# Access Control System

A **production-grade authorization platform** built with NestJS that implements RBAC (Role-Based Access Control), ABAC (Attribute-Based Access Control), multi-tenancy, and comprehensive audit logging.

**[Live Demo](https://access-control-api.onrender.com)** | **[API Documentation](https://access-control-api.onrender.com/api/docs)**

---

## Overview

This system solves the fundamental question every enterprise application needs to answer:

> *"Is user X allowed to perform action Y on resource Z, given context C?"*

Built to demonstrate real-world authorization patterns used by companies like Auth0, Okta, and AWS IAM.

---

## Key Features

### Authentication & Security
- JWT-based authentication with bcrypt password hashing
- Rate limiting (100 req/min global, 5/min for login, 3/min for registration)
- Input validation and sanitization
- CORS configuration for production

### Role-Based Access Control (RBAC)
- Create granular permissions using `resource:action` format
- Group permissions into reusable roles
- Assign multiple roles to users
- Organization-scoped role assignments

### Attribute-Based Access Control (ABAC)
- Context-aware policy evaluation
- Support for conditions like:
  - Amount limits (`amountLimit: 10000`)
  - Time restrictions (`timeRestriction: "business_hours"`)
  - Resource ownership (`resourceOwnerOnly: true`)
  - Department-based access (`allowedDepartments: ["finance"]`)

### Multi-Tenancy
- Organizations as first-class entities
- Users can belong to multiple organizations
- Different roles per organization
- Isolated data and permissions per tenant

### Audit Logging
- Every action recorded with:
  - User ID and email
  - Action performed
  - Resource type and ID
  - Result (success/failure)
  - Timestamp
  - Additional metadata
- Indexed for fast querying
- Immutable for compliance

### Performance
- Redis caching for permission lookups
- Database connection pooling via Prisma
- Health check endpoints for monitoring
- Graceful degradation when Redis unavailable

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | NestJS 11 (Node.js) |
| **Database** | PostgreSQL (via Supabase) |
| **ORM** | Prisma 7 |
| **Cache** | Redis (via Upstash) |
| **Auth** | JWT + Passport.js |
| **Docs** | Swagger/OpenAPI |
| **Deployment** | Render |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (Frontend)                       │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    NestJS API Server                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  Auth   │ │  Roles  │ │ Policies│ │  Audit  │           │
│  │ Module  │ │ Module  │ │ Module  │ │ Module  │           │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │
│       │           │           │           │                 │
│       └───────────┴─────┬─────┴───────────┘                 │
│                         │                                    │
│              ┌──────────┴──────────┐                        │
│              │   Permission Guard   │                        │
│              │   (RBAC + ABAC)      │                        │
│              └──────────────────────┘                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ PostgreSQL│    │  Redis   │    │  Audit   │
    │ (Supabase)│    │(Upstash) │    │   Logs   │
    └──────────┘    └──────────┘    └──────────┘
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create new user account |
| POST | `/auth/login` | Authenticate and get JWT |
| GET | `/auth/me` | Get current user profile |

### Permissions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/permissions` | Create permission (e.g., `invoice:read`) |
| GET | `/permissions` | List all permissions |
| GET | `/permissions/:id` | Get permission by ID |
| DELETE | `/permissions/:id` | Delete permission |

### Roles
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/roles` | Create new role |
| GET | `/roles` | List all roles |
| POST | `/roles/:id/permissions` | Assign permissions to role |
| POST | `/roles/users/:userId/assign` | Assign role to user |
| GET | `/roles/users/:userId/permissions` | Get user's effective permissions |

### Organizations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/organizations` | Create organization |
| GET | `/organizations` | List user's organizations |
| POST | `/organizations/:id/members` | Add member to organization |
| DELETE | `/organizations/:id/members/:userId` | Remove member |

### Policies (ABAC)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/policies` | Create context-aware policy |
| GET | `/policies` | List all policies |
| PATCH | `/policies/:id` | Update policy |
| DELETE | `/policies/:id` | Delete policy |

### Audit & Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/audit-logs` | Query audit logs |
| GET | `/audit-logs/stats` | Get audit statistics |
| GET | `/health` | System health check |
| GET | `/health/db` | Database connectivity |
| GET | `/health/redis` | Redis connectivity |

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (or use Supabase)
- Redis (or use Upstash)

### Local Development

```bash
# Clone the repository
git clone https://github.com/MMH576/Event-Processing-Platform.git
cd Event-Processing-Platform/access-control-system

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database and Redis credentials

# Run database migrations
npx prisma migrate dev

# Start development server
npm run start:dev
```

### Using Docker

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Run the application
npm run start:dev
```

### Access Points

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Interactive Dashboard |
| http://localhost:3000/api/docs | Swagger API Documentation |
| http://localhost:3000/health | Health Check Endpoint |

---

## Environment Variables

```env
# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT Configuration
JWT_SECRET=your-super-secret-key-minimum-32-characters
JWT_EXPIRES_IN=7d

# Redis (Option 1: URL for Upstash/Production)
REDIS_URL=rediss://default:token@host:6379

# Redis (Option 2: Host/Port for local)
REDIS_HOST=localhost
REDIS_PORT=6379

# Server
PORT=3000
NODE_ENV=development
```

---

## Database Schema

```
┌─────────────────┐     ┌─────────────────┐
│   organizations │     │      users      │
├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │
│ name            │     │ email           │
│ slug            │     │ password        │
│ settings        │     │ fullName        │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
         ┌───────────┴───────────┐
         │ organization_members  │
         ├───────────────────────┤
         │ organizationId        │
         │ userId                │
         │ joinedAt              │
         └───────────────────────┘

┌─────────────────┐     ┌─────────────────┐
│   permissions   │     │      roles      │
├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │
│ resource        │     │ name            │
│ action          │     │ description     │
│ description     │     │ organizationId  │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
         ┌───────────┴───────────┐
         │   role_permissions    │
         ├───────────────────────┤
         │ roleId                │
         │ permissionId          │
         └───────────────────────┘

┌─────────────────┐     ┌─────────────────┐
│    policies     │     │   audit_logs    │
├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │
│ name            │     │ userId          │
│ permissionId    │     │ action          │
│ conditions      │     │ resourceType    │
│ effect          │     │ result          │
│ priority        │     │ timestamp       │
└─────────────────┘     └─────────────────┘
```

---

## Example Usage

### 1. Register a User
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "secret123", "fullName": "Admin User"}'
```

### 2. Create a Permission
```bash
curl -X POST http://localhost:3000/permissions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"resource": "invoice", "action": "approve", "description": "Approve invoices"}'
```

### 3. Create a Role with Permissions
```bash
curl -X POST http://localhost:3000/roles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Finance Manager", "description": "Can manage invoices"}'

curl -X POST http://localhost:3000/roles/ROLE_ID/permissions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"permissionIds": ["PERMISSION_ID_1", "PERMISSION_ID_2"]}'
```

### 4. Create an ABAC Policy
```bash
curl -X POST http://localhost:3000/policies \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Invoice Approval Limit",
    "organizationId": "ORG_ID",
    "permissionId": "PERMISSION_ID",
    "effect": "deny",
    "conditions": {
      "amountLimit": 10000
    }
  }'
```

---

## Deployment

### Render (Recommended)

The project includes a `render.yaml` for easy deployment:

1. Fork this repository
2. Connect to Render
3. Create a new Blueprint
4. Set environment variables:
   - `DATABASE_URL` (Supabase PostgreSQL)
   - `REDIS_URL` (Upstash Redis)
5. Deploy!

### Manual Deployment

```bash
# Build
npm ci --include=dev
npx prisma generate
npx prisma migrate deploy
npm run build

# Start
npm run start:prod
```

---

## Project Structure

```
access-control-system/
├── src/
│   ├── auth/           # Authentication (JWT, login, register)
│   ├── permissions/    # Permission CRUD
│   ├── roles/          # Role management & assignment
│   ├── organizations/  # Multi-tenant support
│   ├── policies/       # ABAC policy engine
│   ├── audit/          # Audit logging
│   ├── health/         # Health checks
│   ├── prisma/         # Database service
│   ├── redis/          # Cache service
│   └── common/         # Shared guards & decorators
├── prisma/
│   ├── schema.prisma   # Database schema
│   └── migrations/     # Database migrations
├── public/
│   └── index.html      # Interactive dashboard
└── test/               # E2E tests
```

---

## Security Considerations

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with configurable expiration
- Rate limiting on all endpoints
- Input validation with class-validator
- SQL injection protection via Prisma
- CORS configuration for production
- No sensitive data in audit logs

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Author

Built by [Mohammed](https://github.com/MMH576) as a demonstration of enterprise-grade authorization patterns.

---

## Acknowledgments

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [Prisma](https://prisma.io/) - Next-generation ORM
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [Upstash](https://upstash.com/) - Serverless Redis
- [Render](https://render.com/) - Cloud application hosting
