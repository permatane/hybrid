const RIVIS_ORIGIN = 'https://rivis-cloud.pages.dev';
const QC_ORIGIN = 'https://vectorichqc-prv.pages.dev';
const encoder = new TextEncoder();

const headers = {
  'Cache-Control': 'private, no-store',
  'Content-Security-Policy': "frame-ancestors 'none'",
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
};

function denied(status = 403) {
  return new Response('Buka VectorichQC melalui tombol VECTORICH QC di RIVIS.', {status, headers});
}

function decode(value) {
  return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), char => char.charCodeAt(0));
}

async function verify(grant, secret) {
  if (typeof grant !== 'string' || !/^[\w-]{20,350}\.[\w-]{43}$/.test(grant) || !secret) return null;
  const [payload, signature] = grant.split('.');
  const raw = decode(secret);
  if (raw.byteLength !== 32) return null;
  const key = await crypto.subtle.importKey('raw', raw, {name: 'HMAC', hash: 'SHA-256'}, false, ['verify']);
  if (!await crypto.subtle.verify('HMAC', key, decode(signature), encoder.encode(payload))) return null;
  const claims = JSON.parse(new TextDecoder().decode(decode(payload)));
  const now = Math.floor(Date.now() / 1000);
  if (claims.aud !== QC_ORIGIN || !Number.isInteger(claims.exp) || claims.exp <= now || claims.exp > now + 60 ||
      typeof claims.jti !== 'string' || !/^[a-f0-9-]{36}$/.test(claims.jti)) return null;
  return claims;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.origin !== QC_ORIGIN || url.pathname !== '/open' || request.method !== 'POST' ||
        request.headers.get('Origin') !== RIVIS_ORIGIN ||
        request.headers.get('Content-Type')?.split(';', 1)[0] !== 'application/x-www-form-urlencoded') return denied();
    let claims;
    try {
      // The legitimate form has one short field. Bound reads before decoding.
      const reader = request.body?.getReader();
      if (!reader) return denied();
      const decoder = new TextDecoder();
      let body = '';
      while (true) {
        const {value, done} = await reader.read();
        if (done) break;
        body += decoder.decode(value, {stream: true});
        if (body.length > 700) {
          await reader.cancel();
          return denied();
        }
      }
      claims = await verify(new URLSearchParams(body + decoder.decode()).get('grant'), env.VECTORICH_QC_LAUNCH_SECRET);
    } catch {
      return denied();
    }
    if (!claims) return denied();

    try {
      // D1 enforces uniqueness atomically, including launches in different regions.
      const db = env.VECTORICH_QC_GRANTS;
      const [use] = await db.batch([
        db.prepare('INSERT OR IGNORE INTO used_grants (id, expires) SELECT ?, ? WHERE ? > unixepoch()').bind(claims.jti, claims.exp, claims.exp),
        db.prepare('DELETE FROM used_grants WHERE expires <= unixepoch()'),
      ]);
      if (use.meta.changes !== 1) return denied();
      const asset = await env.ASSETS.fetch(new Request(QC_ORIGIN + '/'));
      if (!asset.ok || !asset.headers.get('Content-Type')?.startsWith('text/html')) return denied(503);
      return new Response(asset.body, {
        headers: {...headers, 'Content-Type': 'text/html; charset=utf-8'},
      });
    } catch {
      return denied(503);
    }
  },
};
