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
  c=c.replace(/gateway\.js\?v=[^"']+/g,'gateway.js?v=cf-1.4.6');
  c=c.replace('href="/.netlify/functions/auth-start"','href="/api/auth-start"');
  c=c.replace(/Login aman melalui Netlify/g,'Login aman melalui Cloudflare');
  c=c.replace(/di Netlify/g,'di Cloudflare');
  c=c.replace(/Gateway 1\.3\.10/g,'Gateway 1.4.6');
  c=c.replace(/v1\.3\.10/g,'v1.4.6');
  if(!c.includes('href="/api/auth-start"'))throw Error('Login URL was not patched');
 }
 if(name==='gateway.js'){
  c=c.replace('RIVIS_DRIVE_FOLDER_ID di Netlify Environment Variables','RIVIS_DRIVE_FOLDER_ID di Cloudflare Variables and Secrets');
  c=c.replace('Folder RIVIS sudah ditetapkan di Netlify','Folder RIVIS sudah ditetapkan di Cloudflare');
  c=c.replace('Koneksi ke Netlify gagal.','Koneksi ke Cloudflare gagal.');
  c=c.replace(
   "if (auth === 'failed') message('Login belum berhasil. Periksa Google OAuth consent screen, Redirect URI, dan Test Users.');",
   "if (auth === 'failed') { const reason=params.get('reason')||'unknown'; const messages={google_denied:'Google tidak memberikan izin.',state_cookie_missing:'Cookie OAuth tidak ditemukan. Izinkan cookie untuk situs ini dan ulangi login di browser yang sama.',state_mismatch:'Cookie OAuth tidak cocok. Mulai login ulang dari Gateway.',no_access_token:'Google tidak mengirim access token.',token_exchange_failed:'Pertukaran token Google gagal. Periksa GOOGLE_CLIENT_SECRET dan OAuth Redirect URI.',session_secret_invalid:'Session secret tidak valid.',callback_runtime_error:'Proses callback gagal di Cloudflare. Periksa Workers Logs.',callback_state_validation_failed:'Validasi OAuth state gagal.',callback_oauth_credentials_failed:'Kredensial Google belum dapat digunakan.',callback_token_exchange_failed:'Google menolak atau gagal menukar authorization code. Periksa OAuth Client Secret dan Redirect URI.',callback_session_encryption_failed:'Pembuatan sesi Google gagal. Periksa kompatibilitas enkripsi Cloudflare.',callback_redirect_failed:'Pembuatan redirect dan cookie sesi gagal.',callback_initial_failed:'Callback gagal sebelum verifikasi OAuth.'}; message('Login gagal ('+reason+'): '+(messages[reason]||'Periksa log Cloudflare.')); }"
  );
 }
 fs.writeFileSync(path.join(dist,'rivis-cloud',name),c);
}
fs.writeFileSync(path.join(dist,'index.html'), '<!doctype html><html lang="en"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/rivis-cloud/"><title>RIVIS Cloud Gateway</title><a href="/rivis-cloud/">Open RIVIS Gateway</a></html>');
fs.mkdirSync(path.join(functions,'api'),{recursive:true});
fs.mkdirSync(path.join(functions,'rivis-cloud'),{recursive:true});

function cloudflareShared(){
 let c=legacySource(path.join(source,'_shared.cjs'));
 c=c.replace("const secret = process.env.RIVIS_SESSION_SECRET;",
  "const secret = String(process.env.RIVIS_SESSION_SECRET || '').trim().replace(/^['\\\"]|['\\\"]$/g, '').replace(/\\s+/g, '');");
 const start=c.indexOf('function seal(obj) {');
 const stop=c.indexOf('function json(statusCode',start);
 if(start<0||stop<0)throw Error('Shared session functions changed');
 const replacement=String.raw`
async function seal(obj) {
 const iv=globalThis.crypto.getRandomValues(new Uint8Array(12));
 const key=await globalThis.crypto.subtle.importKey('raw',sessionKey(),{name:'AES-GCM'},false,['encrypt']);
 const enc=new Uint8Array(await globalThis.crypto.subtle.encrypt({name:'AES-GCM',iv,tagLength:128},key,new TextEncoder().encode(JSON.stringify(obj))));
 return Buffer.concat([Buffer.from(iv),Buffer.from(enc.slice(-16)),Buffer.from(enc.slice(0,-16))]).toString('base64url');
}
async function unseal(value) {
 try{
  if(!value)return null;
  const bytes=Buffer.from(value,'base64url');
  if(bytes.length<29)return null;
  const key=await globalThis.crypto.subtle.importKey('raw',sessionKey(),{name:'AES-GCM'},false,['decrypt']);
  const plain=await globalThis.crypto.subtle.decrypt({name:'AES-GCM',iv:bytes.subarray(0,12),tagLength:128},key,Buffer.concat([bytes.subarray(28),bytes.subarray(12,28)]));
  const session=JSON.parse(new TextDecoder().decode(plain));
  return session?.refresh_token||session?.access_token?session:null;
 }catch(_){return null;}
}
async function readSession(event){return unseal(parseCookie(event,COOKIE_SESSION));}
async function sessionCookie(session){return cookie(COOKIE_SESSION,await seal(session),COOKIE_MAX_AGE);}
`;
 c=c.slice(0,start)+replacement+c.slice(stop);
 if(!c.includes('const s=readSession(event);')||!c.includes('newCookie:sessionCookie(updated)'))throw Error('Session call sites changed');
 return c.replace('const s=readSession(event);','const s=await readSession(event);')
         .replace('newCookie:sessionCookie(updated)','newCookie:await sessionCookie(updated)');
}

