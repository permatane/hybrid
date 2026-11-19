'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path=require('node:path');
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
const userUploadedHash='b2ecfc4a1acded4d1dc17f30b4317ddc334ea98e4fe76c6ac62aebd10d9fe3fd';
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
test('Vectorich QC is copied byte-for-byte (CSP and all scripts preserved)',()=>{
  const html=fs.readFileSync(path.join(root,'public/index.html'));
  assert.equal(crypto.createHash('sha256').update(html).digest('hex'),userUploadedHash);
  assert.match(html.toString('utf8'),/Content-Security-Policy/);
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
test('Cloud test verifies the configured folder, spreadsheet, six tabs, and headers in column A',async()=>{
  setEnv();
  const session=h.seal({access_token:'token_test',refresh_token:'refresh_test',expires_at:Date.now()+3600000});
  const orig=global.fetch;let calls=0;
  global.fetch=async(url,opts)=>{
    calls++;assert.equal(opts.headers.Authorization,'Bearer token_test');
    if(String(url).includes('/values/'))return sheetHeaderResponse(url);
    if(String(url).includes('sheets.googleapis.com'))return{ok:true,status:200,json:async()=>({spreadsheetId:'sheet12345',properties:{title:'RIVIS Cloud Index'},sheets:Object.keys(expectedHeaders).map(title=>({properties:{title}}))})};
    if(String(url).includes('folder12345'))return{ok:true,status:200,json:async()=>({id:'folder12345',name:'RIVIS CLOUD GALLERY',mimeType:'application/vnd.google-apps.folder',capabilities:{canAddChildren:true}})};
    return{ok:true,status:200,json:async()=>({id:'sheet12345',name:'RIVIS Cloud Index',mimeType:'application/vnd.google-apps.spreadsheet',capabilities:{canEdit:true}})};
  };
  try{
    const res=await cloudTest({httpMethod:'GET',headers:{cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session)}});
    assert.equal(res.statusCode,200,res.body);
    const body=JSON.parse(res.body);assert.equal(body.ok,true);assert.deepEqual(body.missingTabs,[]);assert.deepEqual(body.schemaErrors,[]);assert.equal(body.schemaStatus,'valid');assert.equal(calls,9);
  } finally {global.fetch=orig;process.env={...oldEnv};}
});

test('Cloud test flags an offset or mismatched sheet header before enabling Cloud Connected',async()=>{
  setEnv();
  const session=h.seal({access_token:'token_test',refresh_token:'refresh_test',expires_at:Date.now()+3600000});
  const orig=global.fetch;
  global.fetch=async(url,opts)=>{
    if(String(url).includes('/values/')){
      const result=sheetHeaderResponse(url);
      if(decodeURIComponent(String(url)).includes("'IDEAS'!A1:U1"))return{ok:true,status:200,json:async()=>({values:[['','Idea ID','Card Code']]})};
      return result;
    }
    if(String(url).includes('sheets.googleapis.com'))return{ok:true,status:200,json:async()=>({spreadsheetId:'sheet12345',properties:{title:'RIVIS Cloud Index'},sheets:Object.keys(expectedHeaders).map(title=>({properties:{title}}))})};
    if(String(url).includes('folder12345'))return{ok:true,status:200,json:async()=>({id:'folder12345',name:'RIVIS CLOUD LIBRARY',mimeType:'application/vnd.google-apps.folder',capabilities:{canAddChildren:true}})};
    return{ok:true,status:200,json:async()=>({id:'sheet12345',name:'RIVIS Cloud Index',mimeType:'application/vnd.google-apps.spreadsheet',capabilities:{canEdit:true}})};
  };
  try{
    const res=await cloudTest({httpMethod:'GET',headers:{cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session)}});
    const body=JSON.parse(res.body);assert.equal(res.statusCode,200);assert.equal(body.ok,false);
    assert.ok(body.schemaErrors.some(x=>x.tab==='IDEAS'&&x.error.includes('column A')));
  } finally {global.fetch=orig;process.env={...oldEnv};}
});

test('Gateway config never exposes OAuth secret and reports automatic storage readiness',async()=>{
  setEnv();const res=await gatewayConfig({httpMethod:'GET'});
  assert.equal(res.statusCode,200);assert.ok(!res.body.includes('client_secret_test'));assert.equal(JSON.parse(res.body).storageConfigured,true);assert.equal(JSON.parse(res.body).gatewayVersion,'1.3.4');
});


