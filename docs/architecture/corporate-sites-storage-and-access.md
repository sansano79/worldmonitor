# Corporate Sites: storage and access boundary

Status: implementation in progress. The first private read API and migration are in `csm/`; no database, identity provider, or deployment is running as a result of these source files.

## Existing boundary

The bundled Docker stack serves the dashboard through nginx and proxies `/api/` to the Node sidecar (`docker-compose.yml`, `docker/nginx.conf`). The sidecar token authenticates that internal transport, not an employee. Docker mode has no Clerk or Convex entitlement backend; its signed `wms_` browser session is anonymous (`SELF_HOSTING.md`, “Self-hosted API authentication”). The `WORLDMONITOR_VALID_KEYS` operator keys authenticate WorldMonitor MCP/REST callers, but carry no Corporate Sites user or organization membership.

Private corporate coordinates, contacts, site status, and derived risk must therefore never enter the existing public bootstrap payload, shared Redis keys, anonymous RPCs, MCP tools, static assets, browser storage, URLs, or client-visible logs. A separate map layer may display SEIDOR's already published office directory with approximate city centers; that public directory is not the private Corporate Sites inventory and must not include CSM criticality, operational status, surveillance radii, contacts, or risks. `shared/corporate-site.mjs` validates a private site record only; it neither stores nor publishes it. Its `countryCode` check validates syntax, not membership in an ISO country registry.

## Decision

Use a dedicated CSM API process and a dedicated PostgreSQL database in the self-hosted Compose deployment. Keep PostgreSQL on the private Compose network, with its own persistent volume, no host port, and credentials supplied outside Git. Redis remains a cache for public-source snapshots; it is not the authority for corporate records. Do not enable PostGIS in the first slice: a bounded application-side distance calculation suffices until measured query volume or spatial requirements warrant it. PostgreSQL provides relational constraints, transactional site updates, membership records, and an audit trail; Convex Cloud would introduce a separate hosted dependency into the self-hosted installation.

The first CSM read API accepts only a signed OIDC bearer token issued for its configured audience. It verifies issuer, audience, signature, expiry, issued-at time, and subject against a configured HTTPS JWKS endpoint. A missing or invalid token is denied; an unavailable verification service fails closed. The future browser interface will use the authorization-code flow with PKCE, state and nonce checks, then an opaque server-side session in Secure, HttpOnly, SameSite cookies over HTTPS. State-changing requests will also require CSRF protection. The provider and claim mapping remain deployment configuration; a specific vendor has not been selected. If no suitable corporate provider exists, identity provisioning is a prerequisite to exposing Corporate Sites.

The API maps the verified subject to an organization membership stored in PostgreSQL. Roles are `viewer` (read), `analyst` (read and assess), and `admin` (manage sites and memberships). Each site belongs to one organization. The organization identifier comes from the authenticated membership, never from a browser-supplied site record. Every query and mutation scopes by organization before returning data. An unknown or foreign site identifier gives the same `404` response. Contacts will use a separate permission-controlled record; they are not part of the current `CorporateSite` contract.

nginx may later proxy `/csm/auth/*` and `/csm/api/*` to this private process, but it must not inject a trusted user header on behalf of arbitrary clients. The CSM process validates the bearer or session itself. Its default bind address is loopback; no CSM service or database port should be published to the LAN in Compose. The existing WorldMonitor dashboard can remain a public-data surface; any CSM panel loads only after CSM authorization and must clear its data on logout. An outer access proxy may restrict the whole dashboard as an additional deployment control, but it is not the API authorization boundary.

All CSM API responses use `Cache-Control: no-store`. Failed identity verification, membership lookup, or database access fails closed; a transient dependency failure is reported as unavailable rather than silently returning an empty authorized result. The first migration prepares an audit table; recording operations in it remains required before mutation or real-site import. Server logs must avoid coordinates, contacts, tokens, and full response bodies. Database backups must be encrypted and restoration tested before real sites are entered.

## First implementation slice

1. Add a private CSM API skeleton with `GET /csm/api/sites` and `GET /csm/api/sites/:id`, and a database migration for organizations, memberships, sites, and audit entries. Add no site data to existing WorldMonitor bootstrap or Redis.
2. Prove with automated requests that anonymous and expired sessions return `401`, valid identities without membership return `403`, foreign site IDs return `404`, and identity or database outages return a non-cacheable error with no site fields.
3. Prove a member sees only sites in their organization and that the response is `no-store`. Use fictitious records only.
4. Before running this slice against the LXC, select and configure the corporate OIDC provider, HTTPS ingress, secret storage, volume backup, and non-conflicting Compose service names and ports. Verify the running image and API behavior separately from local tests. The source includes a dedicated Dockerfile but is not wired into the existing Compose or nginx yet.

No UI marker, geofence, incident verification, alert, or contact endpoint belongs to this slice.
