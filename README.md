# Appointment SaaS API

A production-oriented API starter built with Node.js, TypeScript, Express 5, Prisma, and PostgreSQL. It includes versioned routing, shared HTTP utilities, request validation, structured errors/logging, Docker support, and a GitHub Actions pipeline for Google Cloud Run.

## Requirements

- Node.js 20 or newer (Docker and CI use Node.js 22)
- npm
- Docker Compose for local PostgreSQL

## Local development

```bash
npm ci
cp .env.example .env
docker compose up -d postgres
npm run db:migrate -- --name init
npm run dev
```

The API listens at `http://localhost:4000`. The PostgreSQL Compose service uses local development credentials; do not reuse them outside local development.

### Environment variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `NODE_ENV` | No | `development` | `development`, `test`, or `production` |
| `PORT` | No | `4000` | HTTP port. Cloud Run injects its own port. |
| `LOG_LEVEL` | No | `info` | Pino log level |
| `CORS_ORIGINS` | No | `http://localhost:3000,http://localhost:5173` | Comma-separated allowed browser origins |
| `DATABASE_URL` | No in development; required in production | Local Compose URL | PostgreSQL connection URL. If omitted locally, the Compose URL is used. |
| `DIRECT_URL` | No | Same as `DATABASE_URL` | Direct PostgreSQL URL used by Prisma migrations; useful when runtime uses a transaction pooler. |

`src/config/env.ts` validates configuration during startup and fails fast on invalid values. Keep local secrets in `.env`, which is ignored by git. Development defaults to the local Compose database URL so API endpoints can start without extra configuration; database readiness stays unavailable until PostgreSQL is running. Production requires `DATABASE_URL`, injected from Secret Manager.

For managed PostgreSQL poolers, use the transaction-pool URL as `DATABASE_URL` and a direct/session connection as `DIRECT_URL` when the provider requires it. Do not put real database credentials in `.env.example`.

## API routes and versioning

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/` | Basic service status |
| `GET` | `/api/v1/health/live` | Process liveness |
| `GET` | `/api/v1/health/ready` | Readiness including PostgreSQL |
| `GET` | `/api/health/live` | Legacy liveness URL |
| `GET` | `/api/health/ready` | Legacy readiness URL |

Add new public endpoints under `src/routes/v1.routes.ts` or mount a feature router there. Keep the unversioned health routes for infrastructure probes and compatibility. Introduce a new router (for example `v2.routes.ts`) when a future API version has incompatible behavior.

### Response conventions

Successful feature responses should use `sendSuccess` from `src/lib/api-response.ts`:

```json
{
  "data": {
    "id": "resource-id"
  }
}
```

Errors use a consistent envelope and include the request ID when available:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "path": "email",
        "message": "Invalid email address"
      }
    ],
    "requestId": "request-id"
  }
}
```

Use the shared `HTTP_STATUS` constants and throw `ApiError` for expected application errors. `normalizeApiError` maps validation and common Prisma errors to safe API responses; unexpected failures are logged and returned as generic 500 errors. Do not return database messages or stack traces to clients.

## Code structure

```text
prisma/
  migrations/                # committed, deployable schema migrations
  schema.prisma
src/
  config/                    # validated environment configuration
  lib/                       # shared HTTP utilities, logger, Prisma client
  middleware/                # error handling, not-found, request validation
  modules/
    health/                  # feature routes, controller, service
  routes/
    api.routes.ts            # API route composition
    v1.routes.ts             # version 1 route composition
  app.ts                     # Express middleware and route composition
  server.ts                  # listener, shutdown, process lifecycle
.github/workflows/ci-cd.yml  # CI and Cloud Run deployment
Dockerfile
docker-compose.yml           # local PostgreSQL only
```

### Adding a feature

1. Add `src/modules/<feature>/<feature>.routes.ts`, a controller, service, and schemas as needed.
2. Keep controllers focused on HTTP input/output. Put reusable business rules and database operations in services.
3. Wrap asynchronous controllers in `asyncHandler`; use `validateRequest(schema, "body" | "query" | "params")` before controllers. Validated body data replaces `request.body`; validated query and params are available from `request.validated.query` and `request.validated.params`.
4. Throw `ApiError` for expected failures; let the shared error middleware format them.
5. Mount the feature router in `src/routes/v1.routes.ts`.
6. Add tests for business behavior and request validation.

Example route pattern:

```ts
router.post(
  "/resources",
  validateRequest(createResourceSchema),
  asyncHandler(createResourceController),
);
```

## Database and migrations

Edit `prisma/schema.prisma`, then create and apply a local development migration:

```bash
npm run db:migrate -- --name describe_change
```

Commit the generated `prisma/migrations` files with the schema changes. Production uses:

