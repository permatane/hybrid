'use strict';

const crypto = require('node:crypto');
const TOKEN_CACHE_KEY = '__RIVIS_VEO_SERVICE_TOKEN_CACHE';

function encodeRfc3986(value) {
  return encodeURIComponent(String(value)).replace(/[!'()*]/g, function (c) {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase();
  });
}

function readConfig(env) {
  const raw = String(env.RIVIS_VEO_SERVICE_ACCOUNT_JSON || '').trim();
  if (!raw) throw new Error('RIVIS_VEO_SERVICE_ACCOUNT_JSON belum dikonfigurasi di Cloudflare Secrets.');
  let account;
  try { account = JSON.parse(raw); }
  catch (_) { throw new Error('RIVIS_VEO_SERVICE_ACCOUNT_JSON harus berisi JSON service account yang valid.'); }

  const projectId = String(env.GOOGLE_CLOUD_PROJECT || account.project_id || '').trim();
  const bucket = String(env.RIVIS_VEO_GCS_BUCKET || '').trim();
  const location = String(env.RIVIS_VEO_LOCATION || 'us-central1').trim();
  const prefix = String(env.RIVIS_VEO_GCS_PREFIX || 'rivis-motion').replace(/^\/+|\/+$/g, '');

  if (!account.client_email || !account.private_key) throw new Error('Service account harus memiliki client_email dan private_key.');
  if (!projectId) throw new Error('GOOGLE_CLOUD_PROJECT atau project_id pada service account belum tersedia.');
  if (!/^[a-z0-9][a-z0-9._-]{1,61}[a-z0-9]$/.test(bucket)) throw new Error('RIVIS_VEO_GCS_BUCKET harus berupa nama bucket Google Cloud Storage yang valid.');
  if (!/^[a-z0-9-]+$/.test(location)) throw new Error('RIVIS_VEO_LOCATION tidak valid.');
  if (!/^[A-Za-z0-9/_-]{1,120}$/.test(prefix)) throw new Error('RIVIS_VEO_GCS_PREFIX tidak valid.');

  return {
    account: {
      client_email: String(account.client_email),
      private_key: String(account.private_key).replace(/\\n/g, '\n')
    },
    projectId,
    bucket,
    location,
    prefix
  };
}

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function makeAssertion(account) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(JSON.stringify({
    iss: account.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3500
  }));
  const unsigned = header + '.' + claims;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  return unsigned + '.' + signer.sign(account.private_key, 'base64url');
}

async function getAccessToken(env) {
  const cfg = readConfig(env);
  const cache = globalThis[TOKEN_CACHE_KEY] || (globalThis[TOKEN_CACHE_KEY] = new Map());
  const cacheKey = cfg.account.client_email + '|' + cfg.projectId;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() + 60000) return { token: cached.token, cfg };

  const assertion = makeAssertion(cfg.account);
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    const detail = String(data.error_description || data.error || 'Google OAuth token request gagal').slice(0, 500);
    throw new Error('Autentikasi service account Google gagal: ' + detail);
  }
  cache.set(cacheKey, {
    token: data.access_token,
    expiresAt: Date.now() + Math.max(60, Number(data.expires_in) || 3600) * 1000
  });
  return { token: data.access_token, cfg };
}

async function googleApi(env, url, options) {
  const auth = await getAccessToken(env);
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: 'Bearer ' + auth.token,
      'Content-Type': 'application/json',
      ...(options && options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = String(data.error && data.error.message || data.error_description || 'Google API request gagal').slice(0, 700);
    throw new Error('Google API HTTP ' + response.status + ': ' + detail);
  }
  return { data, cfg: auth.cfg };
}

function operationPrefix(cfg, model) {
  return 'projects/' + cfg.projectId + '/locations/' + cfg.location +
    '/publishers/google/models/' + model + '/operations/';
}

function validateOperationName(env, operationName) {
  const cfg = readConfig(env);
  const name = String(operationName || '');
  const models = ['veo-3.1-generate-001', 'veo-3.1-fast-generate-001'];
  const model = models.find(candidate => name.startsWith(operationPrefix(cfg, candidate)));
  if (!model) throw new Error('Operation Veo tidak cocok dengan project atau location RIVIS.');
  const suffix = name.slice(operationPrefix(cfg, model).length);
  if (!/^[A-Za-z0-9_-]{8,160}$/.test(suffix)) throw new Error('ID operation Veo tidak valid.');
  return { cfg, model, name };
}