const generated=[
 "import crypto from 'node:crypto';",
 "import {Buffer} from 'node:buffer';",
 "function makeShared(env){",
 " const process={env}; const module={exports:{}};",
 cloudflareShared(),
 " return module.exports;",
 "}"
];
for(const name of names){
 generated.push(
  'function handler_'+name.replace(/-/g,'_')+'(env){',
  ' const process={env}; const h=makeShared(env); const exports={};',
  name==='gateway-config'
   ? legacySource(path.join(source,name+'.js')).replace("gatewayVersion:'1.3.8'", "gatewayVersion:'1.4.6'")
   : name==='auth-callback'
    ? legacySource(path.join(source,name+'.js'))
       .replace("const invalid=()=>h.redirect(h.baseUrl()+'/rivis-cloud/?auth=failed',[h.cookie(h.COOKIE_STATE,'',0)]);",
        "const invalid=(reason='unknown')=>h.redirect(h.baseUrl()+'/rivis-cloud/?auth=failed&reason='+encodeURIComponent(reason),[h.cookie(h.COOKIE_STATE,'',0)]); let stage='initial';")
       .replace("if(event.queryStringParameters?.error)return invalid();",
        "if(event.queryStringParameters?.error)return invalid('google_denied');")
       .replace("if(typeof state!=='string'||!saved||!code)return invalid();",
        "if(typeof state!=='string'||!saved||!code)return invalid('state_cookie_missing');")
       .replace("const a=Buffer.from(state),b=Buffer.from(saved);",
        "stage='state_validation'; const a=Buffer.from(state),b=Buffer.from(saved);")
       .replace("if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return invalid();",
        "if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return invalid('state_mismatch');")
       .replace("const {clientId,clientSecret}=h.tokenEnv();",
        "stage='oauth_credentials'; const {clientId,clientSecret}=h.tokenEnv();")
       .replace("const tokens=await h.googleToken(",
        "stage='token_exchange'; const tokens=await h.googleToken(")
       .replace("if(!tokens.access_token)return invalid();",
        "if(!tokens.access_token)return invalid('no_access_token');")
       .replace("return h.redirect(h.baseUrl()+'/rivis-cloud/?auth=connected',[h.cookie(h.COOKIE_STATE,'',0),h.sessionCookie(session)]);",
        "stage='session_encryption'; const savedSession=await h.sessionCookie(session); stage='redirect'; return h.redirect(h.baseUrl()+'/rivis-cloud/?auth=connected',[h.cookie(h.COOKIE_STATE,'',0),savedSession]);")
       .replace("}catch(_){return invalid();}",
        "}catch(e){console.error('RIVIS OAuth callback at '+stage+':',e?.message||e);return invalid('callback_'+stage+'_failed');}")
   : name==='auth-start'
    ? legacySource(path.join(source,name+'.js'))
       .replace("crypto.randomBytes(32).toString('base64url')", "Buffer.from(globalThis.crypto.getRandomValues(new Uint8Array(32))).toString('base64url')")
       .replace("return h.json(500,{error:h.normalizeError(e)});",
        "return h.json(500,{error: e?.message?.includes('RIVIS_SESSION_SECRET') ? 'RIVIS_SESSION_SECRET tidak valid atau belum terbaca di Production' : e?.message?.includes('GOOGLE_CLIENT') ? 'Google OAuth client credentials missing' : 'Google OAuth initialization failed',code:'oauth_init_failed',diagnostic:e?.message?.includes('RIVIS_SESSION_SECRET')?{configured:typeof process.env.RIVIS_SESSION_SECRET==='string'&&process.env.RIVIS_SESSION_SECRET.length>0,rawLength:String(process.env.RIVIS_SESSION_SECRET||'').length,base64Characters:String(process.env.RIVIS_SESSION_SECRET||'').trim().replace(/^['\\\"]|['\\\"]$/g,'').replace(/\\s+/g,'').length,decodedBytes:Buffer.from(String(process.env.RIVIS_SESSION_SECRET||'').trim().replace(/^['\\\"]|['\\\"]$/g,'').replace(/\\s+/g,''),'base64').length}:undefined});")
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
