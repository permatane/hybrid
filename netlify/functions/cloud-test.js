'use strict';
const h=require('./_shared.cjs');
exports.handler=async(event)=>{
 if(!h.onlyGet(event))return h.json(405,{error:'Method not allowed'});
 if(event.queryStringParameters?.folderId||event.queryStringParameters?.sheetId)return h.json(400,{error:'Cloud Gateway uses the Drive folder configured in Netlify; custom IDs are not accepted.'});
 const folderId=process.env.RIVIS_DRIVE_FOLDER_ID||'';if(!h.validFileId(folderId))return h.json(500,{error:'Configure a valid RIVIS_DRIVE_FOLDER_ID in Netlify Environment Variables.'});
 const state=await h.activeSession(event);if(state.error)return h.json(401,{error:state.error});
 const headers=state.newCookie?{'Set-Cookie':state.newCookie}:{};
 try{
  const url='https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(folderId)+'?fields=id,name,mimeType,capabilities(canAddChildren)&supportsAllDrives=true';
  const response=await fetch(url,{headers:{Authorization:'Bearer '+state.session.access_token}}),folder=await response.json().catch(()=>({}));
  if(!response.ok)return h.json(502,{error:'Google Drive access verification failed ('+response.status+'): '+(folder.error?.message||'access denied')},headers);
  if(folder.mimeType!=='application/vnd.google-apps.folder')return h.json(400,{error:'Configured RIVIS_DRIVE_FOLDER_ID is not a Google Drive folder.'},headers);
  if(folder.capabilities?.canAddChildren===false)return h.json(403,{error:'Connected Google account does not have permission to write to the configured Drive folder.'},headers);
  return h.json(200,{ok:true,storageMode:'drive-json',folder:{name:folder.name,type:folder.mimeType},legacyMigrationAvailable:h.validFileId(process.env.RIVIS_SPREADSHEET_ID||'')},headers);
 }catch(error){return h.json(502,{error:'Cannot reach Google Drive: '+(error.message||'network error')},headers);}
};