test('Cloud data save writes card and active prompt to the existing sheet schema',async()=>{
  setEnv();process.env.RIVIS_SPREADSHEET_ID='sheet12345';
  const session=h.seal({access_token:'token_test',refresh_token:'refresh_test',expires_at:Date.now()+3600000});
  const orig=global.fetch;const calls=[];
  global.fetch=async(url,opts={})=>{
    calls.push({url:String(url),method:opts.method||'GET',body:opts.body});
    if((opts.method||'GET')==='GET')return {ok:true,status:200,text:async()=>JSON.stringify({values:[['Idea ID','Card Code','Title']]} )};
    return {ok:true,status:200,text:async()=>JSON.stringify({updates:{updatedRows:1}})};
  };
  try{
    const res=await cloudData({httpMethod:'POST',headers:{cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session),origin:'https://vectorichqc2026.netlify.app'},body:JSON.stringify({action:'save',idea:{ideaId:'idea_12345678',conceptName:'Test Concept',simplePrompt:'clean vector',finalGenerationPrompt:'flat vector illustration'}})});
    assert.equal(res.statusCode,200,res.body);
    const data=JSON.parse(res.body);assert.equal(data.ok,true);assert.equal(data.ideaId,'idea_12345678');
    assert.ok(calls.some(x=>x.url.includes('IDEAS')));assert.ok(calls.some(x=>x.url.includes('PROMPTS')));
    const ideaCall=calls.find(x=>x.url.includes('IDEAS')&&x.method==='POST');
    const promptCall=calls.find(x=>x.url.includes('PROMPTS')&&x.method==='POST');
    assert.ok(ideaCall);assert.ok(promptCall);
    assert.ok(ideaCall.url.includes('A%3AU'));assert.ok(promptCall.url.includes('A%3AL'));
    assert.ok(!ideaCall.url.includes('B%3A'));
    assert.match(ideaCall.url,/:append\?valueInputOption=RAW&insertDataOption=INSERT_ROWS$/);
    assert.match(promptCall.url,/:append\?valueInputOption=RAW&insertDataOption=INSERT_ROWS$/);
    assert.equal(JSON.parse(ideaCall.body).values[0].length,21);
    assert.equal(JSON.parse(promptCall.body).values[0].length,12);
  }finally{global.fetch=orig;process.env={...oldEnv};}
});

test('Cloud data list returns saved idea records from IDEAS sheet',async()=>{
  setEnv();process.env.RIVIS_SPREADSHEET_ID='sheet12345';
  const session=h.seal({access_token:'token_test',refresh_token:'refresh_test',expires_at:Date.now()+3600000});
  const orig=global.fetch;
  global.fetch=async()=>({ok:true,status:200,text:async()=>JSON.stringify({values:[[],['idea_12345678','RV-001','Cloud Concept','','','','','','','','','','88','Saved','2026-11-19','2026-11-19','','','','','{}']]})});
  try{
    const res=await cloudData({httpMethod:'GET',headers:{cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session)},queryStringParameters:{action:'list'}});
    assert.equal(res.statusCode,200,res.body);const data=JSON.parse(res.body);assert.equal(data.ideas[0].ideaId,'idea_12345678');assert.equal(data.ideas[0].conceptName,'Cloud Concept');
  }finally{global.fetch=orig;process.env={...oldEnv};}
});


