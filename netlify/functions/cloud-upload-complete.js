'use strict';
const h=require('./_shared.cjs');
const now=()=>new Date().toISOString();
const validText=(v,max=500)=>String(v??'').slice(0,max);
async function googleFetch(url,options={},timeout=16000){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeout);try{return await fetch(url,{...options,signal:controller.signal});}finally{clearTimeout(timer);}}
exports.handler=async(event)=>{
 if(event.httpMethod!=='POST')return h.json(405,{error:'Method not allowed'});
 const origin=event.headers?.origin||event.headers?.Origin||'';
 if(origin!==h.baseUrl())return h.json(403,{error:'Invalid request origin'});
 const state=await h.activeSession(event);if(state.error)return h.json(401,{error:state.error});
 const headers=state.newCookie?{'Set-Cookie':state.newCookie}:{};
 try{
  const body=JSON.parse(event.body||'{}');
  const folderId=process.env.RIVIS_DRIVE_FOLDER_ID||'',spreadsheetId=process.env.RIVIS_SPREADSHEET_ID||'';
  if(!h.validFileId(folderId)||!h.validFileId(spreadsheetId))return h.json(500,{error:'RIVIS Drive folder or spreadsheet is not configured'},headers);
  if(!h.validFileId(body.ideaId)||!h.validFileId(body.driveFileId)||!h.validFileId(body.assetId))return h.json(400,{error:'Invalid idea, asset, or Drive file ID'},headers);
  const metaRes=await googleFetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(body.driveFileId)+'?fields=id,name,mimeType,size,parents,webViewLink&supportsAllDrives=true',{headers:{Authorization:'Bearer '+state.session.access_token}});
  const file=await metaRes.json().catch(()=>({}));
  if(!metaRes.ok)return h.json(502,{error:'Drive asset verification failed ('+metaRes.status+'): '+(file.error?.message||'Unknown error')},headers);
  if(!Array.isArray(file.parents)||!file.parents.includes(folderId))return h.json(403,{error:'Uploaded file is not inside the configured RIVIS Drive folder'},headers);
  const mime=String(file.mimeType||body.mimeType||'');
  const assetType=String(body.assetType||'reference');
  const rasterMime=['image/png','image/jpeg','image/webp','image/gif'].includes(mime);
  const svgReference=mime==='image/svg+xml'&&assetType==='reference';
  if(!rasterMime&&!svgReference)return h.json(415,{error:'Only PNG, JPEG, WEBP, or GIF images are accepted; SVG is supported for reference assets only'},headers);
  const size=Number(file.size||body.size||0);
  if(body.size!==undefined&&Number(body.size)!==size)return h.json(409,{error:'Drive upload size does not match the initialized asset size',expectedSize:Number(body.size),actualSize:size,driveFileId:file.id},headers);
  const row=[validText(body.assetId,128),validText(body.ideaId,128),validText(body.sceneId,128),validText(assetType,80),validText(file.id,128),validText(file.name||body.fileName,500),validText(mime,120),validText(mime==='image/svg+xml'?'svg':(mime.split('/')[1]||''),40),validText(body.width||'',30),validText(body.height||'',30),validText(body.megapixels||'',30),String(size),String(body.version||1),String(body.isActive??true),now(),validText(body.sourceAssetId,128)];
  const readRange="'ASSETS'!A:Q";
  const writeRange="'ASSETS'!A:P";
  const read=await googleFetch('https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(spreadsheetId)+'/values/'+encodeURIComponent(readRange),{headers:{Authorization:'Bearer '+state.session.access_token}});
  const readData=await read.json().catch(()=>({}));
  if(!read.ok)return h.json(502,{error:'Could not read ASSETS index ('+read.status+'): '+(readData.error?.message||'Google Sheets API error')},headers);
  const rows=Array.isArray(readData.values)?readData.values:[];
  // Repair legacy ASSETS rows that Gateway 1.3.0 appended one column too far right.
  for(let i=1;i<rows.length;i++){
   const row=rows[i]||[];
   if(String(row[0]||'').trim()!==''||!/^[A-Za-z0-9_-]{1,128}$/.test(String(row[1]||'')))continue;
   const repaired=row.slice(1,17);while(repaired.length<16)repaired.push('');
   const repairUrl='https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(spreadsheetId)+'/values/'+encodeURIComponent("'ASSETS'!A"+(i+1)+':Q'+(i+1))+'?valueInputOption=RAW';
   const repairRes=await googleFetch(repairUrl,{method:'PUT',headers:{Authorization:'Bearer '+state.session.access_token,'Content-Type':'application/json'},body:JSON.stringify({majorDimension:'ROWS',values:[[...repaired,'']]})});
   const repairData=await repairRes.json().catch(()=>({}));
   if(!repairRes.ok)return h.json(502,{error:'Legacy shifted ASSETS row repair failed ('+repairRes.status+'): '+(repairData.error?.message||'Google Sheets API error'),driveFileId:file.id},headers);
   rows[i]=repaired;
  }
  const index=rows.findIndex((r,i)=>i>0&&String(r[0]||'')===String(body.assetId));
  let writeUrl,method;
  if(index>0){method='PUT';writeUrl='https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(spreadsheetId)+'/values/'+encodeURIComponent("'ASSETS'!A"+(index+1)+':P'+(index+1))+'?valueInputOption=RAW';}
  else{method='POST';writeUrl='https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(spreadsheetId)+'/values/'+encodeURIComponent(writeRange)+':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS';}
  const write=await googleFetch(writeUrl,{method,headers:{Authorization:'Bearer '+state.session.access_token,'Content-Type':'application/json'},body:JSON.stringify({majorDimension:'ROWS',values:[row]})});
  const writeRaw=await write.text();
  let writeData={};try{writeData=writeRaw?JSON.parse(writeRaw):{};}catch(_){writeData={raw:writeRaw.slice(0,1200)};}
  const writeError=writeData.error||writeData;
  const writeDetails=Array.isArray(writeError.details)?writeError.details.map(x=>x.message||x.reason||JSON.stringify(x)).join(' | '):'';
  const writeReason=[writeError.message,writeError.status,writeDetails,writeData.raw].filter(Boolean).join(' · ').slice(0,1200);
  if(!write.ok)return h.json(502,{error:'Drive upload completed but ASSETS index update failed ('+write.status+'): '+(writeReason||'Google Sheets API returned no error details'),googleStatus:write.status,googleReason:writeError.status||'',driveFileId:file.id},headers);
  return h.json(200,{ok:true,asset:{assetId:body.assetId,ideaId:body.ideaId,sceneId:body.sceneId||'',assetType,driveFileId:file.id,fileName:file.name,mimeType:mime,fileSizeBytes:size,webViewLink:file.webViewLink||'',width:body.width||null,height:body.height||null,megapixels:body.megapixels||null,version:body.version||1}},headers);
 }catch(error){const timeout=error?.name==='AbortError'||error?.name==='TimeoutError';return h.json(timeout?504:502,{error:timeout?'Cloud ASSETS indexing request to Google timed out (16 s). Re-run indexing without re-uploading.':(error.message||'Cloud ASSETS indexing failed')},headers);}
};