async function startGeneration(env, input) {
  const auth = await getAccessToken(env);
  const cfg = auth.cfg;
  const model = input.model === 'veo-3.1-fast-generate-001'
    ? 'veo-3.1-fast-generate-001'
    : 'veo-3.1-generate-001';
  const jobId = crypto.randomUUID();
  const day = new Date().toISOString().slice(0, 10);
  const storageUri = 'gs://' + cfg.bucket + '/' + cfg.prefix + '/' + day + '/' + jobId + '/';
  const url = 'https://' + cfg.location + '-aiplatform.googleapis.com/v1/projects/' +
    encodeURIComponent(cfg.projectId) + '/locations/' + encodeURIComponent(cfg.location) +
    '/publishers/google/models/' + encodeURIComponent(model) + ':predictLongRunning';

  const payload = {
    instances: [{
      prompt: input.prompt,
      image: {
        bytesBase64Encoded: input.imageBase64,
        mimeType: input.mimeType
      }
    }],
    parameters: {
      storageUri,
      sampleCount: input.sampleCount,
      durationSeconds: input.durationSeconds,
      aspectRatio: input.aspectRatio,
      resolution: input.resolution,
      fps: 24,
      task: 'imageToVideo',
      resizeMode: input.resizeMode || 'crop',
      negativePrompt: input.negativePrompt,
      personGeneration: input.personGeneration || 'allow_adult',
      generateAudio: false,
      enhancePrompt: true,
      compressionQuality: 'optimized'
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + auth.token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.name) {
    const detail = String(data.error && data.error.message || 'Veo tidak mengembalikan operation name').slice(0, 900);
    throw new Error('Veo generation request gagal (HTTP ' + response.status + '): ' + detail);
  }
  return {
    jobId,
    operationName: data.name,
    storageUri,
    model,
    projectId: cfg.projectId,
    location: cfg.location
  };
}

async function fetchOperation(env, operationName) {
  const valid = validateOperationName(env, operationName);
  const url = 'https://' + valid.cfg.location + '-aiplatform.googleapis.com/v1/projects/' +
    encodeURIComponent(valid.cfg.projectId) + '/locations/' + encodeURIComponent(valid.cfg.location) +
    '/publishers/google/models/' + encodeURIComponent(valid.model) + ':fetchPredictOperation';
  const result = await googleApi(env, url, {
    method: 'POST',
    body: JSON.stringify({ operationName: valid.name })
  });
  return { operation: result.data, cfg: result.cfg, model: valid.model };
}

function parseGcsUri(env, uri) {
  const cfg = readConfig(env);
  const value = String(uri || '');
  const match = /^gs:\/\/([a-z0-9._-]+)\/(.+)$/.exec(value);
  if (!match || match[1] !== cfg.bucket) throw new Error('Video URI tidak berada di bucket RIVIS yang dikonfigurasi.');
  const objectName = match[2].replace(/^\/+/, '');
  if (!objectName.startsWith(cfg.prefix + '/') || objectName.includes('..')) {
    throw new Error('Lokasi video di luar direktori Motion Studio.');
  }
  return { cfg, objectName };
}

function signStorageUrl(env, gcsUri, attachment) {
  const parsed = parseGcsUri(env, gcsUri);
  const cfg = parsed.cfg;
  const now = new Date();
  const date = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateOnly = date.slice(0, 8);
  const scope = dateOnly + '/auto/storage/goog4_request';
  const canonicalUri = '/' + cfg.bucket + '/' + parsed.objectName.split('/').map(encodeRfc3986).join('/');
  const pairs = [
    ['X-Goog-Algorithm', 'GOOG4-RSA-SHA256'],
    ['X-Goog-Credential', cfg.account.client_email + '/' + scope],
    ['X-Goog-Date', date],
    ['X-Goog-Expires', '900'],
    ['X-Goog-SignedHeaders', 'host']
  ];
  if (attachment) {
    const filename = String(attachment).replace(/[^A-Za-z0-9._-]+/g, '_').slice(0, 100) || 'rivis-motion.mp4';
    pairs.push(['response-content-disposition', 'attachment; filename="' + filename + '"']);
  }
  const canonicalQuery = pairs
    .map(pair => [encodeRfc3986(pair[0]), encodeRfc3986(pair[1])])
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(pair => pair[0] + '=' + pair[1])
    .join('&');
  const canonicalRequest = [
    'GET',
    canonicalUri,
    canonicalQuery,
    'host:storage.googleapis.com\n',
    'host',
    'UNSIGNED-PAYLOAD'
  ].join('\n');
  const hash = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
  const stringToSign = 'GOOG4-RSA-SHA256\n' + date + '\n' + scope + '\n' + hash;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(stringToSign);
  signer.end();
  const signature = signer.sign(cfg.account.private_key, 'hex');
  return 'https://storage.googleapis.com' + canonicalUri + '?' + canonicalQuery + '&X-Goog-Signature=' + signature;
}

function normalizeVideoList(response) {
  const source = response || {};
  const list = Array.isArray(source.videos) ? source.videos :
    Array.isArray(source.generatedVideos) ? source.generatedVideos :
    Array.isArray(source.predictions) ? source.predictions.flatMap(item => item.videos || item.generatedVideos || []) : [];
  return list.map(video => ({
    gcsUri: video.gcsUri || video.uri || video.video && (video.video.uri || video.video.gcsUri) || '',
    mimeType: video.mimeType || video.mime_type || video.video && (video.video.mimeType || video.video.mime_type) || 'video/mp4'
  })).filter(video => /^gs:\/\//.test(video.gcsUri));
}

function makeVideoLinks(env, videoList) {
  return videoList.map((video, index) => {
    const safeName = 'rivis-motion-' + String(index + 1).padStart(2, '0') + '.mp4';
    return {
      index,
      gcsUri: video.gcsUri,
      mimeType: video.mimeType || 'video/mp4',
      previewUrl: signStorageUrl(env, video.gcsUri, ''),
      downloadUrl: signStorageUrl(env, video.gcsUri, safeName)
    };
  });
}

module.exports = {
  readConfig,
  getAccessToken,
  startGeneration,
  fetchOperation,
  validateOperationName,
  normalizeVideoList,
  makeVideoLinks,
  signStorageUrl
};