test('Cloud data automatically repairs legacy rows shifted from column B to column A',async()=>{
  setEnv();
  const session=h.seal({access_token:'token_test',refresh_token:'refresh_test',expires_at:Date.now()+3600000});
  const orig=global.fetch;const writes=[];
  const legacyIdea=['','idea_legacy123','RV-LEGACY','Legacy Cloud Idea','','','','','','','','','','Saved','2026-11-19','2026-11-19','','','','','{}'];
  global.fetch=async(url,opts={})=>{
    if(String(url).includes('/values/')){
      const range=decodeURIComponent(String(url).split('/values/')[1].split('?')[0]);
      if((opts.method||'GET')==='GET'){
        if(range.startsWith("'IDEAS'!"))return{ok:true,status:200,text:async()=>JSON.stringify({values:[expectedHeaders.IDEAS,legacyIdea]})};
        if(range.startsWith("'ASSETS'!"))return{ok:true,status:200,text:async()=>JSON.stringify({values:[expectedHeaders.ASSETS]})};
      }
      writes.push({range,method:opts.method,body:JSON.parse(opts.body)});
      return{ok:true,status:200,text:async()=>JSON.stringify({updatedRows:1})};
    }
    throw new Error('Unexpected URL '+url);
  };
  try{
    const res=await cloudData({httpMethod:'GET',headers:{cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session)},queryStringParameters:{action:'list'}});
    assert.equal(res.statusCode,200,res.body);
    const data=JSON.parse(res.body);assert.equal(data.ideas[0].ideaId,'idea_legacy123');assert.equal(data.ideas[0].conceptName,'Legacy Cloud Idea');
    assert.equal(writes.length,1);assert.equal(writes[0].range,"'IDEAS'!A2:V2");assert.equal(writes[0].body.values[0][0],'idea_legacy123');
  }finally{global.fetch=orig;process.env={...oldEnv};}
});

test('Cloud data exposes Google Sheets append status and API reason instead of a generic error',async()=>{
  setEnv();
  const session=h.seal({access_token:'token_test',refresh_token:'refresh_test',expires_at:Date.now()+3600000});
  const orig=global.fetch;
  global.fetch=async(url,opts={})=>{
    if((opts.method||'GET')==='GET')return{ok:true,status:200,text:async()=>JSON.stringify({values:[expectedHeaders.IDEAS]})};
    return{ok:false,status:403,text:async()=>JSON.stringify({error:{status:'PERMISSION_DENIED',message:'The caller does not have permission'}})};
  };
  try{
    const res=await cloudData({httpMethod:'POST',headers:{cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session),origin:'https://vectorichqc2026.netlify.app'},body:JSON.stringify({action:'save',idea:{ideaId:'idea_perm123',conceptName:'Permission Test'}})});
    const body=JSON.parse(res.body);assert.equal(res.statusCode,502);
    assert.match(body.error,/Sheets append failed \(403/);assert.match(body.error,/PERMISSION_DENIED/);assert.match(body.error,/does not have permission/);
  }finally{global.fetch=orig;process.env={...oldEnv};}
});

