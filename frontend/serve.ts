import path from 'node:path';

const port = Number(process.env.PORT ?? 3001);
const distDir = path.join(import.meta.dir, 'dist');

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

Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);

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
