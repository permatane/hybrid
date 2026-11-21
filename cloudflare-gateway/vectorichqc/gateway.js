import { Buffer } from 'node:buffer';

const ORIGIN = 'https://rivis-cloud.pages.dev';
const QC_ORIGIN = 'https://vectorichqc-prv.pages.dev';
const DRIVE_ABOUT = 'https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)';

const htmlHeaders = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
};

function notice(status, text, cookie) {
  const headers = new Headers(htmlHeaders);
  if (cookie) headers.append('Set-Cookie', cookie);
  headers.set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  return new Response('<!doctype html><html lang="id"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>VectorichQC</title><h1>VectorichQC</h1><p>' + text + '</p><p><a href="/rivis-cloud/">Buka RIVIS Cloud Gateway</a></p></html>', {status, headers});
}

export async function launchVectorichQC({request, env}, sessionFor) {
  if (request.method !== 'POST' || request.headers.get('Origin') !== ORIGIN) {
    return notice(403, 'Buka VectorichQC melalui tombol di RIVIS.');
  }
  const sessionResult = await sessionFor({headers: {cookie: request.headers.get('Cookie') || ''}});
  if (sessionResult.error || !sessionResult.session?.access_token) {
    return notice(401, 'Hubungkan akun Google di RIVIS, lalu klik kembali tombol VECTORICH QC.');
  }
  const email = env.VECTORICH_QC_EMAIL?.trim().toLowerCase();
  const secret = Buffer.from(env.VECTORICH_QC_LAUNCH_SECRET || '', 'base64');
  if (!email || secret.byteLength !== 32) return notice(503, 'Akses VectorichQC belum tersedia.');
  let about;
  try {
    const response = await fetch(DRIVE_ABOUT, {
      headers: {Authorization: 'Bearer ' + sessionResult.session.access_token},
      signal: AbortSignal.timeout(8000),
      redirect: 'error',
    });
    if (response.ok) about = await response.json();
  } catch {
    return notice(503, 'Google belum merespons. Coba kembali dari tombol di RIVIS.');
  }
  if (about?.user?.emailAddress?.toLowerCase() !== email) {
    return notice(403, 'Akun Google ini belum diberi akses ke VectorichQC.', sessionResult.newCookie);
  }

  const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(24))).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    aud: QC_ORIGIN,
    exp: Math.floor(Date.now() / 1000) + 45,
    jti: crypto.randomUUID(),
  })).toString('base64url');
  const key = await crypto.subtle.importKey('raw', secret, {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
  const signature = Buffer.from(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))).toString('base64url');
  const headers = new Headers(htmlHeaders);
  if (sessionResult.newCookie) headers.append('Set-Cookie', sessionResult.newCookie);
  headers.set('Content-Security-Policy', "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action " + QC_ORIGIN + "; script-src 'nonce-" + nonce + "'");
  return new Response(`<!doctype html><html lang="id"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Membuka VectorichQC</title><form method="post" action="${QC_ORIGIN}/open"><input type="hidden" name="grant" value="${payload}.${signature}"><button>Buka VectorichQC</button></form><script nonce="${nonce}">document.forms[0].submit()</script></html>`, {headers});
}
