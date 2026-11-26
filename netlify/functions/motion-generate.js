'use strict';
const h = require('./_shared.cjs');
const v = require('./_veo.cjs');

function imagePayload(body) {
  let mimeType = String(body.mimeType || '').toLowerCase();
  let encoded = String(body.imageBase64 || '');
  const dataUrl = /^data:(image\/(?:png|jpeg));base64,([\s\S]+)$/i.exec(encoded);
  if (dataUrl) {
    mimeType = dataUrl[1].toLowerCase();
    encoded = dataUrl[2].replace(/\s/g, '');
  }
  if (!['image/png', 'image/jpeg'].includes(mimeType)) throw new Error('Veo hanya menerima gambar PNG atau JPEG.');
  if (!encoded || encoded.length > 28 * 1024 * 1024 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
    throw new Error('Data gambar Base64 tidak valid atau melebihi batas 20 MB.');
  }
  const bytes = Buffer.from(encoded, 'base64');
  if (bytes.length < 32 || bytes.length > 20 * 1024 * 1024) throw new Error('Ukuran gambar harus antara 32 byte dan 20 MB.');
  const canonical = bytes.toString('base64').replace(/=+$/, '');
  if (canonical !== encoded.replace(/=+$/, '')) throw new Error('Encoding Base64 gambar tidak valid.');
  const png = bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpeg = bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if ((mimeType === 'image/png' && !png) || (mimeType === 'image/jpeg' && !jpeg)) {
    throw new Error('MIME type tidak cocok dengan isi file gambar.');
  }
  return { mimeType, imageBase64: encoded };
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return h.json(405, { error: 'Method not allowed' });
  const origin = event.headers && (event.headers.origin || event.headers.Origin) || '';
  if (origin !== h.baseUrl()) return h.json(403, { error: 'Invalid request origin' });

  try {
    const body = JSON.parse(event.body || '{}');
    const prompt = String(body.prompt || '').trim();
    if (prompt.length < 12 || prompt.length > 5000) return h.json(400, { error: 'Prompt motion harus berisi 12–5000 karakter.' });
    const image = imagePayload(body);
    const durationSeconds = Number(body.durationSeconds || 8);
    const sampleCount = Number(body.sampleCount || 1);
    const aspectRatio = String(body.aspectRatio || '16:9');
    const resolution = String(body.resolution || '1080p');
    const resizeMode = String(body.resizeMode || 'crop');
    const personGeneration = String(body.personGeneration || 'allow_adult');
    const model = String(body.model || 'veo-3.1-generate-001');
    if (![4, 6, 8].includes(durationSeconds)) return h.json(400, { error: 'Durasi Veo harus 4, 6, atau 8 detik.' });
    if (!Number.isInteger(sampleCount) || sampleCount < 1 || sampleCount > 4) return h.json(400, { error: 'Jumlah variasi harus 1–4.' });
    if (!['16:9', '9:16'].includes(aspectRatio)) return h.json(400, { error: 'Aspect ratio harus 16:9 atau 9:16.' });
    if (!['720p', '1080p'].includes(resolution)) return h.json(400, { error: 'Resolusi harus 720p atau 1080p.' });
    if (!['crop', 'pad'].includes(resizeMode)) return h.json(400, { error: 'Resize mode harus crop atau pad.' });
    if (!['allow_adult', 'dont_allow', 'allowAll'].includes(personGeneration)) return h.json(400, { error: 'Pengaturan people generation tidak valid.' });
    if (!['veo-3.1-generate-001', 'veo-3.1-fast-generate-001'].includes(model)) return h.json(400, { error: 'Model Veo tidak didukung.' });

    const negativePrompt = String(body.negativePrompt || [
      'watermark, signature, logo, captions, subtitles, text overlays, brand marks',
      'flicker, jitter, ghosting, frame tearing, duplicated objects, object morphing',
      'deformed anatomy, extra limbs, unnatural physics, abrupt camera shake, compression artifacts'
    ].join(', ')).slice(0, 1800);

    const job = await v.startGeneration(process.env, {
      ...image,
      prompt,
      negativePrompt,
      durationSeconds,
      sampleCount,
      aspectRatio,
      resolution,
      resizeMode,
      personGeneration,
      model
    });
    return h.json(202, {
      ok: true,
      status: 'submitted',
      provider: 'Google Veo 3.1',
      jobId: job.jobId,
      operationName: job.operationName,
      storageUri: job.storageUri,
      model: job.model,
      projectId: job.projectId,
      location: job.location,
      settings: { durationSeconds, sampleCount, aspectRatio, resolution, fps: 24, audio: false }
    });
  } catch (error) {
    const message = String(error && error.message || error || 'Motion generation failed');
    const status = /belum dikonfigurasi|belum tersedia|harus memiliki|harus berupa nama bucket|service account/i.test(message) ? 503 :
      /Veo generation request gagal|Google API HTTP 4\d\d|Autentikasi service account/i.test(message) ? 502 : 400;
    return h.json(status, { error: message.slice(0, 1200) });
  }
};
