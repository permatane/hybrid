'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const h=require('../netlify/functions/_shared.cjs');
const start=require('../netlify/functions/auth-start.js').handler;
const callback=require('../netlify/functions/auth-callback.js').handler;
const cloudTest=require('../netlify/functions/cloud-test.js').handler;
const cloudData=require('../netlify/functions/cloud-data.js').handler;
const cloudDownload=require('../netlify/functions/cloud-download.js').handler;
const cloudUploadInit=require('../netlify/functions/cloud-upload-init.js').handler;
const cloudUploadChunk=require('../netlify/functions/cloud-upload-chunk.js').handler;
const cloudUploadComplete=require('../netlify/functions/cloud-upload-complete.js').handler;
const cloudThumbnail=require('../netlify/functions/cloud-thumbnail.js').handler;
const gatewayConfig=require('../netlify/functions/gateway-config.js').handler;
const root=path.join(__dirname,'..');
const oldEnv={...process.env};
function setEnv() {process.env.RIVIS_SESSION_SECRET=crypto.randomBytes(32).toString('base64');process.env.GOOGLE_CLIENT_ID='test.apps.googleusercontent.com';process.env.GOOGLE_CLIENT_SECRET='client_secret_test';process.env.RIVIS_DRIVE_FOLDER_ID='folder12345';process.env.RIVIS_SPREADSHEET_ID='sheet12345';delete process.env.RIVIS_BASE_URL;}
function getCookie(resp,name) {return resp.multiValueHeaders['Set-Cookie'].find(x=>x.startsWith(name+'='));}
function parseValue(value) {return decodeURIComponent(value.split(';')[0].split('=').slice(1).join('='));}
const expectedHeaders = {
  IDEAS:['Idea ID','Card Code','Title','Production Type','Data Type','Category','Subcategory','Visual Style','Asset Type','Color Palette','Target Buyer','Design Need','Commercial Value Score','Status','Created At','Updated At','Parent Idea ID','Drive Folder ID','Cover Asset ID','Active Prompt ID','Notes'],
  PROMPTS:['Prompt ID','Idea ID','Prompt Type','Version','Simple Prompt','Visual Prompt','Final Prompt','Reference Asset ID','Active Version','Created At','Updated At','Notes'],
  ASSETS:['Asset ID','Idea ID','Scene ID','Asset Type','Drive File ID','File Name','MIME Type','Format','Width px','Height px','Megapixels','File Size Bytes','Version','Is Active','Created At','Source Asset ID'],
  GROUPS:['Group ID','Idea ID','Group Type','Group Title','Series Bible','Continuity Lock','Visual Style','Color Palette','Character Description','Location','Scene Count','Created At','Updated At'],
  'GROUP ITEMS':['Item ID','Group ID','Idea ID','Sequence','Scene ID','Scene Title','Scene Action','Prompt ID','Active Asset ID','Generation Status','Created At','Updated At'],
  'GENERATION LOG':['Run ID','Idea ID','Scene ID','Prompt ID','Prompt Version','AI Provider','Model','Resolution','Aspect Ratio','Generation Date','Status','Output Asset ID','Error Message']
};
function sheetHeaderResponse(url) {
  const range = decodeURIComponent(String(url).split('/values/')[1] || '');
  const tab = range.match(/^'?(.+?)'?!A1:/)?.[1]?.replace(/^'|'$/g,'');
  return {ok:true,status:200,json:async()=>({values:[expectedHeaders[tab]||[]]})};
}

function freshCloudData(){delete require.cache[require.resolve('../netlify/functions/cloud-data.js')];return require('../netlify/functions/cloud-data.js').handler;}
function driveJsonMock(options={}){
 const files=new Map();let seq=0;
 const response=(body,status=200,etag='"rev-1"')=>({ok:status>=200&&status<300,status,headers:{get:key=>key.toLowerCase()==='etag'?etag:null},text:async()=>typeof body==='string'?body:JSON.stringify(body),json:async()=>typeof body==='string'?JSON.parse(body):body});
 const fetch=async(url,opts={})=>{
  const uri=String(url),method=opts.method||'GET';
  if(uri.includes('sheets.googleapis.com')){
   if(!options.legacy)throw Error('Unexpected Sheets access after JSON mode: '+uri);
   const ranges=new URL(uri).searchParams.getAll('ranges');
   return response({valueRanges:ranges.map(range=>{
    const tab=Object.keys(expectedHeaders).find(name=>range.includes("'"+name+"'!"));
    const values=tab==='IDEAS'?[expectedHeaders.IDEAS,options.legacyIdea]:[expectedHeaders[tab]||[]];
    return{range,values};
   })});
  }
  if(uri.includes('/drive/v3/files?q=')){
   const nameMatch=uri.match(/name%20%3D%20%27([^%]+)%27/),name=nameMatch?decodeURIComponent(nameMatch[1]):'';
   return response({files:[...files.values()].filter(x=>x.name===name&&x.parents.includes('folder12345')).map(x=>({id:x.id,name:x.name,mimeType:x.mimeType,parents:x.parents,version:1}))});
  }
  if(uri.includes('/upload/drive/v3/files?uploadType=multipart')){
   const boundary=(opts.headers['Content-Type']||'').split('boundary=')[1],parts=String(opts.body).split('--'+boundary);
   const metaPart=parts[1]||'',contentPart=parts[2]||'';
   const meta=JSON.parse(metaPart.slice(metaPart.indexOf('\r\n\r\n')+4).trim());
   const payloadStart=contentPart.indexOf('\r\n\r\n')+4,payloadEnd=contentPart.lastIndexOf('\r\n');
   const doc=JSON.parse(contentPart.slice(payloadStart,payloadEnd));
   const id=(meta.name==='RIVIS_CLOUD_CATALOG.json'?'catalog_':'idea_')+String(++seq).padStart(8,'0');
   const file={id,name:meta.name,mimeType:meta.mimeType,parents:meta.parents,description:meta.description||'',doc,etag:'"rev-1"'};
   files.set(id,file);return response({id,name:file.name,mimeType:file.mimeType,parents:file.parents});
  }
  const updateMatch=uri.match(/\/upload\/drive\/v3\/files\/([^?]+)/);
  if(updateMatch&&uri.includes('uploadType=media')&&method==='PATCH'){
   const file=files.get(decodeURIComponent(updateMatch[1]));if(!file)return response({error:{message:'not found'}},404);
   file.doc=JSON.parse(opts.body);file.etag='"rev-'+(Number(file.etag.match(/(\d+)/)?.[1]||1)+1)+'"';
   return response({id:file.id,name:file.name,mimeType:file.mimeType,modifiedTime:new Date().toISOString(),version:2},200,file.etag);
  }
  const metaMatch=uri.match(/\/drive\/v3\/files\/([^?]+)/);
  if(metaMatch){
   const id=decodeURIComponent(metaMatch[1]),file=files.get(id);
   if(!file)return response({error:{message:'not found'}},404);
   if(method==='DELETE'){files.delete(id);return response({},204);}
   if(method==='PATCH'&&opts.body){
    const patch=JSON.parse(String(opts.body));
    if(patch.trashed===true){file.trashed=true;return response({id:file.id,trashed:true},200,file.etag);}
   }
   if(uri.includes('alt=media'))return response(JSON.stringify(file.doc),200,file.etag);
   return response({id:file.id,name:file.name,mimeType:file.mimeType,parents:file.parents,description:file.description||'',trashed:file.trashed===true,version:1},200,file.etag);
  }
  throw Error('Unexpected Drive mock URL '+uri+' '+method);
 };
 return {fetch,files,response};
}
test('VectorichQC source is not published in RIVIS GitHub source root',()=>{
  const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
  assert.match(html,/https:\/\/vectorichqc-prv\.pages\.dev\//);
  assert.doesNotMatch(html,/<script\b|Vectorich QC Studio v4\.02|Content-Security-Policy/);
  assert.ok(Buffer.byteLength(html)<2048,'Only the Cloudflare redirect should be public');
});
test('AES-GCM session: auth and tamper detection',()=>{
  setEnv();const obj={access_token:'secret_token',refresh_token:'refresh_test',expires_at:1234};
  const cipher=h.seal(obj);assert.deepEqual(h.unseal(cipher),obj);
  const bytes=Buffer.from(cipher,'base64url');bytes[bytes.length-1]^=0x1;
  assert.equal(h.unseal(bytes.toString('base64url')),null);
  process.env= {...oldEnv};
});
test('OAuth start uses stable redirect URI, offline flow, and state cookie',async()=>{
  setEnv();const response=await start({httpMethod:'GET'});
  assert.equal(response.statusCode,302);
  const login=new URL(response.headers.Location);
  assert.equal(login.origin,'https://accounts.google.com');
  assert.equal(login.searchParams.get('redirect_uri'),'https://vectorichqc2026.netlify.app/rivis-cloud/callback');
  assert.equal(login.searchParams.get('access_type'),'offline');
  assert.equal(login.searchParams.get('scope'),h.DRIVE_SCOPE);
  const cookie=getCookie(response,h.COOKIE_STATE);
  assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Lax/);
  assert.equal(login.searchParams.get('state'),parseValue(cookie));
});
test('OAuth callback rejects invalid state without token exchange',async()=>{
  setEnv();const res=await callback({httpMethod:'GET',headers:{cookie:h.COOKIE_STATE+'=bad'},queryStringParameters:{state:'wrong',code:'some_code'}});
  assert.equal(res.statusCode,302);assert.match(res.headers.Location,/auth=failed/);
});
test('OAuth callback exchanges code then puts access + refresh token in encrypted cookie',async()=>{
  setEnv();const originalFetch=global.fetch;
  global.fetch=async(url,opts)=>{
    assert.equal(url,'https://oauth2.googleapis.com/token');
    const params=new URLSearchParams(opts.body);assert.equal(params.get('grant_type'),'authorization_code');
    return {ok:true,json:async()=>({access_token:'token_test',refresh_token:'refresh_test',expires_in:3600})};
  };
  try {
    const state='x'.repeat(40);
    const res=await callback({httpMethod:'GET',headers:{cookie:h.COOKIE_STATE+'='+state},queryStringParameters:{state,code:'test_code'}});
    assert.equal(res.statusCode,302);
    const session=getCookie(res,h.COOKIE_SESSION);assert.ok(session);
    assert.ok(!session.includes('token_test'));
    const decrypted=h.unseal(parseValue(session));
    assert.equal(decrypted.access_token,'token_test');assert.equal(decrypted.refresh_token,'refresh_test');
  } finally{global.fetch=originalFetch;}
});
test('Cloud test rejects file ID containing URL before any fetch',async()=>{
  const result=await cloudTest({httpMethod:'GET',queryStringParameters:{folderId:'https://evil.example',sheetId:'defghijk'}});
  assert.equal(result.statusCode,400);
});
test('Cloud test verifies the configured Drive folder only for JSON storage',async()=>{
 setEnv();const session=h.seal({access_token:'token_test',refresh_token:'refresh_test',expires_at:Date.now()+3600000}),orig=global.fetch;let calls=0;
 global.fetch=async(url,opts)=>{calls++;assert.equal(opts.headers.Authorization,'Bearer token_test');return{ok:true,status:200,json:async()=>({id:'folder12345',name:'RIVIS CLOUD GALLERY',mimeType:'application/vnd.google-apps.folder',capabilities:{canAddChildren:true}})};};
 try{const res=await cloudTest({httpMethod:'GET',headers:{cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session)}});const body=JSON.parse(res.body);assert.equal(res.statusCode,200);assert.equal(body.ok,true);assert.equal(body.storageMode,'drive-json');assert.equal(body.folder.name,'RIVIS CLOUD GALLERY');assert.equal(body.legacyMigrationAvailable,true);assert.equal(calls,1);}
 finally{global.fetch=orig;process.env={...oldEnv};}
});

test('Cloud test rejects a Drive folder without write permission',async()=>{
 setEnv();const session=h.seal({access_token:'token_test',refresh_token:'refresh_test',expires_at:Date.now()+3600000}),orig=global.fetch;
 global.fetch=async()=>({ok:true,status:200,json:async()=>({id:'folder12345',name:'RIVIS',mimeType:'application/vnd.google-apps.folder',capabilities:{canAddChildren:false}})});
 try{const res=await cloudTest({httpMethod:'GET',headers:{cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session)}});assert.equal(res.statusCode,403);}
 finally{global.fetch=orig;process.env={...oldEnv};}
});

test('Gateway config never exposes OAuth secret and reports automatic storage readiness',async()=>{
  setEnv();const res=await gatewayConfig({httpMethod:'GET'});
  assert.equal(res.statusCode,200);assert.ok(!res.body.includes('client_secret_test'));assert.equal(JSON.parse(res.body).storageConfigured,true);assert.equal(JSON.parse(res.body).gatewayVersion,'1.3.8');
});



