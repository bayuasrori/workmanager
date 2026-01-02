# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Development Commands

```bash
# Development
bun run dev                    # Start dev server on 0.0.0.0:5173
bun run build                  # Build for production
bun run preview                # Preview production build

# Code Quality
bun run lint                   # Run ESLint and Prettier checks
bun run format                 # Format code with Prettier
bun run check                  # Type checking with SvelteKit
bun run check:watch            # Type checking in watch mode

# Database Operations
bun run db:push               # Push schema changes to database (dev only)
bun run db:migrate            # Create new migration file
bun run db:studio             # Open Drizzle Studio for data browsing

# Testing
bun run test                  # Run Vitest tests
```

## High-Level Architecture

### Multi-Tenant Work Management System
Papanin is a SvelteKit-based work management application with organization-based multi-tenancy. The core architecture follows:

**Database Schema**: PostgreSQL with Drizzle ORM implementing a multi-tenant model where:
- `user` → `organization` (many-to-many via `organization_member`)
- `organization` → `project` (one-to-many)
- `project` → `task` (one-to-many)
- Each organization is a separate tenant with data isolation

**Authentication Flow**: Session-based using Oslo.js:
- Tokens stored in HTTP-only cookies
- SHA-256 hashed session IDs in database
- 30-day sessions with automatic renewal
- User validation through `hooks.server.ts`

**Service Layer Pattern**: All business logic abstracted into services under `src/lib/server/service/`:
- Consistent CRUD interface across all services
- Cross-service composition (e.g., taskService uses activityService)
- Built-in permission checking and audit logging

### Route Protection Strategy
- Public routes: `/login`, `/public-board/[slug]`
- Protected routes: All under `(protected)` folder require authentication
- Admin routes: Under `(protected)/admin/` require `isAdmin` flag
- Server-side validation in `+page.server.ts` files

### Key Architectural Decisions

**Default Workspace Creation**: New users automatically receive:
- Personal organization (derived from username)
- Default project with basic task statuses
- Organization membership setup

**Activity Tracking**: All task changes are logged to `activity` table for audit trails and feeds.

**Cascade Delete Pattern**: Projects perform cascading deletes in specific order to maintain referential integrity.

**Database Connection**: Uses PostgreSQL via libSQL client with connection pooling through Drizzle ORM.

## Working with Services

When modifying business logic:

1. **Use service layer** - Don't query database directly from routes
2. **Follow service pattern** - Each service exports consistent CRUD methods
3. **Permission checking** - Services handle `isMember()` and authorization
4. **Activity logging** - Task changes should log to activity table
5. **Transaction management** - Use transactions for multi-table operations

Example service usage:
```typescript
import { projectService, taskService } from '$lib/server/service';

// In route server code
const project = await projectService.getById(projectId);
if (!project) throw error(404);
if (!await projectService.isMember(projectId, locals.user.id)) {
  throw error(403);
}
```

## Database Schema Considerations

- **UUID primary keys** for all tables
- **Composite primary keys** for junction tables (`organization_member`, `project_member`)
- **Foreign key constraints** with proper ON DELETE behavior
- **JSONB columns** for flexible metadata (payment credentials, activity metadata)
- **Enums** for constrained values (payment status, membership plans)

## Localization Notes

UI strings are in Indonesian (Bahasa Indonesia). When adding new user-facing text, use Indonesian:
- Error messages in forms
- Default project/status names
- Navigation labels

## Common Development Patterns

**Form Validation**: Server-side validation in `+page.server.ts` using helper functions from login route

**Error Handling**: Consistent error responses using `fail()` for form errors and `throw error()` for HTTP errors

**Type Safety**: Leverage Drizzle's inferred types (`typeof user.$inferSelect`) throughout the codebase

## Environment Setup

Database connection requires `DATABASE_URL` in `.env`:
- Development: Can use file-based database (`file:local.db`)
- Production: PostgreSQL connection string
- The app uses PostgreSQL driver even with libSQL client