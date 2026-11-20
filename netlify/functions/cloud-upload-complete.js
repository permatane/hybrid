'use strict';
const h=require('./_shared.cjs');
async function googleFetch(url,options={},timeout=16000){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);try{return await fetch(url,{...options,signal:controller.signal});}finally{clearTimeout(timer);}}
exports.handler=async(event)=>{
 if(event.httpMethod!=='POST')return h.json(405,{error:'Method not allowed'});
 const origin=event.headers?.origin||event.headers?.Origin||'';if(origin!==h.baseUrl())return h.json(403,{error:'Invalid request origin'});
 const state=await h.activeSession(event);if(state.error)return h.json(401,{error:state.error});
 const headers=state.newCookie?{'Set-Cookie':state.newCookie}:{};
 try{
  const body=JSON.parse(event.body||'{}'),folderId=process.env.RIVIS_DRIVE_FOLDER_ID||'';
  if(!h.validFileId(folderId))return h.json(500,{error:'RIVIS Drive folder is not configured'},headers);
  if(!h.validFileId(body.ideaId)||!h.validFileId(body.driveFileId)||!h.validFileId(body.assetId))return h.json(400,{error:'Invalid idea, asset, or Drive file ID'},headers);
  const url='https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(body.driveFileId)+'?fields=id,name,mimeType,size,parents,webViewLink&supportsAllDrives=true';
  const response=await googleFetch(url,{headers:{Authorization:'Bearer '+state.session.access_token}}),file=await response.json().catch(()=>({}));
  if(!response.ok)return h.json(502,{error:'Drive asset verification failed ('+response.status+'): '+(file.error?.message||'Unknown error')},headers);
  if(!Array.isArray(file.parents)||!file.parents.includes(folderId))return h.json(403,{error:'Uploaded file is not inside the configured RIVIS Drive folder'},headers);
  const mime=String(file.mimeType||body.mimeType||''),assetType=String(body.assetType||'reference'),rasterMime=['image/png','image/jpeg','image/webp','image/gif'].includes(mime),svgReference=mime==='image/svg+xml'&&assetType==='reference';
  if(!rasterMime&&!svgReference)return h.json(415,{error:'Only PNG, JPEG, WEBP, or GIF images are accepted; SVG is supported for reference assets only'},headers);
  const size=Number(file.size||body.size||0);if(body.size!==undefined&&Number(body.size)!==size)return h.json(409,{error:'Drive upload size does not match the initialized asset size',expectedSize:Number(body.size),actualSize:size,driveFileId:file.id},headers);
  return h.json(200,{ok:true,storageMode:'drive-json',asset:{assetId:body.assetId,ideaId:body.ideaId,sceneId:body.sceneId||'',assetType,driveFileId:file.id,fileName:file.name||body.fileName,mimeType:mime,format:mime==='image/svg+xml'?'svg':(mime.split('/')[1]||''),fileSizeBytes:size,webViewLink:file.webViewLink||'',width:body.width||null,height:body.height||null,megapixels:body.megapixels||null,version:body.version||1,isActive:body.isActive??true,createdAt:new Date().toISOString(),sourceAssetId:body.sourceAssetId||''}},headers);
 }catch(error){const timeout=error?.name==='AbortError'||error?.name==='TimeoutError';return h.json(timeout?504:502,{error:timeout?'Drive asset verification timed out (16 s).':(error.message||'Drive asset verification failed')},headers);}
};
