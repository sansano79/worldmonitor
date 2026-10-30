# Corporate Sites read API

This source-only service is separate from the public WorldMonitor API. It has no real site data and is not wired into the default Compose stack or nginx. Its two read routes are `GET /csm/api/sites` and `GET /csm/api/sites/:id`.

It requires Node 24, PostgreSQL with migration 001 applied, and a corporate OIDC provider that issues signed JWT access tokens for a dedicated CSM audience. Set these variables through the deployment secret mechanism, never in Git:

| Variable | Purpose |
|---|---|
| `CSM_DATABASE_URL` | PostgreSQL connection string for the private CSM database |
| `CSM_OIDC_ISSUER` | Exact HTTPS issuer value in access tokens |
| `CSM_OIDC_AUDIENCE` | Dedicated audience expected in access tokens |
| `CSM_OIDC_JWKS_URL` | HTTPS JWKS endpoint for that issuer |
| `CSM_PORT` | Optional listening port; defaults to `46124` |
| `CSM_BIND_HOST` | Optional bind address; defaults to `127.0.0.1` |

Run `npm ci --ignore-scripts` in this directory, `npm run migrate`, then `npm start`. The service refuses to start without the required configuration or migrated site table. Migration 001 creates organizations, single-organization memberships, sites and an audit table. No account or site is seeded automatically. A valid bearer must map to a membership before either route reads sites; responses are never cached. A future browser sign-in flow and audit writes are still needed before connecting a CSM panel or importing real sites.

The Dockerfile uses the repository root as its build context (`docker build -f csm/Dockerfile .`). Do not publish its port or start it with real data until HTTPS ingress, OIDC configuration, backups and access checks have been verified in the target deployment.
