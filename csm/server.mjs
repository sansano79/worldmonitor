import pg from 'pg';
import { createOidcAuthenticator } from './auth.mjs';
import { createCsmHttpServer } from './http-server.mjs';
import { createSitesHandler } from './sites-handler.mjs';
import { createSitesRepository } from './sites-repository.mjs';

for (const name of ['CSM_DATABASE_URL', 'CSM_OIDC_ISSUER', 'CSM_OIDC_AUDIENCE', 'CSM_OIDC_JWKS_URL']) {
  if (!process.env[name]) throw new Error(`${name} is required`);
}

const port = Number(process.env.CSM_PORT ?? 46124);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid CSM_PORT');

const pool = new pg.Pool({ connectionString: process.env.CSM_DATABASE_URL, max: 10 });
const authenticate = createOidcAuthenticator({
  issuer: process.env.CSM_OIDC_ISSUER,
  audience: process.env.CSM_OIDC_AUDIENCE,
  jwksUrl: process.env.CSM_OIDC_JWKS_URL,
});
try {
  await pool.query('SELECT 1 FROM csm_sites LIMIT 0');
  const handle = createSitesHandler({ authenticate, repository: createSitesRepository(pool) });
  const server = createCsmHttpServer(handle);
  server.once('error', () => {
    process.stderr.write('CSM listener failed\n');
    void pool.end();
    process.exitCode = 1;
  });
  server.listen(port, process.env.CSM_BIND_HOST ?? '127.0.0.1');
  const shutdown = () => server.close(() => void pool.end());
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} catch (error) {
  await pool.end();
  throw error;
}
