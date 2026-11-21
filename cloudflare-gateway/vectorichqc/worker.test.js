import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { launchVectorichQC } from './gateway.js';
import worker from './worker.js';

const gatewayOrigin = 'https://rivis-cloud.pages.dev';
const qcOrigin = 'https://vectorichqc-prv.pages.dev';

test('a permitted RIVIS session opens VectorichQC once; direct, invalid and replayed requests stay blocked', async t => {
  const env = {
    VECTORICH_QC_EMAIL: 'owner@example.com',
    VECTORICH_QC_LAUNCH_SECRET: randomBytes(32).toString('base64'),
  };
  const session = () => ({session: {access_token: 'test-token'}});
  const launch = (origin, activeSession = session) => launchVectorichQC({
    env,
    request: new Request(gatewayOrigin + '/api/vectorichqc-launch', {method: 'POST', headers: {Origin: origin}}),
  }, activeSession);
  const google = t.mock.method(globalThis, 'fetch', async () => Response.json({user: {emailAddress: 'other@example.com'}}));

  assert.equal((await launch('https://example.com')).status, 403);
  assert.equal((await launch(gatewayOrigin, () => ({error: 'not_connected'}))).status, 401);
  assert.equal(google.mock.callCount(), 0);
  assert.equal((await launch(gatewayOrigin)).status, 403);

  google.mock.mockImplementation(async () => Response.json({user: {emailAddress: 'OWNER@example.com'}}));
  const response = await launch(gatewayOrigin);
  assert.equal(response.status, 200);
  const grant = (await response.text()).match(/name="grant" value="([^"]+)"/)[1];
  const database = new DatabaseSync(':memory:');
  database.exec('CREATE TABLE used_grants (id TEXT PRIMARY KEY, expires INTEGER NOT NULL)');
  let assetReads = 0;
  const workerEnv = {
    ...env,
    VECTORICH_QC_GRANTS: {
      prepare(sql, ...defaultArgs) {
        return {sql, args: defaultArgs, bind(...args) { return {sql, args}; }};
      },
      async batch(statements) {
        return statements.map(({sql, args}) => ({meta: {changes: database.prepare(sql).run(...args).changes}}));
      },
    },
    ASSETS: {
      async fetch(request) {
        assert.equal(request.url, qcOrigin + '/');
        assetReads++;
        return new Response('<title>VectorichQC v4.04</title>', {headers: {'Content-Type': 'text/html'}});
      },
    },
  };
  const redeem = (token, origin = gatewayOrigin) => worker.fetch(new Request(qcOrigin + '/open', {
    method: 'POST', headers: {Origin: origin}, body: new URLSearchParams({grant: token}),
  }), workerEnv);
  assert.equal((await worker.fetch(new Request(qcOrigin + '/index.html'), workerEnv)).status, 403);
  assert.equal((await redeem(grant, 'https://example.com')).status, 403);
  assert.equal((await redeem(grant.replace(/^./, 'Z'))).status, 403);
  const attempts = await Promise.all([redeem(grant), redeem(grant)]);
  assert.deepEqual(attempts.map(r => r.status).sort(), [200, 403]);
  assert.match(await attempts.find(r => r.ok).text(), /VectorichQC v4\.04/);
  assert.equal(assetReads, 1);
  database.close();
});
