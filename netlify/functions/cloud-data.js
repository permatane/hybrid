'use strict';
const crypto = require('node:crypto');
const h = require('./_shared.cjs');
const SPREADSHEET_ID = () => process.env.RIVIS_SPREADSHEET_ID || '';
const HEADERS = {
  IDEAS: ['Idea ID','Card Code','Title','Production Type','Data Type','Category','Subcategory','Visual Style','Asset Type','Color Palette','Target Buyer','Design Need','Commercial Value Score','Status','Created At','Updated At','Parent Idea ID','Drive Folder ID','Cover Asset ID','Active Prompt ID','Notes'],
  PROMPTS: ['Prompt ID','Idea ID','Prompt Type','Version','Simple Prompt','Visual Prompt','Final Prompt','Reference Asset ID','Active Version','Created At','Updated At','Notes'],
  ASSETS: ['Asset ID','Idea ID','Scene ID','Asset Type','Drive File ID','File Name','MIME Type','Format','Width px','Height px','Megapixels','File Size Bytes','Version','Is Active','Created At','Source Asset ID'],
  GROUPS: ['Group ID','Idea ID','Group Type','Group Title','Series Bible','Continuity Lock','Visual Style','Color Palette','Character Description','Location','Scene Count','Created At','Updated At'],
  'GROUP ITEMS': ['Item ID','Group ID','Idea ID','Sequence','Scene ID','Scene Title','Scene Action','Prompt ID','Active Asset ID','Generation Status','Created At','Updated At'],
  'GENERATION LOG': ['Run ID','Idea ID','Scene ID','Prompt ID','Prompt Version','AI Provider','Model','Resolution','Aspect Ratio','Generation Date','Status','Output Asset ID','Error Message']
};
const now = () => new Date().toISOString();
const id = prefix => prefix + '_' + crypto.randomBytes(9).toString('hex');
function parseBody(event) { try { return JSON.parse(event.body || '{}'); } catch (_) { return null; } }
function sheetId() { const value = SPREADSHEET_ID(); if (!h.validFileId(value)) throw new Error('RIVIS_SPREADSHEET_ID is not configured'); return value; }
function range(tab, rows='A:Z') { return "'" + tab.replace(/'/g,"''") + "'!" + rows; }
function columnName(number) {
  let n=number,out='';
  while(n>0){const r=(n-1)%26;out=String.fromCharCode(65+r)+out;n=Math.floor((n-1)/26);}
  return out;
}
function googleFailure(label, result) {
  const status = result.response?.status || 'unknown';
  const error = result.data?.error || result.data || {};
  const detail = error.message || error.error_description || result.data?.raw || 'Google Sheets API returned an empty error response';
  const reason = error.status && error.status !== String(status) ? ' · ' + error.status : '';
  return new Error(label + ' (' + status + reason + '): ' + String(detail).slice(0, 1200));
}
async function google(event, url, options={}) {
  const state = await h.activeSession(event);
  if (state.error) return { error: state.error };
  const response = await fetch(url, { ...options, headers: { Authorization: 'Bearer ' + state.session.access_token, ...(options.headers||{}) } });
  const text = await response.text(); let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch (_) { data = { raw: text.slice(0,500) }; }
  return { response, data, newCookie: state.newCookie };
}
async function values(event, tab, method='GET', rowValues=null, rowNumber=null) {
  const id = sheetId();
  const baseWidth = HEADERS[tab]?.length || 26;
  const width = Math.max(baseWidth + (!rowValues && !rowNumber ? 1 : 0), rowValues?.length || 0);
  const lastColumn = columnName(width);
  const r = rowNumber ? range(tab, `A${rowNumber}:${lastColumn}${rowNumber}`) : range(tab, `A:${lastColumn}`);
  const url = 'https://sheets.googleapis.com/v4/spreadsheets/' + encodeURIComponent(id) + '/values/' + encodeURIComponent(r) + (method==='POST' ? ':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS' : method==='PUT' ? '?valueInputOption=RAW' : '');
  const options = { method: method==='GET'?'GET':method==='POST'?'POST':'PUT' };
  if (rowValues) { options.headers={'Content-Type':'application/json'}; options.body=JSON.stringify({majorDimension:'ROWS',values:[rowValues]}); }
  return google(event,url,options);
}
async function rows(event, tab) {
  const result=await values(event,tab);
  if(result.error) throw new Error(result.error);
  if(!result.response.ok) throw googleFailure('Sheets read failed', result);
  const data = result.data.values || [];
  const expected = HEADERS[tab];
  // Repair rows written by Gateway 1.3.0 with a one-column right shift.
  // A valid record always has its primary ID in column A; a blank A plus ID in B
  // is the exact legacy pattern produced by the previous B:Z write range.
  if (expected && data[0]?.[0] === expected[0]) {
    for (let i = 1; i < data.length; i++) {
      const row = data[i] || [];
      if (String(row[0] || '').trim() !== '' || !/^[A-Za-z0-9_-]{1,128}$/.test(String(row[1] || ''))) continue;
      const repaired = row.slice(1, expected.length + 1);
      while (repaired.length < expected.length) repaired.push('');
      const write = await values(event, tab, 'PUT', [...repaired, ''], i + 1);
      if (write.error) throw new Error(write.error);
      if (!write.response.ok) throw googleFailure('Legacy shifted row repair failed in ' + tab, write);
      data[i] = repaired;
    }
  }
  return data;
}
async function upsert(event, tab, key, row) {
  const existing=await rows(event,tab);
  const index=existing.findIndex((r,i)=>i>0 && String(r[0]||'')===String(key));
  const expected=HEADERS[tab].length;
  const clean=row.slice(0,expected);
  while(clean.length<expected)clean.push('');
  if(index>0){
    const result=await values(event,tab,'PUT',clean,index+1);
    if(result.error)throw new Error(result.error);
    if(!result.response.ok)throw googleFailure('Sheets update failed', result);
    return 'updated';
  }
  const result=await values(event,tab,'POST',clean);
  if(result.error)throw new Error(result.error);
  if(!result.response.ok)throw googleFailure('Sheets append failed', result);
  return 'created';
}
function jsonObject(value) { if(typeof value==='object' && value!==null)return value; if(typeof value==='string'){try{return JSON.parse(value);}catch(_){}} return {}; }
function text(v,max=30000) { if(v===undefined||v===null)return ''; return String(v).slice(0,max); }
function ideaRow(idea) {
  const created=idea.createdAt||now(),updated=now();
  const notes=JSON.stringify(idea);
  return [text(idea.ideaId,128),text(idea.cardCode||idea.uniqueCode||idea.ideaId,128),text(idea.conceptName||idea.title||idea.name,500),text(idea.productionType,100),text(idea.dataType,100),text(idea.category,200),text(idea.subcategory,200),text(idea.visualStyle||idea.style,300),text(idea.assetType,200),text(Array.isArray(idea.colorPalette)?idea.colorPalette.join(', '):idea.colorPalette,2000),text(idea.targetBuyer,1000),text(idea.designNeed,1000),text(idea.commercialValueScore??idea.score,40),text(idea.status||'Saved',80),created,updated,text(idea.parentIdeaId,128),text(idea.driveFolderId,128),text(idea.coverAssetId,128),text(idea.activePromptId,128),notes];
}
function promptRow(idea,prompt) {
  const p={...idea,...prompt};
  return [text(p.promptId||id('pr'),128),text(idea.ideaId,128),text(p.promptType||idea.productionType||'single',100),text(p.version||1,40),text(p.simplePrompt||idea.simplePrompt,30000),text(p.visualPrompt||idea.visualPrompt||idea.imagePrompt,30000),text(p.finalPrompt||p.finalGenerationPrompt||idea.finalGenerationPrompt||idea.finalPrompt,30000),text(p.referenceAssetId||idea.referenceAssetId,128),String(p.activeVersion??true),text(p.createdAt||now(),80),now(),JSON.stringify(prompt)];
}
function assetRow(asset,ideaId) { return [text(asset.assetId||id('as'),128),text(ideaId,128),text(asset.sceneId,128),text(asset.assetType||'reference',80),text(asset.driveFileId,128),text(asset.fileName,500),text(asset.mimeType,120),text(asset.format,40),text(asset.width,30),text(asset.height,30),text(asset.megapixels,30),text(asset.fileSizeBytes,40),text(asset.version||1,30),String(asset.isActive??true),text(asset.createdAt||now(),80),text(asset.sourceAssetId,128)]; }
function groupRow(g,ideaId){return [text(g.groupId||id('gp'),128),text(ideaId,128),text(g.groupType||'collection',80),text(g.groupTitle||g.title,500),text(g.seriesBible,10000),text(g.continuityLock,10000),text(g.visualStyle,300),text(g.colorPalette,2000),text(g.characterDescription,5000),text(g.location,2000),text(g.sceneCount,30),text(g.createdAt||now(),80),now()];}
function itemRow(x,ideaId,groupId){return [text(x.itemId||id('it'),128),text(x.groupId||groupId,128),text(ideaId,128),text(x.sequence,30),text(x.sceneId,128),text(x.sceneTitle,500),text(x.sceneAction,5000),text(x.promptId,128),text(x.activeAssetId,128),text(x.generationStatus||'saved',80),text(x.createdAt||now(),80),now()];}
function logRow(x,ideaId){return [text(x.runId||id('run'),128),text(ideaId,128),text(x.sceneId,128),text(x.promptId,128),text(x.promptVersion,40),text(x.aiProvider,100),text(x.model,200),text(x.resolution,50),text(x.aspectRatio,40),text(x.generationDate||now(),80),text(x.status,80),text(x.outputAssetId,128),text(x.errorMessage,2000)];}
function parseIdeaRow(r){const note=jsonObject(r[20]);return {...note,ideaId:r[0],cardCode:r[1],conceptName:r[2],productionType:r[3],dataType:r[4],category:r[5],subcategory:r[6],visualStyle:r[7],assetType:r[8],colorPalette:r[9],targetBuyer:r[10],designNeed:r[11],commercialValueScore:r[12],status:r[13],createdAt:r[14],updatedAt:r[15],parentIdeaId:r[16],driveFolderId:r[17],coverAssetId:r[18],activePromptId:r[19]};}
async function listIdeas(event){
 const [data,assetRows]=await Promise.all([rows(event,'IDEAS'),rows(event,'ASSETS')]);
 const assets=assetRows.slice(1).filter(r=>r[0]&&r[1]).map(r=>({assetId:r[0],ideaId:r[1],sceneId:r[2]||'',assetType:r[3]||'reference',driveFileId:r[4]||'',fileName:r[5]||'',mimeType:r[6]||'',format:r[7]||'',width:r[8]||'',height:r[9]||'',megapixels:r[10]||'',fileSizeBytes:r[11]||'',version:r[12]||1,isActive:r[13]??'true',createdAt:r[14]||'',sourceAssetId:r[15]||''}));
 return data.slice(1).filter(r=>r[0]&&!['deleted','archived'].includes(String(r[13]||'').trim().toLowerCase())).map(row=>{
  const idea=parseIdeaRow(row),linked=assets.filter(a=>String(a.ideaId)===String(idea.ideaId));
  idea.cloudAssets=linked;
  const cover=linked.find(a=>a.assetType==='generated'&&!a.sceneId&&String(a.isActive).toLowerCase()!=='false')||linked.find(a=>a.assetType==='generated'&&String(a.isActive).toLowerCase()!=='false');
  if(cover){idea.coverAssetId=idea.coverAssetId||cover.assetId;idea.cloudAssetRefs={...(idea.cloudAssetRefs||{}),cover:idea.cloudAssetRefs?.cover||cover};}
  return idea;
 }).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
}
async function loadIdea(event,ideaId){
 const tabs=await Promise.all(['IDEAS','PROMPTS','ASSETS','GROUPS','GROUP ITEMS','GENERATION LOG'].map(t=>rows(event,t)));
 const [ideas,prompts,assets,groups,items,logs]=tabs;
 const r=ideas.slice(1).find(x=>String(x[0])===ideaId);if(!r||['deleted','archived'].includes(String(r[13]||'').trim().toLowerCase()))return null;
 const byIdea=x=>x.slice(1).filter(y=>String(y[1])===ideaId);
 return {idea:parseIdeaRow(r),prompts:byIdea(prompts).map(x=>({...jsonObject(x[11]),promptId:x[0],ideaId:x[1],promptType:x[2],version:x[3],simplePrompt:x[4],visualPrompt:x[5],finalPrompt:x[6],referenceAssetId:x[7],activeVersion:x[8]})),assets:byIdea(assets).map(x=>({assetId:x[0],ideaId:x[1],sceneId:x[2],assetType:x[3],driveFileId:x[4],fileName:x[5],mimeType:x[6],format:x[7],width:x[8],height:x[9],megapixels:x[10],fileSizeBytes:x[11],version:x[12],isActive:x[13],createdAt:x[14],sourceAssetId:x[15]})),groups:byIdea(groups).map(x=>({groupId:x[0],ideaId:x[1],groupType:x[2],groupTitle:x[3],seriesBible:x[4],continuityLock:x[5],visualStyle:x[6],colorPalette:x[7],characterDescription:x[8],location:x[9],sceneCount:x[10],createdAt:x[11],updatedAt:x[12]})),groupItems:items.slice(1).filter(x=>String(x[2])===ideaId).map(x=>({itemId:x[0],groupId:x[1],ideaId:x[2],sequence:x[3],sceneId:x[4],sceneTitle:x[5],sceneAction:x[6],promptId:x[7],activeAssetId:x[8],generationStatus:x[9],createdAt:x[10],updatedAt:x[11]})),generationLogs:byIdea(logs).map(x=>({runId:x[0],ideaId:x[1],sceneId:x[2],promptId:x[3],promptVersion:x[4],aiProvider:x[5],model:x[6],resolution:x[7],aspectRatio:x[8],generationDate:x[9],status:x[10],outputAssetId:x[11],errorMessage:x[12]}))};
}
exports.handler=async(event)=>{
 if(event.httpMethod==='OPTIONS')return h.json(204,{});
 if(event.httpMethod==='POST'){const origin=event.headers?.origin||event.headers?.Origin||'';if(origin!==h.baseUrl())return h.json(403,{error:'Invalid request origin'});}
 if(!['GET','POST'].includes(event.httpMethod))return h.json(405,{error:'Method not allowed'});
 const session=await h.activeSession(event);if(session.error)return h.json(401,{error:session.error});
 const headers=session.newCookie?{'Set-Cookie':session.newCookie}:{};
 try{
  if(event.httpMethod==='GET'){
   const action=event.queryStringParameters?.action||'list';
   if(action==='list')return h.json(200,{ok:true,ideas:await listIdeas(event)},headers);
   if(action==='load'){
    const ideaId=event.queryStringParameters?.ideaId||'';if(!/^[A-Za-z0-9_-]{1,128}$/.test(ideaId))return h.json(400,{error:'Invalid ideaId'});
    const data=await loadIdea(event,ideaId);return data?h.json(200,{ok:true,...data},headers):h.json(404,{error:'Idea not found'},headers);
   }
   return h.json(400,{error:'Unknown action'},headers);
  }
  const body=parseBody(event);if(!body)return h.json(400,{error:'Invalid JSON body'},headers);
  if(body.action==='save'){
   const idea=jsonObject(body.idea);const ideaId=text(idea.ideaId||id('idea'),128);if(!/^[A-Za-z0-9_-]{1,128}$/.test(ideaId))return h.json(400,{error:'Invalid ideaId'},headers);idea.ideaId=ideaId;
   if(JSON.stringify(idea).length>45000)return h.json(413,{error:'Card data exceeds the 45 KB Google Sheets cell safety limit. Remove embedded image data and try again.'},headers);
   const prompts=Array.isArray(body.prompts)&&body.prompts.length?body.prompts:[{promptId:idea.activePromptId||id('pr'),promptType:idea.productionType,simplePrompt:idea.simplePrompt,visualPrompt:idea.visualPrompt||idea.imagePrompt,finalPrompt:idea.finalGenerationPrompt||idea.finalPrompt,referenceAssetId:idea.referenceAssetId,version:1,activeVersion:true}];
   if(!idea.activePromptId&&prompts[0])idea.activePromptId=prompts[0].promptId||id('pr');
   if(prompts[0]&&!prompts[0].promptId)prompts[0].promptId=idea.activePromptId;
   const result={idea:await upsert(event,'IDEAS',ideaId,ideaRow(idea)),prompts:0,assets:0,groups:0,groupItems:0,generationLogs:0};
   for(const p of prompts){const row=promptRow(idea,p);result.prompts+=await upsert(event,'PROMPTS',row[0],row)==='created'?1:0;}
   for(const a of (Array.isArray(body.assets)?body.assets:[])){const row=assetRow(a,ideaId);result.assets+=await upsert(event,'ASSETS',row[0],row)==='created'?1:0;}
   const groups=Array.isArray(body.groups)?body.groups:[];
   const groupItems=Array.isArray(body.groupItems)?body.groupItems:[];
   if(idea.productionType==='series'&&Array.isArray(idea.seriesScenes)){
    const groupId=idea.groupId||ideaId+'_series';
    groups.push({groupId,groupType:'series',groupTitle:idea.conceptName||idea.title,seriesBible:JSON.stringify(idea.seriesBible||{}),continuityLock:String(idea.seriesContinuityLock!==false),visualStyle:idea.visualStyle||idea.style,colorPalette:Array.isArray(idea.colorPalette)?idea.colorPalette.join(', '):idea.colorPalette,characterDescription:idea.seriesBible?.mainCharacter||idea.mainSubject||'',location:idea.seriesBible?.primaryLocation||idea.environment||'',sceneCount:idea.seriesScenes.length});
    for(let index=0;index<idea.seriesScenes.length;index++){const scene=idea.seriesScenes[index];
     const sceneId=scene.sceneId||ideaId+'_scene_'+(index+1);
     const promptId=scene.promptId||ideaId+'_scene_prompt_'+(index+1);
     groupItems.push({itemId:scene.itemId||ideaId+'_scene_item_'+(index+1),groupId,sequence:index+1,sceneId,sceneTitle:scene.sceneTitle||scene.title||('Scene '+(index+1)),sceneAction:[scene.narrativeBeat,scene.mainAction||scene.action,scene.interaction,scene.camera,scene.environment].filter(Boolean).join(' · '),promptId,activeAssetId:scene.activeAssetId||scene.assetId||'',generationStatus:scene.generationStatus||'saved'});
     if(scene.finalGenerationPrompt||scene.scenePrompt){const scenePrompt={promptId, promptType:'series-scene',version:scene.promptVersion||1,simplePrompt:scene.scenePrompt||scene.mainAction||'',visualPrompt:scene.visualPrompt||'',finalPrompt:scene.finalGenerationPrompt||scene.scenePrompt||'',referenceAssetId:scene.referenceAssetId||'',activeVersion:true};const prow=promptRow(idea,scenePrompt);result.prompts+=await upsert(event,'PROMPTS',prow[0],prow)==='created'?1:0;}
    }
   }
   for(const g of groups){const row=groupRow(g,ideaId);result.groups+=await upsert(event,'GROUPS',row[0],row)==='created'?1:0;}
   for(const x of groupItems){const row=itemRow(x,ideaId,x.groupId);result.groupItems+=await upsert(event,'GROUP ITEMS',row[0],row)==='created'?1:0;}
   for(const x of (Array.isArray(body.generationLogs)?body.generationLogs:[])){const row=logRow(x,ideaId);result.generationLogs+=await upsert(event,'GENERATION LOG',row[0],row)==='created'?1:0;}
   return h.json(200,{ok:true,ideaId,result},headers);
  }
  if(body.action==='delete'){
   const ideaId=text(body.ideaId,128);
   if(!/^[A-Za-z0-9_-]{1,128}$/.test(ideaId))return h.json(400,{error:'Invalid ideaId'},headers);
   const data=await rows(event,'IDEAS');
   const index=data.findIndex((row,i)=>i>0&&String(row[0])===ideaId);
   if(index<=0)return h.json(404,{error:'Idea not found'},headers);
   const idea=parseIdeaRow(data[index]);
   if(String(idea.status||'').toLowerCase()==='deleted')return h.json(200,{ok:true,ideaId,status:'Deleted',alreadyDeleted:true},headers);
   idea.status='Deleted';idea.updatedAt=now();
   const write=await values(event,'IDEAS','PUT',ideaRow(idea),index+1);
   if(write.error)throw new Error(write.error);
   if(!write.response.ok)throw googleFailure('Cloud Gallery delete failed',write);
   return h.json(200,{ok:true,ideaId,status:'Deleted',retainedDriveAssets:true},headers);
  }
  if(body.action==='archive'){
   const ideaId=text(body.ideaId,128);const existing=await loadIdea(event,ideaId);if(!existing)return h.json(404,{error:'Idea not found'},headers);
   existing.idea.status='Archived';const result=await upsert(event,'IDEAS',ideaId,ideaRow(existing.idea));return h.json(200,{ok:true,ideaId,status:'Archived',result},headers);
  }
  return h.json(400,{error:'Unknown action'},headers);
 }catch(error){return h.json(502,{error:error.message||'Cloud data operation failed'},headers);}
};
