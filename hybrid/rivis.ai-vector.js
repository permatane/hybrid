/* RIVIS AI Vector Bridge v3.3.66 — hosted in GitHub. */
(function(){'use strict';
const MAX_SVG=750000;
function extractSvg(raw){let t=String(raw||'').trim();t=t.replace(/^```(?:svg|xml|html)?\s*/i,'').replace(/```\s*$/,'');const start=t.search(/<svg\b/i);const end=t.toLowerCase().lastIndexOf('</svg>');if(start<0||end<start)throw Error('AI tidak mengembalikan kode SVG. Coba prompt lebih sederhana.');return t.slice(start,end+6);}
function validate(svg){if(svg.length>MAX_SVG)throw Error('SVG terlalu besar; coba sederhanakan detail.');if(/<!DOCTYPE|<!ENTITY/i.test(svg))throw Error('SVG DTD/ENTITY ditolak.');const dom=new DOMParser().parseFromString(svg,'image/svg+xml');if(dom.querySelector('parsererror')||dom.documentElement.localName!=='svg')throw Error('Sintaks SVG dari AI tidak valid.');const forbidden='script,foreignObject,image,iframe,object,embed,video,audio,animate,animateMotion,animateTransform,set,feImage,use,style,metadata';if(dom.querySelector(forbidden))throw Error('SVG mengandung elemen tidak aman atau raster tertanam.');for(const elem of dom.querySelectorAll('*')){if(!['svg','g','path','rect','circle','ellipse','polygon','polyline','line','defs','linearGradient','radialGradient','stop','clipPath','title','desc'].includes(elem.localName))throw Error('SVG berisi elemen tidak diizinkan: '+elem.localName);for(const attr of [...elem.attributes]){const k=attr.name.toLowerCase(),v=attr.value.trim();if(k==='xmlns'||k.startsWith('xmlns:'))continue;if(k.startsWith('on')||k==='href'||k==='xlink:href'||k==='src'||(/url\s*\(/i.test(v)&&!/^(?:url\(#[A-Za-z_][\w.-]*\))$/.test(v))||/javascript:|data:|https?:\/\//i.test(v))throw Error('SVG memuat script atau referensi eksternal.');if(k==='style')throw Error('Style inline dibatasi; gunakan fill, stroke, opacity.');}}
const nodes=dom.querySelectorAll('path,rect,circle,ellipse,polygon,polyline,line');if(!nodes.length)throw Error('AI tidak membuat objek vektor.');if(!dom.documentElement.getAttribute('viewBox'))throw Error('SVG harus memiliki viewBox.');const clean=new XMLSerializer().serializeToString(dom.documentElement);return clean;}
async function preparedImage(imageUrl){const img=new Image();img.crossOrigin='anonymous';img.src=imageUrl;await img.decode();const max=768,scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.naturalWidth*scale));c.height=Math.max(1,Math.round(img.naturalHeight*scale));const ctx=c.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(img,0,0,c.width,c.height);const data=c.toDataURL('image/jpeg',.84).split(',')[1];c.width=c.height=0;return {base64:data,mimeType:'image/jpeg',w:img.naturalWidth,h:img.naturalHeight};}
function prompt(idea, detail){let name=String(idea.conceptName||idea.name||'').slice(0,160), description=String(idea.imagePrompt||idea.prompt||idea.simplePrompt||'').slice(0,1800);return `Act as an expert SVG illustrator and vector art director. Reconstruct the ATTACHED image as genuine editable SVG geometry, not bitmap tracing or an SVG image wrapper. Preserve recognizable silhouette, object count, placement, scale, perspective, proportions, layering, main palette, rounded corners and meaningful details. Use clean paths/shape primitives, minimal nodes, smooth cubic Bezier curves; avoid micro shapes and anti-aliasing fragments. Use real linearGradient/radialGradient elements ONLY where the image has smooth gradients. Avoid shadows, filters, patterns, masks, external resources, fonts, text, scripts, CSS and embedded bitmap images. Use a 1024x1024 viewBox and preserve source aspect ratio through geometry placement. Prefer visibly faithful shapes over decorative improvisation. Do NOT generate a new composition. Concept: ${name}. Original prompt: ${description}. Detail preference: ${detail}. Output ONLY a complete valid SVG document starting with <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"> and ending </svg>, no markdown. Keep SVG compact below 700 KB. Explicitly use fill attributes on shapes. Colors must be sensible. This is vector reconstruction, not pixel-level identical copying.`;}
const OPENROUTER_MODELS_URL='https://openrouter.ai/api/v1/models?input_modalities=image';
let visionModelCache=null,visionModelCheckedAt=0;
function zeroCost(m){const p=m.pricing||{};return ['prompt','completion'].every(k=>Number(p[k]||0)===0);}
async function listOpenRouterModels({force=false}={}){
 if(!force&&visionModelCache&&Date.now()-visionModelCheckedAt<5*60*1000)return visionModelCache;
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
 try{
  const res=await fetch(OPENROUTER_MODELS_URL,{cache:'no-store',signal:controller.signal,headers:{Accept:'application/json'}});
  if(!res.ok)throw Error('Katalog OpenRouter HTTP '+res.status);
  const payload=await res.json();
  if(!Array.isArray(payload.data))throw Error('Format katalog model OpenRouter tidak dikenal');
  const records=payload.data.filter(m=>typeof m.id==='string'&&m.architecture?.input_modalities?.includes('image')&&m.architecture?.output_modalities?.includes('text')).map(m=>({id:m.id,name:m.name||m.id,free:zeroCost(m),context:m.context_length||0}));
  records.sort((a,b)=>Number(b.free)-Number(a.free)||b.context-a.context||a.id.localeCompare(b.id));
  visionModelCache=records;visionModelCheckedAt=Date.now();return records;
 }finally{clearTimeout(timeout);}
}
async function resolveOpenRouterVisionModel(requested){
 let choices;
 try{choices=await listOpenRouterModels();}
 catch(err){if(requested.trim())return requested.trim();throw Error('Gagal memuat katalog model vision OpenRouter ('+err.message+'). Pilih Gemini atau isi Model ID vision yang valid.');}
 if(!choices.length)throw Error('Tidak ada model Vision→Text OpenRouter yang tersedia saat ini.');
 if(requested.trim()){
  const selected=choices.find(m=>m.id===requested.trim());
  if(!selected)throw Error('Model "'+requested.trim()+'" tidak tersedia sebagai Vision→Text (input image). Pilih model dari daftar OpenRouter Vision.');
  return selected.id;
 }
 const best=choices.find(m=>m.free);if(!best)throw Error('Tidak ada model vision gratis. Pilih model berbayar secara manual bila bersedia menggunakan kredit.');return best.id;
}
async function generate({imageUrl,idea={},provider='gemini',apiKey='',model='',detail='balanced'}){if(!imageUrl)throw Error('Gambar asli belum tersedia.');const image=await preparedImage(imageUrl),instruction=prompt(idea,detail);let responseText='';
if(provider==='gemini'){
 const m=model||'gemini-3-flash-preview';
 if(typeof callGeminiApi!=='function')throw Error('Gemini API Canvas belum siap.');
 const payload={contents:[{parts:[{text:instruction},{inlineData:{mimeType:image.mimeType,data:image.base64}}]}],generationConfig:{temperature:0.25,maxOutputTokens:16000}};
 const data=await callGeminiApi(m,payload);
 responseText=(data.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join('');
}else if(provider==='openrouter'||provider==='groq'){
 if(!apiKey.trim())throw Error('API key '+provider+' diperlukan. Tidak disimpan oleh RIVIS.');
 if(provider==='openrouter')model=await resolveOpenRouterVisionModel(model);
 else if(!model.trim())throw Error('Isi ID model vision yang aktif pada '+provider+'.');
 const endpoint=provider==='openrouter'?'https://openrouter.ai/api/v1/chat/completions':'https://api.groq.com/openai/v1/chat/completions';
 const resp=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+apiKey.trim()},body:JSON.stringify({model:model.trim(),messages:[{role:'user',content:[{type:'text',text:instruction},{type:'image_url',image_url:{url:'data:image/jpeg;base64,'+image.base64}}]}],temperature:.2,max_tokens:16000})});
 const data=await resp.json().catch(()=>({}));if(!resp.ok){const reason=String(data.error?.message||'Model/kuota/API gagal');if(provider==='openrouter'&&resp.status===404&&/image input|base64 image|image urls|no endpoints/i.test(reason))throw Error('OpenRouter: endpoint model '+model+' tidak mendukung gambar/base64 saat ini. Pilih model vision lain lewat daftar model; periksa dukungan input image di openrouter.ai/models. ('+reason.slice(0,130)+')');throw Error(provider+' HTTP '+resp.status+': '+reason.slice(0,200));}responseText=data.choices?.[0]?.message?.content||'';
}else throw Error('Provider AI tidak dikenal.');
const svg=validate(extractSvg(responseText));const parsed=new DOMParser().parseFromString(svg,'image/svg+xml');const vectorCount=parsed.querySelectorAll('path,rect,circle,ellipse,polygon,polyline,line').length;const paths=parsed.querySelectorAll('path').length;const gradients=parsed.querySelectorAll('linearGradient,radialGradient').length;
return {svg,info:{provider,model:model||(provider==='gemini'?'gemini-3-flash-preview':''),vectorCount,paths,gradients,bytes:new Blob([svg]).size,sourceWidth:image.w,sourceHeight:image.h}};
}
window.RIVIS_AI_VECTOR=Object.freeze({generate,validate,listOpenRouterModels});
})();
window.RIVIS_AI_VECTOR_MODULE_LOADED=true;