test('Cloud data saves an idea and catalog as separate Drive JSON files, then lists and loads it',async()=>{
 setEnv();delete process.env.RIVIS_SPREADSHEET_ID;
 const session=h.seal({access_token:'token_test',refresh_token:'refresh_test',expires_at:Date.now()+3600000}),orig=global.fetch,mock=driveJsonMock();global.fetch=mock.fetch;
 try{
  const handler=freshCloudData(),headers={cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session),origin:'https://vectorichqc2026.netlify.app'};
  const saved=await handler({httpMethod:'POST',headers,body:JSON.stringify({action:'save',idea:{ideaId:'idea_12345678',conceptName:'Test Concept',simplePrompt:'clean vector',finalGenerationPrompt:'flat vector illustration'},prompts:[{promptId:'prompt_1',simplePrompt:'clean vector',finalPrompt:'flat vector illustration'}]})});
  assert.equal(saved.statusCode,200,saved.body);const saveBody=JSON.parse(saved.body);assert.equal(saveBody.storageMode,'drive-json');assert.equal(saveBody.result.idea,'created');assert.equal(saveBody.result.prompts,1);
  const names=[...mock.files.values()].map(x=>x.name);assert.ok(names.includes('RIVIS_CLOUD_CATALOG.json'));assert.ok(names.includes('RIVIS_IDEA_idea_12345678.json'));
  const listed=await handler({httpMethod:'GET',headers,queryStringParameters:{action:'list'}});const listBody=JSON.parse(listed.body);assert.equal(listed.statusCode,200);assert.equal(listBody.ideas.length,1);assert.equal(listBody.ideas[0].conceptName,'Test Concept');
  const loaded=await handler({httpMethod:'GET',headers,queryStringParameters:{action:'load',ideaId:'idea_12345678'}});const loadBody=JSON.parse(loaded.body);assert.equal(loaded.statusCode,200);assert.equal(loadBody.idea.simplePrompt,'clean vector');assert.equal(loadBody.prompts[0].finalPrompt,'flat vector illustration');
 }finally{global.fetch=orig;process.env={...oldEnv};}
});

test('Cloud data migrates legacy Sheets records into per-idea JSON documents in resumable batches',async()=>{
 setEnv();const legacyIdea=Array(expectedHeaders.IDEAS.length).fill('');
 legacyIdea[0]='idea_legacy123';legacyIdea[1]='RV-LEGACY';legacyIdea[2]='Legacy Cloud Idea';legacyIdea[13]='Saved';legacyIdea[14]='2026-11-19T00:00:00.000Z';legacyIdea[15]='2026-11-19T00:00:00.000Z';legacyIdea[20]=JSON.stringify({ideaId:'idea_legacy123',conceptName:'Legacy Cloud Idea',simplePrompt:'legacy prompt'});
 const session=h.seal({access_token:'token_test',refresh_token:'refresh_test',expires_at:Date.now()+3600000}),orig=global.fetch,mock=driveJsonMock({legacy:true,legacyIdea});global.fetch=mock.fetch;
 try{
  const handler=freshCloudData(),headers={cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session),origin:'https://vectorichqc2026.netlify.app'};
  const first=await handler({httpMethod:'GET',headers,queryStringParameters:{action:'list'}});assert.equal(JSON.parse(first.body).migrationRequired,true);
  const migration=await handler({httpMethod:'POST',headers,body:JSON.stringify({action:'migrate',limit:8})});const state=JSON.parse(migration.body).migration;assert.equal(migration.statusCode,200);assert.equal(state.done,true);assert.equal(state.migrated,1);
  const listed=await handler({httpMethod:'GET',headers,queryStringParameters:{action:'list'}});const data=JSON.parse(listed.body);assert.equal(data.ideas.length,1);assert.equal(data.ideas[0].ideaId,'idea_legacy123');
  const loaded=await handler({httpMethod:'GET',headers,queryStringParameters:{action:'load',ideaId:'idea_legacy123'}});assert.equal(loaded.statusCode,200);assert.equal(JSON.parse(loaded.body).idea.simplePrompt,'legacy prompt');
 }finally{global.fetch=orig;process.env={...oldEnv};}
});

test('Cloud data delete trashes the image but permanently removes its JSON and catalog entry',async()=>{
 setEnv();delete process.env.RIVIS_SPREADSHEET_ID;
 const session=h.seal({access_token:'token_test',refresh_token:'refresh_test',expires_at:Date.now()+3600000}),orig=global.fetch,mock=driveJsonMock();global.fetch=mock.fetch;
 try{
  const handler=freshCloudData(),headers={cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session),origin:'https://vectorichqc2026.netlify.app'};
  mock.files.set('drive_asset_123',{id:'drive_asset_123',name:'asset_keep_original.png',mimeType:'image/png',parents:['folder12345'],description:'RIVIS Cloud Asset · Idea idea_delete123 · generated'});
  await handler({httpMethod:'POST',headers,body:JSON.stringify({action:'save',idea:{ideaId:'idea_delete123',conceptName:'Delete Fixture'},assets:[{assetId:'asset_keep',ideaId:'idea_delete123',driveFileId:'drive_asset_123',assetType:'generated'}]})});
  const deleted=await handler({httpMethod:'POST',headers,body:JSON.stringify({action:'delete',ideaId:'idea_delete123'})});assert.equal(deleted.statusCode,200,deleted.body);
  assert.equal(JSON.parse(deleted.body).permanent,true);
   assert.equal(JSON.parse(deleted.body).assetDisposition,'trash');
   assert.equal(JSON.parse(deleted.body).trashedDriveFiles,1);
   assert.equal(JSON.parse(deleted.body).deletedDriveFiles,1);
  const listed=await handler({httpMethod:'GET',headers,queryStringParameters:{action:'list'}});assert.deepEqual(JSON.parse(listed.body).ideas,[]);
  assert.equal(mock.files.get('drive_asset_123')?.trashed,true,'Image remains recoverable in Drive Trash');
  assert.equal([...mock.files.values()].some(x=>x.name==='RIVIS_IDEA_idea_delete123.json'),false);
  assert.equal([...mock.files.values()].some(x=>x.name==='RIVIS_CLOUD_CATALOG.json'),true);
 }finally{global.fetch=orig;process.env={...oldEnv};}
});

test('Cloud data stores series prompts, groups, and scene items inside one JSON document',async()=>{
 setEnv();delete process.env.RIVIS_SPREADSHEET_ID;
 const session=h.seal({access_token:'token_test',refresh_token:'refresh_test',expires_at:Date.now()+3600000}),orig=global.fetch,mock=driveJsonMock();global.fetch=mock.fetch;
 try{
  const handler=freshCloudData(),headers={cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session),origin:'https://vectorichqc2026.netlify.app'};
  const res=await handler({httpMethod:'POST',headers,body:JSON.stringify({action:'save',idea:{ideaId:'series_12345678',conceptName:'Test Series',productionType:'series',seriesLength:2,seriesScenes:[{sceneId:'scene_1',sceneTitle:'Arrival'},{sceneId:'scene_2',sceneTitle:'Departure'}]},prompts:[{promptId:'p1',simplePrompt:'scene 1'},{promptId:'p2',simplePrompt:'scene 2'}],assets:[{assetId:'a1',sceneId:'scene_1',assetType:'generated',isActive:'true',driveFileId:'drive_scene_1',width:2048,height:2048},{assetId:'a2',sceneId:'scene_2',assetType:'generated',isActive:'true',driveFileId:'drive_scene_2',width:2048,height:2048}],groups:[{groupId:'g1',groupTitle:'Series'}],groupItems:[{itemId:'i1',groupId:'g1',sceneTitle:'Arrival'}]})});
  assert.equal(res.statusCode,200,res.body);const doc=[...mock.files.values()].find(x=>x.name==='RIVIS_IDEA_series_12345678.json').doc;
  assert.equal(doc.prompts.length,2);assert.equal(doc.groups.length,1);assert.equal(doc.groupItems.length,1);
  assert.equal(doc.assets.length,2,'Original Drive JSON retains both full assets');
  const listed=JSON.parse((await handler({httpMethod:'GET',headers,queryStringParameters:{action:'list'}})).body);
  assert.equal(listed.ideas.length,1);
  assert.equal(listed.ideas[0].productionType,'series');
  assert.equal(listed.ideas[0].seriesLength,2);
  assert.deepEqual(listed.ideas[0].seriesScenes.map(x=>x.sceneId),['scene_1','scene_2']);
  assert.deepEqual(listed.ideas[0].cloudAssets.filter(x=>x.sceneId).map(x=>x.driveFileId),['drive_scene_1','drive_scene_2']);
 }finally{global.fetch=orig;process.env={...oldEnv};}
});

test('Cloud download streams large assets as authenticated byte ranges',async()=>{
  setEnv();
  const session=h.seal({access_token:'token_test',refresh_token:'refresh_test',expires_at:Date.now()+3600000});
  const originalFetch=global.fetch;let mediaCalls=0;
  global.fetch=async(url,opts={})=>{
    assert.equal(opts.headers.Authorization,'Bearer token_test');
    if(String(url).includes('fields=id,mimeType,size,name'))return {ok:true,status:200,json:async()=>({id:'file12345',mimeType:'image/png',size:'1500000',name:'large.png'})};
    mediaCalls++;assert.match(String(url),/alt=media/);assert.equal(opts.headers.Range,'bytes=0-1048575');
    const bytes=Buffer.from([137,80,78,71,1,2,3]);
    return {ok:true,status:206,headers:{get:name=>name==='content-range'?'bytes 0-6/1500000':name==='content-type'?'image/png':null},arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};
  };
  try{
    const res=await cloudDownload({httpMethod:'GET',headers:{cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session),origin:'https://vectorichqc2026.netlify.app'},queryStringParameters:{fileId:'file12345',start:'0',chunkSize:'1048576'}});
    assert.equal(res.statusCode,200,res.body);const body=JSON.parse(res.body);assert.equal(body.mimeType,'image/png');assert.equal(body.totalBytes,1500000);assert.equal(body.done,false);assert.ok(body.base64);assert.equal(mediaCalls,1);
  }finally{global.fetch=originalFetch;process.env={...oldEnv};}
});

test('Cloud upload init creates a Google Drive resumable session without transferring image bytes through Netlify',async()=>{
  setEnv();
  const session=h.seal({access_token:'token_test',refresh_token:'refresh_test',expires_at:Date.now()+3600000});
  const originalFetch=global.fetch;let captured;
  global.fetch=async(url,opts={})=>{captured={url:String(url),opts};return {ok:true,status:200,headers:{get:name=>name.toLowerCase()==='location'?'https://www.googleapis.com/upload/drive/v3/files?upload_id=resume123':null}};};
  try{
    const res=await cloudUploadInit({httpMethod:'POST',headers:{cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session),origin:'https://vectorichqc2026.netlify.app'},body:JSON.stringify({ideaId:'idea_12345678',assetId:'asset_12345678',assetType:'generated',fileName:'large.png',mimeType:'image/png',size:12500000,width:4096,height:4096})});
    assert.equal(res.statusCode,200,res.body);const body=JSON.parse(res.body);assert.equal(body.size,12500000);assert.match(body.uploadUrl,/upload_id=resume123/);assert.equal(captured.opts.headers['X-Upload-Content-Length'],'12500000');assert.equal(captured.opts.headers.Authorization,'Bearer token_test');
  }finally{global.fetch=originalFetch;process.env={...oldEnv};}
});


test('Cloud upload init accepts SVG reference assets but rejects SVG generated assets',async()=>{
  setEnv();
  const session=h.seal({access_token:'token_test',refresh_token:'refresh_test',expires_at:Date.now()+3600000});
  const originalFetch=global.fetch;let uploadStarts=0;
  global.fetch=async(url,opts={})=>{
    if(String(url).includes('/drive/v3/files?q='))return{ok:true,status:200,json:async()=>({files:[]})};
    uploadStarts++;
    assert.equal(opts.headers['X-Upload-Content-Type'],'image/svg+xml');
    return{ok:true,status:200,headers:{get:name=>name.toLowerCase()==='location'?'https://www.googleapis.com/upload/drive/v3/files?upload_id=svg_resume123':null}};
  };
  try{
    const headers={cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session),origin:'https://vectorichqc2026.netlify.app'};
    const accepted=await cloudUploadInit({httpMethod:'POST',headers,body:JSON.stringify({ideaId:'idea_12345678',assetId:'asset_svg123456',assetType:'reference',fileName:'reference.svg',mimeType:'image/svg+xml',size:2048})});
    assert.equal(accepted.statusCode,200,accepted.body);assert.equal(JSON.parse(accepted.body).mimeType,'image/svg+xml');
    const rejected=await cloudUploadInit({httpMethod:'POST',headers,body:JSON.stringify({ideaId:'idea_12345678',assetId:'asset_svg123457',assetType:'generated',fileName:'generated.svg',mimeType:'image/svg+xml',size:2048})});
    assert.equal(rejected.statusCode,415);assert.match(JSON.parse(rejected.body).error,/reference assets only/i);assert.equal(uploadStarts,1);
  }finally{global.fetch=originalFetch;process.env={...oldEnv};}
});


