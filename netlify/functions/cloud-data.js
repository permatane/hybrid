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

async function rowsMany(event,tabs){
 const spreadsheet=sheetId(),query=tabs.map(tab=>'ranges='+encodeURIComponent(range(tab))).join('&');
 const result=await google(event,'https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(spreadsheet)+'/values:batchGet?'+query);
 if(result.error)throw new Error(result.error);
 if(!result.response.ok)throw googleFailure('Sheets batch read failed',result);
 const valueRanges=result.data.valueRanges||[],output={};
 for(let index=0;index<tabs.length;index++){
  const tab=tabs[index],data=valueRanges[index]?.values||[],expected=HEADERS[tab];
  if(expected&&data[0]?.[0]===expected[0])for(let i=1;i<data.length;i++){
   const row=data[i]||[];
   if(String(row[0]||'').trim()!==''||!/^[A-Za-z0-9_-]{1,128}$/.test(String(row[1]||'')))continue;
   const repaired=row.slice(1,expected.length+1);while(repaired.length<expected.length)repaired.push('');
   const write=await values(event,tab,'PUT',[...repaired,''],i+1);
   if(write.error)throw new Error(write.error);
   if(!write.response.ok)throw googleFailure('Legacy shifted row repair failed in '+tab,write);
   data[i]=repaired;
  }
  output[tab]=data;
 }
 return output;
}
async function batchUpsert(event,tables){
 const tabs=Object.keys(tables).filter(tab=>HEADERS[tab]&&Array.isArray(tables[tab])&&tables[tab].length);
 if(!tabs.length)return {};
 const current=await rowsMany(event,tabs),data=[],result={};
 for(const tab of tabs){
  const existing=current[tab]||[],expected=HEADERS[tab].length,lastColumn=columnName(expected),rowIndex=new Map();
  for(let i=1;i<existing.length;i++){const key=String(existing[i]?.[0]||'');if(key)rowIndex.set(key,i+1);}
  const updates=new Map(),appends=new Map();
  for(const source of tables[tab]){
   const key=text(source?.[0],128);if(!key)throw new Error('Missing primary key in '+tab);
   const clean=source.slice(0,expected);while(clean.length<expected)clean.push('');
   const index=rowIndex.get(key);if(index)updates.set(index,clean);else appends.set(key,clean);
  }
  for(const [rowNumber,row] of updates)data.push({range:range(tab,'A'+rowNumber+':'+lastColumn+rowNumber),majorDimension:'ROWS',values:[row]});
  if(appends.size){
   const start=Math.max(1,existing.length)+1,rowsToAppend=[...appends.values()];
   data.push({range:range(tab,'A'+start+':'+lastColumn+(start+rowsToAppend.length-1)),majorDimension:'ROWS',values:rowsToAppend});
  }
  result[tab]={created:appends.size,updated:updates.size};
 }
 if(data.length){
  const write=await google(event,'https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(sheetId())+'/values:batchUpdate?valueInputOption=RAW',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({valueInputOption:'RAW',data})});
  if(write.error)throw new Error(write.error);
  if(!write.response.ok)throw googleFailure('Sheets batch update failed',write);
 }
 return result;
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
 const loaded=await rowsMany(event,['IDEAS','ASSETS']);
 const data=loaded.IDEAS||[],assetRows=loaded.ASSETS||[];
 const assets=assetRows.slice(1).filter(r=>r[0]&&r[1]).map(r=>({assetId:r[0],ideaId:r[1],sceneId:r[2]||'',assetType:r[3]||'reference',driveFileId:r[4]||'',fileName:r[5]||'',mimeType:r[6]||'',format:r[7]||'',width:r[8]||'',height:r[9]||'',megapixels:r[10]||'',fileSizeBytes:r[11]||'',version:r[12]||1,isActive:r[13]??'true',createdAt:r[14]||'',sourceAssetId:r[15]||''}));
 return data.slice(1).filter(r=>r[0]&&!['deleted','archived'].includes(String(r[13]||'').trim().toLowerCase())).map(row=>{
  const idea=parseIdeaRow(row),linked=assets.filter(a=>String(a.ideaId)===String(idea.ideaId));
  idea.cloudAssets=linked;
  const cover=linked.find(a=>a.assetType==='generated'&&!a.sceneId&&String(a.isActive).toLowerCase()!=='false')||linked.find(a=>a.assetType==='generated'&&String(a.isActive).toLowerCase()!=='false');
  if(cover){idea.coverAssetId=idea.coverAssetId||cover.assetId;idea.cloudAssetRefs={...(idea.cloudAssetRefs||{}),cover:idea.cloudAssetRefs?.cover||cover};}
  return idea;
 }).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
}
async function loadIdea(event,ideaId,mode='library'){
 const names=mode==='explore'?['IDEAS','PROMPTS','ASSETS']:['IDEAS','PROMPTS','ASSETS','GROUPS','GROUP ITEMS','GENERATION LOG'];
 const loaded=await rowsMany(event,names);
 const ideas=loaded.IDEAS||[],prompts=loaded.PROMPTS||[],assets=loaded.ASSETS||[],groups=loaded.GROUPS||[],items=loaded['GROUP ITEMS']||[],logs=loaded['GENERATION LOG']||[];
 const r=ideas.slice(1).find(x=>String(x[0])===ideaId);if(!r||['deleted','archived'].includes(String(r[13]||'').trim().toLowerCase()))return null;
 const byIdea=x=>x.slice(1).filter(y=>String(y[1])===ideaId);
 return {idea:parseIdeaRow(r),prompts:byIdea(prompts).map(x=>({...jsonObject(x[11]),promptId:x[0],ideaId:x[1],promptType:x[2],version:x[3],simplePrompt:x[4],visualPrompt:x[5],finalPrompt:x[6],referenceAssetId:x[7],activeVersion:x[8]})),assets:byIdea(assets).map(x=>({assetId:x[0],ideaId:x[1],sceneId:x[2],assetType:x[3],driveFileId:x[4],fileName:x[5],mimeType:x[6],format:x[7],width:x[8],height:x[9],megapixels:x[10],fileSizeBytes:x[11],version:x[12],isActive:x[13],createdAt:x[14],sourceAssetId:x[15]})),groups:byIdea(groups).map(x=>({groupId:x[0],ideaId:x[1],groupType:x[2],groupTitle:x[3],seriesBible:x[4],continuityLock:x[5],visualStyle:x[6],colorPalette:x[7],characterDescription:x[8],location:x[9],sceneCount:x[10],createdAt:x[11],updatedAt:x[12]})),groupItems:items.slice(1).filter(x=>String(x[2])===ideaId).map(x=>({itemId:x[0],groupId:x[1],ideaId:x[2],sequence:x[3],sceneId:x[4],sceneTitle:x[5],sceneAction:x[6],promptId:x[7],activeAssetId:x[8],generationStatus:x[9],createdAt:x[10],updatedAt:x[11]})),generationLogs:byIdea(logs).map(x=>({runId:x[0],ideaId:x[1],sceneId:x[2],promptId:x[3],promptVersion:x[4],aiProvider:x[5],model:x[6],resolution:x[7],aspectRatio:x[8],generationDate:x[9],status:x[10],outputAssetId:x[11],errorMessage:x[12]}))};
}

const CATALOG_NAME='RIVIS_CLOUD_CATALOG.json';
let catalogFileIdCache='',legacySnapshotCache=null,legacySnapshotAt=0;
function driveError(label,response,data){return new Error(label+' ('+response.status+'): '+String(data?.error?.message||data?.message||'Google Drive API error').slice(0,900));}
async function driveFetch(ctx,url,options={},timeout=22000){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);try{return await fetch(url,{...options,signal:controller.signal,headers:{Authorization:'Bearer '+ctx.token,...(options.headers||{})}});}finally{clearTimeout(timer);}}
async function driveFindJson(ctx,name){
 const q="'"+ctx.folderId+"' in parents and name = '"+String(name).replace(/'/g,"\\'")+"' and trashed = false";
 const url='https://www.googleapis.com/drive/v3/files?q='+encodeURIComponent(q)+'&pageSize=10&supportsAllDrives=true&includeItemsFromAllDrives=true&fields='+encodeURIComponent('files(id,name,mimeType,modifiedTime,version,parents)');
 const res=await driveFetch(ctx,url),data=await res.json().catch(()=>({}));if(!res.ok)throw driveError('Drive JSON index search failed',res,data);
 return (data.files||[]).find(file=>file.mimeType==='application/json'&&file.parents?.includes(ctx.folderId))||null;
}
async function driveReadJson(ctx,fileId){
 const res=await driveFetch(ctx,'https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(fileId)+'?alt=media&supportsAllDrives=true');
 if(!res.ok){const data=await res.json().catch(()=>({}));throw driveError('Drive JSON read failed',res,data);}
 const raw=await res.text();let document;try{document=JSON.parse(raw);}catch(_){throw new Error('JSON file in Google Drive is invalid: '+fileId);}
 return {document,etag:res.headers?.get?.('etag')||''};
}
async function driveWriteJson(ctx,{fileId=null,name,document,etag=''}){
 const payload=JSON.stringify(document);if(Buffer.byteLength(payload,'utf8')>8*1024*1024)throw new Error('JSON document exceeds the 8 MB safety limit.');
 if(fileId){
  let currentEtag=etag;
  if(!currentEtag){const meta=await driveFetch(ctx,'https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(fileId)+'?supportsAllDrives=true&fields=id,name,mimeType,version');const metaData=await meta.json().catch(()=>({}));if(!meta.ok)throw driveError('Drive JSON metadata read failed',meta,metaData);currentEtag=meta.headers?.get?.('etag')||'';}
  const headers={'Content-Type':'application/json; charset=UTF-8'};if(currentEtag)headers['If-Match']=currentEtag;
  const url='https://www.googleapis.com/upload/drive/v3/files/'+encodeURIComponent(fileId)+'?uploadType=media&supportsAllDrives=true&fields=id,name,mimeType,modifiedTime,version';
  const res=await driveFetch(ctx,url,{method:'PATCH',headers,body:payload}),data=await res.json().catch(()=>({}));
  if(res.status===412)throw new Error('DRIVE_JSON_CONFLICT: File changed during save. Retry the operation.');
  if(!res.ok)throw driveError('Drive JSON update failed',res,data);return {fileId:data.id||fileId,etag:res.headers?.get?.('etag')||''};
 }
 const boundary='rivis_'+crypto.randomBytes(12).toString('hex'),metadata={name,mimeType:'application/json',parents:[ctx.folderId],description:'RIVIS Cloud JSON Database · '+name};
 const body='--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify(metadata)+'\r\n--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+payload+'\r\n--'+boundary+'--';
 const url='https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,mimeType,parents';
 const res=await driveFetch(ctx,url,{method:'POST',headers:{'Content-Type':'multipart/related; boundary='+boundary},body}),data=await res.json().catch(()=>({}));
 if(!res.ok)throw driveError('Drive JSON create failed',res,data);return {fileId:data.id,etag:res.headers?.get?.('etag')||''};
}
async function getCatalog(ctx){
 if(catalogFileIdCache){try{return {fileId:catalogFileIdCache,...await driveReadJson(ctx,catalogFileIdCache)};}catch(_){catalogFileIdCache='';}}
 const file=await driveFindJson(ctx,CATALOG_NAME);if(!file)return null;catalogFileIdCache=file.id;return {fileId:file.id,...await driveReadJson(ctx,file.id)};
}
function emptyCatalog(){return {schema:'rivis-drive-json',schemaVersion:3,revision:1,createdAt:now(),updatedAt:now(),migration:{status:'complete',offset:0,total:0,source:'new'},ideas:[]};}
async function createCatalog(ctx,catalog){const saved=await driveWriteJson(ctx,{name:CATALOG_NAME,document:catalog});catalogFileIdCache=saved.fileId;return saved.fileId;}
async function saveCatalog(ctx,catalog,fileId,etag=''){catalog.revision=Number(catalog.revision||0)+1;catalog.updatedAt=now();const saved=await driveWriteJson(ctx,{fileId,name:CATALOG_NAME,document:catalog,etag});catalogFileIdCache=saved.fileId;return saved;}
function assetFromRow(r){return {assetId:r[0],ideaId:r[1],sceneId:r[2]||'',assetType:r[3]||'reference',driveFileId:r[4]||'',fileName:r[5]||'',mimeType:r[6]||'',format:r[7]||'',width:r[8]||'',height:r[9]||'',megapixels:r[10]||'',fileSizeBytes:r[11]||'',version:r[12]||1,isActive:r[13]??'true',createdAt:r[14]||'',sourceAssetId:r[15]||''};}
function promptFromRow(r){return {...jsonObject(r[11]),promptId:r[0],ideaId:r[1],promptType:r[2],version:r[3],simplePrompt:r[4],visualPrompt:r[5],finalPrompt:r[6],referenceAssetId:r[7],activeVersion:r[8],createdAt:r[9],updatedAt:r[10]};}
function groupFromRow(r){return {groupId:r[0],ideaId:r[1],groupType:r[2],groupTitle:r[3],seriesBible:r[4],continuityLock:r[5],visualStyle:r[6],colorPalette:r[7],characterDescription:r[8],location:r[9],sceneCount:r[10],createdAt:r[11],updatedAt:r[12]};}
function groupItemFromRow(r){return {itemId:r[0],groupId:r[1],ideaId:r[2],sequence:r[3],sceneId:r[4],sceneTitle:r[5],sceneAction:r[6],promptId:r[7],activeAssetId:r[8],generationStatus:r[9],createdAt:r[10],updatedAt:r[11]};}
function logFromRow(r){return {runId:r[0],ideaId:r[1],sceneId:r[2],promptId:r[3],promptVersion:r[4],aiProvider:r[5],model:r[6],resolution:r[7],aspectRatio:r[8],generationDate:r[9],status:r[10],outputAssetId:r[11],errorMessage:r[12]};}
async function readLegacySnapshot(ctx){
 if(!h.validFileId(SPREADSHEET_ID()))return null;if(legacySnapshotCache&&Date.now()-legacySnapshotAt<5*60*1000)return legacySnapshotCache;
 const tables=await rowsMany(ctx.event,['IDEAS','PROMPTS','ASSETS','GROUPS','GROUP ITEMS','GENERATION LOG']);
 const ideas=(tables.IDEAS||[]).slice(1).filter(r=>r[0]).map(parseIdeaRow),prompts=(tables.PROMPTS||[]).slice(1).filter(r=>r[0]&&r[1]).map(promptFromRow),assets=(tables.ASSETS||[]).slice(1).filter(r=>r[0]&&r[1]).map(assetFromRow),groups=(tables.GROUPS||[]).slice(1).filter(r=>r[0]&&r[1]).map(groupFromRow),groupItems=(tables['GROUP ITEMS']||[]).slice(1).filter(r=>r[0]&&r[2]).map(groupItemFromRow),generationLogs=(tables['GENERATION LOG']||[]).slice(1).filter(r=>r[0]&&r[1]).map(logFromRow);
 const docs=ideas.map(idea=>{const ideaId=String(idea.ideaId),doc={schemaVersion:2,idea,prompts:prompts.filter(x=>String(x.ideaId)===ideaId),assets:assets.filter(x=>String(x.ideaId)===ideaId),groups:groups.filter(x=>String(x.ideaId)===ideaId),groupItems:groupItems.filter(x=>String(x.ideaId)===ideaId),generationLogs:generationLogs.filter(x=>String(x.ideaId)===ideaId)};idea.cloudAssets=doc.assets;idea.cloudPrompts=doc.prompts;idea.cloudGroups=doc.groups;idea.cloudGroupItems=doc.groupItems;idea.cloudGenerationLogs=doc.generationLogs;return doc;});
 legacySnapshotCache=docs;legacySnapshotAt=Date.now();return docs;
}
function catalogSummary(doc,fileId){
 const idea=doc.idea||{},prompts=Array.isArray(doc.prompts)?doc.prompts:[],assets=Array.isArray(doc.assets)?doc.assets:[],active=prompts.find(p=>String(p.promptId)===String(idea.activePromptId))||prompts.find(p=>['true','1','yes'].includes(String(p.activeVersion).toLowerCase()))||prompts.at(-1)||{};
 const activeAsset=asset=>({assetId:asset.assetId,ideaId:asset.ideaId,sceneId:asset.sceneId||'',assetType:asset.assetType,driveFileId:asset.driveFileId||'',fileName:asset.fileName||'',mimeType:asset.mimeType||'',format:asset.format||'',width:asset.width||'',height:asset.height||'',megapixels:asset.megapixels||'',fileSizeBytes:asset.fileSizeBytes||'',version:asset.version||1,isActive:asset.isActive??'true',createdAt:asset.createdAt||''});
 const generated=assets.filter(a=>a.assetType==='generated'&&String(a.isActive).toLowerCase()!=='false');
 const cover=generated.filter(a=>!a.sceneId).at(-1)||generated.at(-1)||null;
 const reference=assets.filter(a=>a.assetType==='reference'&&String(a.isActive).toLowerCase()!=='false').at(-1)||null;
 const galleryAssets=[cover,reference].filter(Boolean).map(activeAsset);
 const activePrompt=active.promptId?{promptId:active.promptId,ideaId:active.ideaId,simplePrompt:active.simplePrompt||'',visualPrompt:active.visualPrompt||'',finalPrompt:active.finalPrompt||'',activeVersion:active.activeVersion??true}:null;
 const summary={ideaId:idea.ideaId,fileId,cardCode:idea.cardCode||idea.uniqueCode||idea.ideaId,conceptName:idea.conceptName||idea.title||idea.name||'Untitled Idea',title:idea.title||idea.conceptName||'Untitled Idea',productionType:idea.productionType||'single',dataType:idea.dataType||'',category:idea.category||'',subcategory:idea.subcategory||'',visualStyle:idea.visualStyle||idea.style||'',assetType:idea.assetType||'',colorPalette:idea.colorPalette||'',targetBuyer:idea.targetBuyer||'',designNeed:idea.designNeed||'',commercialValueScore:idea.commercialValueScore??idea.score??null,score:idea.score??idea.commercialValueScore??null,status:idea.status||'Saved',createdAt:idea.createdAt||now(),updatedAt:idea.updatedAt||now(),parentIdeaId:idea.parentIdeaId||'',driveFolderId:idea.driveFolderId||'',coverAssetId:idea.coverAssetId||cover?.assetId||'',activePromptId:idea.activePromptId||active.promptId||'',simplePrompt:idea.simplePrompt||active.simplePrompt||'',visualPrompt:idea.visualPrompt||active.visualPrompt||'',finalGenerationPrompt:idea.finalGenerationPrompt||active.finalPrompt||'',prompts:activePrompt?[activePrompt]:[],cloudAssets:galleryAssets,cloudAssetRefs:{...(cover?{cover:activeAsset(cover)}:{}),...(reference?{reference:activeAsset(reference)}:{})}};
 return summary;
}
function cleanJsonValue(value){if(typeof value==='string'&&(value.startsWith('data:image/')||value.startsWith('blob:')))return '';if(Array.isArray(value))return value.map(cleanJsonValue);if(value&&typeof value==='object'){const out={};for(const [key,item] of Object.entries(value)){if(['referenceImageBlob','referenceImageFile','imageBase64'].includes(key))continue;out[key]=cleanJsonValue(item);}return out;}return value;}
async function writeIdeaDocument(ctx,doc,fileId=''){
 const safeId=String(doc.idea?.ideaId||'').replace(/[^A-Za-z0-9_-]/g,'_').slice(0,128);if(!safeId)throw new Error('Invalid ideaId for Drive JSON document.');
 const name='RIVIS_IDEA_'+safeId+'.json';let existing=fileId;if(!existing){const found=await driveFindJson(ctx,name);existing=found?.id||'';}
 return (await driveWriteJson(ctx,{fileId:existing||null,name,document:cleanJsonValue(doc)})).fileId;
}
async function initializeCatalog(ctx){
 const current=await getCatalog(ctx);if(current)return current;
 if(h.validFileId(SPREADSHEET_ID())){const docs=await readLegacySnapshot(ctx),catalog={schema:'rivis-drive-json',schemaVersion:2,revision:1,createdAt:now(),updatedAt:now(),migration:{status:docs.length?'pending':'complete',offset:0,total:docs.length,source:'Google Sheets'},ideas:docs.map(doc=>catalogSummary(doc,''))};const fileId=await createCatalog(ctx,catalog);return {fileId,document:catalog,etag:''};}
 const catalog=emptyCatalog(),fileId=await createCatalog(ctx,catalog);return {fileId,document:catalog,etag:''};
}
async function migrateLegacyBatch(ctx,limit=8){
 const current=await initializeCatalog(ctx),catalog=current.document;if(catalog.migration?.status==='complete')return {done:true,migrated:0,total:Number(catalog.migration.total||0),offset:Number(catalog.migration.offset||0)};
 if(!h.validFileId(SPREADSHEET_ID()))throw new Error('Legacy migration requires RIVIS_SPREADSHEET_ID. Keep the old Spreadsheet ID configured until migration is complete.');
 const docs=await readLegacySnapshot(ctx),total=docs.length,offset=Math.max(0,Math.min(total,Number(catalog.migration?.offset)||0)),batch=docs.slice(offset,Math.min(total,offset+Math.max(1,Math.min(8,Number(limit)||8))));
 const results=await Promise.all(batch.map(async doc=>{const entry=catalog.ideas.find(x=>String(x.ideaId)===String(doc.idea.ideaId)),fileId=await writeIdeaDocument(ctx,doc,entry?.fileId||'');return {ideaId:doc.idea.ideaId,fileId,summary:catalogSummary(doc,fileId)};}));
 const latest=await getCatalog(ctx);if(!latest)throw new Error('Cloud JSON catalog disappeared during migration.');
 for(const result of results){const index=latest.document.ideas.findIndex(x=>String(x.ideaId)===String(result.ideaId));if(index>=0)latest.document.ideas[index]=result.summary;else latest.document.ideas.push(result.summary);}
 const nextOffset=Math.min(total,offset+batch.length);latest.document.migration={status:nextOffset>=total?'complete':'pending',offset:nextOffset,total,source:'Google Sheets',completedAt:nextOffset>=total?now():null};
 await saveCatalog(ctx,latest.document,latest.fileId,latest.etag);return {done:nextOffset>=total,migrated:batch.length,total,offset:nextOffset};
}
function compactCatalogEntry(entry){
 const assets=Array.isArray(entry.cloudAssets)?entry.cloudAssets:[];
 const refs=entry.cloudAssetRefs||{};
 const generated=assets.filter(a=>a.assetType==='generated'&&String(a.isActive).toLowerCase()!=='false');
 const cover=generated.filter(a=>!a.sceneId).at(-1)||generated.at(-1)||refs.cover||null;
 const reference=assets.filter(a=>a.assetType==='reference'&&String(a.isActive).toLowerCase()!=='false').at(-1)||refs.reference||null;
 const keep=[cover,reference].filter(Boolean);
 const prompts=Array.isArray(entry.prompts)?entry.prompts:[];
 const active=prompts.find(p=>String(p.promptId||'')===String(entry.activePromptId||''))||prompts.at(-1)||null;
 const compactPrompt=active?{promptId:active.promptId,ideaId:active.ideaId,simplePrompt:active.simplePrompt||'',visualPrompt:active.visualPrompt||'',finalPrompt:active.finalPrompt||'',activeVersion:active.activeVersion??true}:null;
 const assetFields=a=>({assetId:a.assetId,ideaId:a.ideaId,sceneId:a.sceneId||'',assetType:a.assetType,driveFileId:a.driveFileId||'',fileName:a.fileName||'',mimeType:a.mimeType||'',format:a.format||'',width:a.width||'',height:a.height||'',megapixels:a.megapixels||'',fileSizeBytes:a.fileSizeBytes||'',version:a.version||1,isActive:a.isActive??'true',createdAt:a.createdAt||''});
 return {...entry,prompts:compactPrompt?[compactPrompt]:[],cloudAssets:keep.map(assetFields),cloudAssetRefs:{...(cover?{cover:assetFields(cover)}:{}),...(reference?{reference:assetFields(reference)}:{})}};
}
async function compactCatalogIfNeeded(ctx,current){
 let latest=current;
 for(let attempt=0;attempt<5;attempt++){
  if(Number(latest.document.schemaVersion||0)>=3)return latest;
  const catalog=latest.document;
  catalog.ideas=(Array.isArray(catalog.ideas)?catalog.ideas:[]).map(compactCatalogEntry);
  catalog.schemaVersion=3;
  try{const saved=await saveCatalog(ctx,catalog,latest.fileId,latest.etag);return {fileId:latest.fileId,document:catalog,etag:saved.etag};}
  catch(error){if(!String(error.message).includes('DRIVE_JSON_CONFLICT')||attempt===4)throw error;latest=await getCatalog(ctx);if(!latest)throw new Error('Cloud JSON catalog disappeared during compaction.');}
 }
 return latest;
}
async function ensureJsonCatalog(ctx){const existing=await getCatalog(ctx);if(existing)return compactCatalogIfNeeded(ctx,existing);if(h.validFileId(SPREADSHEET_ID()))return null;return initializeCatalog(ctx);}
async function updateCatalogEntry(ctx,summary){
 for(let attempt=0;attempt<7;attempt++){
  const current=await initializeCatalog(ctx),catalog=current.document;
  const index=catalog.ideas.findIndex(x=>String(x.ideaId)===String(summary.ideaId));
  if(index>=0)catalog.ideas[index]=summary;else catalog.ideas.push(summary);
  catalog.schemaVersion=3;
  try{await saveCatalog(ctx,catalog,current.fileId,current.etag);return;}
  catch(error){
   if(!String(error.message).includes('DRIVE_JSON_CONFLICT')||attempt===6)throw error;
   await new Promise(resolve=>setTimeout(resolve,Math.min(900,80*Math.pow(2,attempt))));
  }
 }
}
async function updateIdeaStatus(ctx,ideaId,status){
 const catalog=await ensureJsonCatalog(ctx);if(!catalog)return {migrationRequired:true};const entry=catalog.document.ideas.find(x=>String(x.ideaId)===String(ideaId));if(!entry||!entry.fileId)return null;
 const loaded=await driveReadJson(ctx,entry.fileId),doc=loaded.document;doc.idea=doc.idea||{};doc.idea.status=status;doc.idea.updatedAt=now();
 const saved=await driveWriteJson(ctx,{fileId:entry.fileId,name:'RIVIS_IDEA_'+String(ideaId)+'.json',document:cleanJsonValue(doc),etag:loaded.etag});await updateCatalogEntry(ctx,catalogSummary(doc,saved.fileId));return {ideaId,status,retainedDriveAssets:true};
}

exports.handler=async(event)=>{
 if(event.httpMethod==='OPTIONS')return h.json(204,{});
 if(event.httpMethod==='POST'&&(event.headers?.origin||event.headers?.Origin||'')!==h.baseUrl())return h.json(403,{error:'Invalid request origin'});
 if(!['GET','POST'].includes(event.httpMethod))return h.json(405,{error:'Method not allowed'});
 const state=await h.activeSession(event);if(state.error)return h.json(401,{error:state.error});
 const headers=state.newCookie?{'Set-Cookie':state.newCookie}:{},folderId=process.env.RIVIS_DRIVE_FOLDER_ID||'';
 if(!h.validFileId(folderId))return h.json(500,{error:'RIVIS_DRIVE_FOLDER_ID is not configured'},headers);
 const ctx={event,token:state.session.access_token,folderId};
 try{
  if(event.httpMethod==='GET'){
   const action=event.queryStringParameters?.action||'list';
   if(action==='state'){
    const current=await ensureJsonCatalog(ctx);
    if(!current)return h.json(200,{ok:true,storageMode:'drive-json',migrationRequired:true,migration:{status:'pending',offset:0,total:0}},headers);
    const migration=current.document.migration||{status:'complete',offset:0,total:0};
    return h.json(200,{ok:true,storageMode:'drive-json',migrationRequired:migration.status==='pending',migration,totalIdeas:(current.document.ideas||[]).length},headers);
   }
   if(action==='list'){
    const current=await ensureJsonCatalog(ctx);if(!current)return h.json(200,{ok:true,storageMode:'drive-json',migrationRequired:true,ideas:[]},headers);
    if(current.document.migration?.status==='pending')return h.json(200,{ok:true,storageMode:'drive-json',migrationRequired:true,migration:current.document.migration,ideas:[]},headers);
    const ideas=(current.document.ideas||[]).filter(x=>x.ideaId&&!['deleted','archived'].includes(String(x.status||'').toLowerCase())).sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||''))||String(a.ideaId).localeCompare(String(b.ideaId)));
    const total=ideas.length,idsOnly=['1','true','yes'].includes(String(event.queryStringParameters?.idsOnly||'').toLowerCase());
    if(idsOnly)return h.json(200,{ok:true,storageMode:'drive-json',total,ids:ideas.map(idea=>String(idea.ideaId))},headers);
    const page=Math.max(1,Math.floor(Number(event.queryStringParameters?.page)||1));
    const pageSize=Math.max(1,Math.min(100,Math.floor(Number(event.queryStringParameters?.pageSize)||20)));
    const totalPages=Math.max(1,Math.ceil(total/pageSize)),safePage=Math.min(page,totalPages),start=(safePage-1)*pageSize;
    return h.json(200,{ok:true,storageMode:'drive-json',total,page:safePage,pageSize,totalPages,ideas:ideas.slice(start,start+pageSize)},headers);
   }
   if(action==='load'){
    const ideaId=String(event.queryStringParameters?.ideaId||'');if(!/^[A-Za-z0-9_-]{1,128}$/.test(ideaId))return h.json(400,{error:'Invalid ideaId'},headers);
    const current=await ensureJsonCatalog(ctx);if(!current)return h.json(409,{error:'Legacy migration is required before loading this item.',migrationRequired:true},headers);
    if(current.document.migration?.status==='pending')return h.json(409,{error:'Legacy migration is still in progress.',migrationRequired:true},headers);
    const entry=current.document.ideas.find(x=>String(x.ideaId)===ideaId);if(!entry||!entry.fileId||['deleted','archived'].includes(String(entry.status||'').toLowerCase()))return h.json(404,{error:'Idea not found'},headers);
    const loaded=await driveReadJson(ctx,entry.fileId),doc=loaded.document;if(!doc?.idea||String(doc.idea.ideaId)!==ideaId)return h.json(409,{error:'Drive JSON document does not match its catalog entry.'},headers);
    const idea=doc.idea;idea.cloudAssets=doc.assets||[];idea.cloudPrompts=doc.prompts||[];idea.cloudGroups=doc.groups||[];idea.cloudGroupItems=doc.groupItems||[];idea.cloudGenerationLogs=doc.generationLogs||[];
    return h.json(200,{ok:true,storageMode:'drive-json',idea,prompts:doc.prompts||[],assets:doc.assets||[],groups:doc.groups||[],groupItems:doc.groupItems||[],generationLogs:doc.generationLogs||[]},headers);
   }
   return h.json(400,{error:'Unknown action'},headers);
  }
  const body=parseBody(event);if(!body)return h.json(400,{error:'Invalid JSON body'},headers);
  if(body.action==='migrate')return h.json(200,{ok:true,storageMode:'drive-json',migration:await migrateLegacyBatch(ctx,body.limit||8)},headers);
  if(body.action==='save'){
   const idea=jsonObject(body.idea),ideaId=text(idea.ideaId||id('idea'),128);if(!/^[A-Za-z0-9_-]{1,128}$/.test(ideaId))return h.json(400,{error:'Invalid ideaId'},headers);
   const current=await ensureJsonCatalog(ctx);if(!current)return h.json(409,{error:'Legacy migration is required before saving. Keep RIVIS_SPREADSHEET_ID configured and open Cloud Gallery once.',migrationRequired:true},headers);
   if(current.document.migration?.status==='pending')return h.json(409,{error:'Legacy migration is still in progress.',migrationRequired:true},headers);
   const existing=current.document.ideas.find(x=>String(x.ideaId)===ideaId),existingDoc=existing?.fileId?(await driveReadJson(ctx,existing.fileId)).document:null;
   idea.ideaId=ideaId;idea.createdAt=idea.createdAt||existingDoc?.idea?.createdAt||now();idea.updatedAt=now();idea.status=idea.status||'Saved';
   const prompts=Array.isArray(body.prompts)&&body.prompts.length?body.prompts:(Array.isArray(idea.cloudPrompts)?idea.cloudPrompts:(Array.isArray(idea.prompts)?idea.prompts:(existingDoc?.prompts||[])));
   const assets=Array.isArray(body.assets)&&body.assets.length?body.assets:(Array.isArray(idea.cloudAssets)?idea.cloudAssets:(existingDoc?.assets||[]));
   const groups=Array.isArray(body.groups)&&body.groups.length?body.groups:(Array.isArray(idea.cloudGroups)?idea.cloudGroups:(existingDoc?.groups||[]));
   const groupItems=Array.isArray(body.groupItems)&&body.groupItems.length?body.groupItems:(Array.isArray(idea.cloudGroupItems)?idea.cloudGroupItems:(existingDoc?.groupItems||[]));
   const generationLogs=Array.isArray(body.generationLogs)&&body.generationLogs.length?body.generationLogs:(Array.isArray(idea.cloudGenerationLogs)?idea.cloudGenerationLogs:(existingDoc?.generationLogs||[]));
   idea.cloudAssets=assets;idea.cloudPrompts=prompts;idea.cloudGroups=groups;idea.cloudGroupItems=groupItems;idea.cloudGenerationLogs=generationLogs;
   const doc=cleanJsonValue({schemaVersion:2,idea,prompts,assets,groups,groupItems,generationLogs,updatedAt:idea.updatedAt});
   const fileId=await writeIdeaDocument(ctx,doc,existing?.fileId||'');await updateCatalogEntry(ctx,catalogSummary(doc,fileId));
   return h.json(200,{ok:true,storageMode:'drive-json',ideaId,result:{idea:existing?'updated':'created',prompts:prompts.length,assets:assets.length,groups:groups.length,groupItems:groupItems.length,generationLogs:generationLogs.length},fileId},headers);
  }
  if(body.action==='delete'||body.action==='archive'){
   const ideaId=text(body.ideaId,128);if(!/^[A-Za-z0-9_-]{1,128}$/.test(ideaId))return h.json(400,{error:'Invalid ideaId'},headers);
   const status=body.action==='delete'?'Deleted':'Archived',result=await updateIdeaStatus(ctx,ideaId,status);
   if(!result)return h.json(404,{error:'Idea not found'},headers);if(result.migrationRequired)return h.json(409,{error:'Legacy migration is required before changing this item.',migrationRequired:true},headers);
   return h.json(200,{ok:true,storageMode:'drive-json',...result},headers);
  }
  return h.json(400,{error:'Unknown action'},headers);
 }catch(error){
  const timeout=error?.name==='AbortError'||error?.name==='TimeoutError',conflict=String(error?.message||'').includes('DRIVE_JSON_CONFLICT');
  return h.json(conflict?409:timeout?504:502,{error:error.message||'Cloud JSON operation failed'},headers);
 }
};