```bash
npm run db:deploy
```

The GitHub deployment workflow executes `prisma migrate deploy` as a Cloud Run Job before deploying the new service revision. Migrations should be backward-compatible with the currently running revision during rollouts.

Other useful commands:

```bash
npm run db:generate
npm run db:studio
docker compose down
```

The starter data model has users, organizations, and organization memberships. Scope future tenant queries by organization and enforce membership/authorization in the service layer; the starter does not yet include authentication or authorization.

## Docker

Build and run the production image locally:

```bash
docker build -t appointment-saas-api .
docker run --rm --env-file .env -e PORT=4000 -p 4000:4000 appointment-saas-api
```

The image runs as a non-root user. In Cloud Run it listens on the platform-provided port (8080 by default). The liveness and readiness endpoints can be configured as HTTP probes in platforms that support them.

## CI/CD: Google Cloud Run

`.github/workflows/ci-cd.yml` runs on pull requests and pushes to `main`. CI installs from the lockfile, type-checks, runs unit tests, audits dependencies, builds TypeScript, and builds the Docker image. A push to `main` then:

1. Authenticates to Google Cloud using GitHub Workload Identity Federation (no service-account key file).
2. Builds and pushes an immutable SHA-tagged image to Artifact Registry.
3. Executes a Cloud Run migration job.
4. Deploys the service to Cloud Run.

The workflow keeps the Cloud Run service private (`--no-allow-unauthenticated`). Configure an authenticated gateway or explicitly change this policy only after the application has appropriate authentication and authorization.

### Google Cloud prerequisites

Create/configure the following once in Google Cloud:

- An Artifact Registry Docker repository in the target region.
- A Cloud Run service and Cloud Run Job will be created by the workflow.
- A PostgreSQL Cloud SQL instance with a database and user.
- Secret Manager secrets named `DATABASE_URL` and `DIRECT_DATABASE_URL`. The workflow maps these to Prisma's `DATABASE_URL` and `DIRECT_URL`. For Cloud SQL they can contain the same URL; use a direct/session URL for `DIRECT_DATABASE_URL` if your provider requires a separate migration connection. For Cloud SQL, configure Prisma to use the Cloud SQL Unix socket, for example:

  ```text
  postgresql://DB_USER:URL_ENCODED_PASSWORD@localhost:5432/DB_NAME?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
  ```

- A Cloud Run runtime service account with `roles/cloudsql.client` and `roles/secretmanager.secretAccessor`.
- A GitHub deploy service account with the permissions required to push to the repository, deploy Cloud Run services/jobs, and act as the runtime service account.
- A Workload Identity Federation provider and binding that trusts this GitHub repository and allows the deploy service account to be impersonated.

Add these **repository or production-environment variables** in GitHub:

| Variable | Example | Description |
| --- | --- | --- |
| `GCP_PROJECT_ID` | `my-gcp-project` | Google Cloud project ID |
| `GCP_REGION` | `us-central1` | Artifact Registry and Cloud Run region |
| `GCP_ARTIFACT_REGISTRY_REPOSITORY` | `appointment-api` | Existing Artifact Registry repository name |
| `CLOUD_RUN_SERVICE` | `appointment-api` | Cloud Run service name |
| `CLOUD_RUN_RUNTIME_SERVICE_ACCOUNT` | `api-runtime@my-gcp-project.iam.gserviceaccount.com` | Runtime identity for service and migration job |
| `CLOUD_SQL_INSTANCE` | `my-gcp-project:us-central1:appointments-db` | Cloud SQL connection name |
| `CORS_ORIGINS` | `https://app.example.com` | Comma-separated production frontend origins |

Add these **GitHub Actions secrets**:

| Secret | Description |
| --- | --- |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Full Workload Identity Provider resource name |
| `GCP_DEPLOY_SERVICE_ACCOUNT` | Deploy service-account email |

The workflow requires the GitHub `production` environment to exist (or remove `environment: production` from the workflow). Configure environment protection/approvals there if needed. Grant the Cloud Run runtime service account access to both database secrets and the Cloud SQL instance. Grant the GitHub deploy account Artifact Registry Writer, Cloud Run Admin, Secret Manager Viewer (to verify required secrets exist), Service Account User on the runtime account, and the permissions required to use the configured workload identity.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run with TypeScript watch/reload |
| `npm run typecheck` | Type-check without emitting files |
| `npm test` | Run unit tests |
| `npm run build` | Generate Prisma Client and compile TypeScript |
| `npm start` | Run the compiled server |
| `npm run db:migrate -- --name <name>` | Create/apply a development migration |
| `npm run db:deploy` | Apply committed migrations |
| `npm run db:studio` | Open Prisma Studio |
