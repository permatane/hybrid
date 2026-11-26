'use strict';
const h = require('./_shared.cjs');
const v = require('./_veo.cjs');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return h.json(405, { error: 'Method not allowed' });
  const origin = event.headers && (event.headers.origin || event.headers.Origin) || '';
  if (origin !== h.baseUrl()) return h.json(403, { error: 'Invalid request origin' });

  try {
    const body = JSON.parse(event.body || '{}');

    // A saved GCS URI can be re-signed after the previous preview/download URL expires.
    if (body.gcsUri) {
      const links = v.makeVideoLinks(process.env, [{
        gcsUri: String(body.gcsUri),
        mimeType: String(body.mimeType || 'video/mp4')
      }]);
      return h.json(200, { ok: true, done: true, videos: links });
    }

    const operationName = String(body.operationName || '');
    if (!operationName) return h.json(400, { error: 'operationName atau gcsUri wajib diisi.' });
    const result = await v.fetchOperation(process.env, operationName);
    const operation = result.operation || {};

    if (operation.error) {
      return h.json(200, {
        ok: true,
        done: true,
        state: 'failed',
        error: String(operation.error.message || 'Veo operation failed').slice(0, 1000)
      });
    }

    if (operation.done !== true) {
      return h.json(200, {
        ok: true,
        done: false,
        state: 'processing',
        operationName,
        metadata: operation.metadata || null
      });
    }

    const videos = v.normalizeVideoList(operation.response || operation.result || {});
    if (!videos.length) {
      return h.json(200, {
        ok: true,
        done: true,
        state: 'failed',
        error: 'Veo menyelesaikan operation tetapi tidak mengembalikan file MP4.'
      });
    }
    return h.json(200, {
      ok: true,
      done: true,
      state: 'completed',
      operationName,
      videos: v.makeVideoLinks(process.env, videos)
    });
  } catch (error) {
    const message = String(error && error.message || error || 'Motion status failed');
    const status = /belum dikonfigurasi|belum tersedia|harus memiliki|harus berupa nama bucket|service account/i.test(message) ? 503 :
      /Operation Veo tidak cocok|ID operation Veo tidak valid|Video URI tidak berada|Lokasi video di luar/i.test(message) ? 400 : 502;
    return h.json(status, { error: message.slice(0, 1200) });
  }
};
