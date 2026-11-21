const headers = {
  'Cache-Control': 'no-store',
  'Content-Security-Policy': "frame-ancestors 'none'",
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow',
};

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== '/') return new Response('Tidak ditemukan.', {status: 404, headers});
    if (!['GET', 'HEAD'].includes(request.method)) {
      return new Response('Metode tidak didukung.', {status: 405, headers: {...headers, Allow: 'GET, HEAD'}});
    }
    try {
      const source = await fetch(env.QC_UPSTREAM, {
        method: request.method,
        redirect: 'manual',
        signal: AbortSignal.timeout(8000),
      });
      if (source.ok && source.headers.get('Content-Type')?.startsWith('text/html')) {
        return new Response(source.body, {headers: {...headers, 'Content-Type': 'text/html; charset=utf-8'}});
      }
      await source.body?.cancel();
    } catch (error) {
      console.warn('VectorichQC source request failed:', error.name);
    }
    return new Response('VectorichQC belum bisa dimuat. Muat ulang halaman sebentar lagi.', {status: 502, headers});
  },
};