test('Cloud upload completion verifies Drive asset and returns metadata without Google Sheets',async()=>{
 setEnv();delete process.env.RIVIS_SPREADSHEET_ID;
 const session=h.seal({access_token:'token_test',refresh_token:'refresh_test',expires_at:Date.now()+3600000}),orig=global.fetch;let calls=0;
 global.fetch=async(url,opts={})=>{calls++;assert.equal(opts.headers.Authorization,'Bearer token_test');assert.ok(String(url).includes('/drive/v3/files/file12345?fields='));return{ok:true,status:200,json:async()=>({id:'file12345',name:'asset_cover.png',mimeType:'image/png',size:'12500000',parents:['folder12345'],webViewLink:'https://drive.google.com/file/d/file12345/view'})};};
 try{
  const res=await cloudUploadComplete({httpMethod:'POST',headers:{cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session),origin:'https://vectorichqc2026.netlify.app'},body:JSON.stringify({ideaId:'idea_12345678',assetId:'asset_12345678',driveFileId:'file12345',assetType:'generated',mimeType:'image/png',size:12500000,width:4096,height:4096})});
  const body=JSON.parse(res.body);assert.equal(res.statusCode,200,res.body);assert.equal(body.storageMode,'drive-json');assert.equal(body.asset.fileSizeBytes,12500000);assert.equal(body.asset.driveFileId,'file12345');assert.equal(calls,1);
 }finally{global.fetch=orig;process.env={...oldEnv};}
});

test('Cloud upload completion accepts SVG reference metadata without spreadsheet configuration',async()=>{
 setEnv();delete process.env.RIVIS_SPREADSHEET_ID;
 const session=h.seal({access_token:'token_test',refresh_token:'refresh_test',expires_at:Date.now()+3600000}),orig=global.fetch;
 global.fetch=async()=>({ok:true,status:200,json:async()=>({id:'file_svg123',name:'reference.svg',mimeType:'image/svg+xml',size:'2048',parents:['folder12345']})});
 try{
  const res=await cloudUploadComplete({httpMethod:'POST',headers:{cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session),origin:'https://vectorichqc2026.netlify.app'},body:JSON.stringify({ideaId:'idea_12345678',assetId:'asset_svg123456',driveFileId:'file_svg123',assetType:'reference',mimeType:'image/svg+xml',size:2048,fileName:'reference.svg'})});
  const asset=JSON.parse(res.body).asset;assert.equal(res.statusCode,200);assert.equal(asset.mimeType,'image/svg+xml');assert.equal(asset.format,'svg');assert.equal(asset.assetType,'reference');
 }finally{global.fetch=orig;process.env={...oldEnv};}
});

test('Cloud upload chunk proxies binary data to the Google Drive resumable session and accepts final metadata',async()=>{
  setEnv();
  const session=h.seal({access_token:'token_test',refresh_token:'refresh_test',expires_at:Date.now()+3600000});
  const originalFetch=global.fetch;let captured;
  const bytes=Buffer.from([1,2,3,4]);
  global.fetch=async(url,opts={})=>{
    captured={url:String(url),opts};
    return{ok:true,status:201,headers:{get:()=>null},text:async()=>JSON.stringify({id:'file12345',name:'asset.png',mimeType:'image/png',size:'4',webViewLink:'https://drive.google.com/file/d/file12345/view'})};
  };
  try{
    const res=await cloudUploadChunk({
      httpMethod:'PUT',
      isBase64Encoded:true,
      headers:{
        cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session),
        origin:'https://vectorichqc2026.netlify.app',
        'x-rivis-upload-url':'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=resume123',
        'x-rivis-mime-type':'image/png',
        'content-range':'bytes 0-3/4'
      },
      body:bytes.toString('base64')
    });
    assert.equal(res.statusCode,200,res.body);
    const body=JSON.parse(res.body);assert.equal(body.ok,true);assert.equal(body.done,true);assert.equal(body.file.id,'file12345');
    assert.equal(captured.opts.headers.Authorization,'Bearer token_test');
    assert.equal(captured.opts.headers['Content-Range'],'bytes 0-3/4');
    assert.deepEqual(captured.opts.body,bytes);
  }finally{global.fetch=originalFetch;process.env={...oldEnv};}
});


test('Cloud upload chunk proxies SVG reference bytes with image/svg+xml content type',async()=>{
  setEnv();
  const session=h.seal({access_token:'token_test',refresh_token:'refresh_test',expires_at:Date.now()+3600000});
  const originalFetch=global.fetch;let captured;
  const bytes=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  global.fetch=async(url,opts={})=>{captured={url:String(url),opts};return{ok:true,status:201,headers:{get:()=>null},text:async()=>JSON.stringify({id:'file_svg123',name:'reference.svg',mimeType:'image/svg+xml',size:String(bytes.length)})};};
  try{
    const res=await cloudUploadChunk({httpMethod:'PUT',isBase64Encoded:true,headers:{cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session),origin:'https://vectorichqc2026.netlify.app','x-rivis-upload-url':'https://www.googleapis.com/upload/drive/v3/files?upload_id=svg_resume123','x-rivis-mime-type':'image/svg+xml','content-range':`bytes 0-${bytes.length-1}/${bytes.length}`},body:bytes.toString('base64')});
    assert.equal(res.statusCode,200,res.body);assert.equal(JSON.parse(res.body).file.mimeType,'image/svg+xml');assert.equal(captured.opts.headers['Content-Type'],'image/svg+xml');assert.deepEqual(captured.opts.body,bytes);
  }finally{global.fetch=originalFetch;process.env={...oldEnv};}
});

test('Cloud upload chunk treats Google Drive 308 Resume Incomplete as a successful partial chunk',async()=>{
  setEnv();
  const session=h.seal({access_token:'token_test',refresh_token:'refresh_test',expires_at:Date.now()+3600000});
  const originalFetch=global.fetch;
  global.fetch=async()=>({ok:false,status:308,headers:{get:name=>name.toLowerCase()==='range'?'bytes=0-262143':null},text:async()=>''});
  try{
    const bytes=Buffer.alloc(256*1024,7);
    const res=await cloudUploadChunk({
      httpMethod:'PUT',isBase64Encoded:true,
      headers:{cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session),origin:'https://vectorichqc2026.netlify.app',
        'x-rivis-upload-url':'https://www.googleapis.com/upload/drive/v3/files?upload_id=resume123',
        'x-rivis-mime-type':'image/png','content-range':'bytes 0-262143/524288'},
      body:bytes.toString('base64')
    });
    const body=JSON.parse(res.body);assert.equal(res.statusCode,200);assert.equal(body.ok,true);assert.equal(body.done,false);assert.equal(body.nextStart,262144);
  }finally{global.fetch=originalFetch;process.env={...oldEnv};}
});

test('Cloud upload chunk rejects non-Google upload URLs before making an outbound request',async()=>{
  setEnv();
  const session=h.seal({access_token:'token_test',refresh_token:'refresh_test',expires_at:Date.now()+3600000});
  const originalFetch=global.fetch;let called=false;global.fetch=async()=>{called=true;throw new Error('should not fetch');};
  try{
    const res=await cloudUploadChunk({httpMethod:'PUT',isBase64Encoded:true,headers:{
      cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session),origin:'https://vectorichqc2026.netlify.app',
      'x-rivis-upload-url':'https://evil.example/upload?upload_id=abc','x-rivis-mime-type':'image/png','content-range':'bytes 0-2/3'
    },body:Buffer.from([1,2,3]).toString('base64')});
    assert.equal(res.statusCode,400);assert.equal(called,false);
  }finally{global.fetch=originalFetch;process.env={...oldEnv};}
});

test('Cloud thumbnail endpoint returns a compact private Drive preview',async()=>{
  setEnv();
  const session=h.seal({access_token:'token_test',refresh_token:'refresh_test',expires_at:Date.now()+3600000});
  const originalFetch=global.fetch;
  global.fetch=async(url,opts={})=>{
    assert.equal(opts.headers.Authorization,'Bearer token_test');
    if(String(url).includes('fields=id,mimeType,thumbnailLink'))return {ok:true,status:200,json:async()=>({id:'file12345',mimeType:'image/png',thumbnailLink:'https://lh3.googleusercontent.com/thumb'})};
    const bytes=Buffer.from([255,216,255,217]);
    return {ok:true,status:200,headers:{get:()=> 'image/jpeg'},arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};
  };
  try{
    const res=await cloudThumbnail({httpMethod:'GET',headers:{cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session),origin:'https://vectorichqc2026.netlify.app'},queryStringParameters:{fileId:'file12345'}});
    assert.equal(res.statusCode,200,res.body);const body=JSON.parse(res.body);assert.equal(body.mimeType,'image/jpeg');assert.ok(body.base64);
  }finally{global.fetch=originalFetch;process.env={...oldEnv};}
});


test('Cloud thumbnail falls back to a bounded original SVG preview when Drive has no thumbnail',async()=>{
  setEnv();
  const session=h.seal({access_token:'token_test',refresh_token:'refresh_test',expires_at:Date.now()+3600000});
  const originalFetch=global.fetch;let mediaCalled=false;
  const svg=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>');
  global.fetch=async(url,opts={})=>{
    assert.equal(opts.headers.Authorization,'Bearer token_test');
    if(String(url).includes('fields=id,mimeType,thumbnailLink'))return{ok:true,status:200,json:async()=>({id:'file_svg123',mimeType:'image/svg+xml',size:String(svg.length)})};
    mediaCalled=true;return{ok:true,status:200,arrayBuffer:async()=>svg.buffer.slice(svg.byteOffset,svg.byteOffset+svg.byteLength)};
  };
  try{
    const res=await cloudThumbnail({httpMethod:'GET',headers:{cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session),origin:'https://vectorichqc2026.netlify.app'},queryStringParameters:{fileId:'file_svg123'}});
    assert.equal(res.statusCode,200,res.body);const body=JSON.parse(res.body);assert.equal(body.mimeType,'image/svg+xml');assert.equal(Buffer.from(body.base64,'base64').toString(),svg.toString());assert.equal(mediaCalled,true);
  }finally{global.fetch=originalFetch;process.env={...oldEnv};}
});

test('Gateway page exposes resumable upload, chunked download, thumbnails, and no manual Picker steps',()=>{
  const js=fs.readFileSync(path.join(root,'public/rivis-cloud/gateway.js'),'utf8');
  const html=fs.readFileSync(path.join(root,'public/rivis-cloud/index.html'),'utf8');
  assert.match(js,/d\.command === 'upload'/);
  assert.match(js,/cloud-upload-init/);
  assert.match(js,/cloud-upload-complete/);
  assert.match(js,/cloud-upload-chunk/);
  assert.doesNotMatch(js,/fetch\(init\.uploadUrl/);
  assert.match(js,/d\.command === 'download'/);
  assert.match(js,/cloud-download\?fileId=/);
  assert.match(js,/d\.command === 'thumbnail'/);
  assert.match(js,/cloud-thumbnail\?fileId=/);
  assert.doesNotMatch(html,/id="pickFolder"|id="pickSheet"|id="testBtn"|id="sendBtn"/);
  assert.match(html,/Drive JSON Database/);
  assert.doesNotMatch(html,/id="sheetState"|Google Sheets/);
});

test('Resumable status query returns authoritative accepted byte offset (Google 308)',async()=>{
 setEnv();
 const session=h.seal({access_token:'token_test',refresh_token:'refresh_test',expires_at:Date.now()+3600000});
 const orig=global.fetch;let captured;
 global.fetch=async(url,opts)=>{captured={url:String(url),opts};return{ok:false,status:308,headers:{get:n=>n.toLowerCase()==='range'?'bytes=0-1048575':null},text:async()=>''};};
 try{
  const res=await cloudUploadChunk({httpMethod:'PUT',headers:{cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session),origin:'https://vectorichqc2026.netlify.app','x-rivis-upload-url':'https://www.googleapis.com/upload/drive/v3/files?upload_id=resume123','x-rivis-mime-type':'image/png','x-rivis-query-status':'1','x-rivis-total-bytes':'4194304'}});
  assert.equal(res.statusCode,200,res.body);
  const body=JSON.parse(res.body);assert.equal(body.nextStart,1048576);assert.equal(body.resumed,true);assert.equal(body.done,false);
  assert.equal(captured.opts.headers['Content-Range'],'bytes */4194304');assert.equal(captured.opts.body.length,0);
 }finally{global.fetch=orig;process.env={...oldEnv};}
});

