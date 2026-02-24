import path from 'node:path';

const port = Number(process.env.PORT ?? 3001);
const distDir = path.join(import.meta.dir, 'dist');
const API_UPSTREAM = process.env.API_UPSTREAM ?? 'http://localhost:8484';

function resolveDistPath(urlPathname: string): string | null {
  let pathname = urlPathname;

  try {
    pathname = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  if (pathname === '/') pathname = '/index.html';
  if (!pathname.startsWith('/')) pathname = `/${pathname}`;

  const normalized = path.posix.normalize(pathname);
  if (normalized.includes('..')) return null;

  return path.join(distDir, normalized);
}

async function proxyToApi(request: Request, url: URL): Promise<Response> {
  const upstream = `${API_UPSTREAM}${url.pathname}${url.search}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const resp = await fetch(upstream, {
      method: request.method,
      headers: request.headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.arrayBuffer() : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return new Response(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers: resp.headers,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return new Response(JSON.stringify({ error: 'api upstream unreachable', detail: message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      return proxyToApi(request, url);
    }

    const filePath = resolveDistPath(url.pathname);
    if (!filePath) return new Response('Bad Request', { status: 400 });

    const file = Bun.file(filePath);
    if (await file.exists()) return new Response(file);

    const accept = request.headers.get('accept') ?? '';
    if (accept.includes('text/html')) {
      const indexFile = Bun.file(path.join(distDir, 'index.html'));
      if (await indexFile.exists()) return new Response(indexFile);
    }

    return new Response('Not Found', { status: 404 });
  },
});
