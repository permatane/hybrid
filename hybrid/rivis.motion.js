/* RIVIS Motion Studio · Image-to-video for Adobe Stock */
(function installRivisMotionStudio(){
 'use strict';
 if(window.RIVIS_MOTION_STUDIO_INSTALLED)return;
 window.RIVIS_MOTION_STUDIO_INSTALLED=true;

 const PRESETS={
  nature:{label:'Nature Motion',direction:'Create gentle, physically realistic movement in the natural elements: leaves sway softly, water ripples naturally, and distant clouds drift slowly. Keep the main subject stable and recognizable.',tags:['nature','natural movement','leaves','water','outdoors','environment','organic','calm']},
  product:{label:'Product Motion',direction:'Create a restrained premium product-commercial motion: subtle condensation or surface highlights move naturally, with a very slow controlled camera push-in. Preserve the exact product shape, label-free surfaces, material and proportions.',tags:['product','product commercial','advertising','premium','close up','studio lighting','commercial video']},
  food:{label:'Food Motion',direction:'Add subtle realistic food movement such as delicate rising steam, a gentle sauce flow or a natural glossy highlight. Preserve the exact food arrangement, shape, texture and color; do not add ingredients or utensils.',tags:['food','food commercial','steam','freshness','culinary','close up','appetizing']},
  fabric:{label:'Fabric Motion',direction:'Let the fabric move softly in a gentle breeze with believable folds, weight and gravity. Keep the original weave, print, color and garment silhouette unchanged.',tags:['fabric','textile','fashion','soft movement','texture','material','wind']},
  atmosphere:{label:'Atmospheric Motion',direction:'Move only atmospheric elements such as slow drifting mist, fine dust or soft natural light rays. Keep the main subject, geometry and camera composition stable.',tags:['atmosphere','mist','fog','light rays','ambient','cinematic','background']},
  cinematic:{label:'Cinematic Motion',direction:'Create one restrained cinematic shot with subtle parallax and believable subject movement. Use a very slow smooth camera move, stable exposure and consistent lighting; no cuts or abrupt movement.',tags:['cinematic','camera movement','parallax','film look','storytelling','smooth motion']},
  loop:{label:'Seamless Loop',direction:'Create subtle continuous movement designed to loop seamlessly. Keep the first and final composition visually compatible, with no sudden start, stop, jump or camera cut.',tags:['seamless loop','loopable','continuous motion','background video','repeatable','smooth']}
 };
 const DEFAULTS={preset:'nature',durationSeconds:8,aspectRatio:'16:9',resolution:'1080p',sampleCount:1,resizeMode:'pad',personGeneration:'allow_adult',model:'veo-3.1-generate-001'};
 const NEGATIVE='watermark, signature, logo, brand mark, captions, subtitles, text overlays, flicker, jitter, ghosting, frame tearing, duplicated objects, object morphing, deformed anatomy, extra limbs, unnatural physics, abrupt camera shake, compression artifacts, excessive blur';
 const state={ideaId:'',tab:'manual',busy:false,cancelBatch:false,batchSelected:new Set(),previewLinks:new Map(),localVideoUrls:new Map(),lastVideos:[]};
 const $=id=>document.getElementById(id);
 const bridge=()=>window.RIVIS_LIBRARY_BRIDGE;
 const cloud=()=>window.RIVIS_CLOUD_MOTION_COMMAND;
 const safe=(value)=>String(value==null?'':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));

 function isRasterIdea(idea){
  if(!idea||!idea.generatedImageUrl)return false;
  const mode=String(idea.outputMode||idea.outputType||idea.assetType||'').toLowerCase();
  if(mode.includes('vector')||mode==='svg'||mode.includes('eps'))return false;
  return true;
 }
 function getIdea(id){return bridge()?.getCloudSource?.(id)||null;}
 function getLibrary(){
  const api=bridge();if(!api?.getCloudSourceIds||!api?.getCloudSource)return [];
  return api.getCloudSourceIds().map(id=>api.getCloudSource(id)).filter(isRasterIdea);
 }
 function sourceFor(idea){return idea?.generatedImagePreviewUrl||idea?.generatedImageUrl||'';}
 function previewFor(idea){return idea?.generatedImagePreviewUrl||idea?.generatedImageUrl||'';}
 function titleFor(idea){return String(idea?.conceptName||idea?.mainSubject||idea?.title||'Untitled raster asset');}

 function ensureStyle(){
  if($('rivisMotionStudioStyle'))return;
  const style=document.createElement('style');style.id='rivisMotionStudioStyle';
  style.textContent=[
   '#rivisMotionOverlay{position:fixed;inset:0;z-index:10040;background:rgba(2,6,23,.88);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:12px}',
   '#rivisMotionDialog{width:min(1040px,100%);max-height:96dvh;overflow:auto;border:1px solid #334155;border-radius:20px;background:linear-gradient(155deg,#111827,#090f1d 65%);color:#e2e8f0;box-shadow:0 30px 100px rgba(0,0,0,.6)}',
   '#rivisMotionDialog button,#rivisMotionDialog select,#rivisMotionDialog textarea{font:inherit}',
   '.rms-field{display:flex;flex-direction:column;gap:6px;min-width:0}.rms-field label{font-size:10px;font-weight:800;letter-spacing:.04em;color:#a5b4fc;text-transform:uppercase}',
   '.rms-control{width:100%;box-sizing:border-box;border:1px solid #334155;border-radius:10px;background:#0b1220;color:#e2e8f0;padding:10px;font-size:12px;outline:none}.rms-control:focus{border-color:#818cf8;box-shadow:0 0 0 2px rgba(129,140,248,.16)}',
   '.rms-panel{border:1px solid #253449;background:rgba(15,23,42,.72);border-radius:14px;padding:12px;min-width:0}',
   '.rms-primary{border:1px solid #6366f1;background:linear-gradient(110deg,#6d28d9,#2563eb);color:white;border-radius:11px;padding:11px 15px;font-size:12px;font-weight:900;cursor:pointer}.rms-primary:disabled{opacity:.5;cursor:not-allowed}',
   '.rms-secondary{border:1px solid #475569;background:#1e293b;color:#e2e8f0;border-radius:10px;padding:9px 12px;font-size:11px;font-weight:800;cursor:pointer}',
   '.rms-tab{border:1px solid #334155;background:#0f172a;color:#94a3b8;border-radius:10px;padding:9px 14px;font-size:11px;font-weight:900}.rms-tab.active{background:#312e81;border-color:#818cf8;color:#fff}',
   '.rms-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.rms-progress{height:7px;border-radius:99px;background:#1e293b;overflow:hidden}.rms-progress>span{display:block;height:100%;width:0;background:linear-gradient(90deg,#22d3ee,#818cf8);transition:width .2s}',
   '.rms-batch-item{display:flex;align-items:center;gap:10px;padding:8px;border:1px solid #263449;border-radius:10px;background:#0b1220}.rms-batch-item img{width:56px;height:48px;object-fit:contain;border-radius:7px;background:#020617}.rms-video-card{border:1px solid #334155;background:#0b1220;border-radius:12px;padding:10px;min-width:0}.rms-video-card video{width:100%;max-height:300px;background:#020617;border-radius:8px}',
   '.rms-muted{color:#94a3b8;font-size:10px;line-height:1.5}.rms-status{font-size:11px;color:#67e8f9;min-height:18px;white-space:pre-wrap}.rms-badge{font-size:9px;font-weight:900;border:1px solid #155e75;color:#67e8f9;background:#083344;border-radius:99px;padding:4px 8px}',
   '#sideTabMotionStudio{color:#a5f3fc;border-color:rgba(34,211,238,.35)}#sideTabMotionStudio.is-active{background:#155e75;border-color:#67e8f9;color:white}',
   '@media(max-width:680px){#rivisMotionOverlay{padding:4px}#rivisMotionDialog{max-height:99dvh;border-radius:14px}.rms-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.rms-mobile-stack{grid-template-columns:1fr!important}.rms-batch-item img{width:48px;height:42px}}',
   '@media(prefers-reduced-motion:reduce){.rms-progress>span{transition:none}}'
  ].join('\n');
  document.head.appendChild(style);
 }

 function shell(){
  if($('rivisMotionOverlay'))return;
  ensureStyle();
  const overlay=document.createElement('div');overlay.id='rivisMotionOverlay';overlay.hidden=true;
  overlay.innerHTML=[
   '<div id="rivisMotionDialog" role="dialog" aria-modal="true" aria-labelledby="rmsTitle">',
    '<div class="flex items-center justify-between gap-3 p-4 border-b border-slate-800 sticky top-0 z-10" style="background:rgba(9,15,29,.96);backdrop-filter:blur(12px)">',
     '<div class="min-w-0"><div class="flex items-center gap-2"><span class="text-cyan-300 font-black text-xs tracking-widest">RIVIS</span><span class="text-slate-600">/</span><span id="rmsTitle" class="font-black text-white text-sm">MOTION STUDIO</span><span class="rms-badge">VEO 3.1</span></div>',
      '<p class="text-[10px] text-slate-400 mt-1">Canvas-native workflow · prepare in RIVIS, generate in Gemini Veo, import MP4</p></div>',
     '<button id="rmsClose" class="rms-secondary" aria-label="Close Motion Studio">Close ✕</button>',
    '</div>',
    '<div class="p-3 md:p-5 space-y-4">',
     '<div class="flex flex-wrap gap-2"><button id="rmsTabManual" class="rms-tab active">Manual Production</button><button id="rmsTabBatch" class="rms-tab">Batch Production</button><span class="ml-auto text-[9px] text-slate-500 self-center">1080p · 24 fps · Silent MP4</span></div>',
     '<section id="rmsManualPanel" class="space-y-3">',
      '<div class="rms-panel grid grid-cols-1 md:grid-cols-[220px_1fr] gap-3">',
       '<div class="rounded-xl border border-slate-800 bg-slate-950 min-h-[150px] flex items-center justify-center overflow-hidden"><img id="rmsSourcePreview" alt="Selected Library source" class="max-h-52 w-full object-contain"></div>',
       '<div class="min-w-0 space-y-2"><div class="text-[9px] uppercase font-black text-cyan-300">Selected Library Asset</div><div id="rmsSourceTitle" class="font-bold text-sm text-white break-words">Select a raster image from Library</div><p id="rmsSourceMeta" class="rms-muted">Only raster assets with a generated image can be animated.</p>',
        '<div class="flex flex-wrap gap-2"><button id="rmsChooseOther" class="rms-secondary">Choose another image</button><button id="rmsRefreshSaved" class="rms-secondary">Refresh saved videos</button></div></div>',
      '</div>',
      '<div class="rms-panel space-y-3">',
       '<div class="rms-grid">',
        '<div class="rms-field"><label for="rmsPreset">Motion preset</label><select id="rmsPreset" class="rms-control"></select></div>',
        '<div class="rms-field"><label for="rmsDuration">Duration</label><select id="rmsDuration" class="rms-control"><option value="8">8 seconds</option><option value="6">6 seconds</option><option value="4">4 seconds</option></select></div>',
        '<div class="rms-field"><label for="rmsVariations">Variations</label><select id="rmsVariations" class="rms-control"><option value="1">1 variation</option><option value="2">2 variations</option><option value="3">3 variations</option><option value="4">4 variations</option></select></div>',
        '<div class="rms-field"><label for="rmsAspect">Aspect ratio</label><select id="rmsAspect" class="rms-control"><option value="16:9">16:9 Landscape</option><option value="9:16">9:16 Portrait</option></select></div>',
        '<div class="rms-field"><label for="rmsResolution">Resolution</label><select id="rmsResolution" class="rms-control"><option value="1080p">1080p</option><option value="720p">720p</option></select></div>',
        '<div class="rms-field"><label for="rmsResize">Fit source image</label><select id="rmsResize" class="rms-control"><option value="pad">Preserve frame · Pad</option><option value="crop">Fill frame · Crop</option></select></div>',
       '</div>',
       '<div class="rms-field"><label for="rmsDirection">Motion direction</label><textarea id="rmsDirection" class="rms-control" rows="3" maxlength="1800"></textarea></div>',
       '<details class="text-[10px] text-slate-400"><summary class="cursor-pointer font-bold text-slate-300">Advanced generation controls</summary><div class="rms-grid mt-3"><div class="rms-field"><label for="rmsPeople">People in video</label><select id="rmsPeople" class="rms-control"><option value="allow_adult">Allow adults</option><option value="dont_allow">Do not generate people</option><option value="allowAll">Allow all ages</option></select></div><div class="rms-field"><label for="rmsModel">Veo model</label><select id="rmsModel" class="rms-control"><option value="veo-3.1-generate-001">Veo 3.1 · Standard</option><option value="veo-3.1-fast-generate-001">Veo 3.1 · Fast</option></select></div></div><div class="rms-field mt-3"><label for="rmsNegative">Negative prompt</label><textarea id="rmsNegative" class="rms-control" rows="2"></textarea></div></details>',
       '<div class="flex flex-wrap items-center justify-between gap-2"><p class="rms-muted">RIVIS menyiapkan prompt dan gambar. Generate dilakukan di Gemini/Veo; setelah itu impor MP4 di sini.</p><button id="rmsGenerate" class="rms-primary">Prepare for Gemini Veo</button></div>',
       '<div id="rmsManualStatus" class="rms-status" aria-live="polite"></div><div class="rms-panel space-y-2"><label class="rms-muted" for="rmsImportVideo"><strong>Import hasil Veo (MP4)</strong> · pilih video yang sudah diunduh dari Gemini</label><input id="rmsImportVideo" type="file" accept="video/mp4,video/webm,video/quicktime" class="rms-control"><p class="rms-muted">File video tetap berada di perangkat. RIVIS menyimpan catatan dan metadata pada Library; simpan MP4 asli secara terpisah.</p></div>',
       '<div class="rms-progress"><span id="rmsManualProgress"></span></div>',
      '</div>',
      '<div id="rmsSavedVideos" class="space-y-3"></div><div id="rmsPreparedPromptPanel" class="rms-panel space-y-2" hidden><div class="font-bold text-xs text-white">Prepared Veo Prompt</div><textarea id="rmsPreparedPrompt" class="rms-control" rows="7" readonly></textarea><button id="rmsCopyPreparedPrompt" class="rms-secondary" type="button">Copy prompt</button></div>',
     '</section>',
     '<section id="rmsBatchPanel" class="space-y-3" hidden>',
      '<div class="rms-panel space-y-2"><div class="flex flex-wrap items-center justify-between gap-2"><div><div class="font-bold text-sm text-white">Batch queue</div><p class="rms-muted">Pilih gambar raster dari Library. Proses berjalan satu per satu untuk mengendalikan biaya dan kuota Veo.</p></div><div class="flex gap-2"><button id="rmsSelectAll" class="rms-secondary">Select all</button><button id="rmsClearAll" class="rms-secondary">Clear</button></div></div><div id="rmsBatchList" class="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[42vh] overflow-auto"></div>',
       '<div class="flex flex-wrap items-center justify-between gap-2 pt-2"><span id="rmsBatchCount" class="rms-muted">0 images selected</span><div class="flex gap-2"><button id="rmsCancelBatch" class="rms-secondary" disabled>Stop after current job</button><button id="rmsRunBatch" class="rms-primary">Generate selected images</button></div></div>',
       '<div id="rmsBatchStatus" class="rms-status" aria-live="polite"></div><div class="rms-progress"><span id="rmsBatchProgress"></span></div>',
      '</div>',
     '</section>',
     '<div class="rms-panel space-y-2"><div class="font-bold text-[11px] text-white">Adobe Stock submission checks</div><div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] text-slate-300"><p>• Mark <strong>Created using generative AI tools</strong> when submitting.</p><p>• Avoid embedded text, signatures, watermarks and model inconsistencies.</p><p>• Check subject identity, anatomy, flicker, ghosting and motion artifacts.</p><p>• Verify commercial-use rights and obtain model/property releases when required.</p></div><p class="text-[9px] text-amber-300">RIVIS prepares and checks files; it cannot guarantee Adobe Stock acceptance. Review every clip before submission.</p></div>',
    '</div>',
   '</div>'
  ].join('');
  document.body.appendChild(overlay);
  Object.keys(PRESETS).forEach(key=>{
   const option=document.createElement('option');option.value=key;option.textContent=PRESETS[key].label;$('rmsPreset').appendChild(option);
  });
  $('rmsNegative').value=NEGATIVE;
  $('rmsPreset').value=DEFAULTS.preset;
  $('rmsDirection').value=PRESETS[DEFAULTS.preset].direction;
  $('rmsClose').addEventListener('click',close);
  overlay.addEventListener('click',event=>{if(event.target===overlay&&!state.busy)close();});
  $('rmsTabManual').addEventListener('click',()=>setTab('manual'));
  $('rmsTabBatch').addEventListener('click',()=>setTab('batch'));
  $('rmsPreset').addEventListener('change',()=>{$('rmsDirection').value=PRESETS[$('rmsPreset').value]?.direction||'';});
  $('rmsGenerate').addEventListener('click',generateManual);
  $('rmsImportVideo').addEventListener('change',importVideoFile);
  $('rmsCopyPreparedPrompt').addEventListener('click',()=>navigator.clipboard?.writeText($('rmsPreparedPrompt').value));
  $('rmsChooseOther').addEventListener('click',()=>setTab('batch'));
  $('rmsRefreshSaved').addEventListener('click',refreshSavedVideos);
  $('rmsSelectAll').addEventListener('click',()=>{getLibrary().forEach(idea=>state.batchSelected.add(String(idea.ideaId)));renderBatch();});
  $('rmsClearAll').addEventListener('click',()=>{state.batchSelected.clear();renderBatch();});
  $('rmsRunBatch').addEventListener('click',runBatch);
  $('rmsCancelBatch').addEventListener('click',()=>{state.cancelBatch=true;$('rmsBatchStatus').textContent='Batch akan berhenti setelah pekerjaan aktif selesai.';});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&overlay&&!overlay.hidden&&!state.busy)close();});
 }

 function setTab(tab){
  state.tab=tab;
  $('rmsManualPanel').hidden=tab!=='manual';
  $('rmsBatchPanel').hidden=tab!=='batch';
  $('rmsTabManual').classList.toggle('active',tab==='manual');
  $('rmsTabBatch').classList.toggle('active',tab==='batch');
  if(tab==='batch')renderBatch();
 }
 function open(ideaId,tab){
  shell();
  state.ideaId=String(ideaId||'');
  $('rivisMotionOverlay').hidden=false;
  document.body.style.overflow='hidden';
  setTab(tab||(state.ideaId?'manual':'batch'));
  if(state.ideaId)renderManual();
  else clearManual();
  $('sideTabMotionStudio')?.classList.add('is-active');
 }
 function close(){
  if(state.busy)return;
  const overlay=$('rivisMotionOverlay');if(overlay)overlay.hidden=true;
  document.body.style.overflow='';
  $('sideTabMotionStudio')?.classList.remove('is-active');
 }
 function clearManual(){
  $('rmsSourcePreview').removeAttribute('src');
  $('rmsSourceTitle').textContent='Select a raster image from Library';
  $('rmsSourceMeta').textContent='Open a Library card and click Create Motion Video, or select an image in Batch Production.';
  $('rmsSavedVideos').innerHTML='';
 }
 function renderManual(){
  const idea=getIdea(state.ideaId);
  if(!isRasterIdea(idea)){clearManual();$('rmsManualStatus').textContent='Pilih gambar raster yang sudah tersedia di Library.';return;}
  $('rmsSourcePreview').src=previewFor(idea);
  $('rmsSourceTitle').textContent=titleFor(idea);
  $('rmsSourceMeta').textContent=(idea.generatedImageWidth||'?')+' × '+(idea.generatedImageHeight||'?')+' px · '+String(idea.outputMode||'Raster')+' · '+(idea.motionVideos?.length||0)+' saved motion clip(s)';
  renderSavedVideos(idea);
  if(Array.isArray(idea.motionVideos)&&idea.motionVideos.length&&gatewayReady())refreshSavedVideos();
 }
 function renderBatch(){
  const list=$('rmsBatchList');if(!list)return;
  const ideas=getLibrary();
  if(!ideas.length){list.innerHTML='<p class="rms-muted">Belum ada gambar raster hasil generate di Library.</p>';$('rmsBatchCount').textContent='0 images selected';return;}
  list.innerHTML=ideas.map(idea=>{
   const id=String(idea.ideaId),checked=state.batchSelected.has(id);
   return '<label class="rms-batch-item"><input type="checkbox" data-rms-batch-id="'+safe(id)+'" '+(checked?'checked':'')+'><img src="'+safe(previewFor(idea))+'" alt=""><span class="min-w-0"><strong class="block text-[11px] text-slate-100 truncate">'+safe(titleFor(idea))+'</strong><small class="block text-[9px] text-slate-500">'+safe(idea.outputMode||'Raster')+' · '+(idea.motionVideos?.length||0)+' clips</small></span></label>';
  }).join('');
  list.querySelectorAll('input[data-rms-batch-id]').forEach(input=>input.addEventListener('change',()=>{
   const id=input.dataset.rmsBatchId;if(input.checked)state.batchSelected.add(id);else state.batchSelected.delete(id);
   $('rmsBatchCount').textContent=state.batchSelected.size+' images selected';
  }));
  $('rmsBatchCount').textContent=state.batchSelected.size+' images selected';
 }
 function getSettings(){
  return {
   preset:$('rmsPreset').value,
   durationSeconds:Number($('rmsDuration').value)||8,
   aspectRatio:$('rmsAspect').value,
   resolution:$('rmsResolution').value,
   sampleCount:Number($('rmsVariations').value)||1,
   resizeMode:$('rmsResize').value,
   personGeneration:$('rmsPeople').value,
   model:$('rmsModel').value,
   negativePrompt:$('rmsNegative').value||NEGATIVE
  };
 }
 function buildPrompt(idea,direction){
  const subject=String(idea.mainSubject||idea.conceptName||idea.title||'the subject').slice(0,240);
  return [
   'Create an image-to-video commercial stock clip from the supplied image as the exact first frame.',
   'Main subject: '+subject+'.',
   'Motion direction: '+String(direction||'subtle natural movement').slice(0,1800),
   'Preserve the original subject identity, silhouette, geometry, object count, materials, textures, colors and overall composition.',
   'Use physically plausible continuous movement, consistent lighting and exposure, stable details and one uninterrupted shot.',
   'Do not add or remove objects. Do not add text, logos, labels, signatures, subtitles or watermarks.'
  ].join(' ');
 }
 async function sourceBlob(source){
  if(!source)throw new Error('Gambar sumber tidak tersedia.');
  let response;
  try{response=await fetch(source,{cache:'no-store'});}
  catch(error){throw new Error('Browser tidak dapat membaca gambar Library. Generate ulang atau unggah kembali gambar tersebut.');}
  if(!response.ok)throw new Error('Gagal membaca gambar sumber (HTTP '+response.status+').');
  let blob=await response.blob();
  if(!['image/png','image/jpeg'].includes(blob.type)||blob.size>20*1024*1024){
   const bitmap=await createImageBitmap(blob);
   try{
    const scale=Math.min(1,2048/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas tidak tersedia untuk menyiapkan gambar Veo.');
    ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
    blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('Gagal menyiapkan JPEG untuk Veo.')),'image/jpeg',.92));
    canvas.width=0;canvas.height=0;
   }finally{bitmap.close?.();}
  }
  if(blob.size>20*1024*1024)throw new Error('Gambar masih melebihi batas Veo 20 MB setelah optimasi.');
  return blob;
 }
 async function imageBase64(source){
  const blob=await sourceBlob(source);
  const dataUrl=await new Promise((resolve,reject)=>{
   const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||''));reader.onerror=()=>reject(new Error('Gagal membaca data gambar.'));
   reader.readAsDataURL(blob);
  });
  const comma=dataUrl.indexOf(',');
  if(comma<0)throw new Error('Data URL gambar tidak lengkap.');
  return {imageBase64:dataUrl.slice(comma+1),mimeType:blob.type};
 }
 function gatewayReady(){
  const status=window.RIVIS_CLOUD_STATUS?.();
  return status?.connected===true&&status?.verified===true&&typeof cloud()==='function';
 }
 function promptConnect(){
  $('rmsManualStatus').textContent='Hubungkan Google melalui Cloud Gallery dan biarkan popup Cloud Gateway tetap terbuka.';
  $('rmsBatchStatus').textContent='Hubungkan Google melalui Cloud Gallery dan biarkan popup Cloud Gateway tetap terbuka.';
  const button=$('rvCloudOpenGateway');if(button)button.click();
 }
 function setBusy(value){
  state.busy=Boolean(value);
  $('rmsGenerate').disabled=state.busy;
  $('rmsRunBatch').disabled=state.busy;
  $('rmsCancelBatch').disabled=!state.busy||state.tab!=='batch';
  $('rmsClose').disabled=state.busy;
 }
 function progress(target,value){const bar=$(target);if(bar)bar.style.width=Math.max(0,Math.min(100,Number(value)||0))+'%';}
 async function poll(operationName,statusTarget,progressTarget){
  const started=Date.now(),limit=18*60*1000;
  while(Date.now()-started<limit){
   await delay(12000);
   const status=await cloud()('motion-status',{operationName});
   if(status.done===true){
    if(status.state==='failed'||status.error)throw new Error(status.error||'Veo gagal menyelesaikan video.');
    progress(progressTarget,100);return status.videos||[];
   }
   const elapsed=Math.round((Date.now()-started)/1000);
   $(statusTarget).textContent='Veo sedang memproses video · '+elapsed+' detik berlalu…';
   progress(progressTarget,Math.min(94,Math.round((Date.now()-started)/limit*94)));
  }
  throw new Error('Pekerjaan Veo belum selesai setelah 18 menit. ID operation disimpan agar status dapat diperiksa lagi.');
 }
 function metadataDraft(idea,prompt,settings,index){
  const source=Array.isArray(idea.metadata?.keywords)?idea.metadata.keywords:[];
  const titleBase=String(idea.metadata?.stockTitle||idea.conceptName||idea.mainSubject||'Commercial stock footage').trim();
  const action=String(settings.preset==='nature'?'natural movement':settings.preset==='food'?'food in motion':settings.preset==='product'?'product motion':settings.preset==='fabric'?'fabric in motion':settings.preset==='atmosphere'?'atmospheric motion':settings.preset==='loop'?'seamless motion':'cinematic motion');
  const title=(titleBase+' '+action).slice(0,70).trim();
  const stop=new Set(['with','from','into','that','this','there','their','about','over','under','very','slowly','gently','create','video','image','using','the','and','for','are','was','has','have','your','motion','commercial','stock']);
  const words=[];
  const add=value=>{
   String(value||'').toLowerCase().replace(/[^a-z0-9 -]/g,' ').split(/\s+/).forEach(word=>{
    if(word.length>2&&!stop.has(word)&&!words.includes(word))words.push(word);
   });
  };
  add(titleBase);add(idea.mainSubject);add(idea.category);add(prompt);
  (source||[]).forEach(add);
  (PRESETS[settings.preset]?.tags||[]).forEach(add);
  ['video footage','moving image','motion clip','commercial footage','copy space','visual background','realistic movement','continuous shot','high quality footage'].forEach(add);
  const keywords=words.slice(0,40);
  return {stockTitle:title,keywords,adobeCategoryCode:Number(idea.metadata?.adobeCategoryCode)||12,createdUsingGenerativeAI:true,peopleAndPropertyFictional:false,reviewRequired:true};
 }
 function persistVideo(idea,video,job,settings,prompt,index){
  const record={
   videoId:'mv_'+Date.now().toString(36)+'_'+index,
   provider:'Google Veo 3.1',
   model:job.model||settings.model,
   operationName:job.operationName,
   gcsUri:video.gcsUri,
   mimeType:video.mimeType||'video/mp4',
   durationSeconds:settings.durationSeconds,
   resolution:settings.resolution,
   aspectRatio:settings.aspectRatio,
   fps:24,
   silent:true,
   preset:settings.preset,
   prompt,
   metadata:metadataDraft(idea,prompt,settings,index),
   createdAt:new Date().toISOString(),
   adobeStock:{generativeAI:true,peopleAndPropertyFictional:null,reviewRequired:true}
  };
  const latest=getIdea(idea.ideaId)||idea;
  const current=Array.isArray(latest.motionVideos)?latest.motionVideos.slice():[];
  current.push(record);
  const updated=Object.assign({},latest,{motionVideos:current.slice(-50),motionUpdatedAt:record.createdAt});
  bridge()?.upsertIdea?.(updated);
  state.previewLinks.set(video.gcsUri,video);
  return record;
 }
 function renderSavedVideos(idea){
  const records=Array.isArray(idea?.motionVideos)?idea.motionVideos:[];
  const root=$('rmsSavedVideos');if(!root)return;
  if(!records.length){root.innerHTML='';return;}
  root.innerHTML='<div class="font-bold text-xs text-white">Imported Motion Clips ('+records.length+')</div>'+records.slice().reverse().map(record=>{
   const url=state.localVideoUrls.get(record.videoId);
   return '<div class="rms-video-card space-y-2"><div class="flex items-center justify-between gap-2"><strong class="text-[11px] text-white">'+safe(record.metadata?.stockTitle||record.preset||'Motion clip')+'</strong><span class="rms-badge">'+safe(record.resolution||'MP4')+'</span></div>'+
    (url?'<video controls playsinline preload="metadata" src="'+safe(url)+'"></video>':'<p class="rms-muted">Video tercatat di Library. File asli perlu diimpor ulang setelah halaman dimuat kembali.</p>')+
    '<p class="rms-muted">'+safe(record.fileName||'MP4')+' · '+safe(record.durationSeconds)+'s · '+safe(record.aspectRatio)+' · '+safe(record.preset||'Motion')+'</p>'+
    '<button type="button" class="rms-secondary" data-rms-metadata="'+safe(record.videoId)+'">Download metadata CSV</button></div>';
  }).join('');
  root.querySelectorAll('[data-rms-metadata]').forEach(button=>button.addEventListener('click',()=>{
   const record=records.find(item=>item.videoId===button.dataset.rmsMetadata);if(record)downloadMetadata(record);
  }));
 }
 function downloadMetadata(record){
  const meta=record.metadata||{},keywords=(meta.keywords||[]).join(',');
  const csv=[['Filename','Title','Keywords','Category'],[record.fileName||'rivis-motion.mp4',meta.stockTitle||'',keywords,meta.adobeCategoryCode||12]]
   .map(row=>row.map(value=>'"'+String(value??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='rivis-motion-metadata.csv';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
 }
 function downloadBlob(blob,name){
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
 }
 function slug(value){return String(value||'asset').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48)||'asset';}
 async function prepareVeo(idea,openGemini=true){
  if(!isRasterIdea(idea))throw new Error('Sumber harus berupa gambar raster hasil generate.');
  const settings=getSettings(),direction=state.tab==='manual'?$('rmsDirection').value:PRESETS[settings.preset].direction;
  const prompt=buildPrompt(idea,direction)+' Duration target: '+settings.durationSeconds+' seconds. Aspect ratio: '+settings.aspectRatio+'. Output target: '+settings.resolution+'. Negative guidance: '+settings.negativePrompt+'.';
  const blob=await sourceBlob(sourceFor(idea));
  const base=slug(titleFor(idea));
  if(openGemini)window.open('https://gemini.google.com/app','_blank','noopener');
  downloadBlob(blob,base+'-veo-source.'+(blob.type==='image/png'?'png':'jpg'));
  try{await navigator.clipboard.writeText(prompt);$('rmsManualStatus').textContent='Prompt disalin. Gambar sumber diunduh. Di tab Gemini, buka Veo, unggah gambar, tempel prompt, lalu generate.';}
  catch(_){$('rmsManualStatus').textContent='Gambar sumber diunduh. Salin prompt dari panel di bawah, lalu tempel di Gemini Veo.';}
  $('rmsPreparedPrompt').value=prompt;
  $('rmsPreparedPromptPanel').hidden=false;
  return {prompt,blob,settings};
 }
 async function generateManual(){
  if(state.busy)return;
  const idea=getIdea(state.ideaId);
  if(!isRasterIdea(idea)){$('rmsManualStatus').textContent='Pilih gambar raster dari Library terlebih dahulu.';return;}
  setBusy(true);progress('rmsManualProgress',15);
  try{
   await prepareVeo(idea,true);
   progress('rmsManualProgress',100);
  }catch(error){$('rmsManualStatus').textContent='Gagal menyiapkan: '+String(error.message||error);progress('rmsManualProgress',0);}
  finally{setBusy(false);}
 }
 async function runBatch(){
  if(state.busy)return;
  const ids=Array.from(state.batchSelected).slice(0,20);
  if(!ids.length){$('rmsBatchStatus').textContent='Pilih minimal satu gambar raster.';return;}
  state.cancelBatch=false;setBusy(true);$('rmsCancelBatch').disabled=false;
  try{
   const zip=new window.JSZip();let count=0;
   for(let i=0;i<ids.length;i++){
    if(state.cancelBatch)break;
    const idea=getIdea(ids[i]);if(!isRasterIdea(idea))continue;
    const settings=getSettings(),prompt=buildPrompt(idea,PRESETS[settings.preset].direction)+' Duration target: '+settings.durationSeconds+' seconds. Aspect ratio: '+settings.aspectRatio+'. Output target: '+settings.resolution+'. Negative guidance: '+settings.negativePrompt+'.';
    const blob=await sourceBlob(sourceFor(idea)),base=slug(titleFor(idea));
    zip.file('images/'+base+(blob.type==='image/png'?'.png':'.jpg'),blob);
    zip.file('prompts/'+base+'-veo-prompt.txt',prompt);
    zip.file('prompts/'+base+'-settings.json',JSON.stringify({preset:settings.preset,durationSeconds:settings.durationSeconds,aspectRatio:settings.aspectRatio,resolution:settings.resolution,sourceIdeaId:idea.ideaId},null,2));
    count++;progress('rmsBatchProgress',Math.round((i+1)/ids.length*100));
    $('rmsBatchStatus').textContent='Menyiapkan paket '+(i+1)+'/'+ids.length+' · '+titleFor(idea);
   }
   if(!count)throw new Error('Tidak ada gambar raster valid untuk diproses.');
   const blob=await zip.generateAsync({type:'blob'});
   downloadBlob(blob,'RIVIS-Veo-Batch-Prompts.zip');
   window.open('https://gemini.google.com/app','_blank','noopener');
   $('rmsBatchStatus').textContent=count+' prompt dan gambar berhasil dikemas. Ekstrak ZIP, lalu unggah gambar dan gunakan prompt di Gemini Veo.';
  }catch(error){$('rmsBatchStatus').textContent='Gagal menyiapkan batch: '+String(error.message||error);}
  finally{setBusy(false);$('rmsCancelBatch').disabled=true;renderBatch();}
 }
 function importVideoFile(event){
  const file=event.target.files?.[0];if(!file)return;
  if(!/^video\/(mp4|webm|quicktime)$/.test(file.type)){ $('rmsManualStatus').textContent='Format video tidak didukung. Pilih MP4, WebM, atau MOV.';return;}
  const idea=getIdea(state.ideaId);if(!idea){$('rmsManualStatus').textContent='Pilih gambar sumber di Library sebelum mengimpor video.';return;}
  const settings=getSettings(),direction=$('rmsDirection').value,prompt=buildPrompt(idea,direction);
  const metadata=metadataDraft(idea,prompt,settings,1),videoId='local_'+Date.now().toString(36);
  const url=URL.createObjectURL(file);state.localVideoUrls.set(videoId,url);
  const record={videoId,provider:'Gemini Veo (manual import)',model:'Veo',fileName:file.name,fileSize:file.size,mimeType:file.type,
   durationSeconds:settings.durationSeconds,resolution:settings.resolution,aspectRatio:settings.aspectRatio,fps:24,silent:true,
   preset:settings.preset,prompt,metadata,createdAt:new Date().toISOString(),storageNote:'Original video remains on user device; re-import after reload to preview.'};
  const latest=getIdea(idea.ideaId)||idea,current=Array.isArray(latest.motionVideos)?latest.motionVideos.slice():[];
  current.push(record);bridge()?.upsertIdea?.(Object.assign({},latest,{motionVideos:current.slice(-50),motionUpdatedAt:record.createdAt}));
  state.lastVideos.push({record,file,url});renderSavedVideos(getIdea(idea.ideaId)||latest);
  $('rmsManualStatus').textContent='Video '+file.name+' berhasil diimpor. Metadata tersimpan pada Library. Simpan MP4 asli di folder aset Anda.';
  event.target.value='';
 }
 function mountRailButton(){
  const rail=$('floatingSideTabs');if(!rail||$('sideTabMotionStudio'))return;
  const button=document.createElement('button');button.id='sideTabMotionStudio';button.type='button';button.className='side-tab';
  button.title='Open RIVIS Motion Studio';button.setAttribute('aria-label','Open RIVIS Motion Studio');
  button.innerHTML='<span class="text-lg" aria-hidden="true">▶</span>';
  button.addEventListener('click',()=>open('', 'batch'));
  rail.appendChild(button);
 }
 function init(){
  if(!document.body){document.addEventListener('DOMContentLoaded',init,{once:true});return;}
  shell();
  mountRailButton();
  const observer=new MutationObserver(()=>mountRailButton());
  observer.observe(document.body,{childList:true,subtree:true});
  window.RIVIS_OPEN_MOTION_STUDIO=(ideaId)=>open(ideaId||'');
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountRailButton,{once:true});
 }
 init();
})();