test('Drive status query signals completed file and does not restart upload',async()=>{
 setEnv();const session=h.seal({access_token:'token_test',refresh_token:'refresh_test',expires_at:Date.now()+3600000});
 const orig=global.fetch;
 global.fetch=async()=>({ok:true,status:200,headers:{get:()=>null},text:async()=>JSON.stringify({id:'file12345',name:'cover.png',mimeType:'image/png',size:'2000'})});
 try{
  const res=await cloudUploadChunk({httpMethod:'PUT',headers:{cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session),origin:'https://vectorichqc2026.netlify.app','x-rivis-upload-url':'https://www.googleapis.com/upload/drive/v3/files?upload_id=resume123','x-rivis-mime-type':'image/png','x-rivis-query-status':'1','x-rivis-total-bytes':'2000'}});
  const body=JSON.parse(res.body);assert.equal(body.done,true);assert.equal(body.file.id,'file12345');assert.equal(body.nextStart,2000);
 }finally{global.fetch=orig;process.env={...oldEnv};}
});

test('Drive upload chunk error reports timeout rather than hanging until RIVIS 180-second watchdog',async()=>{
 setEnv();const session=h.seal({access_token:'token_test',refresh_token:'refresh_test',expires_at:Date.now()+3600000});
 const orig=global.fetch;
 global.fetch=async()=>{const e=new Error('network canceled');e.name='AbortError';throw e;};
 try{
  const res=await cloudUploadChunk({httpMethod:'PUT',isBase64Encoded:true,headers:{cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session),origin:'https://vectorichqc2026.netlify.app','x-rivis-upload-url':'https://www.googleapis.com/upload/drive/v3/files?upload_id=resume123','x-rivis-mime-type':'image/png','content-range':'bytes 0-3/4'},body:Buffer.from('abcd').toString('base64')});
  assert.equal(res.statusCode,504,res.body);assert.match(JSON.parse(res.body).error,/timed out/i);
 }finally{global.fetch=orig;process.env={...oldEnv};}
});

test('Re-running a failed indexed upload finds existing Google Drive file and prevents duplicate upload',async()=>{
 setEnv();const session=h.seal({access_token:'token_test',refresh_token:'refresh_test',expires_at:Date.now()+3600000});
 const orig=global.fetch;let calls=0;
 global.fetch=async(url,options)=>{
  calls++;assert.match(String(url),/drive\/v3\/files\?q=/);
  assert.equal(options.method,undefined);
  return{ok:true,status:200,json:async()=>({files:[{id:'file12345',name:'as_stable123_my-cover.png',mimeType:'image/png',size:'4096',parents:['folder12345']}]})};
 };
 try{
  const res=await cloudUploadInit({httpMethod:'POST',headers:{cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session),origin:'https://vectorichqc2026.netlify.app'},body:JSON.stringify({ideaId:'idea_12345678',assetId:'as_stable123',assetType:'generated',fileName:'my-cover.png',mimeType:'image/png',size:4096})});
  assert.equal(res.statusCode,200,res.body);const body=JSON.parse(res.body);
  assert.equal(body.existingFileId,'file12345');assert.equal(body.recovered,true);assert.equal(calls,1);
 }finally{global.fetch=orig;process.env={...oldEnv};}
});

test('Gateway image upload has progress telemetry, bounded chunk requests, and resume support',()=>{
 const js=fs.readFileSync(path.join(root,'public/rivis-cloud/gateway.js'),'utf8');
 assert.match(js,/const chunkSize=1024\*1024/);
 assert.match(js,/RIVIS_CLOUD_PROGRESS/);
 assert.match(js,/queryUploadStatus/);
 assert.match(js,/index-retry/);
 assert.match(js,/for\(let attempt=1;attempt<=2;attempt\+\+\)/);
 assert.doesNotThrow(()=>new (require('node:vm').Script)(js));
});

test('Browser Gateway upload end-to-end recovers interrupted chunk, advances progress and indexes Drive file',async()=>{
 const vm=require('node:vm');const source=fs.readFileSync(path.join(root,'public/rivis-cloud/gateway.js'),'utf8');
 const channel='a'.repeat(48),messages=[],listeners={},storage=new Map(),calls={chunks:[],status:0,index:0};
 let accepted=0,failOnce=true;
 const origin='https://vectorichqc2026.netlify.app';
 const opener={postMessage(message){messages.push(message);}};
 const fakeElement=()=>({dataset:{},style:{},hidden:false,disabled:false,textContent:'',value:'',lastElementChild:{textContent:''},addEventListener(){}});
 const elements=new Map();
 const document={getElementById:id=>{if(!elements.has(id))elements.set(id,fakeElement());return elements.get(id);}};
 const json=(data,status=200)=>({ok:status<400,status,text:async()=>JSON.stringify(data)});
 const testBlob=new Blob([Buffer.alloc(2*1024*1024+111,7)],{type:'image/jpeg'});
 const fetchMock=async(url,options={})=>{
  const path=String(url).split('/.netlify/functions/')[1]||'';
  if(path==='gateway-config')return json({gatewayVersion:'1.3.8',storageConfigured:true,storageMode:'drive-json'});
  if(path==='session')return json({connected:true});
  if(path==='cloud-test')return json({ok:true,storageMode:'drive-json',legacyMigrationAvailable:false,folder:{name:'RIVIS'}});
  if(path==='cloud-upload-init')return json({...JSON.parse(options.body),ok:true,uploadUrl:'https://www.googleapis.com/upload/drive/v3/files?upload_id=resume_test'});
  if(path==='cloud-upload-complete'){
   calls.index++;assert.equal(JSON.parse(options.body).driveFileId,'file12345');
   return json({ok:true,asset:{driveFileId:'file12345',assetId:'as_example'}});
  }
  if(path==='cloud-upload-chunk'){
   if(options.headers['X-RIVIS-Query-Status']==='1'){
    calls.status++;return json({ok:true,done:false,nextStart:accepted});
   }
   const range=options.headers['Content-Range'];calls.chunks.push(range);
   const match=range.match(/^bytes (\d+)-(\d+)\/(\d+)$/);
   assert.ok(match);const start=Number(match[1]),end=Number(match[2]),total=Number(match[3]);
   assert.equal(start,accepted);assert.ok(end-start+1<=1024*1024);
   assert.equal(options.body.size,end-start+1);
   accepted=end+1;
   if(failOnce){failOnce=false;throw new Error('simulated disconnect after Google Drive accepted bytes');}
   if(accepted===total)return json({ok:true,done:true,nextStart:total,file:{id:'file12345',name:'cover.jpg',mimeType:'image/jpeg',size:total}});
   return json({ok:true,done:false,nextStart:accepted});
  }
  throw Error('Unexpected endpoint '+url);
 };
 const win={opener,addEventListener:(name,fn)=>{listeners[name]=fn;}};
 const sandbox={window:win,location:new URL(origin+'/rivis-cloud/?channel='+channel),document,
  history:{replaceState(){}},sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
  URL,Blob,AbortController,setTimeout,clearTimeout,setInterval,clearInterval,console,fetch:fetchMock};
 vm.runInNewContext(source,sandbox,{timeout:3000});
 for(let i=0;i<20;i++)await new Promise(resolve=>setImmediate(resolve));
 assert.ok(listeners.message);
 listeners.message({source:opener,origin:'null',data:{type:'RIVIS_CLOUD_ACK',channel}});
 listeners.message({source:opener,origin:'null',data:{type:'RIVIS_CLOUD_COMMAND',channel,requestId:'request1',command:'upload',payload:{
  ideaId:'idea12345',assetId:'as_example',fileName:'cover.jpg',mimeType:'image/jpeg',size:testBlob.size,blob:testBlob,assetType:'generated'}}});
 for(let i=0;i<40&&!messages.some(x=>x.type==='RIVIS_CLOUD_RESULT');i++)await new Promise(resolve=>setTimeout(resolve,80));
 const outcome=messages.find(x=>x.type==='RIVIS_CLOUD_RESULT');
 assert.ok(outcome,'The Gateway did not respond to the browser upload command');
 assert.equal(outcome.ok,true,JSON.stringify(outcome));
 assert.equal(outcome.result.asset.driveFileId,'file12345');
 assert.equal(calls.status,1);assert.equal(calls.index,1);
 assert.equal(calls.chunks.length,3);
 const progress=messages.filter(x=>x.type==='RIVIS_CLOUD_PROGRESS');
 assert.ok(progress.some(x=>x.stage==='retry'));
 assert.ok(progress.some(x=>x.stage==='resume'));
 assert.ok(progress.some(x=>x.stage==='done'&&x.percent===100));
});


test('Mobile upload: Gateway requests 1 MiB remote Blob chunks rather than receiving entire image via postMessage',async()=>{
 const vm=require('node:vm');const source=fs.readFileSync(path.join(root,'public/rivis-cloud/gateway.js'),'utf8');
 const channel='b'.repeat(48), messages=[], listeners={}, storage=new Map(), fetched=[];
 const origin='https://vectorichqc2026.netlify.app';
 const testBlob=new Blob([Buffer.alloc(3*1024*1024+11,3)],{type:'image/jpeg'});
 const json=(data,status=200)=>({ok:status<400,status,text:async()=>JSON.stringify(data)});
 const elem=()=>({dataset:{},hidden:false,disabled:false,textContent:'',lastElementChild:{textContent:''},addEventListener(){}});
 const elements=new Map(),doc={getElementById:id=>{if(!elements.has(id))elements.set(id,elem());return elements.get(id);}};
 let bytesTransferred=0;
 const opener={postMessage(message){
   messages.push(message);
   if(message.type!=='RIVIS_CLOUD_BLOB_REQUEST')return;
   assert.ok(message.end-message.start<=1024*1024,'window bridge chunk too large');
   setImmediate(async()=>{
    const buffer=await testBlob.slice(message.start,message.end).arrayBuffer();
    bytesTransferred+=buffer.byteLength;
    listeners.message({source:opener,origin:'null',data:{type:'RIVIS_CLOUD_BLOB_RESPONSE',channel,requestId:message.requestId,chunkId:message.chunkId,start:message.start,end:message.end,buffer}});
   });
 }};
 let accepted=0,requests=0;
 const fetchMock=async(url,options={})=>{
   const api=String(url).split('/.netlify/functions/')[1]||'';
   if(api==='gateway-config')return json({gatewayVersion:'1.3.8',storageConfigured:true,storageMode:'drive-json'});
   if(api==='session')return json({connected:true});
   if(api==='cloud-test')return json({ok:true,storageMode:'drive-json',legacyMigrationAvailable:false,folder:{name:'RIVIS'}});
   if(api==='cloud-upload-init')return json({...JSON.parse(options.body),uploadUrl:'https://www.googleapis.com/upload/drive/v3/files?upload_id=stream123'});
   if(api==='cloud-upload-complete')return json({ok:true,asset:{driveFileId:'file_test_stream123',assetId:'as_test_stream123'}});
   if(api==='cloud-upload-chunk'){
    const m=options.headers['Content-Range'].match(/^bytes (\d+)-(\d+)\/(\d+)$/);
    assert.ok(m,'valid Content-Range');
    const start=+m[1],end=+m[2],total=+m[3];
    assert.equal(start,accepted);assert.equal(options.body.size,end-start+1);
    fetched.push(options.body.size);requests++;accepted=end+1;
    if(accepted===total)return json({ok:true,done:true,nextStart:accepted,file:{id:'file_test_stream123',name:'test.jpg',mimeType:'image/jpeg',size:total}});
    return json({ok:true,done:false,nextStart:accepted});
   }
   throw Error('Unexpected '+api);
 };
 const win={opener,addEventListener:(name,fn)=>{listeners[name]=fn;}};
 const sandbox={window:win,location:new URL(origin+'/rivis-cloud/?channel='+channel),document:doc,history:{replaceState(){}},sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},URL,Blob,ArrayBuffer,AbortController,setTimeout,clearTimeout,setInterval,clearInterval,console,fetch:fetchMock};
 vm.runInNewContext(source,sandbox,{timeout:3000});
 for(let i=0;i<20;i++)await new Promise(resolve=>setImmediate(resolve));
 listeners.message({source:opener,origin:'null',data:{type:'RIVIS_CLOUD_ACK',channel}});
 const uploadPayload={ideaId:'idea_test123',assetId:'as_test_stream123',fileName:'test.jpg',mimeType:'image/jpeg',size:testBlob.size,assetType:'generated',streamedBlob:true};
 assert.equal('blob' in uploadPayload,false,'Full Blob must not be transferred in command header');
 listeners.message({source:opener,origin:'null',data:{type:'RIVIS_CLOUD_COMMAND',channel,requestId:'requestStream123',command:'upload',payload:uploadPayload}});
 for(let i=0;i<80&&!messages.some(m=>m.type==='RIVIS_CLOUD_RESULT');i++)await new Promise(resolve=>setTimeout(resolve,70));
 const result=messages.find(m=>m.type==='RIVIS_CLOUD_RESULT');
 assert.ok(result,'Gateway did not complete streamed upload');
 assert.equal(result.ok,true,JSON.stringify(result));
 assert.equal(result.result.asset.driveFileId,'file_test_stream123');
 assert.equal(requests,4);assert.equal(bytesTransferred,testBlob.size);
 assert.ok(messages.some(m=>m.type==='RIVIS_CLOUD_PROGRESS'&&m.stage==='init'));
 assert.ok(messages.some(m=>m.type==='RIVIS_CLOUD_PROGRESS'&&m.stage==='done'));
 assert.ok(messages.filter(m=>m.type==='RIVIS_CLOUD_BLOB_REQUEST').every(m=>m.end-m.start<=1024*1024));
});


