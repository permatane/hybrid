'use strict';
const crypto=require('node:crypto');
const h=require('./_shared.cjs');
const safeName=s=>String(s||'rivis-asset').replace(/[^a-zA-Z0-9._-]+/g,'_').slice(0,120);
exports.handler=async(event)=>{
 if(event.httpMethod!=='POST')return h.json(405,{error:'Method not allowed'});
 const origin=event.headers?.origin||event.headers?.Origin||'';
 if(origin!==h.baseUrl())return h.json(403,{error:'Invalid request origin'});
 const state=await h.activeSession(event);if(state.error)return h.json(401,{error:state.error});
 const headers=state.newCookie?{'Set-Cookie':state.newCookie}:{};
 try{
  const body=JSON.parse(event.body||'{}');
  const folderId=process.env.RIVIS_DRIVE_FOLDER_ID||'';
  if(!h.validFileId(folderId))return h.json(500,{error:'RIVIS Drive folder is not configured'},headers);
  if(!h.validFileId(body.ideaId))return h.json(400,{error:'Invalid ideaId'},headers);
  const assetId=body.assetId&&/^[A-Za-z0-9_-]{1,128}$/.test(body.assetId)?body.assetId:'as_'+crypto.randomBytes(9).toString('hex');
  const mime=String(body.mimeType||'');
  const assetType=String(body.assetType||'reference');
  const rasterMime=['image/png','image/jpeg','image/webp','image/gif'].includes(mime);
  const svgReference=mime==='image/svg+xml'&&assetType==='reference';
  if(!rasterMime&&!svgReference)return h.json(415,{error:'Only PNG, JPEG, WEBP, or GIF images are accepted; SVG is supported for reference assets only'},headers);
  const size=Number(body.size);
  if(!Number.isSafeInteger(size)||size<1||size>100*1024*1024)return h.json(413,{error:'Asset size must be between 1 byte and 100 MB'},headers);
  const fileName=safeName(body.fileName||assetId+'.'+(mime.split('/')[1]||'png'));
  const metadata={name:assetId+'_'+fileName,mimeType:mime,parents:[folderId],description:'RIVIS Cloud Asset · Idea '+body.ideaId+' · '+assetType};
  // Reuse a previously uploaded Drive file when indexing failed on an earlier attempt.
  // This requires a stable assetId derived from idea + type + image fingerprint.
  try {
   const q=`trashed = false and name = '${metadata.name}' and '${folderId}' in parents`;
   const lookup='https://www.googleapis.com/drive/v3/files?q='+encodeURIComponent(q)+'&fields='+encodeURIComponent('files(id,name,mimeType,size,parents),nextPageToken')+'&pageSize=15&supportsAllDrives=true&includeItemsFromAllDrives=true';
   const lookupControl=new AbortController();const lookupTimer=setTimeout(()=>lookupControl.abort(),7000);
   let matches;try{matches=await fetch(lookup,{headers:{Authorization:'Bearer '+state.session.access_token},signal:lookupControl.signal});}finally{clearTimeout(lookupTimer);}
   if(matches.ok){
    const found=await matches.json();
    const match=(found.files||[]).find(x=>x.id&&x.name===metadata.name&&x.mimeType===mime&&Number(x.size)===size&&(x.parents||[]).includes(folderId));
    if(match)return h.json(200,{ok:true,recovered:true,existingFileId:match.id,assetId,ideaId:body.ideaId,fileName,mimeType:mime,size,
      assetType,sceneId:String(body.sceneId||''),width:Number(body.width)||null,height:Number(body.height)||null,megapixels:Number(body.megapixels)||null,version:Number(body.version)||1,sourceAssetId:String(body.sourceAssetId||'')},headers);
   }
  }catch(_){/* The lookup is optional; an inaccessible/missing index must not block a fresh upload. */}

  const url='https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id,name,mimeType,webViewLink,size';
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),18000);
  let response;
  try{response=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+state.session.access_token,'Content-Type':'application/json; charset=UTF-8','X-Upload-Content-Type':mime,'X-Upload-Content-Length':String(size)},body:JSON.stringify(metadata),signal:controller.signal});}
  finally{clearTimeout(timer);}
  const location=response.headers?.get?.('location')||response.headers?.get?.('Location')||'';
  if(!response.ok||!location){const error=await response.json().catch(()=>({}));return h.json(502,{error:'Could not start Google Drive resumable upload ('+response.status+'): '+(error.error?.message||'Google Drive did not return an upload session')},headers);}
  if(!/^https:\/\/www\.googleapis\.com\/upload\/drive\/v3\/files\?/.test(location))return h.json(502,{error:'Google Drive returned an unexpected upload session URL'},headers);
  return h.json(200,{ok:true,assetId,ideaId:body.ideaId,fileName,mimeType:mime,size,uploadUrl:location,assetType,sceneId:String(body.sceneId||''),width:Number(body.width)||null,height:Number(body.height)||null,megapixels:Number(body.megapixels)||null,version:Number(body.version)||1,sourceAssetId:String(body.sourceAssetId||'')},headers);
 }catch(error){const timeout=error?.name==='AbortError'||error?.name==='TimeoutError';return h.json(timeout?504:502,{error:timeout?'Google Drive resumable upload initialization timed out (18 s).':(error.message||'Drive upload initialization failed')},headers);}
};
