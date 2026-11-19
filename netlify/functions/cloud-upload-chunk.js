'use strict';
const h = require('./_shared.cjs');

// Keep individual uploads well below the Netlify synchronous execution limit.
const MAX_CHUNK_BYTES = 1024 * 1024;
const DRIVE_CHUNK_QUANTUM = 256 * 1024;
const MAX_ASSET_BYTES = 100 * 1024 * 1024;
const MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']);
const DRIVE_TIMEOUT_MS = 23000;

function uploadSessionUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' && url.hostname === 'www.googleapis.com' &&
      !url.port && !url.username && !url.password &&
      url.pathname === '/upload/drive/v3/files' && Boolean(url.searchParams.get('upload_id')) && !url.hash;
  } catch (_) {return false;}
}
function responseError(data, raw) {
  return data?.error?.message || data?.error_description || data?.message || raw || 'Google Drive returned an unknown error';
}
function nextByte(range, fallback=0) {
  const match = /^bytes=(\d+)-(\d+)$/i.exec(String(range || '').trim());
  return match ? Number(match[2]) + 1 : fallback;
}
function parsedBody(raw) {
  try {return raw ? JSON.parse(raw) : {};} catch (_) {return {raw:String(raw).slice(0,600)};}
}
async function driveRequest(url, opts, timeoutMs=DRIVE_TIMEOUT_MS) {
  const ac=new AbortController();
  const timer=setTimeout(()=>ac.abort(),timeoutMs);
  try {return await fetch(url,{...opts,signal:ac.signal,redirect:'manual'});}
  finally {clearTimeout(timer);}
}
exports.handler = async (event) => {
  if (event.httpMethod !== 'PUT') return h.json(405, {error:'Method not allowed'});
  const origin=event.headers?.origin || event.headers?.Origin || '';
  if (origin !== h.baseUrl()) return h.json(403, {error:'Invalid request origin'});
  const state=await h.activeSession(event);
  if (state.error) return h.json(401,{error:state.error});
  const headers=state.newCookie ? {'Set-Cookie':state.newCookie} : {};
  try {
    const uploadUrl=event.headers?.['x-rivis-upload-url'] || event.headers?.['X-Rivis-Upload-Url'] || '';
    const mimeType=event.headers?.['x-rivis-mime-type'] || event.headers?.['X-Rivis-Mime-Type'] || '';
    const contentRange=event.headers?.['content-range'] || event.headers?.['Content-Range'] || '';
    if (!uploadSessionUrl(uploadUrl)) return h.json(400,{error:'Invalid or expired Google Drive upload URL. Reconnect Google and retry.'},headers);
    if (!MIME_TYPES.has(mimeType)) return h.json(415,{error:'Unsupported image MIME type'},headers);
    const auth={'Authorization':'Bearer '+state.session.access_token,'Content-Type':mimeType};
    const isStatus=String(event.headers?.['x-rivis-query-status'] || event.headers?.['X-Rivis-Query-Status'] || '') === '1';

    // Google Drive resumable status query: an empty PUT with Content-Range bytes */TOTAL.
    if (isStatus) {
      const total=Number(event.headers?.['x-rivis-total-bytes'] || event.headers?.['X-Rivis-Total-Bytes'] || 0);
      if(!Number.isSafeInteger(total) || total<1 || total>MAX_ASSET_BYTES)return h.json(400,{error:'Invalid total bytes for resume status'},headers);
      const response=await driveRequest(uploadUrl,{method:'PUT',headers:{...auth,'Content-Length':'0','Content-Range':`bytes */${total}`},body:Buffer.alloc(0)},14000);
      const raw=await response.text();const data=parsedBody(raw);
      if(response.status===308){const range=response.headers?.get?.('range') || '';
        return h.json(200,{ok:true,done:false,resumed:true,acceptedRange:range,nextStart:nextByte(range,0)},headers);
      }
      if((response.status===200 || response.status===201) && data.id){
        return h.json(200,{ok:true,done:true,resumed:true,nextStart:total,file:{id:data.id,name:data.name||'',mimeType:data.mimeType||mimeType,size:Number(data.size||total),webViewLink:data.webViewLink||''}},headers);
      }
      return h.json(502,{error:`Drive resumable status failed (${response.status}): ${responseError(data,data.raw)}`,googleStatus:response.status},headers);
    }
    const match=String(contentRange).match(/^bytes\s+(\d+)-(\d+)\/(\d+)$/i);
    if (!match)return h.json(400,{error:'Invalid Content-Range for image chunk'},headers);
    const start=Number(match[1]),end=Number(match[2]),total=Number(match[3]);
    if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||!Number.isSafeInteger(total)||start<0||end<start||total<1||total>MAX_ASSET_BYTES||end>=total)return h.json(416,{error:'Upload range outside asset size'},headers);
    const bytes=event.isBase64Encoded?Buffer.from(event.body||'','base64'):Buffer.from(event.body||'','binary');
    if(!bytes.length||bytes.length!==end-start+1)return h.json(400,{error:'Chunk byte count differs from Content-Range',expectedBytes:end-start+1,receivedBytes:bytes.length},headers);
    if(bytes.length>MAX_CHUNK_BYTES)return h.json(413,{error:'Image upload chunk exceeds 1 MB'},headers);
    if(end<total-1 && bytes.length%DRIVE_CHUNK_QUANTUM!==0)return h.json(400,{error:'Non-final chunk must be a multiple of 256 KB'},headers);
    const response=await driveRequest(uploadUrl,{method:'PUT',headers:{...auth,'Content-Length':String(bytes.length),'Content-Range':`bytes ${start}-${end}/${total}`},body:bytes});
    const raw=await response.text();const data=parsedBody(raw);
    if(response.status===308){const range=response.headers?.get?.('range') || '';
      return h.json(200,{ok:true,done:false,acceptedRange:range,nextStart:nextByte(range,0)},headers);
    }
    if((response.status===200||response.status===201)&&data.id){
      return h.json(200,{ok:true,done:true,nextStart:total,file:{id:data.id,name:data.name||'',mimeType:data.mimeType||mimeType,size:Number(data.size||total),webViewLink:data.webViewLink||''}},headers);
    }
    return h.json(502,{error:`Google Drive upload chunk rejected (${response.status}): ${responseError(data,data.raw)}`,googleStatus:response.status},headers);
  }catch(error){
    const timedOut=error?.name==='AbortError'||error?.name==='TimeoutError';
    return h.json(504,{error:timedOut?'Google Drive upload timed out after 23 seconds. Session can be resumed.':`Google Drive proxy error: ${String(error?.message||error)}`},headers);
  }
};