test('RIVIS source bridge accepts numeric chunk IDs and rejects invalid IDs and byte ranges', async () => {
 const vm=require('node:vm');
 const source=fs.readFileSync(path.join(root,'hybrid/rivis.support.js'),'utf8');
 const start=source.indexOf(" if(d.type==='RIVIS_CLOUD_BLOB_REQUEST'){");
 const end=source.indexOf(" if(d.type==='RIVIS_CLOUD_PROGRESS'){",start);
 assert.ok(start>=0&&end>start,'Cloud Blob bridge handler missing');
 const maxChunk=2*1024*1024;
 const messages=[],blob=new Blob([Buffer.alloc(maxChunk+8,31)],{type:'image/jpeg'});
 const pending=new Map([['req_ok',{blob,renew(){}}]]);
 const popup={closed:false,postMessage(message){messages.push(message);}};
 const handle=vm.runInNewContext('(function(d){'+source.slice(start,end)+'})',{
  cloudPending:pending,gatewayPopup:popup,gatewayChannel:'test-channel',
  GATEWAY_ORIGIN:'https://vectorichqc2026.netlify.app'
 },{timeout:3000});
 const ask=async(chunkId,start,end)=>{
  const before=messages.length;
  handle({type:'RIVIS_CLOUD_BLOB_REQUEST',requestId:'req_ok',chunkId,start,end});
  for(let n=0;n<12&&messages.length===before;n++)await new Promise(resolve=>setImmediate(resolve));
  assert.equal(messages.length,before+1,'Bridge did not reply to requested chunk');
  return messages.at(-1);
 };
 const first=await ask('1',0,maxChunk);
 assert.equal(first.error,null,'Numeric chunkId must be accepted');
 assert.equal(first.buffer.byteLength,maxChunk);
 const last=await ask('2',maxChunk,blob.size);
 assert.equal(last.error,null,'Last partial chunk must be accepted');
 assert.equal(last.buffer.byteLength,8);
 assert.match((await ask('abc',0,64)).error,/tidak valid/i,'Non-numeric ID must fail');
 assert.match((await ask('3',0,maxChunk+1)).error,/tidak valid/i,'Oversize chunk must fail');
 assert.match((await ask('4',0,blob.size+1)).error,/tidak valid/i,'Out-of-bounds chunk must fail');
});



test('Cloud Gallery removes its JSON but moves original Drive image to Trash',async()=>{
 setEnv();delete process.env.RIVIS_SPREADSHEET_ID;
 const session=h.seal({access_token:'token_test',refresh_token:'refresh_test',expires_at:Date.now()+3600000}),orig=global.fetch,mock=driveJsonMock();global.fetch=mock.fetch;
 try{
  const handler=freshCloudData(),headers={cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session),origin:'https://vectorichqc2026.netlify.app'};
  mock.files.set('driveFile123',{id:'driveFile123',name:'as_demo_photo.png',mimeType:'image/png',parents:['folder12345'],description:'RIVIS Cloud Asset · Idea idea_delete_test · generated'});
  await handler({httpMethod:'POST',headers,body:JSON.stringify({action:'save',idea:{ideaId:'idea_delete_test',conceptName:'Delete Fixture'},assets:[{assetId:'as_demo',ideaId:'idea_delete_test',driveFileId:'driveFile123',assetType:'generated'}]})});
  const deleting=await handler({httpMethod:'POST',headers,body:JSON.stringify({action:'delete',ideaId:'idea_delete_test'})});
  assert.equal(deleting.statusCode,200,deleting.body);assert.equal(JSON.parse(deleting.body).permanent,true);
  const listed=await handler({httpMethod:'GET',headers,queryStringParameters:{action:'list'}});
  assert.deepEqual(JSON.parse(listed.body).ideas,[]);
  assert.equal(mock.files.get('driveFile123')?.trashed,true);
  assert.equal([...mock.files.values()].some(x=>x.name==='RIVIS_IDEA_idea_delete_test.json'),false);
 }finally{global.fetch=orig;process.env={...oldEnv};}
});


test('RIVIS Cloud Gallery UI and Save All progress support one-row mobile actions and safe remove',()=>{
 const source=fs.readFileSync(path.join(root,'hybrid/rivis.support.js'),'utf8');
 const gatewaySource=fs.readFileSync(path.join(root,'public/rivis-cloud/gateway.js'),'utf8');
 assert.match(source,/rivis-library-action-row/);
 assert.match(source,/grid-template-columns:minmax\(0,1\.28fr\)/);
 assert.match(source,/#saveAllToCloudBtn\.inner-progress/);
 assert.match(source,/cloudBulkProgress\.onProgress\(d\)/);
 assert.match(source,/window\.RIVIS_DELETE_CLOUD_IDEA=deleteCloudGalleryIdea/);
 assert.match(source,/dataset\.confirmDelete/);
 assert.match(gatewaySource,/d\.command === 'archive' \|\| d\.command === 'delete'/);
});

test('Library storage estimate avoids JSON stringifying full 4K Series image payloads',()=>{
 const source=fs.readFileSync(path.join(root,'hybrid/rivis.support.js'),'utf8');
 const backupStart=source.indexOf('function compactLibraryBackup(');
 const backupEnd=source.indexOf('\nasync function initializePersistentLibrary',backupStart);
 const estimateStart=source.indexOf('function estimateSavedLibraryBytes(');
 const estimateEnd=source.indexOf('\nfunction refreshStorageStatus()',estimateStart);
 assert.ok(backupStart>0&&backupEnd>backupStart&&estimateStart>0&&estimateEnd>estimateStart);
 const funcs=source.slice(backupStart,backupEnd)+'\n'+source.slice(estimateStart,estimateEnd);
 const {compactLibraryBackup,estimateSavedLibraryBytes}=vm.runInNewContext(
  funcs+'\n({compactLibraryBackup,estimateSavedLibraryBytes})',{Blob});
 const image='data:image/png;base64,'+'A'.repeat(400000);
 const idea={ideaId:'series_test',seriesAnchorImageUrl:image,generatedImageUrl:image,
  seriesScenes:[{sceneId:'scene_1',generatedImageUrl:image,generatedImagePreviewUrl:image}]};
 const backup=compactLibraryBackup([idea]);
 assert.ok(!JSON.stringify(backup).includes('data:image/'),'metadata fallback must exclude image bytes');
 assert.equal(idea.seriesScenes[0].generatedImageUrl,image,'original image payload must remain untouched');
 const bytes=estimateSavedLibraryBytes([idea]);
 assert.ok(bytes>=1_200_000&&bytes<1_300_000,'estimate must account for all four image payloads');
});

test('Cloud Gallery compact Series summary preserves earlier full scene metadata',()=>{
 const source=fs.readFileSync(path.join(root,'hybrid/rivis.support.js'),'utf8');
 const start=source.indexOf('function mergeCloudSeriesGalleryItem('),end=source.indexOf('\nfunction cloudSeriesPreviewAssets(',start);
 assert.ok(start>0&&end>start);
 const merge=vm.runInNewContext(source.slice(start,end)+'\nmergeCloudSeriesGalleryItem',{});
 const prior={productionType:'series',seriesLength:2,seriesScenes:[
  {sceneId:'scene_1',sceneTitle:'Arrival',metadata:{stockTitle:'Arrival Scene'}},
  {sceneId:'scene_2',sceneTitle:'Departure',metadata:{stockTitle:'Departure Scene'}}],cloudAssets:[]};
 const incoming={productionType:'series',seriesLength:2,seriesScenes:[
  {sceneId:'scene_1',sceneTitle:'Arrival Updated'},{sceneId:'scene_2',sceneTitle:'Departure'}],
  cloudAssets:[{sceneId:'scene_1',assetType:'generated',driveFileId:'drive_1'},{sceneId:'scene_2',assetType:'generated',driveFileId:'drive_2'}]};
 const merged=merge(incoming,prior);
 assert.equal(merged.seriesScenes.length,2);
 assert.equal(merged.seriesScenes[0].metadata.stockTitle,'Arrival Scene');
 assert.equal(merged.seriesScenes[0].sceneTitle,'Arrival Updated');
 assert.equal(merged.seriesScenes[1].metadata.stockTitle,'Departure Scene');
 assert.equal(merged.cloudAssets.length,2);
});

test('Mobile Cloud Gallery deletion uses a compact status label and readable button',()=>{
 const source=fs.readFileSync(path.join(root,'hybrid/rivis.support.js'),'utf8');
 assert.match(source,/rv-cloud-gallery-actions\{grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\) minmax\(68px,\.55fr\)/);
 assert.match(source,/button\.textContent='Hapus…'/);
 assert.match(source,/Sedang menghapus item Cloud Gallery/);
 assert.doesNotMatch(source,/button\.textContent='Menghapus\.\.\.'/);
});

function createCloudDeleteHarness(){
 const source=fs.readFileSync(path.join(root,'hybrid/rivis.support.js'),'utf8');
 const start=source.indexOf('let cloudGalleryDeleteBusy=false;');
 const end=source.indexOf('\nasync function saveCardToCloud(',start);
 assert.ok(start>0&&end>start,'Cloud Gallery deletion source found');
 let resolveCommand,rejectCommand;
 const command=new Promise((resolve,reject)=>{resolveCommand=resolve;rejectCommand=reject;});
 const ui={renderCount:0,refreshCount:0,toasts:[],cacheCleared:0};
 const context={
  gatewayVerified:true,
  cloudGalleryItems:[{ideaId:'idea_one',conceptName:'Original'},{ideaId:'idea_two',conceptName:'Other'}],
  cloudGalleryTotal:2,cloudGalleryPage:1,cloudGalleryNavigationId:0,
  cloudGalleryMutationRevision:0,cloudGalleryPrefetchTimer:null,
  cloudGallerySelectedIds:new Set(['idea_one']),
  cloudGalleryPageRequests:new Map(),cloudGalleryPageCache:new Map(),
  CLOUD_GALLERY_CACHE_KEY:'test-cloud-cache',CLOUD_GALLERY_PAGE_SIZE:20,
  clearTimeout:()=>{},setTimeout:()=>0,
  localStorage:{removeItem:()=>{ui.cacheCleared++;}},
  showToast:(...args)=>ui.toasts.push(args),
  cloudSyncStatus:()=>{},
  renderCloudGallery:()=>{ui.renderCount++;},
  refreshCloudGallery:async()=>{ui.refreshCount++;},
  sendCloudCommand:(action,data)=>{
   assert.equal(action,'delete');
   assert.equal(data.ideaId,'idea_one');
   return command;
  }
 };
 const {deleteCloudGalleryIdea}=vm.runInNewContext(
  source.slice(start,end)+'\n({deleteCloudGalleryIdea})',context);
 const button={dataset:{confirmDelete:'idea_one'},isConnected:true,disabled:false,textContent:'Yakin?',
  setAttribute:()=>{},removeAttribute:()=>{}};
 return {context,ui,button,deleteCloudGalleryIdea,resolveCommand,rejectCommand};
}

test('Cloud Gallery deletion removes card immediately without waiting for a second Drive list',async()=>{
 const h=createCloudDeleteHarness();
 const pending=h.deleteCloudGalleryIdea('idea_one',h.button);
 assert.deepEqual(h.context.cloudGalleryItems.map(x=>x.ideaId),['idea_two']);
 assert.equal(h.context.cloudGalleryTotal,1);
 assert.equal(h.ui.refreshCount,0);
 assert.equal(h.context.cloudGallerySelectedIds.has('idea_one'),false);
 h.resolveCommand({ok:true,permanent:true,assetDisposition:'trash',trashedDriveFiles:2,deletedDriveFiles:1});
 assert.equal(await pending,true);
 assert.equal(h.ui.refreshCount,0,'No full Drive list after successful delete');
 assert.equal(h.ui.cacheCleared,1);
});

test('Cloud Gallery deletion restores card immediately when Drive rejects delete',async()=>{
 const h=createCloudDeleteHarness();
 const pending=h.deleteCloudGalleryIdea('idea_one',h.button);
 assert.equal(h.context.cloudGalleryItems.length,1);
 h.rejectCommand(new Error('Drive temporarily unavailable'));
 assert.equal(await pending,false);
 assert.deepEqual(h.context.cloudGalleryItems.map(x=>x.ideaId),['idea_one','idea_two']);
 assert.equal(h.context.cloudGalleryTotal,2);
 assert.equal(h.context.cloudGallerySelectedIds.has('idea_one'),true);
 assert.equal(h.ui.refreshCount,0);
 assert.ok(h.ui.toasts.some(row=>row[1]==='error'));
});

test('Gallery removal: Series images and SVG reference moved concurrently to Drive Trash',async()=>{
 setEnv();delete process.env.RIVIS_SPREADSHEET_ID;
 const session=h.seal({access_token:'test-token',refresh_token:'refresh-token',expires_at:Date.now()+3600000}),orig=global.fetch,mock=driveJsonMock();
 const ideaId='series_delete123',ids=['scene_file_111','scene_file_222','scene_file_333','reference_svg_1'];
 const assets=ids.map((driveFileId,i)=>({assetId:'asset_scene_'+i,ideaId,assetType:i===3?'reference':'generated',sceneId:i===3?'':'scene_'+i,driveFileId}));
 for(let i=0;i<assets.length;i++)mock.files.set(ids[i],{id:ids[i],name:assets[i].assetId+'_file'+i,mimeType:i===3?'image/svg+xml':'image/png',parents:['folder12345'],description:'RIVIS Cloud Asset · Idea '+ideaId+' · '+assets[i].assetType});
 let active=0,maxActive=0;
 global.fetch=async(url,options={})=>{
  if(options.method==='PATCH'&&ids.some(id=>String(url).includes('/'+id+'?'))){
   active++;maxActive=Math.max(maxActive,active);
   await new Promise(resolve=>setTimeout(resolve,10));
   try{return await mock.fetch(url,options);}finally{active--;}
  }
  return mock.fetch(url,options);
 };
 try{
  const handler=freshCloudData(),headers={cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session),origin:'https://vectorichqc2026.netlify.app'};
  const saved=await handler({httpMethod:'POST',headers,body:JSON.stringify({action:'save',idea:{ideaId,productionType:'series',seriesScenes:[{sceneId:'scene_0'},{sceneId:'scene_1'},{sceneId:'scene_2'}]},assets})});
  assert.equal(saved.statusCode,200,saved.body);
  const result=await handler({httpMethod:'POST',headers,body:JSON.stringify({action:'delete',ideaId})});
  assert.equal(result.statusCode,200,result.body);
  const data=JSON.parse(result.body);
  assert.equal(data.trashedDriveFiles,4,'Four image/reference files are moved to Trash');
   assert.equal(data.deletedDriveFiles,1,'Only the card JSON is permanently deleted');
  assert.equal(data.skippedUnverifiedAssets,0);
  for(const id of ids)assert.equal(mock.files.get(id)?.trashed,true,id+' must be in Trash');
  assert.ok(maxActive>=2,'Drive images should be removed in parallel');
 }finally{global.fetch=orig;process.env={...oldEnv};}
});

