const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: HEADERS });
}

export function createSitesHandler({ authenticate, repository }) {
  return async function handle(request) {
    const pathname = new URL(request.url).pathname;
    const detail = /^\/csm\/api\/sites\/([A-Za-z0-9][A-Za-z0-9_-]{0,63})$/.exec(pathname);
    if (pathname !== '/csm/api/sites' && !detail) return json(404, { error: 'Not found' });
    if (request.method !== 'GET') return json(405, { error: 'Method not allowed' });

    let identity;
    try {
      identity = await authenticate(request);
    } catch {
      return json(503, { error: 'Identity unavailable' });
    }
    if (!identity) return json(401, { error: 'Unauthorized' });

    try {
      const membership = await repository.findMembership(identity);
      if (!membership || !['viewer', 'analyst', 'admin'].includes(membership.role)
        || !membership.organizationId) {
        return json(403, { error: 'Forbidden' });
      }
      if (detail) {
        const site = await repository.findSite(membership.organizationId, detail[1]);
        return site ? json(200, { site }) : json(404, { error: 'Not found' });
      }
      const sites = await repository.listSites(membership.organizationId);
      if (!Array.isArray(sites)) throw new TypeError('Invalid site result');
      return json(200, { sites });
    } catch {
      return json(503, { error: 'Storage unavailable' });
    }
  };
}