test('Cloud data Series save creates group, scene items, and per-scene prompts',async()=>{
  setEnv();process.env.RIVIS_SPREADSHEET_ID='sheet12345';
  const session=h.seal({access_token:'token_test',refresh_token:'refresh_test',expires_at:Date.now()+3600000});
  const orig=global.fetch;const calls=[];
  global.fetch=async(url,opts={})=>{calls.push({url:String(url),method:opts.method||'GET',body:opts.body});if((opts.method||'GET')==='GET')return{ok:true,status:200,text:async()=>JSON.stringify({values:[[]]})};return{ok:true,status:200,text:async()=>JSON.stringify({updates:{updatedRows:1}})};};
  try{
    const res=await cloudData({httpMethod:'POST',headers:{cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session),origin:'https://vectorichqc2026.netlify.app'},body:JSON.stringify({action:'save',idea:{ideaId:'series_12345678',conceptName:'Test Series',productionType:'series',seriesBible:{mainCharacter:'A fox',primaryLocation:'Old town'},seriesScenes:[{sceneTitle:'Arrival',mainAction:'Fox arrives',finalGenerationPrompt:'Scene prompt 1'},{sceneTitle:'Discovery',mainAction:'Fox discovers a map',finalGenerationPrompt:'Scene prompt 2'}]}})});
    assert.equal(res.statusCode,200,res.body);const result=JSON.parse(res.body).result;
    assert.equal(result.groups,1);assert.equal(result.groupItems,2);assert.equal(result.prompts,3);
    assert.ok(calls.some(x=>x.url.includes('GROUPS')));assert.ok(calls.some(x=>x.url.includes('GROUP%20ITEMS')));assert.ok(calls.some(x=>x.url.includes('PROMPTS')));
    const appendCalls=calls.filter(x=>x.method==='POST');
    assert.ok(appendCalls.length>=5);
    for(const call of appendCalls)assert.match(call.url,/:append\?valueInputOption=RAW&insertDataOption=INSERT_ROWS$/);
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

test('Cloud upload completion verifies Drive folder and indexes asset in ASSETS tab',async()=>{
  setEnv();
  const session=h.seal({access_token:'token_test',refresh_token:'refresh_test',expires_at:Date.now()+3600000});
  const originalFetch=global.fetch;const calls=[];
  global.fetch=async(url,opts={})=>{
    calls.push({url:String(url),method:opts.method||'GET',body:opts.body});
    if(String(url).includes('/drive/v3/files/file12345?fields='))return {ok:true,status:200,json:async()=>({id:'file12345',name:'asset_cover.png',mimeType:'image/png',size:'12500000',parents:['folder12345'],webViewLink:'https://drive.google.com/file/d/file12345/view'})};
    if((opts.method||'GET')==='GET')return {ok:true,status:200,json:async()=>({values:[['Asset ID','Idea ID']]})};
    return {ok:true,status:200,json:async()=>({updates:{updatedRows:1}}),text:async()=>JSON.stringify({updates:{updatedRows:1}})};
  };
  try{
    const res=await cloudUploadComplete({httpMethod:'POST',headers:{cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session),origin:'https://vectorichqc2026.netlify.app'},body:JSON.stringify({ideaId:'idea_12345678',assetId:'asset_12345678',driveFileId:'file12345',assetType:'generated',mimeType:'image/png',size:12500000,width:4096,height:4096})});
    assert.equal(res.statusCode,200,res.body);const body=JSON.parse(res.body);assert.equal(body.asset.fileSizeBytes,12500000);assert.equal(body.asset.driveFileId,'file12345');
    const assetsWrite=calls.find(x=>x.url.includes('ASSETS')&&x.method==='POST');
    assert.ok(assetsWrite);assert.ok(decodeURIComponent(assetsWrite.url).includes("'ASSETS'!A:P:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS"));
    assert.equal(JSON.parse(assetsWrite.body).values[0][0],'asset_12345678');
  }finally{global.fetch=originalFetch;process.env={...oldEnv};}
});


test('Cloud upload completion indexes SVG reference with svg format in ASSETS',async()=>{
  setEnv();
  const session=h.seal({access_token:'token_test',refresh_token:'refresh_test',expires_at:Date.now()+3600000});
  const originalFetch=global.fetch;const calls=[];
  global.fetch=async(url,opts={})=>{
    calls.push({url:String(url),method:opts.method||'GET',body:opts.body});
    if(String(url).includes('/drive/v3/files/file_svg123?fields='))return{ok:true,status:200,json:async()=>({id:'file_svg123',name:'reference.svg',mimeType:'image/svg+xml',size:'2048',parents:['folder12345']})};
    if((opts.method||'GET')==='GET')return{ok:true,status:200,json:async()=>({values:[expectedHeaders.ASSETS]})};
    return{ok:true,status:200,text:async()=>JSON.stringify({updates:{updatedRows:1}})};
  };
  try{
    const res=await cloudUploadComplete({httpMethod:'POST',headers:{cookie:h.COOKIE_SESSION+'='+encodeURIComponent(session),origin:'https://vectorichqc2026.netlify.app'},body:JSON.stringify({ideaId:'idea_12345678',assetId:'asset_svg123456',driveFileId:'file_svg123',assetType:'reference',mimeType:'image/svg+xml',size:2048,fileName:'reference.svg'})});
    assert.equal(res.statusCode,200,res.body);const body=JSON.parse(res.body);assert.equal(body.asset.mimeType,'image/svg+xml');assert.equal(body.asset.assetType,'reference');
    const write=calls.find(x=>x.url.includes('ASSETS')&&x.method==='POST');assert.ok(write);const row=JSON.parse(write.body).values[0];assert.equal(row[6],'image/svg+xml');assert.equal(row[7],'svg');
  }finally{global.fetch=originalFetch;process.env={...oldEnv};}
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
  if(path==='gateway-config')return json({gatewayVersion:'1.3.4',storageConfigured:true});
  if(path==='session')return json({connected:true});
  if(path==='cloud-test')return json({ok:true,missingTabs:[],schemaErrors:[],folder:{name:'RIVIS'},spreadsheet:{name:'RIVIS Index',tabs:[]}});
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
  URL,Blob,AbortController,setTimeout,clearTimeout,console,fetch:fetchMock};
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
