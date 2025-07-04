# SAP Service Agent

My take-home challenge solution for SAP.

## Quick Start

```bash
# Start all services (frontend, backend, database, worker) and seed with sample data
npm run prod:up

# Stop all services
npm run prod:down
```


The `npm run prod:up` command will:
- Start PostgreSQL database
- Create tenant databases automatically
- Launch the NestJS backend API on port 3000
- Start the background worker for processing requests
- Launch the Angular frontend on port 4200
- Automatically create and schedule a set of test service-calls for each tenant, with execution times randomly distributed within the next 10 minutes

**Note:** The worker will immediately start sending requests as soon as it starts. All outgoing requests are mocked (except for those to https://jsonplaceholder.typicode.com/posts, which are real; all other URLs return fake data).

Once everything is running, you can access:
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3000/api

Use `npm run prod:down` to stop all services and clean up containers.

After running `npm run prod:up`, two tenants are available by default. The script `scripts/setup-tenant-databases.sh` automatically creates databases for these tenants (this script is also executed inside Docker). The tenant IDs are set via the `TENANT_IDS` environment variable and can be found in `.env.example`.

## Auto-Created Users

The following users are automatically created when you run `npm run prod:up`:

| Username     | Password     | Tenant        |
|--------------|--------------|---------------|
| alpha_user   | password123  | Tenant Alpha  |
| beta_user    | password123  | Tenant Beta   |
| admin_user   | password123  | Tenant Alpha  |

You can use these credentials to log in to the application.

## My Solution Design & Justification

### Multi-Tenant Architecture

To implement multi-tenancy, I considered two main approaches:

1. **Shared database with tenant_id column**: Application-level isolation using a base repository that always includes `tenant_id` in queries. This is simpler to deploy and manage.

2. **Separate databases per tenant**: Complete database isolation where each tenant has its own database instance. This provides stronger data isolation but requires more complex deployment and database management.

After consideration, I decided to go with multiple databases to showcase a large-scale production solution with strong tenant isolation and independent.
### Application Structure

I built the backend using NestJS with shared libraries and separate applications:
- **Shared libs**: `auth`, `service-calls`, `shared` - reusable across apps
- **Separate apps**: API server and background worker - can be deployed independently
- **Tenant parameter**: I pass this explicitly to services instead of request-scoped injection. This keeps services stateless and allows the worker to process any tenant without HTTP context.

### Separate applications for API and Worker

I decided to split the backend into two separate applications instead of having one monolithic backend:

1. **API Server**: Handles HTTP requests, authentication, and immediate responses
2. **Background Worker**: Processes scheduled service calls independently

With this setup I have isolated logic for request handling and API-requests. This way if API Server stops, the worker will continue handling requests. Also, this allows to scale worker for horizontally for different tenants.

### API Requests

- Real requests go to https://jsonplaceholder.typicode.com/posts
- All other URLs are mocked (return fake data)
- Service calls marked as "Execute immediately" will use current time. And worker has the logic that all requests scheduled in the past will be executed.

### Data Relationships

**Favorites limitation**: I couldn't create an actual relationship between users and favorites because favorites table is in tenant-specific DB while users are in the auth DB. In production, I would handle this with a BFF (Backend-for-Frontend) service with its own database.

**Data merging**: I merge favorite + service call data at the frontend level. With a proper BFF, I would handle this differently.

### What I Left Out of Scope

**Intentionally simplified:**
- Unit tests (would require significant time without much demo value)
- DB optimization and indexes
- Tenant list is public and not secured
- Persisting filters/sorting (could use localStorage or URL params)
- WebSocket real-time updates (using polling for simplicity)
- Full accessibility and responsive design
- Tenant registration interface
