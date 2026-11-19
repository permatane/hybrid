'use strict';
const h=require('./_shared.cjs');
exports.handler=async(event)=>{
 if(event.httpMethod!=='GET')return h.json(405,{error:'Method not allowed'});
 const origin=event.headers?.origin||event.headers?.Origin||'';
 if(origin&&origin!==h.baseUrl())return h.json(403,{error:'Invalid request origin'});
 const state=await h.activeSession(event);if(state.error)return h.json(401,{error:state.error});
 const headers=state.newCookie?{'Set-Cookie':state.newCookie}:{};
 try{
  const fileId=String(event.queryStringParameters?.fileId||'');
  if(!h.validFileId(fileId))return h.json(400,{error:'Invalid Drive file ID'},headers);
  const metaRes=await fetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(fileId)+'?fields=id,mimeType,thumbnailLink,size&supportsAllDrives=true',{headers:{Authorization:'Bearer '+state.session.access_token}});
  const meta=await metaRes.json().catch(()=>({}));
  if(!metaRes.ok)return h.json(502,{error:'Could not read Drive thumbnail metadata ('+metaRes.status+')'},headers);
  if(!String(meta.mimeType||'').startsWith('image/'))return h.json(415,{error:'Cloud asset is not an image'},headers);
  if(!meta.thumbnailLink&&meta.mimeType==='image/svg+xml'){
   if(Number(meta.size)>1024*1024)return h.json(413,{error:'SVG preview exceeds the 1 MB preview limit'},headers);
   const original=await fetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(fileId)+'?alt=media&supportsAllDrives=true',{headers:{Authorization:'Bearer '+state.session.access_token}});
   if(!original.ok)return h.json(502,{error:'Google Drive SVG preview request failed ('+original.status+')'},headers);
   const bytes=Buffer.from(await original.arrayBuffer());
   if(!bytes.length||bytes.length>1024*1024)return h.json(413,{error:'SVG preview exceeds the 1 MB preview limit'},headers);
   return h.json(200,{ok:true,fileId,mimeType:'image/svg+xml',base64:bytes.toString('base64')},headers);
  }
  if(!meta.thumbnailLink)return h.json(404,{error:'Google Drive thumbnail is not available for this asset'},headers);
  const thumbRes=await fetch(meta.thumbnailLink,{headers:{Authorization:'Bearer '+state.session.access_token}});
  if(!thumbRes.ok)return h.json(502,{error:'Google Drive thumbnail request failed ('+thumbRes.status+')'},headers);
  const mime=thumbRes.headers?.get?.('content-type')||'image/jpeg';
  if(!mime.startsWith('image/'))return h.json(415,{error:'Drive thumbnail response is not an image'},headers);
  const bytes=Buffer.from(await thumbRes.arrayBuffer());
  if(!bytes.length||bytes.length>1024*1024)return h.json(413,{error:'Thumbnail exceeds the 1 MB preview limit'},headers);
  return h.json(200,{ok:true,fileId,mimeType:mime,base64:bytes.toString('base64')},headers);
 }catch(error){return h.json(502,{error:error.message||'Cloud thumbnail request failed'},headers);}
};
