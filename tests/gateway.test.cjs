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
   const id=meta.name==='RIVIS_CLOUD_CATALOG.json'?'catalog_'+(++seq):'idea_'+(++seq);
   const file={id,name:meta.name,mimeType:meta.mimeType,parents:meta.parents,doc,etag:'"rev-1"'};
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
   const file=files.get(decodeURIComponent(metaMatch[1]));if(!file)return response({error:{message:'not found'}},404);
   if(uri.includes('alt=media'))return response(JSON.stringify(file.doc),200,file.etag);
   return response({id:file.id,name:file.name,mimeType:file.mimeType,parents:file.parents,version:1},200,file.etag);
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

test('Cloud data delete soft-deletes JSON record and hides it from the catalog without deleting assets',async()=>{
 setEnv();delete process.env.RIVIS_SPREADSHEET_ID;
 const session=h.seal({access_token:'token_test',refresh_token:'refresh_test',expires_at:Date.now()+3600000}),orig=global.fetch,mock=driveJsonMock();global.fetch=mock.fetch;
 try{
  const handler=freshCloudData(),headers={cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session),origin:'https://vectorichqc2026.netlify.app'};
  await handler({httpMethod:'POST',headers,body:JSON.stringify({action:'save',idea:{ideaId:'idea_delete123',conceptName:'Delete Fixture'},assets:[{assetId:'asset_keep',ideaId:'idea_delete123',driveFileId:'drive_asset_123',assetType:'generated'}]})});
  const deleted=await handler({httpMethod:'POST',headers,body:JSON.stringify({action:'delete',ideaId:'idea_delete123'})});assert.equal(deleted.statusCode,200,deleted.body);assert.equal(JSON.parse(deleted.body).retainedDriveAssets,true);
  const listed=await handler({httpMethod:'GET',headers,queryStringParameters:{action:'list'}});assert.deepEqual(JSON.parse(listed.body).ideas,[]);
  const doc=[...mock.files.values()].find(x=>x.name==='RIVIS_IDEA_idea_delete123.json');assert.equal(doc.doc.idea.status,'Deleted');assert.equal(doc.doc.assets[0].driveFileId,'drive_asset_123');
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



test('Cloud Gallery delete hides Drive JSON record while retaining its assets',async()=>{
 setEnv();delete process.env.RIVIS_SPREADSHEET_ID;
 const session=h.seal({access_token:'token_test',refresh_token:'refresh_test',expires_at:Date.now()+3600000}),orig=global.fetch,mock=driveJsonMock();global.fetch=mock.fetch;
 try{
  const handler=freshCloudData(),headers={cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session),origin:'https://vectorichqc2026.netlify.app'};
  await handler({httpMethod:'POST',headers,body:JSON.stringify({action:'save',idea:{ideaId:'idea_delete_test',conceptName:'Delete Fixture'},assets:[{assetId:'as_demo',ideaId:'idea_delete_test',driveFileId:'driveFile123',assetType:'generated'}]})});
  const deleting=await handler({httpMethod:'POST',headers,body:JSON.stringify({action:'delete',ideaId:'idea_delete_test'})});
  assert.equal(deleting.statusCode,200,deleting.body);assert.equal(JSON.parse(deleting.body).retainedDriveAssets,true);
  const listed=await handler({httpMethod:'GET',headers,queryStringParameters:{action:'list'}});
  assert.deepEqual(JSON.parse(listed.body).ideas,[]);
  const file=[...mock.files.values()].find(x=>x.name==='RIVIS_IDEA_idea_delete_test.json');
  assert.equal(file.doc.idea.status,'Deleted');assert.equal(file.doc.assets[0].driveFileId,'driveFile123');
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
