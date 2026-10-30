import { createServer } from 'node:http';

export function createCsmHttpServer(handle) {
  return createServer(async (incoming, outgoing) => {
    try {
      const request = new Request(`http://localhost${incoming.url}`, {
        method: incoming.method,
        headers: incoming.headers,
      });
      const response = await handle(request);
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      outgoing.end(await response.text());
    } catch {
      outgoing.writeHead(503, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      outgoing.end('{"error":"Service unavailable"}');
    }
  });
}
