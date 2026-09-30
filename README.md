# Project Auth API

Authentication and authorization service for a multi-tenant SaaS platform.

The goal is to provide a reusable foundation for the SaaS: authentication, authorization, tenant management, user management, and eventually tenant-specific business databases and services.

---

## Current Status

The project currently provides:

* JWT authentication
* Password hashing with Argon2
* Multi-tenant company model
* User management
* Role-based authorization
* Permission-based access control
* Platform-level and company-level roles
* Tenant isolation for company users
* Separate public UUIDs and internal database keys
* PostgreSQL persistence through Prisma
* Docker-based local PostgreSQL environment

The project is still in development and is **not production-ready**.

---

# Architecture

The initial architecture separates authentication/authorization data from business data.

```text
                    ┌─────────────────────┐
                    │      Frontend       │
                    │   Web / Mobile      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     Auth API        │
                    │      NestJS         │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┴─────────────────┐
             │                                   │
             ▼                                   ▼
      ┌───────────────┐                  ┌────────────────┐
      │   Auth DB     │                  │ Business DB(s) │
      │  PostgreSQL   │                  │ PostgreSQL     │
      │               │                  │                │
      │ Companies     │                  │ Company 1      │
      │ Users         │                  │ Company 2      │
      │ Roles         │                  │ Company 3      │
      │ Permissions   │                  │ ...            │
      └───────────────┘                  └────────────────┘
```

The Auth DB contains platform and identity information.

Each company will eventually have its own business database.

This keeps authentication/authorization concerns separate from the actual business domain.

---

# Technology Stack

* Node.js 24
* NestJS 12
* TypeScript
* PostgreSQL 17
* Prisma 7
* Docker / Docker Compose
* JWT
* Passport
* Argon2
* class-validator
* AWS services planned for production

---

# Authentication

Authentication is handled by the Auth API.

## Login

```http
POST /auth/login
```

The API:

1. Finds the user.
2. Verifies the password using Argon2.
3. Generates a JWT.
4. Returns the access token.

Example response:

```json
{
  "accessToken": "..."
}
```

The JWT currently contains:

```json
{
  "userKey": "...",
  "companyKey": 3,
  "iat": 1234567890,
  "exp": 1234654290
}
```

Tokens currently expire after **24 hours**.

Roles and permissions are intentionally **not stored in the JWT**.

This means role/permission changes take effect immediately without waiting for an existing token to expire.

---

# Authorization

Authorization uses:

```text
User
  │
  ▼
UserRole
  │
  ▼
Role
  │
  ▼
RolePermission
  │
  ▼
Permission
```

Permissions represent capabilities such as:

```text
COMPANY_VIEW
COMPANY_EDIT
COMPANY_CREATE

USER_VIEW
USER_CREATE
USER_EDIT
USER_DISABLE
USER_ROLE_EDIT

WORKFLOW_VIEW
WORKFLOW_EDIT
```

Endpoints declare the permission they require.

Example:

```ts
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermission('USER_CREATE')
```

The permission guard checks the user's current roles and permissions directly in the database.

---

# Roles

The system supports both global and company-scoped roles.

## Platform role

```text
PLATFORM_ADMIN
```

A global role.

Its `companyKey` is `NULL`.

Platform administrators can manage platform-level resources and companies.

## Company roles

```text
COMPANY_ADMIN
USER
```

These belong to a specific company.

For example:

```text
Company 3
 ├── COMPANY_ADMIN
 └── USER

Company 4
 ├── COMPANY_ADMIN
 └── USER
```

A company administrator cannot see or assign the global `PLATFORM_ADMIN` role.

The restriction is enforced by the API, not just the frontend.

---

# Multi-Tenancy

A user normally belongs to one company.

```text
User
 └── companyKey → Company
```

Platform users can have:

```text
companyKey = NULL
```

This allows platform-level users to operate across companies.

Company users are restricted to their own company.

For example:

```text
Company A user
    │
    ├── Can access Company A
    │
    └── Cannot access Company B
```

Tenant isolation is enforced inside the service layer.

---

# Database Model

The current authorization database contains:

```text
Company
User
Role
Permission
UserRole
RolePermission
```

Simplified relationship:

```text
Company
   │
   ├── Users
   │
   └── Roles
          │
          └── RolePermissions
                    │
                    └── Permissions

User
   │
   └── UserRoles
             │
             └── Roles
```

