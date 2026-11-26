'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const originalFetch = global.fetch;
const originalEnv = { ...process.env };

function serviceAccount() {
  const pair = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  return {
    project_id: 'rivis-motion-test',
    client_email: 'rivis-motion-test@rivis-motion-test.iam.gserviceaccount.com',
    private_key: pair.privateKey
  };
}

function setupEnv(account) {
  process.env.RIVIS_BASE_URL = 'https://rivis-cloud.pages.dev';
  process.env.GOOGLE_CLOUD_PROJECT = account.project_id;
  process.env.RIVIS_VEO_SERVICE_ACCOUNT_JSON = JSON.stringify(account);
  process.env.RIVIS_VEO_GCS_BUCKET = 'rivis-motion-test';
  process.env.RIVIS_VEO_LOCATION = 'us-central1';
  process.env.RIVIS_VEO_GCS_PREFIX = 'rivis-motion';
  globalThis.__RIVIS_VEO_SERVICE_TOKEN_CACHE = new Map();
}

function fresh(name) {
  const path = require.resolve('../netlify/functions/' + name + '.js');
  delete require.cache[path];
  return require('../netlify/functions/' + name + '.js').handler;
}

function pngBase64() {
  const bytes = Buffer.alloc(96, 7);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10], 0);
  return bytes.toString('base64');
}

test('Motion generate validates raster payload and submits a Veo 3.1 long-running operation', async () => {
  const account = serviceAccount();
  setupEnv(account);
  const calls = [];
  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes('oauth2.googleapis.com/token')) {
      return new Response(JSON.stringify({ access_token: 'test-access-token', expires_in: 3600 }), { status: 200 });
    }
    if (String(url).includes(':predictLongRunning')) {
      const body = JSON.parse(options.body);
      assert.equal(body.instances[0].image.mimeType, 'image/png');
      assert.equal(body.parameters.durationSeconds, 8);
      assert.equal(body.parameters.fps, 24);
      assert.equal(body.parameters.generateAudio, false);
      assert.equal(body.parameters.sampleCount, 2);
      assert.equal(body.parameters.resolution, '1080p');
      assert.match(body.parameters.storageUri, /^gs:\/\/rivis-motion-test\/rivis-motion\//);
      return new Response(JSON.stringify({
        name: 'projects/rivis-motion-test/locations/us-central1/publishers/google/models/veo-3.1-generate-001/operations/abcdefgh12345678'
      }), { status: 200 });
    }
    throw new Error('Unexpected URL: ' + url);
  };

  try {
    const handler = fresh('motion-generate');
    const response = await handler({
      httpMethod: 'POST',
      headers: { origin: 'https://rivis-cloud.pages.dev' },
      body: JSON.stringify({
        imageBase64: pngBase64(),
        mimeType: 'image/png',
        prompt: 'A botanical subject gently sways in a natural breeze.',
        durationSeconds: 8,
        sampleCount: 2,
        aspectRatio: '16:9',
        resolution: '1080p'
      })
    });
    assert.equal(response.statusCode, 202, response.body);
    const result = JSON.parse(response.body);
    assert.equal(result.ok, true);
    assert.equal(result.status, 'submitted');
    assert.equal(result.provider, 'Google Veo 3.1');
    assert.match(result.operationName, /operations\/abcdefgh12345678$/);
    assert.equal(calls.length, 2);
  } finally {
    global.fetch = originalFetch;
    process.env = { ...originalEnv };
  }
});

test('Motion status polls a Veo operation and returns signed preview and download URLs', async () => {
  const account = serviceAccount();
  setupEnv(account);
  global.fetch = async (url, options = {}) => {
    if (String(url).includes('oauth2.googleapis.com/token')) {
      return new Response(JSON.stringify({ access_token: 'test-access-token', expires_in: 3600 }), { status: 200 });
    }
    if (String(url).includes(':fetchPredictOperation')) {
      const body = JSON.parse(options.body);
      assert.match(body.operationName, /operations\/abcdefgh12345678$/);
      return new Response(JSON.stringify({
        name: body.operationName,
        done: true,
        response: {
          videos: [{
            gcsUri: 'gs://rivis-motion-test/rivis-motion/2026-11-26/job/video_0.mp4',
            mimeType: 'video/mp4'
          }]
        }
      }), { status: 200 });
    }
    throw new Error('Unexpected URL: ' + url);
  };

  try {
    const handler = fresh('motion-status');
    const response = await handler({
      httpMethod: 'POST',
      headers: { origin: 'https://rivis-cloud.pages.dev' },
      body: JSON.stringify({
        operationName: 'projects/rivis-motion-test/locations/us-central1/publishers/google/models/veo-3.1-generate-001/operations/abcdefgh12345678'
      })
    });
    assert.equal(response.statusCode, 200, response.body);
    const result = JSON.parse(response.body);
    assert.equal(result.done, true);
    assert.equal(result.state, 'completed');
    assert.equal(result.videos.length, 1);
    assert.match(result.videos[0].previewUrl, /^https:\/\/storage\.googleapis\.com\//);
    assert.match(result.videos[0].previewUrl, /X-Goog-Signature=/);
    assert.match(result.videos[0].downloadUrl, /response-content-disposition=/);
  } finally {
    global.fetch = originalFetch;
    process.env = { ...originalEnv };
  }
});

test('Motion status rejects operation names outside the configured Veo project', async () => {
  const account = serviceAccount();
  setupEnv(account);
  global.fetch = async () => { throw new Error('Network should not be called'); };
  try {
    const handler = fresh('motion-status');
    const response = await handler({
      httpMethod: 'POST',
      headers: { origin: 'https://rivis-cloud.pages.dev' },
      body: JSON.stringify({
        operationName: 'projects/other-project/locations/us-central1/publishers/google/models/veo-3.1-generate-001/operations/abcdefgh12345678'
      })
    });
    assert.equal(response.statusCode, 400);
    assert.match(JSON.parse(response.body).error, /tidak cocok/);
  } finally {
    global.fetch = originalFetch;
    process.env = { ...originalEnv };
  }
});