test('Permanent delete protects an asset shared by another Gallery card',async()=>{
 setEnv();delete process.env.RIVIS_SPREADSHEET_ID;
 const session=h.seal({access_token:'test-token',refresh_token:'refresh-token',expires_at:Date.now()+3600000}),orig=global.fetch,mock=driveJsonMock();global.fetch=mock.fetch;
 try{
  const handler=freshCloudData(),headers={cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session),origin:'https://vectorichqc2026.netlify.app'};
  const id='shared_file_123',assetId='shared_asset_123';
  mock.files.set(id,{id,name:assetId+'_photo.png',mimeType:'image/png',parents:['folder12345'],description:'RIVIS Cloud Asset · Idea idea_share_a · generated'});
  for(const ideaId of ['idea_share_a','idea_share_b']){
   const res=await handler({httpMethod:'POST',headers,body:JSON.stringify({action:'save',idea:{ideaId},assets:[{assetId,assetType:'generated',driveFileId:id,ideaId}]})});
   assert.equal(res.statusCode,200,res.body);
  }
  const del=await handler({httpMethod:'POST',headers,body:JSON.stringify({action:'delete',ideaId:'idea_share_a'})});
  assert.equal(del.statusCode,200,del.body);
  assert.equal(JSON.parse(del.body).skippedSharedAssets,1);
  assert.equal(mock.files.has(id),true,'Referenced file must remain for the other card');
  const listed=JSON.parse((await handler({httpMethod:'GET',headers,queryStringParameters:{action:'list'}})).body);
  assert.deepEqual(listed.ideas.map(x=>x.ideaId),['idea_share_b']);
 }finally{global.fetch=orig;process.env={...oldEnv};}
});

test('Permanent delete never removes a Drive asset outside the configured folder',async()=>{
 setEnv();delete process.env.RIVIS_SPREADSHEET_ID;
 const session=h.seal({access_token:'test-token',refresh_token:'refresh-token',expires_at:Date.now()+3600000}),orig=global.fetch,mock=driveJsonMock();global.fetch=mock.fetch;
 try{
  const handler=freshCloudData(),headers={cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session),origin:'https://vectorichqc2026.netlify.app'};
  const ideaId='idea_external_1',id='external_file_123';
  mock.files.set(id,{id,name:'personal_photo.png',mimeType:'image/png',parents:['private_folder'],description:'Personal photo'});
  const saved=await handler({httpMethod:'POST',headers,body:JSON.stringify({action:'save',idea:{ideaId},assets:[{assetId:'external_asset',assetType:'generated',driveFileId:id,ideaId}]})});
  assert.equal(saved.statusCode,200,saved.body);
  const deleted=await handler({httpMethod:'POST',headers,body:JSON.stringify({action:'delete',ideaId})});
  assert.equal(deleted.statusCode,200,deleted.body);
  assert.equal(JSON.parse(deleted.body).skippedUnverifiedAssets,1);
  assert.equal(mock.files.has(id),true,'Unrelated files must not be deleted');
 }finally{global.fetch=orig;process.env={...oldEnv};}
});

test('Permanent delete retains its JSON and catalog entry after Drive delete failure, then succeeds on retry',async()=>{
 setEnv();delete process.env.RIVIS_SPREADSHEET_ID;
 const session=h.seal({access_token:'test-token',refresh_token:'refresh-token',expires_at:Date.now()+3600000}),orig=global.fetch,mock=driveJsonMock();
 const ideaId='idea_retry_123',id='failed_file_123';
 mock.files.set(id,{id,name:'retry_asset_photo.png',mimeType:'image/png',parents:['folder12345'],description:'RIVIS Cloud Asset · Idea '+ideaId+' · generated'});
 let failure=true;
 global.fetch=async(url,opts={})=>{
  if(failure&&opts.method==='PATCH'&&String(url).includes('/'+id+'?'))
   return mock.response({error:{message:'Temporary unavailable'}},503);
  return mock.fetch(url,opts);
 };
 try{
  const handler=freshCloudData(),headers={cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session),origin:'https://vectorichqc2026.netlify.app'};
  const saved=await handler({httpMethod:'POST',headers,body:JSON.stringify({action:'save',idea:{ideaId},assets:[{assetId:'retry_asset',assetType:'generated',driveFileId:id,ideaId}]})});
  assert.equal(saved.statusCode,200,saved.body);
  const first=await handler({httpMethod:'POST',headers,body:JSON.stringify({action:'delete',ideaId})});
  assert.equal(first.statusCode,502,first.body);
  assert.equal(mock.files.has(id),true);
  assert.ok([...mock.files.values()].some(x=>x.name==='RIVIS_IDEA_'+ideaId+'.json'));
  failure=false;
  const second=await handler({httpMethod:'POST',headers,body:JSON.stringify({action:'delete',ideaId})});
  assert.equal(second.statusCode,200,second.body);
  assert.equal(JSON.parse(second.body).permanent,true);
  assert.equal(mock.files.get(id)?.trashed,true);
 }finally{global.fetch=orig;process.env={...oldEnv};}
});

test('Google Drive Trash cleanup is safe to retry when an image is already trashed',async()=>{
 setEnv();delete process.env.RIVIS_SPREADSHEET_ID;
 const session=h.seal({access_token:'test-token',refresh_token:'refresh-token',expires_at:Date.now()+3600000});
 const orig=global.fetch,mock=driveJsonMock();global.fetch=mock.fetch;
 const ideaId='idea_trash_retry_1',fileId='image_already_trashed_123';
 mock.files.set(fileId,{id:fileId,name:'asset_trash_photo.png',mimeType:'image/png',parents:['folder12345'],
  description:'RIVIS Cloud Asset · Idea '+ideaId+' · generated',trashed:true});
 try{
  const handler=freshCloudData(),headers={cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session),origin:'https://vectorichqc2026.netlify.app'};
  const saved=await handler({httpMethod:'POST',headers,body:JSON.stringify({action:'save',idea:{ideaId},assets:[{assetId:'asset_trash',ideaId,assetType:'generated',driveFileId:fileId}]})});
  assert.equal(saved.statusCode,200,saved.body);
  const response=await handler({httpMethod:'POST',headers,body:JSON.stringify({action:'delete',ideaId})});
  assert.equal(response.statusCode,200,response.body);
  const result=JSON.parse(response.body);
  assert.equal(result.assetDisposition,'trash');
  assert.equal(result.trashedDriveFiles,0);
  assert.equal(result.alreadyTrashedFiles,1);
  assert.equal(result.deletedDriveFiles,1);
  assert.equal(mock.files.get(fileId)?.trashed,true,'Existing Trash item remains recoverable');
 }finally{global.fetch=orig;process.env={...oldEnv};}
});

test('Cloud archive remains reversible and preserves Google Drive files',async()=>{
 setEnv();delete process.env.RIVIS_SPREADSHEET_ID;
 const session=h.seal({access_token:'test-token',refresh_token:'refresh-token',expires_at:Date.now()+3600000}),orig=global.fetch,mock=driveJsonMock();global.fetch=mock.fetch;
 try{
  const handler=freshCloudData(),headers={cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session),origin:'https://vectorichqc2026.netlify.app'};
  const ideaId='idea_archive_1';
  const saved=await handler({httpMethod:'POST',headers,body:JSON.stringify({action:'save',idea:{ideaId}})});
  assert.equal(saved.statusCode,200,saved.body);
  const archive=await handler({httpMethod:'POST',headers,body:JSON.stringify({action:'archive',ideaId})});
  assert.equal(archive.statusCode,200,archive.body);
  assert.equal(JSON.parse(archive.body).status,'Archived');
  assert.ok([...mock.files.values()].some(x=>x.name==='RIVIS_IDEA_'+ideaId+'.json'));
 }finally{global.fetch=orig;process.env={...oldEnv};}
});