## Company identifiers

Companies have two identifiers:

```text
companyKey
```

Internal database key.

```text
companyUuid
```

Public identifier.

The business database name will use the public UUID:

```text
company_<companyUuid>
```

This avoids exposing sequential internal database identifiers as the public company identity.

---

# User Management

The current API supports:

### Create user

```http
POST /users
```

Creates a user inside a company.

New users are initially assigned the company `USER` role.

Passwords are stored as Argon2 hashes and are never returned by the API.

---

### List users

```http
GET /users
```

Platform administrators can see users across the platform.

Company users can only see users belonging to their company.

---

### View user

```http
GET /users/:userKey
```

Returns information about a specific user while enforcing tenant isolation.

---

### Update user

```http
PATCH /users/:userKey
```

Currently allows administrative changes such as:

* Email
* User status

This requires:

```text
USER_EDIT
```

---

### Disable user

```http
PATCH /users/:userKey/disable
```

Disables a user without deleting their record.

This requires:

```text
USER_DISABLE
```

Keeping the record preserves historical relationships and auditability.

---

# Role Management

### View available roles

```http
GET /users/roles
```

Platform administrators can see all roles.

Company administrators only see roles belonging to their own company.

Therefore, company administrators cannot even see:

```text
PLATFORM_ADMIN
```

---

### View user's roles

```http
GET /users/:userKey/roles
```

Returns the roles currently assigned to a user.

Tenant isolation is enforced.

---

### Assign role

```http
POST /users/:userKey/roles
```

Example:

```json
{
  "roleKey": 5
}
```

Requires:

```text
USER_ROLE_EDIT
```

A company administrator can assign company-scoped roles to users in their company, including:

```text
USER
COMPANY_ADMIN
```

A company administrator cannot assign:

```text
PLATFORM_ADMIN
```

Platform administrators can assign any role.

---

# Company Management

Current endpoint:

```http
GET /companies
```

Platform administrators can see all companies.

Company users only see their own company.

Company creation:

```http
POST /companies/createCompany
```

Currently restricted to users with:

```text
COMPANY_CREATE
```

Creating a company also creates the initial company roles and permissions needed by the tenant.

---

# Local Development

PostgreSQL runs through Docker Compose.

```text
PostgreSQL 17
    │
    └── auth_db
```

Connection:

```text
postgresql://auth_api:auth_api_dev@localhost:5432/auth_db
```

Start the database:

```bash
docker compose up -d
```

Run Prisma migrations/generation as required:

```bash
npx prisma generate
```

Run the application:

```bash
npm run start:dev
```

---

# Project Structure

Current structure:

```text
src/
├── auth/
│   ├── decorators/
│   ├── guards/
│   ├── interfaces/
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── jwt-auth.guard.ts
│   └── jwt.strategy.ts
│
├── company/
│   ├── dto/
│   ├── company.controller.ts
│   ├── company.module.ts
│   └── company.service.ts
│
├── user/
│   ├── dto/
│   ├── user.controller.ts
│   ├── user.module.ts
│   └── user.service.ts
│
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
│
├── generated/
│   └── Prisma client
│
├── app.module.ts
└── main.ts

prisma/
├── schema.prisma
└── seed.ts
```

---

# Security Principles

The project is being built around a few principles:

### Authentication ≠ authorization

Authentication answers:

> Who are you?

Authorization answers:

> What are you allowed to do?

---

### Permissions are data-driven

Business permissions are stored in the database instead of being hardcoded throughout the application.

This allows new roles and permission combinations to be created without changing authorization logic.

---

### Tenant isolation is server-side

The frontend should never be trusted to determine which company a user can access.

Every relevant service verifies the user's company scope.

---

### Passwords never leave the Auth API

Only password hashes are stored.

Passwords are never included in normal API responses.

---

### Roles are not trusted from the client

The client sends a requested role, but the API verifies whether the current user is allowed to assign that role.

---

# Roadmap

## Phase 0 — Foundation

**Status: Complete**

* NestJS project
* TypeScript
* PostgreSQL
* Docker
* Prisma
* Environment configuration
* Basic project structure

---

## Phase 1 — Authentication & Authorization

**Status: Mostly complete**

