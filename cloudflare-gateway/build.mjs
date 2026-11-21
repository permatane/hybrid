import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
// Cloudflare Pages build: reuse the maintained Netlify business logic,
// but isolate environment variables and session state for every request.
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const source=path.join(root,'netlify','functions');
const publicDir=path.join(root,'public','rivis-cloud');
const dist=path.join(here,'dist');
const functions=path.join(here,'functions');
const names=['auth-start','auth-callback','session','logout','gateway-config','cloud-test','cloud-data','cloud-upload-init','cloud-upload-chunk','cloud-upload-complete','cloud-thumbnail','cloud-download'];
const read=file=>fs.readFileSync(file,'utf8');
function legacySource(file){
 const c=read(file).replace(/(?:const|let|var)\s+crypto\s*=\s*require\(['"]node:crypto['"]\)\s*;?/g,'').replace(/(?:const|let|var)\s+h\s*=\s*require\(['"]\.\/_shared\.cjs['"]\)\s*;?/g,'');
 if(/require\(/.test(c))throw Error('Unsupported require in '+file);
 return c;
}
fs.rmSync(dist,{recursive:true,force:true});
fs.mkdirSync(path.join(dist,'rivis-cloud'),{recursive:true});
for(const name of ['index.html','gateway.css','gateway.js']){
 let c=read(path.join(publicDir,name));
 if(name==='gateway.js'){
  const marker="const API = '/.netlify/functions/';";
  if(!c.includes(marker))throw Error('Gateway API marker changed');
  c=c.replace(marker,"const API = '/api/';");
 }
 if(name==='index.html'){
  c=c.replace(/gateway\.js\?v=[^"']+/g,'gateway.js?v=cf-1.4.2');
  c=c.replace('href="/.netlify/functions/auth-start"','href="/api/auth-start"');
  c=c.replace(/Login aman melalui Netlify/g,'Login aman melalui Cloudflare');
  c=c.replace(/di Netlify/g,'di Cloudflare');
  c=c.replace(/Gateway 1\.3\.10/g,'Gateway 1.4.2');
  c=c.replace(/v1\.3\.10/g,'v1.4.2');
  if(!c.includes('href="/api/auth-start"'))throw Error('Login URL was not patched');
 }
 if(name==='gateway.js'){
  c=c.replace('RIVIS_DRIVE_FOLDER_ID di Netlify Environment Variables','RIVIS_DRIVE_FOLDER_ID di Cloudflare Variables and Secrets');
  c=c.replace('Folder RIVIS sudah ditetapkan di Netlify','Folder RIVIS sudah ditetapkan di Cloudflare');
  c=c.replace('Koneksi ke Netlify gagal.','Koneksi ke Cloudflare gagal.');
 }
 fs.writeFileSync(path.join(dist,'rivis-cloud',name),c);
}
fs.writeFileSync(path.join(dist,'index.html'), '<!doctype html><html lang="en"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/rivis-cloud/"><title>RIVIS Cloud Gateway</title><a href="/rivis-cloud/">Open RIVIS Gateway</a></html>');
fs.mkdirSync(path.join(functions,'api'),{recursive:true});
fs.mkdirSync(path.join(functions,'rivis-cloud'),{recursive:true});
const generated=[
 "import crypto from 'node:crypto';",
 "import {Buffer} from 'node:buffer';",
 "function makeShared(env){",
 " const process={env}; const module={exports:{}};",
 legacySource(path.join(source,'_shared.cjs')),
 " return module.exports;",
 "}"
];
for(const name of names){
 generated.push(
  'function handler_'+name.replace(/-/g,'_')+'(env){',
  ' const process={env}; const h=makeShared(env); const exports={};',
  name==='gateway-config'
   ? legacySource(path.join(source,name+'.js')).replace("gatewayVersion:'1.3.8'", "gatewayVersion:'1.4.2'")
   : name==='auth-start'
    ? legacySource(path.join(source,name+'.js'))
       .replace("crypto.randomBytes(32).toString('base64url')", "Buffer.from(globalThis.crypto.getRandomValues(new Uint8Array(32))).toString('base64url')")
       .replace("return h.json(500,{error:h.normalizeError(e)});",
        "return h.json(500,{error: e?.message?.includes('RIVIS_SESSION_SECRET') ? 'RIVIS_SESSION_SECRET invalid: must be 32 random bytes encoded as Base64' : e?.message?.includes('GOOGLE_CLIENT') ? 'Google OAuth client credentials missing' : 'Google OAuth initialization failed',code:'oauth_init_failed'});")
    : legacySource(path.join(source,name+'.js')),
  " if(typeof exports.handler!=='function')throw Error('Handler missing');",
  ' return exports.handler;',
  '}'
 );
}
generated.push('const handlers={');
for(const name of names)generated.push(JSON.stringify(name)+':handler_'+name.replace(/-/g,'_')+',');
generated.push('};');
generated.push("\nexport async function dispatch(ctx,endpoint){\n const factory=handlers[endpoint];\n if(!factory)return Response.json({error:'Unknown gateway endpoint'},{status:404});\n const request=ctx.request,url=new URL(request.url);\n const env={...ctx.env,RIVIS_BASE_URL:ctx.env.RIVIS_BASE_URL||url.origin};\n const headers=Object.fromEntries(request.headers.entries());\n const binary=endpoint==='cloud-upload-chunk'&&request.method==='PUT'&&request.headers.get('x-rivis-query-status')!=='1';\n let body='',isBase64Encoded=false;\n if(request.method!=='GET'&&request.method!=='HEAD'){\n  if(binary){\n   body=Buffer.from(await request.arrayBuffer()).toString('base64');\n   isBase64Encoded=true;\n  }else body=await request.text();\n }\n const event={httpMethod:request.method,headers,queryStringParameters:Object.fromEntries(url.searchParams),body,isBase64Encoded};\n try{\n  const r=await factory(env)(event);\n  const responseHeaders=new Headers(r.headers||{});\n  for(const [key,values] of Object.entries(r.multiValueHeaders||{}))\n   for(const value of values||[])responseHeaders.append(key,value);\n  responseHeaders.set('Cache-Control','no-store');\n  responseHeaders.set('X-Content-Type-Options','nosniff');\n  return new Response(r.body||'',{status:r.statusCode||200,headers:responseHeaders});\n }catch(e){\n  console.error('RIVIS gateway error:',endpoint,e?.message||e);\n  return Response.json({error:'Gateway request failed'},{status:500,headers:{'Cache-Control':'no-store'}});\n }\n}\n");

fs.writeFileSync(path.join(here,'legacy-runtime.generated.js'),generated.join('\n\n'));
fs.writeFileSync(path.join(functions,'api','[endpoint].js'),
 "import {dispatch} from '../../legacy-runtime.generated.js';\nexport const onRequest=ctx=>dispatch(ctx,String(ctx.params.endpoint||''));\n");
fs.writeFileSync(path.join(functions,'rivis-cloud','callback.js'),
 "import {dispatch} from '../../legacy-runtime.generated.js';\nexport const onRequest=ctx=>dispatch(ctx,'auth-callback');\n");
fs.writeFileSync(path.join(dist,'_headers'),
 '/rivis-cloud/*\n  Cache-Control: no-store\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n');
for (const file of [path.join(here,'legacy-runtime.generated.js'),path.join(functions,'api','[endpoint].js'),path.join(functions,'rivis-cloud','callback.js')]) execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
console.log('Cloudflare Pages Gateway built and syntax-checked with '+names.length+' API endpoints');