test('Permanent Gallery deletion avoids redundant gateway state check and requires a second confirmation',()=>{
 const gateway=fs.readFileSync(path.join(root,'public/rivis-cloud/gateway.js'),'utf8');
 const support=fs.readFileSync(path.join(root,'hybrid/rivis.support.js'),'utf8');
 assert.match(gateway,/if\(d\.command==='archive'\)await ensureCloudMigration\(d\.requestId\)/);
 assert.match(gateway,/d\.command==='delete'\?120000:45000/);
 assert.match(gateway,/d\.command==='delete'\?'Menghapus file Google Drive/);
 assert.match(support,/result\?\.permanent!==true/);
 assert.match(support,/Klik Yakin\? untuk memindahkan gambar ke Trash dan menghapus data kartu/);
 assert.match(support,/result\?\.assetDisposition!=='trash'/);
 assert.match(support,/skippedSharedAssets/);
});

test('RIVIS Adobe Stock CSV raster uses .jpeg instead of .jpg, preserves PNG and SVG',()=>{
 const source=fs.readFileSync(path.join(root,'hybrid/rivis.support.js'),'utf8');
 const start=source.indexOf('function getMetadataAssetFilename('),end=source.indexOf('\nfunction buildAdobeStockCsvRow(',start);
 assert.ok(start>0&&end>start,'Metadata filename builder is present');
 const sandbox={getCardBaseFilename:()=> 'a123_example',isRasterIdea:idea=>idea.raster,
  rasterSnapshot:idea=>({format:idea.format||'jpg'})};
 const filename=vm.runInNewContext(source.slice(start,end)+'\ngetMetadataAssetFilename',sandbox);
 assert.equal(filename({raster:true,format:'jpg'}),'a123_example-edt.jpeg');
 assert.equal(filename({raster:true,format:'jpeg'},'preview.jpg'),'a123_example-edt.jpeg');
 assert.equal(filename({raster:true,format:'png'}),'a123_example-edt.png');
 assert.equal(filename({raster:true,format:'jpg'},'preview.png'),'a123_example-edt.png');
 assert.equal(filename({raster:false,format:'jpg'}),'a123_example-edt.svg');
 // CSV changes must not rewrite the actual exported JPG filename.
 assert.match(source,/const format=mode==='vector'\?'png':\(p\.format==='png'\?'png':'jpg'\)/);
});

test('METADATA Generator CSV maps .jpg to .jpeg without renaming source image',()=>{
 const html=fs.readFileSync(path.join(root,'hybrid/rivis.meta-gen.html'),'utf8');
 const helperStart=html.indexOf('function csvRasterFilename('),helperEnd=html.indexOf('\nfunction platformKeywords(',helperStart);
 const rowStart=html.indexOf('function csvRow('),rowEnd=html.indexOf('\nfunction exportCsv(',rowStart);
 assert.ok(helperStart>0&&helperEnd>helperStart&&rowStart>0&&rowEnd>rowStart,'CSV mapping source found');
 const sandbox={platform:'adobe',platformKeywords:e=>e.metadata.tags,targetFilename:e=>e.filename};
 const run=vm.runInNewContext(html.slice(helperStart,helperEnd)+'\n'+html.slice(rowStart,rowEnd)+'\n({csvRasterFilename,csvRow})',sandbox);
 const sample={filename:'product_photo.jpg',metadata:{title:'Product photo',tags:['product','photo']},category:'8'};
 assert.equal(run.csvRow(sample)[0],'product_photo.jpeg');
 assert.equal(run.csvRasterFilename('photo.JPG'),'photo.jpeg');
 assert.equal(run.csvRasterFilename('photo.jpeg'),'photo.jpeg');
 assert.equal(run.csvRasterFilename('photo.png'),'photo.png');
 assert.equal(run.csvRasterFilename('vector.svg'),'vector.svg');
 assert.equal(sample.filename,'product_photo.jpg','Input image filename must not change');
 assert.equal(run.csvRow(sample,new Map([[sample,'album.jpg']]))[0],'album.jpeg');
});

test('Discover Auto Generate checkbox is beside Idea Count, persists OFF by default and hides in mini mode',()=>{
 const source=fs.readFileSync(path.join(root,'hybrid/rivis.support.js'),'utf8');
 const markup=source.indexOf('id=\\\"ideaCountSelect\\\"');
 const checkbox=source.indexOf('id=\\\"discoverAutoGenerateCheckbox\\\"');
 const discover=source.indexOf('id=\\\"discoverIdeasBtn\\\"');
 assert.ok(markup>0&&checkbox>markup&&discover>checkbox,'checkbox must sit between count and Discover button');
 assert.match(source,/id=\\\"discoverAutoGenerateCheckbox\\\" type=\\\"checkbox\\\"/);
 assert.match(source,/safeStorageGet\(DISCOVER_AUTO_GENERATE_KEY,'false'\)==='true'/);
 assert.match(source,/#ideaDiscoverActionBar\.is-compact #discoverAutoGenerateControl/);
});

test('Discover Auto Generate schedules Image All and Meta All once, never cancels a running batch',async()=>{
 const source=fs.readFileSync(path.join(root,'hybrid/rivis.support.js'),'utf8');
 const start=source.indexOf("const DISCOVER_AUTO_GENERATE_KEY='rvis_discover_auto_generate_v1';");
 const end=source.indexOf('\nfunction setDiscoverBarCollapsed(',start);
 assert.ok(start>0&&end>start,'Auto Generate implementation must exist');
 const timers=[],runs=[],saved=new Map(),checkbox={checked:false},batchState={images:null,meta:null};
 const sandbox={
  byId:id=>id==='discoverAutoGenerateCheckbox'?checkbox:{id},
  safeStorageSet:(key,value)=>saved.set(key,value),
  setTimeout:fn=>{timers.push(fn);return 1;},
  batchState,
  handleGenerateAllImages:async()=>runs.push('image'),
  handleGenerateAllMetadata:async()=>runs.push('meta'),
  showToast:()=>{},
  console
 };
 const api=vm.runInNewContext(source.slice(start,end)+'\n({setDiscoverAutoGenerate,scheduleDiscoverAutoGeneration,resumePendingDiscoverAutoBatch})',sandbox);
 api.setDiscoverAutoGenerate(true);
 assert.equal(saved.get('rvis_discover_auto_generate_v1'),'true');
 api.scheduleDiscoverAutoGeneration();api.scheduleDiscoverAutoGeneration();
 assert.equal(timers.length,1,'Duplicate scheduling must be prevented');
 timers.shift()();
 await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(runs,['image','meta']);
 batchState.images={abort:()=>{throw Error('Existing Image All must not be cancelled');}};
 api.scheduleDiscoverAutoGeneration();
 timers.shift()();
 await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(runs,['image','meta','meta'],'Only idle Meta All should launch');
 batchState.images=null;
 api.resumePendingDiscoverAutoBatch('images');
 await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(runs,['image','meta','meta','image'],'Queued Image All must resume when prior batch finishes');
 api.setDiscoverAutoGenerate(false);
 api.scheduleDiscoverAutoGeneration();timers.shift()();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(runs.length,4,'Turning the checkbox off must stop a pending launch');
});

test('Discover save uses only the main Auto Generate checkbox for Series and single ideas',()=>{
 const source=fs.readFileSync(path.join(root,'hybrid/rivis.support.js'),'utf8');
 const start=source.indexOf('function saveGeneratedIdeasToLibrary(');
 const end=source.indexOf('\nfunction isRasterMedium(',start);
 assert.ok(start>0&&end>start);
 const calls=[],checkbox={checked:true};
 const sandbox={
  state:{savedIdeas:[],discoveredIdeas:[],refImageUrl:null,referenceFingerprint:null,refMode:'STYLE REFERENCE',productionType:'series'},
  byId:id=>id==='discoverAutoGenerateCheckbox'?checkbox:{id},
  ensureConceptBlueprint:()=>{},persistSavedIdeas:()=>true,updateBadges:()=>{},
  switchTab:()=>calls.push('library'),updateFloatingShortcut:()=>{},
  scheduleDiscoverAutoGeneration:()=>calls.push('image-and-meta'),
  setTimeout:()=>{throw Error('Legacy Series auto-generator must not be scheduled')},
  batchState:{images:null}
 };
 const save=vm.runInNewContext(source.slice(start,end)+'\nsaveGeneratedIdeasToLibrary',sandbox);
 assert.equal(save([{ideaId:'auto_idea_001'}]),1);
 assert.deepEqual(calls,['library','image-and-meta']);
 checkbox.checked=false;
 assert.equal(save([{ideaId:'auto_idea_002'}]),1);
 assert.deepEqual(calls,['library','image-and-meta','library'],
  'Unchecked Auto Generate must not start image-only automation in Series');
 sandbox.state.productionType='single';checkbox.checked=true;
 assert.equal(save([{ideaId:'auto_idea_003'}]),1);
 assert.deepEqual(calls,['library','image-and-meta','library','library','image-and-meta']);
});

test('Auto Generate resumes deferred image and metadata batches after completion',()=>{
 const ai=fs.readFileSync(path.join(root,'hybrid/rivis.ai.js'),'utf8');
 assert.match(ai,/batchState\.images=null;[\s\S]*?resumePendingDiscoverAutoBatch\('images'\)/);
 assert.match(ai,/batchState\.meta=null;[\s\S]*?resumePendingDiscoverAutoBatch\('meta'\)/);
 // Old Series checkbox must not launch Image All separately.
 const support=fs.readFileSync(path.join(root,'hybrid/rivis.support.js'),'utf8');
 assert.match(support,/if\(autoDiscover\)scheduleDiscoverAutoGeneration\(\)/);
 assert.doesNotMatch(support,/seriesAutoGenerateCheckbox|seriesAutoGenerate/);
});

test('Series panel keeps continuity settings but no longer renders duplicate Auto Generate',()=>{
 const support=fs.readFileSync(path.join(root,'hybrid/rivis.support.js'),'utf8');
 const ai=fs.readFileSync(path.join(root,'hybrid/rivis.ai.js'),'utf8');
 assert.match(support,/seriesContinuityLockCheckbox/);
 assert.match(support,/seriesAnchorReferenceCheckbox/);
 assert.match(support,/id=\\\"discoverAutoGenerateCheckbox\\\"/);
 assert.doesNotMatch(support,/Auto-generate all scenes after Save All|seriesAutoGenerateCheckbox|seriesAutoGenerate/);
 assert.doesNotMatch(ai,/seriesAutoGenerateCheckbox|seriesAutoGenerate/);
 assert.match(support,/SERIES CONTINUITY/);
});

test('Discover Auto Generate follows purple-indigo-blue theme of adjacent Discover button',()=>{
 const source=fs.readFileSync(path.join(root,'hybrid/rivis.support.js'),'utf8');
 const control=source.match(/#ideaDiscoverActionBar #discoverAutoGenerateControl\{([^}]+)\}/)?.[1]||'';
 const checkbox=source.match(/#ideaDiscoverActionBar #discoverAutoGenerateCheckbox\{([^}]+)\}/)?.[1]||'';
 const active=source.match(/#ideaDiscoverActionBar #discoverAutoGenerateControl:has\(input:checked\)\{([^}]+)\}/)?.[1]||'';
 assert.match(control,/linear-gradient\(135deg,rgba\(76,29,149/);
 assert.match(control,/color:#ddd6fe/);
 assert.match(checkbox,/accent-color:#818cf8/);
 assert.match(active,/linear-gradient\(135deg,rgba\(124,58,237/);
 assert.match(active,/rgba\(37,99,235/);
 assert.doesNotMatch(control+checkbox+active,/#22c55e|rgba\(6,95,70/);
});

test('Discover checkbox is labeled Auto Process in UI, accessibility and notifications',()=>{
 const source=fs.readFileSync(path.join(root,'hybrid/rivis.support.js'),'utf8');
 assert.match(source,/Auto<br\/>Process/);
 assert.match(source,/Auto Process Image All dan Meta All/);
 assert.match(source,/Auto Process: Image All dan Meta All dimulai/);
 assert.match(source,/Auto Process aktif: batch yang masih berjalan/);
 assert.doesNotMatch(source,/Auto<br\/>Generate|aria-label=\\\"Auto Generate Image All dan Meta All/);
 assert.match(source,/DISCOVER_AUTO_GENERATE_KEY/,'Existing storage key is preserved for user preferences');
});

test('Cutout Ready rejects checkerboard gradients and subject touching image border',()=>{
 const source=fs.readFileSync(path.join(root,'hybrid/rivis.support.js'),'utf8');
 const start=source.indexOf('function rivisCutoutInspectPixels('),end=source.indexOf('\nasync function rivisCutoutInspectUrl(',start);
 assert.ok(start>0&&end>start,'Pixel-inspection implementation must exist');
 const inspect=vm.runInNewContext(source.slice(start,end)+'\nrivisCutoutInspectPixels',{Uint8Array,Uint32Array,Math,Array,parseInt});
 const w=100,h=100,bg=[236,239,243];
 const make=(callback)=>{
  const data=new Uint8ClampedArray(w*h*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const k=(y*w+x)*4,rgb=callback(x,y);
   data[k]=rgb[0];data[k+1]=rgb[1];data[k+2]=rgb[2];data[k+3]=255;
  }
  return data;
 };
 const sample=make((x,y)=>x>=28&&x<=72&&y>=28&&y<=72?[220,40,55]:bg);
 const qc=inspect(sample,w,h,'#ECEFF3');
 assert.equal(qc.ok,true,qc.reason);
 assert.equal(qc.mask[0],1,'Outer background remains removable');
 assert.equal(qc.mask[50*w+50],0,'Original illustration must not be masked');
 assert.ok(qc.backgroundShare>.7&&qc.backgroundShare<.9);
 const checkerboard=make((x,y)=>(Math.floor(x/8)+Math.floor(y/8))%2===0?bg:[150,155,160]);
 const checker=inspect(checkerboard,w,h,'#ECEFF3');
 assert.equal(checker.ok,false,'Printed checkerboard is not real transparency');
 const gradient=make((x,y)=>[Math.min(255,bg[0]+Math.floor(y*.1)),Math.min(255,bg[1]+Math.floor(y*.1)),Math.max(0,bg[2]-Math.floor(y*.6))]);
 assert.equal(inspect(gradient,w,h,'#ECEFF3').ok,false,'Background gradient must be rejected');
 assert.equal(inspect(sample,w,h,'#22AA66').ok,false,'Unexpected BG color must be rejected');
 const cropped=make((x,y)=>x<15?[215,20,45]:bg);
 assert.equal(inspect(cropped,w,h,'#ECEFF3').ok,false,'Subject cropped at border must fail QC');
});

test('Cutout Ready raster controls persist color and preserve original JPG output',()=>{
 const support=fs.readFileSync(path.join(root,'hybrid/rivis.support.js'),'utf8');
 const ai=fs.readFileSync(path.join(root,'hybrid/rivis.ai.js'),'utf8');
 assert.match(support,/rasterCutoutReadyCheckbox/);
 assert.match(support,/rasterCutoutBgColor/);
 assert.match(support,/cutoutReady:false,cutoutBgColor:'#ECEFF3'/);
 assert.match(ai,/cutoutReady:byId\('rasterCutoutReadyCheckbox'\)\?\.checked===true/);
 assert.match(ai,/cutoutBgColor:.*#ECEFF3/);
 assert.match(ai,/rivisCutoutPrompt\(idea\)/);
 assert.match(ai,/const fullPrompt=rivisRsiStyleLock\(idea,preGenerationGuard.prompt\)\+\(isRasterIdea\(idea\)/);
 assert.match(ai,/current.cutoutReadiness=\{status:qc.ok\?'PASS':'REVIEW'/);
 assert.match(support,/onclick=\\\"handleDownloadCutoutPng/);
 assert.match(support,/onclick=\\\"downloadSeriesScene/);
 assert.match(support,/PNG Alpha/);
 assert.match(support,/getCardBaseFilename\(idea\)\+'-transparent.png'/);
 assert.match(support,/const format=mode==='vector'\?'png':\(p.format==='png'\?'png':'jpg'\)/,
  'Original raster JPG/PNG exports must remain intact');
 assert.doesNotMatch(support.slice(support.indexOf('async function handleDownloadCutoutPng('),support.indexOf('async function getExportedAsset(')),/idea\.generatedImageUrl\s*=/,
  'Transparent export must never overwrite the original image');
});

test('Cutout Ready directive requires solid flat background with no shadows or fake transparency',()=>{
 const ai=fs.readFileSync(path.join(root,'hybrid/rivis.ai.js'),'utf8');
 const start=ai.indexOf('function rivisCutoutPrompt('),end=ai.indexOf('\nfunction buildRasterPhotoPrompt(',start);
 assert.ok(start>0&&end>start);
 const directive=vm.runInNewContext(ai.slice(start,end)+'\nrivisCutoutPrompt',{
  rasterSnapshot:idea=>idea.rasterSettings
 });
 const text=directive({rasterSettings:{cutoutReady:true,cutoutBgColor:'#E6E8EE'}});
 assert.match(text,/#E6E8EE/);
 assert.match(text,/NO checkerboard pattern/);
 assert.match(text,/shadows of any kind/);
 assert.match(text,/8–12% outer margin/);
 assert.match(text,/NOT an alpha checkerboard or simulated transparency/);
});

test('Cutout Ready presents background QC on Library and each Series scene',()=>{
 const support=fs.readFileSync(path.join(root,'hybrid/rivis.support.js'),'utf8');
 const ai=fs.readFileSync(path.join(root,'hybrid/rivis.ai.js'),'utf8');
 assert.match(support,/Cutout QC · \$\{escapeHtml\(idea\.cutoutReadiness\?\.status\|\|'REVIEW'\)\}/);
 assert.match(support,/Cutout QC · \$\{escapeHtml\(scene\.cutoutReadiness\?\.status\|\|'REVIEW'\)\}/);
 assert.match(ai,/scene\.cutoutReadiness=generated\.cutoutReadiness\|\|null/);
});

test('Gemini Canvas 401 HTML response reports access issue without forcing API key modal',async()=>{
 const source=fs.readFileSync(path.join(root,'hybrid/rivis.ai.js'),'utf8');
 const start=source.indexOf('function rivisGeminiAuthError('),end=source.indexOf('\n/* RIVIS 3.1.56:',start);
 assert.ok(start>0&&end>start,'Gemini auth error parser exists');
 const classes=new Set(['hidden']),modal={classList:{remove:x=>classes.delete(x)}};
 const noticeClasses=new Set(['hidden']),notice={textContent:'',classList:{remove:(...items)=>items.forEach(x=>noticeClasses.delete(x)),add:(...items)=>items.forEach(x=>noticeClasses.add(x))}};
 const requestedUrls=[];
 const context={state:{apiKey:''},byId:id=>id==='apiKeyModal'?modal:id==='rvisGeminiAuthNotice'?notice:null,
  fetch:async url=>{requestedUrls.push(String(url));return{status:401,statusText:'Unauthorized',ok:false,json:async()=>{throw Error('<html> Unauthorized');}};}};
 const api=vm.runInNewContext(source.slice(start,end)+'\nrivisGeminiApiOnce',context);
 await assert.rejects(()=>api('gemini-3-flash-preview',{contents:[]}),error=>{
  assert.equal(error.httpStatus,401);
  assert.equal(error.isAuthError,true);
  assert.match(error.message,/Gemini Canvas/);
  assert.match(error.message,/muat ulang/);
  assert.doesNotMatch(error.message,/bukan JSON|<html>/);
  return true;
 });
 assert.equal(classes.has('hidden'),true,'Canvas Auto should not force the Gemini Key modal');
 assert.equal(noticeClasses.has('hidden'),false,'Specific auth diagnostic should be visible');
 assert.match(notice.textContent,/HTTP 401/);
 assert.equal(requestedUrls.length,2,'Canvas may try both supported host-auth URL shapes');
 assert.equal(requestedUrls[0].endsWith('?key='),true,'Canvas Auto starts with explicit blank-key integration');
 assert.equal(requestedUrls[1].includes('?key='),false,'Legacy bare URL is only a fallback');
});

test('Gemini invalid custom key 401 is redacted and no HTML is displayed',async()=>{
 const source=fs.readFileSync(path.join(root,'hybrid/rivis.ai.js'),'utf8');
 const start=source.indexOf('function rivisGeminiAuthError('),end=source.indexOf('\n/* RIVIS 3.1.56:',start);
 const key='AIzaEXAMPLE_PRIVATE_API_KEY_NEVER_SHOW_ME_12345';
 const dialog={classList:{remove:()=>{}}},notice={textContent:'',classList:{remove:()=>{},add:()=>{}}};
 const context={state:{apiKey:key},byId:id=>id==='apiKeyModal'?dialog:id==='rvisGeminiAuthNotice'?notice:null,
  fetch:async()=>({status:401,ok:false,json:async()=>({error:{message:'API invalid '+key+'?key='+key}})})};
 const api=vm.runInNewContext(source.slice(start,end)+'\nrivisGeminiApiOnce',context);
 await assert.rejects(()=>api('gemini-3-flash-preview',{contents:[]}),error=>{
  assert.equal(error.httpStatus,401);
  assert.match(error.message,/Gemini Key/);
  assert.doesNotMatch(error.message,/AIzaEXAMPLE_PRIVATE_API_KEY_NEVER_SHOW_ME/);
  assert.doesNotMatch(error.message,/\?key=AIza/);
  return true;
 });
 assert.doesNotMatch(notice.textContent,/AIzaEXAMPLE_PRIVATE_API_KEY_NEVER_SHOW_ME/);
});

test('Gemini request keeps retry signal on HTTP 429 even for non-JSON responses',async()=>{
 const source=fs.readFileSync(path.join(root,'hybrid/rivis.ai.js'),'utf8');
 const start=source.indexOf('function rivisGeminiAuthError('),end=source.indexOf('\n/* RIVIS 3.1.56:',start);
 const run=vm.runInNewContext(source.slice(start,end)+'\nrivisGeminiApiOnce',{
  state:{apiKey:''},byId:()=>null,
  fetch:async()=>({status:429,ok:false,json:async()=>{throw Error('rate limited HTML');}})
 });
 await assert.rejects(()=>run('gemini-3-flash-preview',{}),e=>e.httpStatus===429&&/non-JSON/.test(e.message));
});

test('Gemini Key panel provides a connection test while keeping user credentials private',()=>{
 const support=fs.readFileSync(path.join(root,'hybrid/rivis.support.js'),'utf8');
 const ai=fs.readFileSync(path.join(root,'hybrid/rivis.ai.js'),'utf8');
 assert.match(support,/id=\\\"rvisGeminiAuthNotice\\\"/);
 assert.match(support,/handleTestGeminiConnection\(this\)/);
 assert.match(support,/Uji Koneksi Gemini/);
 assert.match(ai,/async function handleTestGeminiConnection\(btn\)/);
 assert.match(ai,/function saveApiKey\(val\)\{state\.apiKey=val/);
 assert.match(ai,/function rivisShowGeminiAuthRecovery\(error\)/);
 assert.match(ai,/rivisShowGeminiAuthRecovery\(error\)/);
});

test('Gemini Canvas automatic authentication uses blank-key first, then legacy bare-URL fallback',async()=>{
 const ai=fs.readFileSync(path.join(root,'hybrid/rivis.ai.js'),'utf8');
 const start=ai.indexOf('function rivisGeminiAuthError('),end=ai.indexOf('\n/* RIVIS 3.1.56:',start);
 const requests=[];
 const context={state:{apiKey:''},byId:()=>null,fetch:async url=>{
  requests.push(String(url));
  if(requests.length===1)return{status:401,ok:false,json:async()=>{throw Error('Canvas login HTML');}};
  return{status:200,ok:true,json:async()=>({candidates:[{content:{parts:[{text:'OK'}]}}]})};
 }};
 const run=vm.runInNewContext(ai.slice(start,end)+'\nrivisGeminiApiOnce',context);
 const reply=await run('gemini-3-flash-preview',{contents:[{parts:[{text:'test'}]}]});
 assert.equal(reply.candidates.length,1);
 assert.equal(requests.length,2);
 assert.ok(requests[0].endsWith('?key='),'Primary request uses Canvas blank-key host integration');
 assert.ok(!requests[1].includes('?key='),'Fallback retries legacy bare URL');
});

test('Gemini Canvas automatic blank-key authentication succeeds without prompting for a key',async()=>{
 const ai=fs.readFileSync(path.join(root,'hybrid/rivis.ai.js'),'utf8');
 const start=ai.indexOf('function rivisGeminiAuthError('),end=ai.indexOf('\n/* RIVIS 3.1.56:',start);
 const requests=[];let prompted=false;
 const run=vm.runInNewContext(ai.slice(start,end)+'\nrivisGeminiApiOnce',{
  state:{apiKey:''},byId:()=>({classList:{remove:()=>{prompted=true;},add:()=>{}}}),
  fetch:async url=>{requests.push(String(url));return{status:200,ok:true,json:async()=>({candidates:[{content:{parts:[{text:'OK'}]}}]})};}
 });
 const result=await run('gemini-3-flash-preview',{contents:[]});
 assert.equal(result.candidates.length,1);
 assert.equal(requests.length,1);
 assert.ok(requests[0].endsWith('?key='));
 assert.equal(prompted,false);
});

test('Gemini Canvas automatic mode retries a denied model request without inserting user keys',async()=>{
 const ai=fs.readFileSync(path.join(root,'hybrid/rivis.ai.js'),'utf8');
 const start=ai.indexOf('function rivisGeminiAuthError('),end=ai.indexOf('\n/* RIVIS 3.1.56:',start);
 const requests=[];
 const run=vm.runInNewContext(ai.slice(start,end)+'\nrivisGeminiApiOnce',{
  state:{apiKey:''},byId:()=>null,fetch:async url=>{
   requests.push(String(url));
   if(requests.length===1)return{status:403,ok:false,json:async()=>({error:{message:'Unregistered caller'}})};
   return{status:200,ok:true,json:async()=>({candidates:[{content:{parts:[{text:'OK'}]}}]})};
  }
 });
 const reply=await run('gemini-3-flash-preview',{contents:[]});
 assert.equal(reply.candidates.length,1);
 assert.equal(requests.length,2);
 assert.ok(requests[0].endsWith('?key='));
 assert.ok(!requests[1].includes('?key='));
});

test('Image Generator model preview reads real image request status and never silently changes models',()=>{
 const ai=fs.readFileSync(path.join(root,'hybrid/rivis.ai.js'),'utf8');
 const support=fs.readFileSync(path.join(root,'hybrid/rivis.support.js'),'utf8');
 assert.ok(ai.includes("const RIVIS_IMAGE_MODEL_ID='gemini-3.1-flash-image'"));
 assert.ok(ai.includes('return callGeminiApi(RIVIS_IMAGE_MODEL_ID,'));
 assert.ok(ai.includes('window.RIVIS_IMAGE_MODEL_STATUS=info'));
 assert.ok(ai.includes('response?.modelVersion'));
 assert.ok(ai.includes("error?.name==='AbortError'?'canceled':'error'"));
 assert.ok(support.includes('rivisImageModelPreview'));
 assert.ok(support.includes('rivisImageModelLibrary'));
 assert.ok(support.includes('rivis:image-model-status'));
 assert.ok(support.includes('Belum diuji'));
 assert.ok(!support.includes('installGeminiFetchInterceptor'));
});