* [x] User authentication
* [x] Password hashing
* [x] JWT
* [x] JWT guard
* [x] Permission guard
* [x] Permission decorator
* [x] Roles
* [x] Permissions
* [x] Company-scoped authorization
* [x] Platform administrator
* [ ] Automated unit tests
* [ ] Authentication edge cases
* [ ] Production security hardening

---

## Phase 2 — User Management

**Status: In progress**

* [x] Create users
* [x] List users
* [x] View user
* [x] Update user
* [x] Disable user
* [x] View available roles
* [x] View user's roles
* [x] Assign roles
* [ ] Remove roles
* [ ] Email verification
* [ ] Password reset
* [ ] Self-service account management
* [ ] Automated tests

---

## Phase 3 — Company Management

**Next major area**

Planned:

* Company CRUD
* Company status management
* Company settings
* Company administrator management
* Company provisioning workflow
* Database provisioning
* Database lifecycle management

---

## Phase 4 — Tenant Business Databases

Each company will eventually receive its own business database.

Example:

```text
Auth DB
 │
 ├── Company A
 │      └── company_a_database
 │
 ├── Company B
 │      └── company_b_database
 │
 └── Company C
        └── company_c_database
```

Planned:

* Database creation
* Database credentials
* Tenant connection management
* Provisioning automation
* Migration management
* Failure/retry handling
* Tenant database lifecycle

---

## Phase 5 — First Business Module

The first real business functionality will be implemented here.

The exact domain is still to be defined.

Expected architecture:

```text
Frontend
   │
   ▼
API Gateway / Backend
   │
   ├── Auth
   ├── Company
   ├── User
   └── Business Service
             │
             ▼
        Tenant DB
```

The business domain should remain independent from authentication logic.

---

## Phase 6 — Files

Planned AWS S3 integration for:

* Company files
* User uploads
* Business documents
* Attachments
* Generated files

The API will control authorization while S3 handles object storage.

---

## Phase 7 — Web Frontend

Planned:

* Login
* Company dashboard
* User management
* Role management
* Business workflows
* File management
* Administration

AWS Amplify is currently the preferred direction for hosting the web frontend because of the low operational overhead.

---

## Phase 8 — Production Infrastructure

Planned AWS infrastructure:

```text
                    ┌───────────────┐
                    │   Frontend    │
                    │    Amplify    │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │    Backend    │
                    │    Services   │
                    └───────┬───────┘
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
          Auth DB       Tenant DBs         S3
```

Infrastructure will prioritize:

* Low operational overhead
* Low baseline cost
* Scalability
* Security
* Automated deployments

---

## Phase 9 — Billing

Planned SaaS billing model.

The initial business model is expected to be based on usage, potentially using the number of opened production/service orders (`OP`) as a pricing metric.

Example concept:

```text
Customer
30 OP/month
     │
     ▼
SaaS subscription / usage price
```

Infrastructure costs will be tracked against usage to understand the actual margin per customer.

---

## Phase 10 — SaaS Operations

Planned:

* Monitoring
* Logging
* Alerts
* Backups
* Database migrations
* Error handling
* Customer administration
* Usage metrics
* Cost monitoring
* Security hardening

---

## Phase 11 — Mobile

A mobile application can be added once the backend and web application are stable.

The backend APIs should be designed so that:

```text
Web
 │
 ├──────────┐
 │          │
 ▼          ▼
API      Mobile
 │
 ▼
Business Services
```

Both clients use the same backend authorization model.

---

# MVP Definition

The first meaningful SaaS milestone is a customer being able to use the system end-to-end.

```text
Authentication
      ↓
Authorization
      ↓
Company
      ↓
Users
      ↓
Tenant Provisioning
      ↓
Core Business Workflow
      ↓
Files
      ↓
Web UI
      ↓
Production Deployment
      ↓
Billing
```

The objective is not to build every possible feature before launch.

The objective is to establish a solid multi-tenant foundation and then deliver the smallest useful business workflow that a real customer can pay for.

---

# Development Philosophy

The project favors:

* Simple architecture
* Clear service boundaries
* Low operational overhead
* Data-driven authorization
* Server-side tenant isolation
* Incremental development
* Automated testing as functionality stabilizes
* AWS managed services where they reduce maintenance
* Avoiding premature complexity

The architecture should be capable of growing into multiple services without requiring a complete rewrite, while keeping the initial system understandable and inexpensive to operate.
