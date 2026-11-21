'use strict';
const h=require('./_shared.cjs');
const MAX_CHUNK=2*1024*1024;
exports.handler=async(event)=>{
 if(event.httpMethod!=='GET')return h.json(405,{error:'Method not allowed'});
 const origin=event.headers?.origin||event.headers?.Origin||'';
 if(origin&&origin!==h.baseUrl())return h.json(403,{error:'Invalid request origin'});
 const state=await h.activeSession(event);if(state.error)return h.json(401,{error:state.error});
 const headers=state.newCookie?{'Set-Cookie':state.newCookie}:{};
 try{
  const fileId=String(event.queryStringParameters?.fileId||'');
  if(!h.validFileId(fileId))return h.json(400,{error:'Invalid Drive file ID'},headers);
  const token=state.session.access_token;
  const metaRes=await fetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(fileId)+'?fields=id,mimeType,size,name&supportsAllDrives=true',{headers:{Authorization:'Bearer '+token}});
  const meta=await metaRes.json().catch(()=>({}));
  if(!metaRes.ok)return h.json(502,{error:'Drive metadata request failed ('+metaRes.status+')'},headers);
  const mimeType=String(meta.mimeType||'application/octet-stream'),totalBytes=Number(meta.size||0);
  if(!mimeType.startsWith('image/'))return h.json(415,{error:'Cloud asset is not an image'},headers);
  if(!Number.isSafeInteger(totalBytes)||totalBytes<1||totalBytes>100*1024*1024)return h.json(413,{error:'Image asset must be between 1 byte and 100 MB'},headers);
  const startRaw=event.queryStringParameters?.start;
  const start=startRaw===undefined?0:Number(startRaw);
  const requested=Number(event.queryStringParameters?.chunkSize||MAX_CHUNK);
  const chunkSize=Math.min(MAX_CHUNK,Number.isSafeInteger(requested)&&requested>0?requested:MAX_CHUNK);
  if(!Number.isSafeInteger(start)||start<0||start>=totalBytes)return h.json(416,{error:'Invalid download range'},headers);
  const end=Math.min(totalBytes-1,start+chunkSize-1);
  const response=await fetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(fileId)+'?alt=media&supportsAllDrives=true',{headers:{Authorization:'Bearer '+token,Range:'bytes='+start+'-'+end}});
  if(!response.ok)return h.json(502,{error:'Drive download failed ('+response.status+')'},headers);
  const bytes=Buffer.from(await response.arrayBuffer());
  if(!bytes.length||bytes.length>MAX_CHUNK+1024)return h.json(502,{error:'Drive returned an invalid download chunk'},headers);
  if(response.status===200&&totalBytes>chunkSize)return h.json(502,{error:'Google Drive did not honor the requested byte range; retry with a smaller file'},headers);
  const rangeHeader=response.headers?.get?.('content-range')||'';
  const rangeMatch=rangeHeader.match(/bytes\s+(\d+)-(\d+)\/(\d+)/i);
  const actualStart=rangeMatch?Number(rangeMatch[1]):start;
  const actualTotal=rangeMatch?Number(rangeMatch[3]):totalBytes;
  return h.json(200,{ok:true,fileId,mimeType,start:actualStart,end:actualStart+bytes.length-1,totalBytes:actualTotal,done:actualStart+bytes.length>=actualTotal,base64:bytes.toString('base64')},headers);
 }catch(error){return h.json(502,{error:error.message||'Cloud asset download failed'},headers);}
};
