/* RIVIS GitHub Support — v3.4.134. Simplify VectorichQC access and reconnect Cloud Gallery in a browser tab. */
/* RIVIS v3.1.58: autonomous ZIP engine, used only when CDN JSZip is unavailable.
   ZIP STORE avoids a remote dependency; PNG/JPG are already compressed. */
(function installRivisLocalZipFallback(){
  if(typeof window.JSZip==='function')return;
  const encoder=new TextEncoder(),table=new Uint32Array(256);
  for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);table[n]=c>>>0;}
  function crc32(bytes){let c=0xffffffff;for(let i=0;i<bytes.length;i++)c=table[(c^bytes[i])&255]^(c>>>8);return(c^0xffffffff)>>>0;}
  function u16(d,o,v){d.setUint16(o,v,true);}function u32(d,o,v){d.setUint32(o,v>>>0,true);}
  async function bytesOf(data){
    if(typeof data==='string')return encoder.encode(data);
    if(data instanceof Blob)return new Uint8Array(await data.arrayBuffer());
    if(data instanceof ArrayBuffer)return new Uint8Array(data);
    if(ArrayBuffer.isView(data))return new Uint8Array(data.buffer,data.byteOffset,data.byteLength);
    throw new TypeError('Data ZIP harus berupa teks, Blob, atau bytes.');
  }
  class RivisLocalZip{
    constructor(){this.items=[];}
    file(name,data){const filename=String(name||'').replace(/^\/+|\\/g,'/');
      if(!filename||filename.length>1000||filename.startsWith('/')||filename.split('/').includes('..'))throw new Error('Nama file ZIP tidak valid.');
      this.items.push({name:filename,data});return this;
    }
    async generateAsync(options={}){
      if(options.type&&options.type!=='blob')throw new Error('RIVIS ZIP mendukung output Blob.');
      if(this.items.length>65535)throw new Error('Jumlah file ZIP melebihi batas.');
      const local=[],central=[];let offset=0,centralLength=0;
      const now=new Date();const year=Math.max(1980,Math.min(2107,now.getFullYear()));
      const dosTime=(now.getHours()<<11)|(now.getMinutes()<<5)|(now.getSeconds()>>1);
      const dosDate=((year-1980)<<9)|((now.getMonth()+1)<<5)|now.getDate();
      for(const item of this.items){
        const name=encoder.encode(item.name),data=await bytesOf(item.data);
        if(name.length>65535||data.length>0xffffffff||offset+30+name.length+data.length>0xffffffff)throw new Error('File ZIP terlalu besar.');
        const crc=crc32(data),flag=0x0800,localHeader=new Uint8Array(30+name.length),lh=new DataView(localHeader.buffer);
        u32(lh,0,0x04034b50);u16(lh,4,20);u16(lh,6,flag);u16(lh,8,0);
        u16(lh,10,dosTime);u16(lh,12,dosDate);u32(lh,14,crc);u32(lh,18,data.length);u32(lh,22,data.length);
        u16(lh,26,name.length);u16(lh,28,0);localHeader.set(name,30);
        const centralHeader=new Uint8Array(46+name.length),ch=new DataView(centralHeader.buffer);
        u32(ch,0,0x02014b50);u16(ch,4,20);u16(ch,6,20);u16(ch,8,flag);u16(ch,10,0);
        u16(ch,12,dosTime);u16(ch,14,dosDate);u32(ch,16,crc);u32(ch,20,data.length);u32(ch,24,data.length);
        u16(ch,28,name.length);u16(ch,30,0);u16(ch,32,0);u16(ch,34,0);u16(ch,36,0);u32(ch,38,0);
        u32(ch,42,offset);centralHeader.set(name,46);
        local.push(localHeader,data);central.push(centralHeader);
        offset+=localHeader.length+data.length;centralLength+=centralHeader.length;
      }
      const end=new Uint8Array(22),ed=new DataView(end.buffer);
      u32(ed,0,0x06054b50);u16(ed,4,0);u16(ed,6,0);u16(ed,8,this.items.length);u16(ed,10,this.items.length);
      u32(ed,12,centralLength);u32(ed,16,offset);u16(ed,20,0);
      return new Blob([...local,...central,end],{type:'application/zip'});
    }
  }
  window.JSZip=RivisLocalZip;
  window.RIVIS_ZIP_LOCAL_FALLBACK=true;
})();

/* RIVIS v3.1.65: Library Visual Prompt opens before image generation and collapses after success. */
/* RIVIS HYBRID V2: NON-AI support + original Stage 8 DOM/CSS */
(function(){
  const style=document.createElement('style');style.textContent="body{font-family:'Inter',sans-serif;-webkit-tap-highlight-color:transparent}\n.scrollbar-hide::-webkit-scrollbar{display:none}\n.scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}\n@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}\nto{opacity:1;transform:translateY(0)}\n}\n.animate-fadeIn{animation:fadeIn 0.25s cubic-bezier(0.16,1,0.3,1) forwards}\ninput[type=range]{height:6px;border-radius:9999px}\n#floatingSideTabs{position:fixed;z-index:999;right:0;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:.45rem;padding:.4rem;border:1px solid rgba(51,65,85,.9);border-right:0;border-radius:1rem 0 0 1rem;background:rgba(15,23,42,.94);backdrop-filter:blur(16px);box-shadow:0 12px 35px rgba(2,6,23,.5);transition:transform .24s ease,opacity .24s ease}\n#floatingSideTabs .side-tab{width:48px;min-height:48px;display:flex;align-items:center;justify-content:center;gap:.3rem;border-radius:.75rem;padding:.4rem}\n#floatingSideTabs .side-tab .side-tab-label{display:none !important}\n#floatingSideTabs .side-count{font-size:10px;line-height:1;font-weight:900;min-width:14px;text-align:center}\n#floatingSideTabs .side-tab{color:#cbd5e1;background:rgba(15,23,42,.75);border:1px solid transparent;cursor:pointer;transition:background .16s ease,color .16s ease,border-color .16s ease}\n#floatingSideTabs .side-tab:hover,#floatingSideTabs .side-tab:focus-visible{background:#1e293b;color:#fff;outline:2px solid #818cf8;outline-offset:1px}\n#floatingSideTabs .side-tab.is-active{color:#fff;background:#4338ca;border-color:#a5b4fc}\n#floatingSideTabs .side-tab#sideTabLibrary.is-active{background:#047857;border-color:#6ee7b7}\n#floatingSideTabs .side-tab#sideTabCloudGallery.is-active{background:#0369a1;border-color:#7dd3fc}\n#floatingSideTabs .side-tab[aria-current=page]{pointer-events:auto}\n#floatingSideTabs.is-hidden{transform:translate(110%,-50%);opacity:0;pointer-events:none}\n#ideaDiscoverActionBar{position:fixed !important;z-index:998;left:50%;bottom:1rem;transform:translateX(-50%);width:min(560px,calc(100vw - 24px));max-width:calc(100vw - 24px);box-sizing:border-box;padding:.65rem;display:flex;flex-wrap:nowrap;gap:.65rem;background:rgba(15,23,42,.96);border:1px solid rgba(71,85,105,.85);border-radius:1rem;box-shadow:0 12px 36px rgba(2,6,23,.6);backdrop-filter:blur(18px);align-items:flex-end}\n#ideaDiscoverActionBar > div{flex:0 0 125px;width:125px;min-width:0}\n#ideaDiscoverActionBar select{height:48px;max-width:100%}\n#ideaDiscoverActionBar #discoverIdeasBtn{flex:1 1 0%;width:auto;min-width:0;max-width:100%;height:50px;min-height:50px;padding-left:.8rem;padding-right:.8rem;box-sizing:border-box;white-space:nowrap}\nbody{padding-bottom:110px !important}\n@media (max-width:639px){#floatingSideTabs .side-tab{width:42px;min-height:44px}\n#ideaDiscoverActionBar{width:calc(100vw - 16px);max-width:calc(100vw - 16px);left:50%;bottom:.6rem;gap:.4rem;padding:.5rem}\n#ideaDiscoverActionBar > div{flex:0 0 88px;width:88px}\n#ideaDiscoverActionBar label{font-size:9px}\n#ideaDiscoverActionBar select{padding:.5rem;font-size:11px}\n#ideaDiscoverActionBar #discoverIdeasBtn{font-size:11px;gap:.3rem;padding:0 .35rem;letter-spacing:0}\n#ideaDiscoverActionBar #discoverIdeasBtn i{width:15px;height:15px;flex-shrink:0}\n#ideaDiscoverActionBar #discoverIdeasBtnText{font-size:clamp(9px,2.8vw,11px);white-space:nowrap}\n}\n@media (max-width:340px){#ideaDiscoverActionBar > div{flex-basis:78px;width:78px}\n#ideaDiscoverActionBar #discoverIdeasBtn i{width:13px;height:13px}\n}\n#ideaDiscoverActionBar #discoverBarToggleBtn{flex:0 0 40px;height:48px;align-self:flex-end;display:flex;align-items:center;justify-content:center;border:1px solid rgba(167,139,250,.45);border-radius:.85rem;background:rgba(76,29,149,.5);color:#e9d5ff;cursor:pointer;transition:background .2s ease,transform .2s ease}\n#ideaDiscoverActionBar #discoverBarToggleBtn:hover{background:rgba(109,40,217,.8)}\n#ideaDiscoverActionBar:not(.is-ready) #discoverBarToggleBtn{display:none !important}\n#ideaDiscoverActionBar.is-compact{width:58px !important;max-width:58px !important;height:58px;padding:5px !important;gap:0 !important;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#4f46e5,#2563eb);border-color:rgba(196,181,253,.7);align-items:center;box-shadow:0 8px 26px rgba(109,40,217,.4);animation:discoverIconAppear .35s ease-out,discoverIconGlow 2.6s ease-in-out .35s infinite}\n#ideaDiscoverActionBar.is-compact #discoverBarFields,#ideaDiscoverActionBar.is-compact #discoverIdeasBtn{display:none !important}\n#ideaDiscoverActionBar.is-compact #discoverBarToggleBtn{flex:0 0 46px;width:46px;height:46px;border:0;border-radius:50%;background:transparent;color:#fff}\n#ideaDiscoverActionBar.is-compact #discoverBarToggleBtn:hover{background:rgba(255,255,255,.13)}\nbody.discover-mini-active{padding-bottom:76px !important}\n@keyframes discoverIconAppear{from{opacity:0;transform:translateY(16px) scale(.75)}\nto{opacity:1;transform:translateY(0) scale(1)}\n}\n@keyframes discoverIconGlow{0%,100%{box-shadow:0 8px 22px rgba(109,40,217,.4)}\n50%{box-shadow:0 8px 32px rgba(129,140,248,.72)}\n}\n@media (prefers-reduced-motion:reduce){#ideaDiscoverActionBar.is-compact{animation:none}\n}\n#batchQueuePanel.progress-only{padding:.7rem}\n#batchQueuePanel.progress-only >:first-child,#batchQueuePanel.progress-only >:last-child{display:none !important}\n#tabSectionSavedIdeas{min-width:0;padding:.75rem;gap:1rem}\n#tabSectionSavedIdeas > div:first-child{align-items:flex-start}\n#tabSectionSavedIdeas > div:first-child > div:first-child{min-width:0}\n#tabSectionSavedIdeas > div:first-child > div:last-child{width:100%;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.5rem}\n#tabSectionSavedIdeas > div:first-child > div:last-child > *{min-width:0;width:100%;justify-content:center;white-space:normal;text-align:center;padding:.6rem .4rem}\n#tabSectionSavedIdeas #savedIdeasGridContainer{min-width:0}\n#tabSectionSavedIdeas #savedIdeasGridContainer img{max-width:100%;height:auto}\n@media (max-width:639px){header{min-width:0}\nheader > div:first-child{min-width:0}\nheader h1{font-size:clamp(11px,3.5vw,16px);line-height:1.25;flex-wrap:wrap}\nheader p{font-size:9px}\nheader > div:last-child{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));width:100%;gap:.4rem}\nheader > div:last-child > button,header > div:last-child > a{min-width:0;width:100%;padding:.6rem .25rem;font-size:10px;white-space:normal;text-align:center}\nheader > div:last-child > a{grid-column:1 / -1}\n#tabSectionSavedIdeas > div:first-child{display:flex;flex-direction:column}\n#tabSectionSavedIdeas > div:first-child > div:last-child{grid-template-columns:repeat(2,minmax(0,1fr))}\n}\n@media (min-width:768px){#tabSectionSavedIdeas{padding:1.5rem}\n#tabSectionSavedIdeas > div:first-child > div:last-child{width:auto;display:flex;flex-wrap:wrap}\n#tabSectionSavedIdeas > div:first-child > div:last-child > *{width:auto;white-space:nowrap;padding:.5rem .75rem}\n}\n.rivis-library-action-row{display:flex;gap:.375rem;flex-wrap:wrap}\n@media(max-width:639px){\n#savedIdeasGridContainer .rivis-library-action-row{display:grid!important;grid-template-columns:minmax(0,1.28fr) minmax(0,.72fr) minmax(0,1.11fr) minmax(0,.8fr);gap:4px!important;width:100%}\n#savedIdeasGridContainer .rivis-library-action-row.is-series{grid-template-columns:minmax(0,1.4fr) minmax(0,1.2fr) minmax(0,.8fr)}\n#savedIdeasGridContainer .rivis-library-action-row>button{min-width:0!important;width:100%;display:flex!important;align-items:center;justify-content:center;white-space:nowrap!important;overflow:hidden;padding:7px 2px!important;font-size:clamp(8px,2.25vw,10px)!important;line-height:1.15}\n#savedIdeasGridContainer .rivis-library-action-row>button>span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n}\n.inner-progress{position:relative;isolation:isolate;overflow:hidden;--fill:0%}\n.inner-progress::before{content:\"\";position:absolute;inset:0;right:auto;width:var(--fill);z-index:-1;background:repeating-linear-gradient(115deg,rgba(255,255,255,.28) 0 12px,rgba(103,232,249,.4) 12px 24px);background-size:52px 100%;box-shadow:inset -2px 0 0 #a5f3fc,0 0 18px #22d3ee;transition:width .35s ease;animation:innerFlow 1.4s linear infinite;pointer-events:none}\n.inner-progress::after{content:attr(data-progress);font-size:10px;font-variant-numeric:tabular-nums;margin-left:4px;pointer-events:none}\n@keyframes innerFlow{to{background-position:52px 0}\n}\n@media(prefers-reduced-motion:reduce){.inner-progress::before{animation:none;transition:none}\n}\n.lightbox-shell{height:min(94dvh,1100px);min-height:0}\n.lightbox-viewport{flex:1 1 0;touch-action:none;overscroll-behavior:contain;cursor:zoom-in;user-select:none;-webkit-user-select:none}\n.lightbox-viewport.is-zoomed{cursor:grab}\n.lightbox-viewport.is-dragging{cursor:grabbing}\n.lightbox-zoom-image{position:absolute;left:50%;top:50%;width:auto;height:auto;max-width:100%;max-height:100%;object-fit:contain;pointer-events:none;user-select:none;-webkit-user-drag:none;transform-origin:center center;transform:translate(-50%,-50%) scale(1);will-change:transform}\n.lightbox-control{min-width:34px;height:30px;padding:0 9px;border:1px solid #475569;border-radius:8px;background:#1e293b;color:#f8fafc;font-size:17px;font-weight:700;line-height:1;touch-action:manipulation}\n.lightbox-control:hover{background:#334155}\n.lightbox-control:disabled{opacity:.35;cursor:not-allowed}\n.lightbox-control:focus-visible,.lightbox-viewport:focus-visible{outline:2px solid #a78bfa;outline-offset:2px}\n.lightbox-control-text{font-size:11px;min-width:43px}\n@media(max-width:639px){.lightbox-shell{height:96dvh}\n.lightbox-control{min-width:40px;height:35px}\n.lightbox-viewport{border-radius:10px}\n}\n/* v3.1.64: per-card metadata uses the same estimated fill progress as image generation. */\n#generateAllImagesBtn.inner-progress,#generateAllMetaBtn.inner-progress,#saveAllToCloudBtn.inner-progress{position:relative;overflow:hidden}\n#generateAllImagesBtn.inner-progress::before,#generateAllMetaBtn.inner-progress::before,#saveAllToCloudBtn.inner-progress::before{inset:auto auto 0 0;height:3px;z-index:1;animation:none;box-shadow:none;background:#c4b5fd;transition:width .18s ease}\n#generateAllMetaBtn.inner-progress::before,#saveAllToCloudBtn.inner-progress::before{background:#67e8f9}\n#generateAllImagesBtn.inner-progress::after,#generateAllMetaBtn.inner-progress::after,#saveAllToCloudBtn.inner-progress::after{display:none}\n.card-blueprint-toggle{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:9999px;border:1px solid rgba(34,211,238,.45);background:rgba(8,47,73,.7);color:#67e8f9;transition:background .2s ease,transform .2s ease}\n.card-blueprint-toggle:hover{background:rgba(14,116,144,.85);transform:translateY(-1px)}\n.card-blueprint-panel.hidden{display:none}\n.card-blueprint-panel{margin-top:.5rem;border:1px solid rgba(51,65,85,.9);border-radius:.75rem;background:rgba(2,6,23,.72);padding:.65rem}\n.card-blueprint-panel pre{max-height:18rem;overflow:auto}\n#tabSectionIdeaStudio{margin-top:.5rem!important}\n#tabSectionIdeaStudio>#rivisSeasonalPanel,#tabSectionIdeaStudio>.grid{margin-top:.375rem!important}\n.rivis-status-bar{display:flex;align-items:stretch;gap:6px;min-width:0}\n.rivis-status-tile{flex:1 1 0;min-width:0}\n.rivis-status-summary{min-height:44px;box-sizing:border-box;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:5px 2px;border:1px solid #334155;border-radius:9px;background:#111c2e;color:#cbd5e1;list-style:none;user-select:none;text-align:center;touch-action:manipulation}\n.rivis-status-summary::-webkit-details-marker{display:none}\n.rivis-status-summary::marker{content:''}\n.rivis-status-summary:focus-visible{outline:2px solid #a78bfa;outline-offset:2px}\n.rivis-status-summary:hover,.rivis-status-tile[open]>.rivis-status-summary{background:#1d2e46;border-color:#64748b}\n.rivis-status-summary .status-top{display:flex;align-items:center;justify-content:center;gap:4px;font-size:11px;font-weight:800;line-height:1.1}\n.rivis-status-summary .status-label{font-size:9px;font-weight:650;line-height:1.2}\n.rivis-status-summary.status-pass .status-top{color:#34d399}\n.rivis-status-summary.status-warning .status-top{color:#fbbf24}\n.rivis-status-summary.status-brief .status-top{color:#c4b5fd}\n.rivis-status-summary.status-empty{opacity:.7}\n.rivis-status-panel{box-sizing:border-box;width:calc(400% + 18px);margin-top:6px;padding:10px;border:1px solid #475569;border-radius:9px;background:#111c2e;font-size:10px;line-height:1.5;color:#cbd5e1;overflow-wrap:anywhere;max-height:260px;overflow-y:auto}\n.rivis-status-tile:nth-child(2)>.rivis-status-panel{margin-left:calc(-100% - 6px)}\n.rivis-status-tile:nth-child(3)>.rivis-status-panel{margin-left:calc(-200% - 12px)}\n.rivis-status-tile:nth-child(4)>.rivis-status-panel{margin-left:calc(-300% - 18px)}\n.rivis-status-panel .status-detail-row{padding:5px 0;border-bottom:1px solid #334155}\n.rivis-status-panel .status-detail-row:last-child{border-bottom:0}\n.rivis-preflight-row{position:relative;min-width:0;margin-top:.5rem}\n.rivis-preflight-row .rivis-preflight-summary,.rivis-preflight-row .rivis-preflight-empty{display:flex;align-items:center;gap:.35rem;box-sizing:border-box;min-width:0;min-height:40px;padding:7px 115px 7px 9px;white-space:nowrap}\n.rivis-preflight-row .rivis-preflight-title{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.rivis-preflight-row .rivis-preflight-recheck{position:absolute;top:5px;right:5px;z-index:1;display:inline-flex;align-items:center;justify-content:center;gap:4px;box-sizing:border-box;min-height:30px;max-width:108px;padding:5px 8px;white-space:nowrap;font-size:10px}\n.rivis-preflight-row .rivis-preflight-summary::-webkit-details-marker{display:none}\n.rivis-preflight-row .rivis-preflight-summary{list-style:none}\n@media(max-width:639px){.rivis-preflight-row .rivis-preflight-status{display:none}\n.rivis-preflight-row .rivis-preflight-summary,.rivis-preflight-row .rivis-preflight-empty{padding-right:113px}\n}\n.card-prompt-actions{display:flex;align-items:center;justify-content:space-between;gap:5px;min-width:0;flex-wrap:nowrap}\n.card-blueprint-pill{display:inline-flex;align-items:center;gap:5px;flex:1 1 0;min-width:0;padding:7px 8px;border-radius:8px;border:1px solid #155e75;background:#083344;color:#67e8f9;font-size:10px;font-weight:700;white-space:nowrap;cursor:pointer}\n.card-blueprint-pill .truncate{overflow:hidden;text-overflow:ellipsis}\n.card-prompt-btns{display:inline-flex;flex:0 0 auto;align-items:center;gap:5px}\n.card-prompt-btn{display:inline-flex;align-items:center;justify-content:center;gap:4px;padding:7px 9px;border-radius:8px;font-size:10px;font-weight:700;white-space:nowrap;cursor:pointer}\n.rivis-meta-summary{display:flex;align-items:center;justify-content:space-between;gap:8px;list-style:none;cursor:pointer;padding:10px;min-width:0}\n.rivis-meta-summary::-webkit-details-marker{display:none}\n.rivis-meta-summary::marker{content:''}\n.rivis-meta-chevron{transition:transform .2s ease}\n.rivis-meta-accordion[open] .rivis-meta-chevron{transform:rotate(180deg)}\n.rivis-meta-line{display:flex;align-items:center;gap:8px;white-space:nowrap;min-width:0}\n.rivis-meta-file{flex:1 1 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}\n.rivis-meta-file span:last-child{overflow:hidden;text-overflow:ellipsis}\n.rivis-meta-category{flex:0 0 auto;white-space:nowrap}\n@media(max-width:375px){.card-prompt-btn{padding:7px 6px;font-size:10px}\n.card-blueprint-pill{padding:7px 5px}\n.rivis-meta-line{font-size:8px}\n}\n.rivis-icon{display:inline-block;vertical-align:middle;flex-shrink:0;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}\n";document.head.appendChild(style);
 document.body.className="bg-slate-950 text-slate-200 p-2 md:p-6 pb-32 min-h-screen relative selection:bg-purple-500 selection:text-white";
 document.body.insertAdjacentHTML('afterbegin',"<svg xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\" focusable=\"false\" width=\"0\" height=\"0\" style=\"position:absolute;overflow:hidden\"><symbol id=\"rivis-sparkles\" viewBox=\"0 0 24 24\"><path d=\"M11.5 2.5C12.5 8.4 13.6 9.5 19.5 10.5c-5.9 1-7 2.1-8 8-1-5.9-2.1-7-8-8 5.9-1 7-2.1 8-8Z\"/><path d=\"M19 3v5M16.5 5.5h5\"/><circle cx=\"5\" cy=\"20\" r=\"1\"/><\/symbol><symbol id=\"rivis-lightbulb\" viewBox=\"0 0 24 24\"><path d=\"M8 16c0-2.1-3-3.2-3-7a7 7 0 0 1 14 0c0 3.8-3 4.9-3 7\"/><path d=\"M8 19h8M10 22h4\"/><\/symbol><symbol id=\"rivis-bookmark\" viewBox=\"0 0 24 24\"><path d=\"M6 3.5A1.5 1.5 0 0 1 7.5 2h9A1.5 1.5 0 0 1 18 3.5V22l-6-4-6 4V3.5Z\"/><\/symbol><\/svg><div id=\"toastContainer\" class=\"fixed top-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-none\"><\/div><div id=\"imageLightboxModal\" role=\"dialog\" aria-modal=\"true\" aria-label=\"Image preview\" class=\"fixed inset-0 z-[1001] bg-slate-950/95 backdrop-blur-md hidden flex-col items-center justify-center p-2 sm:p-4\"\nonclick=\"closeImageLightbox(event)\"><div class=\"lightbox-shell relative w-full max-w-6xl flex flex-col gap-2\" onclick=\"event.stopPropagation()\"><div class=\"w-full flex items-center justify-between gap-2 bg-slate-900/95 border border-slate-800 px-3 py-2 rounded-xl shadow-2xl\"><div class=\"flex items-center gap-2 min-w-0\"><h4 id=\"lightboxTitle\" class=\"text-xs font-bold text-white truncate\">Image Preview<\/h4><\/div><div class=\"flex items-center gap-2 shrink-0\"><button type=\"button\" onclick=\"closeImageLightbox()\" aria-label=\"Close preview\" title=\"Tutup\" class=\"px-2 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg font-bold text-sm\">✕<\/button><\/div><\/div><div id=\"lightboxViewport\" class=\"lightbox-viewport relative w-full min-h-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow-2xl\"\naria-label=\"Zoomable image; use mouse wheel, drag, or pinch on touch devices\" tabindex=\"0\"><img id=\"lightboxImg\" src=\"\" alt=\"Full image preview\" draggable=\"false\" class=\"lightbox-zoom-image\" /><button id=\"seriesLightboxPrev\" type=\"button\" onclick=\"navigateSeriesSceneLightbox(-1,event)\" aria-label=\"Previous image\" title=\"Previous image\" class=\"hidden absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full border border-slate-600/80 bg-slate-950/75 hover:bg-slate-800/90 text-white text-xl sm:text-2xl font-bold items-center justify-center shadow-lg disabled:opacity-30 disabled:cursor-not-allowed\"><span aria-hidden=\"true\"><</span><\/button><button id=\"seriesLightboxNext\" type=\"button\" onclick=\"navigateSeriesSceneLightbox(1,event)\" aria-label=\"Next image\" title=\"Next image\" class=\"hidden absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full border border-slate-600/80 bg-slate-950/75 hover:bg-slate-800/90 text-white text-xl sm:text-2xl font-bold items-center justify-center shadow-lg disabled:opacity-30 disabled:cursor-not-allowed\"><span aria-hidden=\"true\">></span><\/button><button id=\"lightboxDownloadBtn\" type=\"button\" onclick=\"event.stopPropagation()\" title=\"Download gambar asli\" class=\"absolute bottom-3 right-3 z-20 px-3 py-2 shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5\"><span>Download<\/span><\/button><\/div><div class=\"flex flex-wrap items-center justify-center gap-2 rounded-xl bg-slate-900/95 border border-slate-800 py-2 px-2 text-xs\"><button type=\"button\" id=\"lightboxZoomOut\" aria-label=\"Perkecil gambar\" title=\"Zoom out\" onclick=\"changeLightboxZoom(1/1.4)\" class=\"lightbox-control\">−<\/button><span id=\"lightboxZoomLabel\" role=\"status\" aria-live=\"polite\" aria-label=\"Tingkat zoom\" class=\"text-slate-100 font-mono font-semibold min-w-[52px] text-center\">1.0×<\/span><button type=\"button\" id=\"lightboxZoomIn\" aria-label=\"Perbesar gambar\" title=\"Zoom in\" onclick=\"changeLightboxZoom(1.4)\" class=\"lightbox-control\">+<\/button><button type=\"button\" id=\"lightboxZoomFit\" onclick=\"resetLightboxZoom()\" title=\"Sesuaikan gambar dengan jendela\" class=\"lightbox-control lightbox-control-text\">Pas<\/button><button type=\"button\" id=\"lightboxZoomNative\" onclick=\"setLightboxNativeZoom()\" title=\"Tampilkan 1 piksel gambar = 1 piksel layar\" class=\"lightbox-control lightbox-control-text\">100%<\/button><span class=\"hidden sm:inline text-slate-500 ml-1\">Scroll / + − untuk zoom · Drag untuk geser · Double-click untuk zoom<\/span><span class=\"sm:hidden text-slate-500 text-center w-full\">Cubit untuk zoom · Geser dengan jari<\/span><\/div><\/div><\/div><div class=\"max-w-7xl mx-auto space-y-4\"><header class=\"bg-slate-900 rounded-xl p-3 md:p-4 border border-slate-800 shadow-2xl flex flex-col sm:flex-row justify-between items-center gap-3\"><div class=\"flex items-center justify-between w-full sm:w-auto\"><div class=\"flex items-center gap-2.5\"><div class=\"w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 shrink-0\"><svg aria-hidden=\"true\" class=\"rivis-icon w-5 h-5 md:w-6 md:h-6\"><use href=\"#rivis-lightbulb\"><\/use><\/svg><\/div><div><h1 class=\"text-base md:text-xl font-black tracking-tight text-white flex items-center gap-1.5 flex-wrap\">\nRICH VECTOR <span class=\"text-purple-400\">IDEA STUDIO<\/span><\/h1><p class=\"text-[10px] md:text-xs text-slate-400\">Stock Asset Creator & Idea Intelligence · Vector + Raster<\/p><\/div><\/div><button id=\"apiKeyToggleBtn\" type=\"button\" onclick=\"toggleApiKeyModal()\"\nclass=\"sm:hidden px-2.5 py-1.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 transition-colors whitespace-nowrap bg-slate-800 text-slate-400 border-slate-700 hover:text-white\"><span class=\"apiKeyBtnText\">Key<\/span><\/button><\/div><div class=\"flex items-center gap-1.5 w-full sm:w-auto bg-slate-950/80 p-1 rounded-xl border border-slate-800\"><button id=\"navTabIdeaStudioTop\" type=\"button\" onclick=\"switchTab('idea_studio')\"\nclass=\"nav-tab active-tab flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-600/30\"><svg aria-hidden=\"true\" class=\"rivis-icon w-3.5 h-3.5\"><use href=\"#rivis-lightbulb\"><\/use><\/svg> IDEA STUDIO\n<\/button><button id=\"navTabSavedIdeasTop\" type=\"button\" onclick=\"switchTab('saved_ideas')\"\nclass=\"nav-tab flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800/60\"><svg aria-hidden=\"true\" class=\"rivis-icon w-3.5 h-3.5\"><use href=\"#rivis-bookmark\"><\/use><\/svg> LIBRARY (<span class=\"savedIdeasCountBadge\">0<\/span>)\n<\/button><button type=\"button\" onclick=\"toggleApiKeyModal()\"\nclass=\"hidden sm:flex px-3 py-2 rounded-lg text-xs font-bold border items-center gap-1.5 transition-colors whitespace-nowrap bg-slate-800 text-slate-400 border-slate-700 hover:text-white\"><span class=\"apiKeyBtnText\">Gemini Key<\/span><\/button><\/div><\/header><div id=\"apiKeyModal\" class=\"hidden p-4 bg-slate-900 rounded-xl border border-purple-500/30 space-y-2 animate-fadeIn shadow-2xl\"><div class=\"flex justify-between items-center text-xs font-bold text-purple-300\"><span class=\"flex items-center gap-1.5\"> Custom Gemini API Key<\/span><button type=\"button\" onclick=\"toggleApiKeyModal()\" class=\"text-slate-500 hover:text-white p-1 font-bold\">✕<\/button><\/div><input \ntype=\"password\" \nid=\"apiKeyInput\"\nplaceholder=\"Optional: Enter your Gemini API key...\"\noninput=\"saveApiKey(this.value)\"\nclass=\"w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-base md:text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500\"\n/><p class=\"text-[10px] text-slate-400 leading-relaxed\">\nStandalone HTML memerlukan Gemini API key. Di lingkungan terintegrasi, kredensial dapat disediakan oleh host. Jangan bagikan file yang menyimpan API key Anda.\n<\/p><\/div><section id=\"tabSectionIdeaStudio\" class=\"tab-section space-y-6\"><div id=\"rivisSeasonalPanel\" class=\"bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900 border border-purple-900/40 rounded-xl p-4 md:p-6 shadow-xl relative overflow-hidden space-y-4\"><div class=\"pt-3 border-t border-purple-900/30 space-y-2\"><div class=\"flex items-center justify-between flex-wrap gap-2\"><span class=\"text-xs font-bold text-amber-300 flex items-center gap-1.5\">\nSEASONAL MARKET CALENDAR & TREND RUSH\n<\/span><div class=\"flex items-center gap-2\"><span class=\"text-[10px] font-mono text-slate-400 hidden sm:inline\">Target upload: 60-90 days before peak season<\/span><button id=\"refreshSeasonalAiBtn\" type=\"button\" onclick=\"generateDynamicSeasonalTrendsWithAI()\"\nclass=\"px-2.5 py-1 bg-gradient-to-r from-amber-500 via-purple-600 to-blue-600 hover:from-amber-400 hover:to-blue-500 text-white font-bold rounded-lg text-[10px] flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer\"><svg aria-hidden=\"true\" class=\"rivis-icon w-3 h-3 text-amber-200 animate-pulse\"><use href=\"#rivis-sparkles\"><\/use><\/svg><span id=\"refreshSeasonalAiText\">Generate AI Trends<\/span><\/button><\/div><\/div><div class=\"flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide\" id=\"seasonalCalendarContainer\"><\/div><\/div><\/div><div class=\"grid grid-cols-1 gap-6 items-stretch\"><div class=\"lg:col-span-1 bg-slate-900 rounded-xl p-4 md:p-5 border border-slate-800 space-y-5 shadow-xl\"><div id=\"rivisReferencePanel\" class=\"space-y-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800\"><div class=\"flex justify-between items-center\"><label class=\"text-xs font-bold text-slate-200 flex items-center gap-1.5\"> REFERENCE IMAGE (OPTIONAL)\n<\/label><button id=\"analyzeRefAiBtn\" type=\"button\" onclick=\"handleAnalyzeReferenceImageWithAI()\" class=\"hidden px-2.5 py-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded text-[10px] items-center gap-1 shadow transition-all active:scale-95\"><svg aria-hidden=\"true\" class=\"rivis-icon w-3 h-3\"><use href=\"#rivis-sparkles\"><\/use><\/svg><span id=\"analyzeRefAiText\">AI Analyze<\/span><\/button><\/div><div id=\"refUploadEmptyState\"><label class=\"flex items-center justify-center p-3 border border-dashed border-slate-800 hover:border-purple-500 rounded-lg bg-slate-950 cursor-pointer text-xs text-slate-300 hover:text-slate-100 transition-colors gap-2\"> Upload Reference Image\n<input type=\"file\" id=\"refFileInput\" class=\"hidden\" onchange=\"handleRefImageUpload(event)\" /><\/label><\/div><div id=\"refUploadActiveState\" class=\"hidden space-y-3\"><div class=\"flex gap-3 items-center bg-slate-900/80 p-2.5 rounded-lg border border-slate-800\"><img id=\"refPreviewImg\" src=\"\" class=\"w-14 h-14 object-cover rounded border border-slate-700 shadow\" alt=\"Reference preview\" /><div class=\"flex-1 space-y-1 min-w-0\"><span class=\"text-[10px] font-bold text-emerald-400 block flex items-center gap-1\">✓ Reference Image Active<\/span><p id=\"refFileName\" class=\"text-[10px] text-slate-300 font-mono truncate\">reference_image.png<\/p><\/div><div class=\"flex items-center gap-1.5 shrink-0\"><label class=\"px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded cursor-pointer border border-slate-700 flex items-center gap-1\"> Replace\n<input type=\"file\" class=\"hidden\" onchange=\"handleRefImageUpload(event)\" /><\/label><button type=\"button\" onclick=\"removeRefImage()\" class=\"px-2.5 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 text-[10px] font-bold rounded border border-red-800 flex items-center gap-1\"> Remove\n<\/button><\/div><\/div><div><span class=\"text-[10px] font-bold text-slate-400 block mb-1\">Reference Mode:<\/span><select id=\"refModeSelect\" class=\"w-full bg-slate-900 text-white border border-slate-800 rounded p-2 text-base md:text-xs\"><\/select><\/div><div><span class=\"text-[10px] font-bold text-slate-400 block mb-1\">How should the reference image be modified?<\/span><input type=\"text\" id=\"refModInstructionInput\" placeholder=\"e.g. Change color palette to pastel, create flat vector style...\"\nclass=\"w-full bg-slate-900 text-white border border-slate-800 rounded p-2 text-base md:text-xs outline-none focus:border-purple-500\" /><\/div><div id=\"refSuggestionsBox\" class=\"hidden p-3 bg-purple-950/40 border border-purple-800/60 rounded-lg space-y-2 text-xs\"><span class=\"font-bold text-purple-300 flex items-center gap-1\"> AI Creative Modification Suggestions:\n<\/span><ul id=\"refSuggestionsList\" class=\"space-y-1 pl-4 list-disc text-slate-300 text-[11px]\"><\/ul><\/div><\/div><\/div><div class=\"space-y-2\"><div class=\"flex items-center justify-between gap-2 flex-wrap\"><label class=\"text-xs font-bold text-slate-200 flex items-center gap-1.5\"> A. SIMPLE PROMPT\n<\/label><div class=\"flex flex-wrap items-center justify-end gap-1.5 ml-auto max-w-full\"><button type=\"button\" id=\"clearSimplePromptBtn\" onclick=\"clearSimplePrompt()\" title=\"Clear Simple Prompt\" aria-label=\"Clear Simple Prompt\"\nclass=\"px-2 py-1 bg-slate-900 hover:bg-red-950 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-800 rounded text-[10px] font-bold inline-flex items-center gap-1 transition-all active:scale-95\"> Clear\n<\/button><button type=\"button\" id=\"copySimplePromptBtn\" onclick=\"copySimplePrompt(this)\" title=\"Copy Simple Prompt\" aria-label=\"Copy Simple Prompt\"\nclass=\"px-2 py-1 bg-slate-900 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-700 hover:border-emerald-800 rounded text-[10px] font-bold inline-flex items-center gap-1 transition-all active:scale-95\"> Copy\n<\/button><select id=\"autoPromptModeSelect\" onchange=\"updateAutoPromptMode()\" aria-label=\"Mode Auto Prompt\" class=\"min-w-0 max-w-[135px] bg-slate-950 text-slate-200 border border-slate-700 rounded-lg px-1.5 py-1.5 text-[11px]\"><option value=\"online\">AI Online<\/option><option value=\"offline\">Preset Offline<\/option><\/select><button type=\"button\" id=\"autoPromptBtn\" onclick=\"handleAutoPrompt(this)\" \nclass=\"px-2.5 py-1 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all active:scale-95 cursor-pointer\"><svg aria-hidden=\"true\" class=\"rivis-icon w-3.5 h-3.5 text-amber-200 animate-pulse\"><use href=\"#rivis-sparkles\"><\/use><\/svg> Auto Prompt\n<\/button><\/div><\/div><textarea \nid=\"simplePromptInput\"\nrows=\"3\"\nplaceholder=\"Describe your idea in a few words... (or click 'Auto Prompt' to generate automatically)\"\nclass=\"w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-base md:text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500 leading-relaxed font-medium\"\n><\/textarea><div class=\"flex justify-end\"><button type=\"button\" id=\"saveSimplePromptIdeaBtn\" onclick=\"saveSimplePromptIdea(this)\" class=\"px-3 py-1.5 rounded-lg border border-emerald-700/70 bg-emerald-950/50 hover:bg-emerald-900 text-emerald-200 text-[10px] font-bold\">Save Idea<\/button><\/div><p id=\"autoPromptStatus\" role=\"status\" aria-live=\"polite\" class=\"text-[10px] text-slate-400 leading-relaxed\">AI mengikuti opsi B–G. Preset Offline tersedia untuk pengujian tanpa API.<\/p><fieldset class=\"space-y-2 rounded-lg border border-purple-900/50 bg-slate-950/50 p-3\"><legend class=\"px-1 text-[10px] font-bold text-purple-300\">ARAHAN KOMERSIAL · OPSIONAL<\/legend><div class=\"grid grid-cols-1 sm:grid-cols-2 gap-3\"><div class=\"space-y-1.5 min-w-0\"><label for=\"targetBuyerInput\" class=\"block text-xs font-bold text-slate-200\">Target Pembeli<\/label><input id=\"targetBuyerInput\" type=\"text\" maxlength=\"160\" placeholder=\"Contoh: klinik gigi anak, UMKM bakery\"\naria-describedby=\"commercialBriefHint\" class=\"w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-base md:text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500\"\n/><\/div><div class=\"space-y-1.5 min-w-0\"><label for=\"designNeedInput\" class=\"block text-xs font-bold text-slate-200\">Kebutuhan Desain<\/label><textarea id=\"designNeedInput\" rows=\"2\" maxlength=\"600\" placeholder=\"Contoh: ilustrasi poster edukasi sikat gigi, ruang kosong untuk judul\"\naria-describedby=\"commercialBriefHint\" class=\"w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-base md:text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500 leading-relaxed\"><\/textarea><\/div><\/div><p id=\"commercialBriefHint\" class=\"text-[10px] text-slate-400 leading-relaxed\">Berlaku untuk Auto Prompt, Preset Offline, dan Discover Ideas. Kosongkan agar AI memilih. Variasi mengutamakan subjek, aktivitas, atau kegunaan; bukan sekadar warna atau gaya.<\/p><\/fieldset><div class=\"flex flex-wrap gap-1.5 pt-1\" id=\"quickPromptContainer\"><\/div><\/div><section id=\"outputModeSection\" class=\"space-y-2 pt-1 pb-3 border-b border-slate-800\" aria-label=\"Output Medium\"><div class=\"flex justify-between items-center gap-2\"><label for=\"outputModeSelect\" class=\"text-xs font-bold text-amber-200 flex items-center gap-1.5\"> OUTPUT MODE<\/label><span id=\"outputModeHint\" class=\"text-[10px] text-slate-400\">Clean vector-friendly art<\/span><\/div><select id=\"outputModeSelect\" onchange=\"handleOutputModeChange(this.value)\" class=\"w-full bg-slate-950 text-white border border-amber-700/50 rounded-lg p-2.5 text-base md:text-xs font-semibold outline-none focus:border-amber-400\"><option value=\"vector\">Vector / SVG-Friendly Illustration<\/option><option value=\"photo\">Raster · Clean Commercial Photo<\/option><option value=\"editorial\">Raster · Editorial Lifestyle / Color Pop<\/option><option value=\"advertising\">Raster · Premium Advertising Hero<\/option><option value=\"3d\">Raster · Premium 3D Commercial Render<\/option><\/select><div id=\"rasterControls\" class=\"hidden rounded-xl border border-amber-900/40 bg-slate-950/65 p-3 space-y-3\"><p class=\"text-[10px] text-slate-400 leading-relaxed\">Scene komersial realistis, bukan clipart. Setelan disimpan pada setiap konsep, sehingga hasil di Library tidak berubah ketika mode diganti.<\/p><div class=\"grid grid-cols-2 gap-2\"><div><label class=\"block text-[10px] font-bold text-slate-300 mb-1\">People<\/label><select id=\"rasterPeopleSelect\" class=\"raster-control w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white\"><option value=\"auto\">Auto (sesuai scene)<\/option><option value=\"none\">No People<\/option><option value=\"one\">One Person<\/option><option value=\"small\">Small Group (2–4)<\/option><option value=\"large\">Large Group<\/option><\/select><\/div><div><label class=\"block text-[10px] font-bold text-slate-300 mb-1\">Camera / Shot<\/label><select id=\"rasterShotSelect\" class=\"raster-control w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white\"><option value=\"auto\">Auto Cinematography<\/option><option value=\"closeup\">Close-up Portrait · 85mm<\/option><option value=\"environmental\">Environmental · 35mm<\/option><option value=\"wide\">Wide Scene · 24–35mm<\/option><option value=\"dynamic\">Dynamic / Selfie Perspective<\/option><option value=\"macro\">Macro Product Detail<\/option><\/select><\/div><div><label class=\"block text-[10px] font-bold text-slate-300 mb-1\">Lighting<\/label><select id=\"rasterLightingSelect\" class=\"raster-control w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white\"><option value=\"auto\">Auto · Scene Appropriate<\/option><option value=\"natural\">Soft Natural Daylight<\/option><option value=\"studio\">Clean Professional Studio<\/option><option value=\"cinematic\">Cinematic Blue / Amber<\/option><option value=\"highkey\">Bright High-Key<\/option><option value=\"dramatic\">Dramatic Directional<\/option><\/select><\/div><div><label class=\"block text-[10px] font-bold text-slate-300 mb-1\">Color Direction<\/label><select id=\"rasterColorSelect\" class=\"raster-control w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white\"><option value=\"auto\">Auto · Balanced<\/option><option value=\"natural\">True-to-Life Color<\/option><option value=\"colorpop\">Bold Saturated Color Pop<\/option><option value=\"warm\">Warm Editorial<\/option><option value=\"tealorange\">Cinematic Teal / Amber<\/option><option value=\"pastel\">Soft Premium Pastels<\/option><\/select><\/div><div><label class=\"block text-[10px] font-bold text-slate-300 mb-1\">Authenticity<\/label><select id=\"rasterAuthenticitySelect\" class=\"raster-control w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white\"><option value=\"candid\">Natural Candid<\/option><option value=\"polished\">Polished Commercial<\/option><option value=\"editorial\">Creative Editorial<\/option><option value=\"documentary\">Documentary Realism<\/option><\/select><\/div><div><label class=\"block text-[10px] font-bold text-slate-300 mb-1\">Copy Space<\/label><select id=\"rasterCopySpaceSelect\" class=\"raster-control w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white\"><option value=\"auto\">Auto · Best Placement<\/option><option value=\"none\">None / Immersive<\/option><option value=\"left\">Left<\/option><option value=\"right\">Right<\/option><option value=\"top\">Top<\/option><option value=\"bottom\">Bottom<\/option><\/select><\/div><div><label class=\"block text-[10px] font-bold text-slate-300 mb-1\">Download Format<\/label><select id=\"rasterFormatSelect\" onchange=\"saveRasterOutputPreferences()\" class=\"raster-control w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white\"><option value=\"jpg\">JPG · Microstock<\/option><option value=\"png\">PNG · Lossless<\/option><\/select><\/div><div><label class=\"block text-[10px] font-bold text-slate-300 mb-1\">JPEG Quality<\/label><select id=\"rasterJpegQualitySelect\" onchange=\"saveRasterOutputPreferences()\" class=\"raster-control w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white\"><option value=\"0.92\">92% · High<\/option><option value=\"0.95\" selected>95% · Premium<\/option><option value=\"0.98\">98% · Maximum<\/option><\/select><\/div><\/div><div class=\"grid grid-cols-3 gap-1.5\" aria-label=\"Photo scene examples\"><button type=\"button\" onclick=\"applyRasterScenePreset('lab')\" class=\"text-[10px] rounded-lg border border-slate-700 bg-slate-900 hover:border-amber-500 p-2 text-slate-200\">Science Lab<\/button><button type=\"button\" onclick=\"applyRasterScenePreset('community')\" class=\"text-[10px] rounded-lg border border-slate-700 bg-slate-900 hover:border-amber-500 p-2 text-slate-200\">Community<\/button><button type=\"button\" onclick=\"applyRasterScenePreset('fashion')\" class=\"text-[10px] rounded-lg border border-slate-700 bg-slate-900 hover:border-amber-500 p-2 text-slate-200\">Color Pop<\/button><\/div><p class=\"text-[10px] text-slate-500\">Generate konten orisinal, bukan menyalin contoh. Untuk Adobe Stock gunakan JPG sRGB, 4–100 MP, dan label Generative AI saat submit. Resolusi 1K/2K/4K tetap tersedia.<\/p><\/div><\/section><div class=\"space-y-2 pt-2 border-t border-slate-800\"><div class=\"flex items-center justify-between\"><label class=\"text-xs font-bold text-slate-200 flex items-center gap-1.5\"> B. PRODUCTION TYPE\n<\/label><label class=\"flex items-center gap-1.5 text-xs font-bold text-emerald-400 cursor-pointer\"><input type=\"checkbox\" id=\"noTextCheckbox\" checked class=\"accent-emerald-500 rounded\" /> No Text\n<\/label><\/div><label class=\"flex items-start gap-2 rounded-lg border border-emerald-800/50 bg-emerald-950/20 p-2.5 text-xs text-emerald-100 cursor-pointer\"><input type=\"checkbox\" id=\"svgFriendlyCheckbox\" checked class=\"mt-0.5 accent-emerald-500 rounded\" /><span><strong>SVG-Friendly / Clean Paths<\/strong><span class=\"block text-[10px] text-slate-400 mt-0.5\">Utamakan bentuk sederhana, tertutup, terpisah, minim detail kecil, dan mudah ditrace menjadi SVG.<\/span><\/span><\/label><label class=\"flex items-start gap-2 rounded-lg border border-fuchsia-800/50 bg-fuchsia-950/20 p-2.5 text-xs text-fuchsia-100 cursor-pointer\"><input type=\"checkbox\" id=\"gradientColorCheckbox\" onchange=\"setGradientEnabled(this.checked)\" class=\"mt-0.5 accent-fuchsia-500 rounded\" /><span><strong>Gradasi Warna<\/strong><span class=\"block text-[10px] text-slate-400 mt-0.5\">Gunakan gradasi halus dan terkontrol. Pada mode SVG-Friendly, AI dibatasi ke gradasi linear/radial sederhana agar tetap mudah dibuat sebagai vektor.<\/span><\/span><\/label><div class=\"grid grid-cols-3 gap-2\"><button type=\"button\" id=\"prodTypeSingleBtn\" onclick=\"setProductionType('single')\" class=\"p-2.5 rounded-lg border text-left transition-all flex flex-col gap-1 bg-purple-600/20 border-purple-500 text-white shadow\"><div class=\"flex items-center justify-between font-bold text-xs\"><span>Single Asset</span></div><p class=\"text-[10px] text-slate-400 leading-tight\">One finished asset</p></button><button type=\"button\" id=\"prodTypeCollectionBtn\" onclick=\"setProductionType('collection')\" class=\"p-2.5 rounded-lg border text-left transition-all flex flex-col gap-1 bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700\"><div class=\"flex items-center justify-between font-bold text-xs\"><span>Collection / Set</span></div><p class=\"text-[10px] text-slate-400 leading-tight\">Related asset pack</p></button><button type=\"button\" id=\"prodTypeSeriesBtn\" onclick=\"setProductionType('series')\" class=\"p-2.5 rounded-lg border text-left transition-all flex flex-col gap-1 bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700\"><div class=\"flex items-center justify-between font-bold text-xs\"><span>Series</span></div><p class=\"text-[10px] text-slate-400 leading-tight\">Connected story scenes</p></button></div><div id=\"collectionItemCountBox\" class=\"hidden mt-2 p-3 bg-slate-950 rounded-lg border border-purple-900/40 flex items-center justify-between animate-fadeIn\"><span class=\"text-xs font-bold text-purple-300\">Items in Collection / Set:</span><input type=\"number\" id=\"collectionItemCountInput\" min=\"1\" max=\"50\" placeholder=\"Item count...\" class=\"w-28 bg-slate-900 border border-slate-700 rounded p-1.5 text-center text-xs font-bold text-white outline-none focus:border-purple-500 placeholder-slate-600\"/></div><div id=\"seriesLengthBox\" class=\"hidden mt-2 p-3 bg-slate-950 rounded-lg border border-cyan-900/40 space-y-2.5 animate-fadeIn\"><div class=\"flex items-center justify-between gap-2\"><label for=\"seriesLengthSelect\" class=\"text-xs font-bold text-cyan-300\">Scenes per Series</label><select id=\"seriesLengthSelect\" onchange=\"setSeriesLength(this.value)\" class=\"w-28 bg-slate-900 border border-slate-700 rounded p-1.5 text-center text-xs font-bold text-white\"><option value=\"3\">3 scenes</option><option value=\"4\">4 scenes</option><option value=\"5\" selected>5 scenes</option><option value=\"6\">6 scenes</option><option value=\"8\">8 scenes</option><option value=\"10\">10 scenes</option><option value=\"custom\">Custom</option></select></div><input id=\"seriesLengthCustomInput\" type=\"number\" min=\"2\" max=\"12\" value=\"5\" oninput=\"setSeriesLength('custom')\" class=\"hidden w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white\" placeholder=\"2–12 scenes\"/><p id=\"seriesEstimateText\" class=\"text-[10px] text-cyan-200\">5 ideas × 5 scenes = 25 images planned</p><div class=\"flex items-center justify-between gap-2 pt-1 border-t border-slate-800\"><label for=\"seriesCreationModeSelect\" class=\"text-[10px] font-bold tracking-wider text-cyan-200\">SERIES MODE</label><select id=\"seriesCreationModeSelect\" onchange=\"setSeriesCreationMode(this.value)\" class=\"bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white\"><option value=\"auto\">Series Automation</option><option value=\"manual\">Series Manual</option></select></div><div id=\"seriesManualSceneBox\" class=\"hidden space-y-2 rounded-lg border border-cyan-800/50 bg-slate-900/50 p-2.5\"><p class=\"text-[10px] font-semibold text-cyan-200\">Tentukan adegan setiap scene</p><div id=\"seriesManualSceneList\" class=\"space-y-2 max-h-[360px] overflow-y-auto pr-1\"></div><p class=\"text-[9px] text-slate-400\">Setiap adegan dipertahankan sesuai deskripsi Anda; AI melengkapi continuity, framing, dan prompt.</p></div><span class=\"text-[9px] font-bold tracking-wider text-slate-400\">SERIES CONTINUITY &amp; GENERATION</span><div class=\"grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-800\"><label class=\"flex items-center gap-1.5 text-[10px] text-slate-300 cursor-pointer\"><input id=\"seriesContinuityLockCheckbox\" type=\"checkbox\" checked onchange=\"setSeriesAutomationOption('continuity',this.checked)\" class=\"accent-cyan-500\"/> Strict Continuity Lock</label><label class=\"flex items-center gap-1.5 text-[10px] text-slate-300 cursor-pointer\"><input id=\"seriesAnchorReferenceCheckbox\" type=\"checkbox\" checked onchange=\"setSeriesAutomationOption('anchor',this.checked)\" class=\"accent-cyan-500\"/> Use Scene 01 as visual anchor</label><label class=\"sm:col-span-2 flex items-start gap-1.5 text-[10px] text-emerald-200 cursor-pointer\"><input id=\"seriesAutoGenerateCheckbox\" type=\"checkbox\" onchange=\"setSeriesAutomationOption('autoGenerate',this.checked)\" class=\"mt-0.5 accent-emerald-500\"/><span><strong>Auto-generate all scenes after Save All</strong><span class=\"block text-slate-500\">Optional · uses image-generation API quota. Scenes run one by one to reduce device load.</span></span></label></div></div></div><div class=\"grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800\"><div class=\"space-y-1.5\"><label class=\"text-xs font-bold text-slate-300\">C. CATEGORY</label><select id=\"stockCategorySelect\" onchange=\"handleCategoryChange(this.value)\"\nclass=\"w-full bg-slate-950 text-white border border-slate-800 rounded-lg p-2.5 text-base md:text-xs font-semibold outline-none focus:border-purple-500\"><\/select><input type=\"text\" id=\"customCategoryInput\" placeholder=\"Type custom category...\"\nclass=\"hidden mt-1.5 w-full bg-slate-950 text-white border border-slate-800 rounded p-2 text-xs outline-none focus:border-purple-500\" /><\/div><div class=\"space-y-1.5\"><label class=\"text-xs font-bold text-slate-300\">SUBCATEGORY (OPSIONAL)<\/label><select id=\"stockSubcategorySelect\"\nclass=\"w-full bg-slate-950 text-white border border-slate-800 rounded-lg p-2.5 text-base md:text-xs font-semibold outline-none focus:border-purple-500\"><\/select><input type=\"text\" id=\"customSubcategoryInput\" placeholder=\"Subkategori khusus (opsional)...\"\nclass=\"hidden w-full bg-slate-950 text-white border border-slate-800 rounded p-2.5 text-base md:text-xs outline-none focus:border-purple-500\" /><\/div><\/div><section id=\"colorPaletteSection\" class=\"space-y-2.5 pt-3 border-t border-slate-800\" aria-label=\"Color Palette\">\n<div class=\"flex items-center justify-between gap-2\"><label for=\"colorPaletteSelect\" class=\"text-xs font-bold text-slate-200 flex items-center gap-1.5\"> D. COLOR PALETTE<\/label><\/div>\n<select id=\"colorPaletteSelect\" onchange=\"handlePaletteChange(this.value)\" class=\"w-full bg-slate-950 text-white border border-slate-800 rounded-lg p-2.5 text-base md:text-xs font-semibold outline-none focus:border-fuchsia-500\"\naria-label=\"Select color palette\"><\/select>\n<div id=\"customPaletteEditor\" class=\"hidden p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2\">\n<label for=\"customPaletteHexInput\" class=\"block text-[10px] font-bold text-slate-300\">Custom HEX (opsional · pisahkan dengan koma)<\/label>\n<input id=\"customPaletteHexInput\" type=\"text\" spellcheck=\"false\" autocomplete=\"off\" placeholder=\"#243B53, #00A6A6, #F4EBD0\" oninput=\"handleCustomPaletteHexInput(this.value)\"\nclass=\"w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-base md:text-xs font-mono text-white outline-none focus:border-fuchsia-500\"\n/>\n<div id=\"customPaletteSwatches\" class=\"hidden flex gap-1 h-6 rounded overflow-hidden\" aria-label=\"Manual palette colors\"><\/div>\n<p id=\"customPaletteHint\" class=\"text-[10px] text-slate-400\">Isi minimal 3 warna HEX agar digunakan persis; kosongkan untuk warna otomatis.<\/p>\n<\/div>\n<\/section><div class=\"space-y-3 pt-2 border-t border-slate-800\"><div class=\"flex justify-between items-center\"><label class=\"text-xs font-bold text-slate-200 flex items-center gap-1.5\"> E. CREATIVE DIRECTION\n<\/label><label class=\"flex items-center gap-1.5 text-[11px] font-bold text-purple-400 cursor-pointer\"><input type=\"checkbox\" id=\"autoSelectBestCheckbox\" checked onchange=\"toggleAutoSelectBest(this.checked)\" class=\"accent-purple-500 rounded\" /> Auto Select Best Combination\n<\/label><\/div><div id=\"creativeDirectionControls\" class=\"hidden grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800\"><div><span class=\"text-[10px] font-bold text-slate-400 block mb-1\">Visual Style<\/span><select id=\"visualStyleSelect\" class=\"w-full bg-slate-900 text-white border border-slate-800 rounded p-2 text-base md:text-xs font-medium\"><\/select><\/div><div><span class=\"text-[10px] font-bold text-slate-400 block mb-1\">Commercial Purpose<\/span><select id=\"commercialPurposeSelect\" class=\"w-full bg-slate-900 text-white border border-slate-800 rounded p-2 text-base md:text-xs font-medium\"><\/select><\/div><div><span class=\"text-[10px] font-bold text-slate-400 block mb-1\">Composition<\/span><select id=\"compositionSelect\" class=\"w-full bg-slate-900 text-white border border-slate-800 rounded p-2 text-base md:text-xs font-medium\"><\/select><\/div><\/div><\/div><div class=\"space-y-2 pt-2 border-t border-slate-800\"><label class=\"text-xs font-bold text-slate-200 flex items-center gap-1.5\"> CUSTOM NEGATIVE PROMPT (OPTIONAL)\n<\/label><input type=\"text\" id=\"negativePromptInput\" \nvalue=\"blurry, distorted, watermarks, low resolution, background noise\"\nplaceholder=\"e.g. no gradients, no realistic shadows, no text...\"\nclass=\"w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-base md:text-xs text-slate-300 placeholder-slate-600 outline-none focus:border-purple-500 font-mono\"\n/><p class=\"text-[10px] text-slate-500\">Unwanted visual elements will be explicitly excluded during prompt construction.<\/p><\/div><div class=\"space-y-1.5 pt-2 border-t border-slate-800\"><label class=\"text-xs font-bold text-slate-300\">F. ASSET TYPE<\/label><select id=\"assetTypeSelect\" class=\"w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-base md:text-xs font-semibold outline-none focus:border-purple-500\"><\/select><\/div><div class=\"space-y-3 pt-2 border-t border-slate-800\"><label class=\"text-xs font-bold text-slate-200 flex items-center gap-1.5\"> G. IMAGE SIZE / ASPECT RATIO\n<\/label><div class=\"space-y-2\"><div class=\"grid grid-cols-2 gap-2\"><div><label for=\"ideaStudioSizeSelect\" class=\"block mb-1 text-[10px] text-slate-400 font-bold\">Aspect Ratio<\/label><select id=\"ideaStudioSizeSelect\" onchange=\"handleIdeaSizeChange(this.value);updateRatioHint()\"\nclass=\"w-full bg-slate-950 text-white border border-slate-800 rounded-lg p-2.5 text-base md:text-xs font-semibold outline-none focus:border-purple-500 cursor-pointer\"><\/select><\/div><div><label for=\"imageResolutionSelect\" class=\"block mb-1 text-[10px] text-slate-400 font-bold\">AI Resolution<\/label><select id=\"imageResolutionSelect\" onchange=\"handleImageResolutionChange(this.value)\" class=\"w-full bg-slate-950 text-white border border-slate-800 rounded-lg p-2.5 text-base md:text-xs font-semibold outline-none focus:border-purple-500 cursor-pointer\"><option value=\"1K\" selected>1K · ~1 MP<\/option><option value=\"2K\">2K · ~4 MP<\/option><option value=\"4K\">4K · ~17 MP<\/option><\/select><\/div><\/div><p id=\"stockRatioHint\" aria-live=\"polite\" class=\"text-xs text-slate-400\">Ukuran asli dan megapiksel ditampilkan setelah gambar selesai.<\/p><div id=\"customSizeDimensionsBox\" class=\"hidden bg-slate-950 p-3 rounded-lg border border-purple-900/50 space-y-2.5 animate-fadeIn\"><div class=\"flex items-center justify-between\"><span class=\"text-[11px] font-bold text-purple-300 flex items-center gap-1\"> Custom Dimensions (px)\n<\/span><span class=\"text-[10px] text-slate-400\">64–4096 px · Acuan rasio; generator memakai rasio terdekat.<\/span><\/div><div class=\"grid grid-cols-2 gap-3\"><div><label class=\"text-[10px] font-bold text-slate-400 block mb-1\">Width (px)<\/label><input type=\"number\" oninput=\"updateRatioHint()\" id=\"ideaCustomWidthInput\" min=\"64\" max=\"4096\" value=\"2048\"\nclass=\"w-full bg-slate-900 border border-slate-800 rounded p-2 text-base md:text-xs font-mono text-white outline-none focus:border-purple-500\" /><\/div><div><label class=\"text-[10px] font-bold text-slate-400 block mb-1\">Height (px)<\/label><input type=\"number\" oninput=\"updateRatioHint()\" id=\"ideaCustomHeightInput\" min=\"64\" max=\"4096\" value=\"2048\"\nclass=\"w-full bg-slate-900 border border-slate-800 rounded p-2 text-base md:text-xs font-mono text-white outline-none focus:border-purple-500\" /><\/div><\/div><\/div><\/div><\/div><div id=\"ideaDiscoverActionBar\" class=\"flex flex-row items-end gap-3.5\"><div id=\"discoverBarFields\" class=\"w-full sm:w-36 shrink-0\"><label class=\"text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1\"> Idea Count\n<\/label><select id=\"ideaCountSelect\" onchange=\"updateSeriesEstimate()\" class=\"w-full bg-slate-950 text-white border border-slate-800 rounded-xl px-3.5 py-3 text-xs font-bold outline-none focus:border-purple-500 h-[52px] shadow-inner\"><option value=\"1\">1 Idea<\/option><option value=\"2\">2 Ideas<\/option><option value=\"3\">3 Ideas<\/option><option value=\"4\">4 Ideas<\/option><option value=\"5\" selected>5 Ideas<\/option><option value=\"10\">10 Ideas<\/option><\/select><\/div><button id=\"discoverIdeasBtn\" type=\"button\" onclick=\"handleDiscoverIdeas()\"\nclass=\"flex-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black h-[54px] min-h-[54px] px-6 rounded-2xl text-sm tracking-wide flex items-center justify-center gap-2.5 shadow-xl shadow-purple-600/40 border border-purple-400/30 transition-all active:scale-[0.98] cursor-pointer group\"><svg aria-hidden=\"true\" class=\"rivis-icon w-5 h-5 text-amber-300 shrink-0 group-hover:rotate-12 transition-transform\"><use href=\"#rivis-lightbulb\"><\/use><\/svg><span id=\"discoverIdeasBtnText\" class=\"whitespace-nowrap uppercase\">GENERATE IDEAS<\/span><\/button><button id=\"discoverBarToggleBtn\" type=\"button\" onclick=\"toggleDiscoverActionBar()\"\ntitle=\"Sembunyikan panel Discover Ideas\" aria-label=\"Sembunyikan panel Discover Ideas\"\naria-expanded=\"true\" aria-controls=\"discoverBarFields discoverIdeasBtn\"><span aria-hidden=\"true\" class=\"text-xl\">−<\/span><\/button><\/div><\/div><\/div><\/section><section id=\"tabSectionSavedIdeas\" class=\"tab-section hidden bg-slate-900 rounded-xl p-4 md:p-6 border border-slate-800 space-y-6 shadow-2xl\"><div class=\"flex justify-between items-center border-b border-slate-800 pb-4 flex-wrap gap-3\"><div><h2 class=\"text-base md:text-lg font-bold text-white flex items-center gap-2\"> IDEAS LIBRARY\n<\/h2><p class=\"text-xs text-slate-400\">Hasil generate otomatis tersimpan dari Idea Studio.<\/p><\/div><div class=\"flex flex-wrap gap-2 justify-end items-center\"><button id=\"generateAllImagesBtn\" type=\"button\" onclick=\"handleGenerateAllImages(this)\" class=\"px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-purple-600/20 flex items-center gap-1.5 whitespace-nowrap transition-all active:scale-95\">Image All\n<\/button><button id=\"generateAllMetaBtn\" type=\"button\" onclick=\"handleGenerateAllMetadata(this)\" class=\"px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-blue-600/20 flex items-center gap-1.5 whitespace-nowrap transition-all active:scale-95\"> Meta All\n<\/button><button id=\"clearAllSavedBtn\" type=\"button\" onclick=\"handleClearAllSavedIdeas(this)\" class=\"px-3 py-2 bg-red-950/80 hover:bg-red-900 text-red-300 rounded-lg text-xs font-bold border border-red-800 flex items-center gap-1.5 whitespace-nowrap transition-all active:scale-95\"> Clear All Cards\n<\/button><button id=\"saveAllToCloudBtn\" type=\"button\" onclick=\"RIVIS_SAVE_ALL_TO_CLOUD(this)\" class=\"px-3 py-2 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-sky-600/20 flex items-center gap-1.5 whitespace-nowrap transition-all active:scale-95\"> Save All to Cloud<\/button><button id=\"downloadAllZipBtn\" type=\"button\" onclick=\"handleDownloadAllCardsZip(this)\" class=\"px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 whitespace-nowrap transition-all active:scale-95\"> Download All Card\n<\/button><button id=\"downloadResultsZipBtn\" type=\"button\" onclick=\"handleDownloadResultsZip(this)\" class=\"px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-green-600/20 flex items-center gap-1.5 whitespace-nowrap transition-all active:scale-95\"> Download Result\n<\/button><\/div><\/div><div id=\"libraryStorageTestRow\" class=\"flex items-center justify-between gap-2 min-w-0\">\n<p id=\"storageStatusText\" class=\"min-w-0 flex-1 truncate text-[10px] sm:text-[11px] text-slate-400\" aria-live=\"polite\" title=\"Perkiraan ukuran data Library yang disimpan di perangkat\">IndexedDB lokal • 0 ide • 0.00 MB<\/p>\n<button type=\"button\" id=\"imageTestOfflineBtn\" onclick=\"toggleImageTestOffline()\" aria-pressed=\"false\" title=\"Aktifkan simulasi tanpa API dan muat 3 kartu contoh\"\nclass=\"shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-indigo-700/60 bg-slate-800 hover:bg-indigo-900/70 px-2.5 py-1.5 text-[10px] font-bold text-indigo-200 transition-colors whitespace-nowrap\"><span>Image Test Offline<\/span><span id=\"imageTestOfflineState\" hidden class=\"rounded bg-indigo-300/20 px-1 text-[9px] text-indigo-100\">ON<\/span><\/button>\n<\/div><div id=\"qualityFirstPanel\" class=\"mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-[11px]\"\naria-label=\"Quality First generation settings\"><label class=\"inline-flex items-center gap-1.5 font-bold text-cyan-200 cursor-pointer\"><input type=\"checkbox\" id=\"qualityFirstToggle\" checked onchange=\"setQualityFirstOption('enabled',this.checked)\" class=\"accent-cyan-500\" /> Quality First<\/label><label class=\"inline-flex items-center gap-1.5 text-slate-300 cursor-pointer\"><input type=\"checkbox\" id=\"qualityRepairToggle\" checked onchange=\"setQualityFirstOption('repair',this.checked)\" class=\"accent-cyan-500\" /> Smart Repair (maks. 1×)<\/label><span class=\"text-slate-500\">Crop 100% + AI & pemeriksaan teknis · memakai kuota API tambahan<\/span><\/div><div id=\"savedIdeasGridContainer\"><div class=\"text-center py-16 text-slate-500 text-xs space-y-2\"><p>Belum ada ide. Buat ide di Idea Studio; hasil akan langsung masuk Library.<\/p><\/div><\/div><\/section><\/div><nav id=\"floatingSideTabs\" aria-label=\"Navigasi cepat RIVIS\"><button id=\"sideTabIdeaStudio\" type=\"button\" onclick=\"switchTab(\'idea_studio\')\" title=\"Idea Studio\" aria-label=\"Buka Idea Studio\" class=\"side-tab\" aria-current=\"page\"><svg aria-hidden=\"true\" class=\"rivis-icon w-5 h-5\"><use href=\"#rivis-lightbulb\"><\/use><\/svg><\/button><button id=\"sideTabLibrary\" type=\"button\" onclick=\"switchTab(\'saved_ideas\')\" title=\"Library\" aria-label=\"Buka Library\" class=\"side-tab\"><svg aria-hidden=\"true\" class=\"rivis-icon w-5 h-5\"><use href=\"#rivis-bookmark\"><\/use><\/svg><span id=\"sideShortcutCount\" class=\"side-count\" aria-hidden=\"true\">0<\/span><\/button><button id=\"sideTabCloudGallery\" type=\"button\" onclick=\"switchTab(\'cloud_library\')\" title=\"Cloud Gallery\" aria-label=\"Buka Cloud Gallery\" class=\"side-tab\"><span aria-hidden=\"true\" class=\"text-lg\">☁<\/span><\/button><\/nav>\n\n");
})();
function byId(id){return document.getElementById(id);}
const uiClasses=["text-center py-12 text-slate-500 text-xs space-y-2","px-2.5 py-1 bg-amber-950/90 border border-amber-800/80 rounded-lg text-[10px] text-amber-300 font-bold flex items-center justify-between",
"text-[9px] font-mono text-slate-400","px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold rounded text-[10px] flex items-center gap-1 border border-slate-700 transition-all active:scale-95",
"w-2.5 h-2.5 text-emerald-400","font-bold text-purple-300 flex items-center gap-1","text-[10px] font-bold text-slate-400 block"];
function safeStorageGet(key,fallback=''){try{return localStorage.getItem(key)||fallback;}catch(e){return fallback;}}
function safeStorageSet(key,
val){try{localStorage.setItem(key,val);return true;}catch(e){return false;}}
function validImageResolution(value){return['1K',
'2K','4K'].includes(value)?value:'2K';}
const IDEA_STUDIO_SIZES=[{id:'1:1',label:'Square (1:1)',ratio:'1:1',defaultDims:'5000 × 5000 px',
nativeRatio:'1:1'},{id:'2:3',label:'Portrait (2:3)',ratio:'2:3',defaultDims:'3333 × 5000 px',nativeRatio:'2:3'},{id:'3:2',label:'Landscape (3:2)',
ratio:'3:2',defaultDims:'5000 × 3333 px',nativeRatio:'3:2'},{id:'16:9',label:'Widescreen (16:9)',ratio:'16:9',defaultDims:'5120 × 2880 px',
nativeRatio:'16:9'},{id:'custom',label:'Custom Size',ratio:'Custom px',defaultDims:'Width × Height px',nativeRatio:'custom'}];
const STOCK_CATEGORIES=[
 {id:'business',name:'Business & Finance',subcategories:['Banking & Financial Services','Personal Finance & Budgeting','Startups & Entrepreneurship','Marketing & Advertising','E-commerce & Retail','Office & Remote Work','Business Operations & HR']},
 {id:'tech',name:'Technology & Digital',subcategories:['Artificial Intelligence','Cybersecurity & Privacy','Cloud Computing & Networks','Robotics & Automation','Data Science & Analytics','Software & Applications','Consumer Electronics']},
 {id:'people',name:'People & Lifestyle',subcategories:['Everyday Life','Family & Relationships','Fashion & Personal Style','Fashion Editorial & Streetwear','Community & Inclusion','Career & Professional Life','Aging & Generations','Personal Growth']},
 {id:'health',name:'Health & Wellness',subcategories:['Healthcare & Medical','Mental Health & Mindfulness','Fitness & Exercise','Nutrition & Healthy Eating','Beauty & Skincare','Spa & Relaxation','Accessibility & Caregiving']},
 {id:'food',name:'Food & Beverage',subcategories:['Restaurant & Dining','Cooking & Food Preparation','Bakery & Desserts','Coffee & Tea','Drinks & Beverages','Fresh Produce & Ingredients','Food Culture & Street Food']},
 {id:'animals',name:'Animals & Pets',subcategories:['Pets & Pet Care','Wildlife & Safari','Birds','Marine Animals','Farm Animals','Insects & Pollinators']},
 {id:'nature',name:'Nature & Environment',subcategories:['Plants & Flowers','Forests & Woodlands','Mountains & Landscapes','Ocean & Marine Ecosystems','Ecology & Conservation','Climate & Renewable Energy','Weather & Natural Phenomena']},
 {id:'edu',name:'Education & Science',subcategories:['Classroom & Learning','Online Education','STEM & Laboratory Research','School Supplies','Space & Astronomy','History & Knowledge','Scientific Discoveries']},
 {id:'travel',name:'Travel & Places',subcategories:['Tourism & Destinations','Architecture & Buildings','Landmarks & Heritage','Camping & Adventure','Transportation & Mobility','Hotels & Hospitality','City Life']},
 {id:'home',name:'Home & Living',subcategories:['Interior Design','Furniture & Home Decor','Household Objects','Home Organization','Gardening & DIY','Renovation & Improvement']},
 {id:'industry',name:'Industry & Infrastructure',subcategories:['Manufacturing & Production','Construction & Engineering','Logistics & Supply Chain','Energy & Utilities','Agriculture & Farming','Industrial Safety']},
 {id:'arts',name:'Arts, Culture & Entertainment',subcategories:['Fine Art & Craft','Music & Performance','Film & Media','Visual Storytelling & Storyboards','Books & Publishing','Festivals & Cultural Heritage','Creative Hobbies']},
 {id:'sports',name:'Sports & Recreation',subcategories:['Team Sports','Individual Sports','Athletics & Competition','Outdoor Recreation','Adventure Sports','Sports Equipment & Training']},
 {id:'seasonal',name:'Seasonal & Holidays',subcategories:['Christmas & Winter','Halloween & Autumn','Spring & Easter','Summer & Beach','Valentine & Romance','New Year & Celebrations','Wedding & Special Events']},
 {id:'abstract',name:'Abstract & Graphic Design',subcategories:['Abstract Geometric','Organic Forms & Waves','Gradient Color Fields','Decorative Motifs','Minimal Patterns & Textures','Experimental Visual Concepts']},
 {id:'custom',name:'Custom Category',subcategories:['custom']}
];
const LEGACY_STOCK_CATEGORY_ALIASES=Object.freeze({bg:'abstract',vector:'abstract','3d':'abstract'});
const VISUAL_STYLES_BY_MODE=Object.freeze({
 vector:['Modern Flat Illustration','Editorial Illustration','Playful Editorial Flat Vector','Playful Editorial Fashion','Editorial Fashion Illustration','Fashion Figure Illustration','Contemporary Character Editorial','Stylized Lifestyle Editorial','Bold Color-Block Illustration','Graphic Narrative Illustration','Neo-Brutalist Editorial Graphics','Organic Geometric Editorial','Monochrome Ink Editorial','Geometric Editorial','Botanical Illustration','Character Illustration','Minimalist Line Art','Isometric Illustration','Paper Cut Collage','Screen Print / Risograph','Vintage Engraving','Woodcut Print','Hand-Drawn Ink','Retro Mid-Century','Bauhaus Geometry','Swiss Minimalist Graphic','Children’s Book Illustration','Naive Folk Art','Editorial Cutout','Abstract Organic','Bold Pop Art','Technical Illustration','Monoline Illustration'],
 photo:['Natural Commercial Photography','Editorial Documentary Photography','Premium Product Photography','Lifestyle Storytelling Photography','Cinematic Narrative Photography','Cinematic Film-Still Photography','Studio Still Life','Food Editorial Photography','Fashion Editorial Photography','Architectural Photography','Travel Documentary Photography','Environmental Portrait Photography','Cinematic Advertising Photography'],
 editorial:['Editorial Documentary Photography','Lifestyle Storytelling Photography','Cinematic Narrative Photography','Cinematic Film-Still Photography','Fashion Editorial Photography','Environmental Portrait Photography','Travel Documentary Photography','Food Editorial Photography','Architectural Photography'],
 advertising:['Cinematic Advertising Photography','Premium Product Photography','Lifestyle Storytelling Photography','Studio Still Life','Fashion Editorial Photography','Food Editorial Photography','Natural Commercial Photography'],
 '3d':['Stylized 3D Illustration','Stylized Character 3D','Cinematic 3D Scene Render','Photorealistic Product Render','Isometric 3D','Clay Render','Soft Plastic Toy Render','Glass & Translucent 3D','Metallic Industrial Render','Abstract 3D Geometry','Architectural Visualization','Miniature Diorama']
});
const VISUAL_STYLES=[...new Set(Object.values(VISUAL_STYLES_BY_MODE).flat())];
const COMMERCIAL_PURPOSES=['Website & Landing Page','Digital Advertising','Social Media Campaign','Social Media Carousel','Brand Identity & Marketing','Product Packaging & Labels','E-commerce Listing','Mobile Application','Corporate Presentation','Editorial & Publishing','Visual Storytelling & Narrative Sequence','Film & Media Previsualization','Education & Learning','Infographic & Data Communication','Print & Merchandise','Event & Seasonal Promotion','Interior & Environmental Graphics','Stock Asset Library'];
const PALETTE_GROUPS=Object.freeze({
 'Vivid & Playful':['Vibrant Editorial','High-Contrast Pop','Sunset Energy','Playful Pastel','Tech Neon'],
 'Natural & Organic':['Soft Botanical','Warm Earth','Cool Ocean','Muted Vintage'],
 'Professional & Minimal':['Corporate Blue','Modern Neutral','Monochrome','Black & Gold','Silhouette'],
 'Classic & Retro':['Retro Mid-Century']
});
const COLOR_PALETTES=[...new Set(Object.values(PALETTE_GROUPS).flat()),'Custom Palette'];
const PALETTE_HEX_MAP=Object.freeze({
 'Vibrant Editorial':['#F44771','#FFC857','#22B8A7','#3157A4','#F7F1E8'],
 'High-Contrast Pop':['#F21B5B','#FFB000','#20A6A1','#283D8C','#171717'],
 'Sunset Energy':['#8C3155','#E75D4D','#F49B55','#F5CB75','#4C4B78'],
 'Playful Pastel':['#F28DB2','#F6C96B','#91D8C1','#9CB7F2','#F8EDE7'],
 'Tech Neon':['#101A3A','#315BFF','#00D6C9','#C5FF3D','#F2F5FF'],
 'Soft Botanical':['#315C45','#8BAA78','#D6DDBB','#E8BFA7','#F7F1E7'],
 'Warm Earth':['#8B4B32','#C47B45','#E5B96F','#5E6650','#F2E5D3'],
 'Cool Ocean':['#123F5A','#168C9C','#61C6C2','#A8D9D2','#F0F5EE'],
 'Muted Vintage':['#6F7865','#B18A75','#C7B79B','#6E7D8A','#E8E0D2'],
 'Corporate Blue':['#123B68','#2878A8','#58B8C5','#D9E9EF','#F5F8FA'],
 'Modern Neutral':['#252A32','#737B80','#B7B5AA','#E4DED2','#F8F6F0'],
 'Monochrome':['#171717','#505050','#888888','#C7C7C7','#F4F4F4'],
 'Black & Gold':['#171717','#3A3024','#A77A2D','#D9B65D','#F2E8D2'],
 'Silhouette':['#101820','#35424A','#69757B','#BBC4C7','#F5F5F0'],
 'Retro Mid-Century':['#D85A38','#E7B64A','#3F7773','#293F56','#F2E7D2']
});
const COMPOSITIONS=['Centered Hero','Isolated with Copy Space','Balanced Collection','Symmetrical Layout','Asymmetrical Editorial','Rule of Thirds','Wide Banner','Vertical Poster','Close-up Detail','Top-Down Flat Lay','Full-Bleed Scene','Layered Depth','Dynamic Diagonal','Cinematic Establishing Shot','Over-the-Shoulder Scene','Character Lineup','Full-Body Character Scene','Cinematic Close Interaction','Story Sequence Frame','Environmental Character Portrait','Negative Space Left','Negative Space Right','Repeat-ready Layout'];
const ASSET_TYPES_BY_MODE=Object.freeze({
 vector:['Vector Illustration','Editorial Illustration','Spot Illustration','Scene Illustration','Character & Mascot Set','Icon Set','Sticker Pack','Clipart Set','Infographic & Diagram','Seamless Pattern','Background & Texture','Decorative Elements','Isolated Object','Badge & Emblem','Map & Wayfinding Graphic','Packaging Illustration','Logo & Brand Mark'],
 photo:['Commercial Photography','Product Photography','Lifestyle Photography','Food Photography','Portrait Photography','Architecture Photography','Travel Photography','Nature & Wildlife Photography','Editorial Photography','Advertising Photography'],
 editorial:['Editorial Photography','Lifestyle Photography','Portrait Photography','Travel Photography','Food Photography','Architecture Photography','Nature & Wildlife Photography'],
 advertising:['Advertising Photography','Product Photography','Commercial Photography','Food Photography','Lifestyle Photography','Portrait Photography'],
 '3d':['3D Illustration','3D Product Render','3D Scene Render','Isometric 3D Asset','3D Icon Set','3D Mockup Render','Material & Texture Render','Architectural Visualization','Miniature Diorama']
});
const ASSET_TYPES=[...new Set(Object.values(ASSET_TYPES_BY_MODE).flat())];
const REFERENCE_MODES=[
 {id:'STYLE REFERENCE',name:'1. STYLE REFERENCE',desc:'Use general shape language, line quality, palette, lighting and mood; create a new original design.'},
 {id:'CONCEPT REFERENCE',name:'2. CONCEPT REFERENCE',desc:'Extract broad subject inspiration, then invent original details and activities.'},
 {id:'COMPOSITION REFERENCE',name:'3. COMPOSITION REFERENCE',desc:'Use only general layout and focal hierarchy, not specific objects or graphics.'},
 {id:'VARIATION',name:'4. VARIATION',desc:'Create a new substantive variation while preserving suitable general visual principles.'},
 {id:'CREATIVE REMIX',name:'5. CREATIVE REMIX',desc:'Combine non-identifying reference attributes with a new creative concept.'}
];
function getDefaultAssetTypeForMode(mode){return({vector:'Vector Illustration',photo:'Commercial Photography',editorial:'Editorial Photography',advertising:'Advertising Photography','3d':'3D Illustration'})[mode]||'Vector Illustration';}
function syncCreativeOptionsForMode(mode){
 const key=Object.prototype.hasOwnProperty.call(RASTER_MODES,mode)?mode:'vector';
 const styleSel=byId('visualStyleSelect'),styles=VISUAL_STYLES_BY_MODE[key]||VISUAL_STYLES_BY_MODE.vector;
 if(styleSel){const prev=styleSel.value||state.selectedStyle;styleSel.innerHTML=styles.map(s=>'<option value="'+escapeHtml(s)+'">'+escapeHtml(s)+'</option>').join('');styleSel.value=styles.includes(prev)?prev:styles[0];state.selectedStyle=styleSel.value;}
 const assetSel=byId('assetTypeSelect'),assets=ASSET_TYPES_BY_MODE[key]||ASSET_TYPES_BY_MODE.vector;
 if(assetSel){const prev=assetSel.value||state.selectedAssetType;assetSel.innerHTML=assets.map(a=>'<option value="'+escapeHtml(a)+'">'+escapeHtml(a)+'</option>').join('');assetSel.value=assets.includes(prev)?prev:getDefaultAssetTypeForMode(key);state.selectedAssetType=assetSel.value;}
}
function paletteHexForSelection(name){return PALETTE_HEX_MAP[name]?[...PALETTE_HEX_MAP[name]]:[];}
function categoryForId(id){return STOCK_CATEGORIES.find(c=>c.id===id)||STOCK_CATEGORIES.find(c=>c.id===LEGACY_STOCK_CATEGORY_ALIASES[id])||STOCK_CATEGORIES.find(c=>c.id==='custom');}
let dynamicSeasonalCampaigns=[
 {id:'xmas',icon:'🎄',name:'Christmas & Winter Holidays',rushWindow:'Upload Rush: Aug–Oct',prompt:'Original winter gift packaging collection with evergreen sprigs, warm festive treats and creative holiday objects',category:'seasonal',subcategory:'Christmas & Winter',style:'Retro Mid-Century',purpose:'Product Packaging & Labels',palette:'Warm Earth',assetType:'Sticker Pack'},
 {id:'halloween',icon:'🎃',name:'Halloween & Autumn',rushWindow:'Upload Rush: Jul–Sep',prompt:'Original playful seasonal graphics with carved pumpkins, moonlit garden details and handmade decorations',category:'seasonal',subcategory:'Halloween & Autumn',style:'Vintage Engraving',purpose:'Social Media Campaign',palette:'Muted Vintage',assetType:'Badge & Emblem'},
 {id:'back2school',icon:'🎒',name:'Back to School & STEM',rushWindow:'Upload Rush: Jun–Aug',prompt:'Distinct classroom supplies and science objects arranged as a useful educational collection',category:'edu',subcategory:'School Supplies',style:'Modern Flat Illustration',purpose:'Education & Learning',palette:'Vibrant Editorial',assetType:'Clipart Set'},
 {id:'blackfriday',icon:'🛍️',name:'Retail Campaign',rushWindow:'Upload Rush: Aug–Oct',prompt:'Original abstract retail promotion layout with generic shopping motifs and no typography',category:'business',subcategory:'Marketing & Advertising',style:'Geometric Editorial',purpose:'Digital Advertising',palette:'Black & Gold',assetType:'Badge & Emblem'},
 {id:'spring_easter',icon:'🌸',name:'Spring Renewal & Floral',rushWindow:'Upload Rush: Dec–Feb',prompt:'Elegant seed-bearing stems and distinct spring wildflowers arranged as an original botanical collection',category:'nature',subcategory:'Plants & Flowers',style:'Botanical Illustration',purpose:'Product Packaging & Labels',palette:'Soft Botanical',assetType:'Decorative Elements'},
 {id:'summer_beach',icon:'☀️',name:'Summer Travel & Festival',rushWindow:'Upload Rush: Mar–May',prompt:'Coastal travel essentials and outdoor holiday activities depicted as clearly distinct motifs',category:'travel',subcategory:'Tourism & Destinations',style:'Retro Mid-Century',purpose:'Social Media Campaign',palette:'Sunset Energy',assetType:'Icon Set'}
];
const AUTO_PROMPT_PRESETS=[
 {prompt:'Clean graphic of solar and wind power systems serving a sustainable neighborhood',category:'nature',subcategory:'Climate & Renewable Energy',style:'Technical Illustration',purpose:'Infographic & Data Communication',palette:'Soft Botanical',composition:'Balanced Collection',assetType:'Infographic & Diagram',size:'1:1'},
 {prompt:'Distinct tropical leaves and flower buds designed as an original sticker collection',category:'nature',subcategory:'Plants & Flowers',style:'Botanical Illustration',purpose:'Product Packaging & Labels',palette:'Soft Botanical',composition:'Isolated with Copy Space',assetType:'Sticker Pack',size:'1:1'},
 {prompt:'Small business team reviewing orders and inventory on a shared desk',category:'business',subcategory:'Startups & Entrepreneurship',style:'Modern Flat Illustration',purpose:'Website & Landing Page',palette:'Corporate Blue',composition:'Centered Hero',assetType:'Editorial Illustration',size:'16:9'},
 {prompt:'Artisanal coffee brewing tools and botanically accurate bean branches arranged into an original emblem',category:'food',subcategory:'Coffee & Tea',style:'Vintage Engraving',purpose:'Product Packaging & Labels',palette:'Warm Earth',composition:'Centered Hero',assetType:'Badge & Emblem',size:'1:1'},
 {prompt:'Wide abstract organic shapes arranged as a structured gradient banner background',category:'abstract',subcategory:'Organic Forms & Waves',style:'Abstract Organic',purpose:'Website & Landing Page',palette:'Vibrant Editorial',composition:'Wide Banner',assetType:'Background & Texture',size:'16:9'}
];
const STORAGE_KEYS={API_KEY:'vfp_gemini_api_key',SAVED_IDEAS:'vfp_saved_ideas',
GRADIENT_ENABLED:'rvis_gradient_enabled',IMAGE_RESOLUTION:'rvis_image_resolution',OUTPUT_MODE:'rvis_output_mode',RASTER_PREFS:'rvis_raster_prefs'};
const IDB_NAME='rich_vector_idea_studio_db';
const IDB_STORE='app_data';
const IDB_LIBRARY_KEY='saved_ideas_library_v1';
let idbAvailable=typeof indexedDB!=='undefined';
let idbReadyPromise=null;
function openStudioDB(){if(!idbAvailable)return Promise.reject(new Error('IndexedDB tidak tersedia di browser ini.'));
if(idbReadyPromise)return idbReadyPromise;idbReadyPromise=new Promise((resolve,reject)=>{try{const req=indexedDB.open(IDB_NAME,
1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(IDB_STORE))db.createObjectStore(IDB_STORE);};
req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('Gagal membuka IndexedDB.'));req.onblocked=()=>reject(new Error('Database sedang diblokir tab lain.'));
}catch(e){reject(e);}}).catch(err=>{idbReadyPromise=null;throw err;});return idbReadyPromise;}
async function idbGet(key){const db=await openStudioDB();
return new Promise((resolve,reject)=>{const tx=db.transaction(IDB_STORE,'readonly');const req=tx.objectStore(IDB_STORE).get(key);
req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
async function idbSet(key,value){const db=await openStudioDB();
return new Promise((resolve,reject)=>{const tx=db.transaction(IDB_STORE,'readwrite');tx.objectStore(IDB_STORE).put(value,key);
tx.oncomplete=()=>resolve(true);tx.onerror=tx.onabort=()=>reject(tx.error||new Error('Gagal menulis IndexedDB.'));});}
function readStoredIdeas(){try{const v=JSON.parse(safeStorageGet(STORAGE_KEYS.SAVED_IDEAS,
'[]'));return Array.isArray(v)?v:[];}catch(e){console.warn('Saved ideas storage was invalid',e);return[];}}
function compactLibraryBackup(ideas){return ideas.map(idea=>{const slim={...idea};
delete slim.generatedImageUrl;delete slim.generatedImagePreviewUrl;delete slim.refImageUrl;delete slim.referenceImage;delete slim.imageBase64;delete slim.visualPreflightPending;if(Array.isArray(slim.seriesScenes))slim.seriesScenes=slim.seriesScenes.map(scene=>{const copy={...scene};delete copy.generatedImageUrl;delete copy.generatedImagePreviewUrl;return copy;});
return slim;});}
async function initializePersistentLibrary(){try{const stored=await idbGet(IDB_LIBRARY_KEY);if(Array.isArray(stored)){state.savedIdeas=stored;
}else{const legacy=readStoredIdeas();await idbSet(IDB_LIBRARY_KEY,legacy);state.savedIdeas=legacy;}state.savedIdeas.forEach(ensureConceptBlueprint);
safeStorageSet(STORAGE_KEYS.SAVED_IDEAS,JSON.stringify(compactLibraryBackup(state.savedIdeas)));renderSavedIdeasGrid();updateBadges();
}catch(err){idbAvailable=false;console.warn('IndexedDB initialization failed:',err);state.savedIdeas=readStoredIdeas();state.savedIdeas.forEach(ensureConceptBlueprint);
renderSavedIdeasGrid();updateBadges();}refreshStorageStatus();}
let sizeFrame=0,sizeDirty=false;
function estimateSavedLibraryBytes(ideas){
 let bytes=0;
 for(const idea of ideas||[]){
  try{const meta={...idea};delete meta.generatedImageUrl;delete meta.generatedImagePreviewUrl;bytes+=new Blob([JSON.stringify(meta)]).size;}catch(_){}
  for(const value of [idea?.generatedImageUrl,idea?.generatedImagePreviewUrl]){
   if(typeof value==='string'&&value.startsWith('data:')){const comma=value.indexOf(',');if(comma>=0)bytes+=Math.floor((value.length-comma-1)*.75);}
  }
 }
 return bytes;
}
function refreshStorageStatus(){sizeDirty=true;
if(state.activeTab!=='saved_ideas'||byId('tabSectionSavedIdeas')?.classList.contains('hidden'))return;if(sizeFrame)return;sizeFrame=requestAnimationFrame(()=>{sizeFrame=0;
if(!sizeDirty)return;sizeDirty=false;const status=byId('storageStatusText');if(!status)return;const bytes=estimateSavedLibraryBytes(state.savedIdeas);
status.textContent=`${idbAvailable?'IndexedDB lokal':'Penyimpanan browser'} • ${state.savedIdeas.length} ide • ${(bytes/1048576).toFixed(2)} MB`;
});}
const state={activeTab:'idea_studio',apiKey:safeStorageGet(STORAGE_KEYS.API_KEY,''),refImageUrl:null,refImageFile:null,refMode:REFERENCE_MODES[0].id,
refModInstruction:'',refSuggestions:null,referenceFingerprint:null,referenceAnalysis:null,productionType:'single',collectionItemCount:'',seriesLength:5,seriesCreationMode:'auto',seriesManualScenes:[],seriesContinuityLock:true,seriesAnchorReference:true,seriesAutoGenerate:false,noTextChecked:true,svgFriendly:true,gradientEnabled:safeStorageGet(STORAGE_KEYS.GRADIENT_ENABLED,
'false')==='true',outputMode:'vector',selectedCategory:STOCK_CATEGORIES.find(c=>c.id==='custom'),customCategory:'',selectedSubcategory:'',
customSubcategory:'',autoSelectBest:true,selectedStyle:VISUAL_STYLES[0],selectedPurpose:COMMERCIAL_PURPOSES[0],selectedPalette:COLOR_PALETTES[0],
paletteMode:'auto',manualPaletteHex:[],selectedComposition:COMPOSITIONS[0],selectedAssetType:ASSET_TYPES[0],ideaStudioSizeId:'1:1',
imageResolution:'1K',ideaCustomWidth:2048,ideaCustomHeight:2048,discoveredIdeas:[],selectedIdea:null,savedIdeas:readStoredIdeas()};
function getCardUniqueCode(idea){if(!idea)return Math.random().toString(36).substring(2,6).toLowerCase();if(!idea.shortCode){const cleanId=(idea.ideaId||'').replace(/[^a-zA-Z0-9]/g,
'');if(cleanId.length>=4){idea.shortCode=cleanId.slice(-4).toLowerCase();}else{idea.shortCode=Math.random().toString(36).substring(2,
6).toLowerCase();}}return idea.shortCode;}
function sanitizeTitleForFilename(text){if(!text)return'asset';return String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,
'').replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').substring(0,45)||'asset';}
function getCardBaseFilename(idea){if(!idea)return'0000_stock_asset';
const code=getCardUniqueCode(idea);const rawTitle=idea.metadata?.stockTitle||idea.conceptName||idea.mainSubject||'stock_asset';
const title=sanitizeTitleForFilename(rawTitle);return`${code}_${title.slice(0,Math.max(1,20-code.length-1)).replace(/_+$/,'')||'a'}`;
}
const ADOBE_STOCK_CATEGORIES=Object.freeze({1:'Animals',2:'Buildings and Architecture',3:'Business',4:'Drinks',5:'The Environment',
6:'States of Mind',7:'Food',8:'Graphic Resources',9:'Hobbies and Leisure',10:'Industry',11:'Landscapes',12:'Lifestyle',13:'People',
14:'Plants and Flowers',15:'Culture and Religion',16:'Science',17:'Social Issues',18:'Sports',19:'Technology',20:'Transport',
21:'Travel'});
function adobeCsvText(value,maxLength=Infinity){return String(value??'').replace(/[\r\n\t]+/g,' ').replace(/\s+/g,
' ').trim().slice(0,maxLength);}
function adobeCsvCell(value){return`"${String(value??'').replace(/"/g,'""')}"`;}
function normalizeAdobeKeywords(value,
idea={},meta={}){const source=Array.isArray(value)?value:String(value||'').split(/[,;\n]+/);const seen=new Set();const title=String(meta.stockTitle||idea.conceptName||'').toLowerCase();
const subject=String(idea.mainSubject||'').toLowerCase();const concept=String(idea.conceptName||'').toLowerCase();const anchored=(text,
term)=>term.length>=3&&(' '+text.replace(/[^\p{L}\p{N}]+/gu,' ')+' ').includes(' '+term+' ');const entries=[];source.forEach((item,
index)=>{const term=adobeCsvText(item,80).replace(/^[#\s"']+|[#\s"']+$/g,'').replace(/[\[\]{}<>]/g,'').replace(/\s{2,}/g,' ').trim();
if(!term||term.length<2||/\b(?:adobe stock|shutterstock|freepik|seo|best seller|bestseller|high ranking|high resolution|ultra hd|8k|4k|watermark free|ai generated|generative ai|prompt engineering)\b/i.test(term)||scanIpRisk(term).length)return;
const key=term.toLocaleLowerCase('en-US');const equivalent=key.split(/\s+/).map(w=>w.length>4&&/s$/.test(w)&&!/ss$|us$|is$/.test(w)?w.slice(0,
-1):w).sort().join(' ');if(seen.has(equivalent))return;seen.add(equivalent);const normalized=key.replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const words=normalized.split(' ').filter(w=>w.length>=4&&!/^(?:with|from|into|that|this|illustration|design|vector|graphic|image|stock)$/.test(w));
const score=(49-Math.min(index,49))+(anchored(title,normalized)?115:0)+(anchored(subject,normalized)?105:0)+(anchored(concept,
normalized)?90:0)+(words.some(w=>anchored(title,w))?24:0)+(/^(?:vector|illustration|design|graphic|image|stock|clipart|artwork|template)$/.test(key)?-28:0);
entries.push({term,score,index});});return entries.sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,40).map(x=>x.term);}
function normalizeAdobeReleases(value){const source=Array.isArray(value)?value:String(value||'').split(',');
return source.map(item=>adobeCsvText(item,255)).filter(Boolean).join(', ');}
function resolveAdobeCategoryCode(idea,meta={}){const direct=Number.parseInt(meta.adobeCategoryCode??meta.categoryCode,
10);if(Number.isInteger(direct)&&direct>=1&&direct<=21)return direct;const named=adobeCsvText(meta.adobeCategory).toLowerCase();
const exactEntry=Object.entries(ADOBE_STOCK_CATEGORIES).find(([,name])=>name.toLowerCase()===named);if(exactEntry)return Number(exactEntry[0]);
const categoryId=String(idea?.categoryId||state.selectedCategory?.id||'').toLowerCase();const subcategory=String(idea?.subcategory||idea?.selectedSubcategory||state.selectedSubcategory||'').toLowerCase();
if(categoryId==='vector'||categoryId==='bg'||categoryId==='3d')return 8;const text=[categoryId,subcategory,named,idea?.conceptName,
idea?.mainSubject,idea?.suggestedAssetType,idea?.commercialUseCase,idea?.finalGenerationPrompt].filter(Boolean).join(' ').toLowerCase();
const has=(pattern)=>pattern.test(text);if(has(/\b(animal|wildlife|pet|insect|bird|fish|bee|cat|dog)\b/))return 1;if(has(/\b(building|architecture|interior|house|home exterior|office interior|temple|factory building)\b/))return 2;
if(has(/\b(drink|beverage|coffee|cafe|cocktail|beer|wine|juice|tea)\b/))return 4;if(has(/\b(food|meal|fruit|vegetable|bakery|pastry|restaurant|ingredient|culinary)\b/))return 7;
if(has(/\b(plant|flower|floral|botanical|leaf|leaves|garden)\b/))return 14;if(has(/\b(sport|fitness|athlete|exercise|yoga|football|basketball)\b/))return 18;
if(has(/\b(medical|healthcare|clinical|science|research|laboratory|stem|astronomy|medicine|dental)\b/))return 16;if(has(/\b(transport|vehicle|car|bus|train|plane|logistics|shipping|traffic|road)\b/))return 20;
if(has(/\b(travel|tourism|hotel|hospitality|landmark|vacation|adventure|camping)\b/))return 21;if(has(/\b(portrait|person|people|man|woman|child|children|human)\b/))return 13;
if(has(/\b(lifestyle|family|community|daily life|wellness|self care|spa|relaxation)\b/))return 12;if(has(/\b(environment|ecology|climate|sustainability|sustainable|forest|ocean|marine|weather)\b/))return 5;
if(has(/\b(landscape|cityscape|skyline|scenic|vista)\b/))return 11;if(has(/\b(technology|software|computer|smartphone|digital|cybersecurity|cloud|robot|artificial intelligence|data science)\b/))return 19;
if(has(/\b(industry|industrial|manufacturing|construction|energy production|engineering)\b/))return 10;if(has(/\b(culture|religion|religious|tradition|heritage|ceremony|holiday|christmas|halloween|easter)\b/))return 15;
if(has(/\b(social issue|poverty|inequality|politics|activism|awareness)\b/))return 17;if(has(/\b(emotion|mental health|meditation|state of mind|mindfulness)\b/))return 6;
if(has(/\b(hobby|leisure|craft|knitting|recreation)\b/))return 9;if(categoryId==='business'||has(/\b(business|finance|corporate|banking|marketing|startup)\b/))return 3;
if(categoryId==='travel')return 21;if(categoryId==='health'||categoryId==='edu')return 16;if(categoryId==='tech')return 19;if(categoryId==='people')return 12;
if(categoryId==='nature')return 5;if(categoryId==='food')return 7;return 8;}
function normalizeAdobeStockMetadata(idea,meta={}){const adobeCategoryCode=resolveAdobeCategoryCode(idea,
meta);return{...meta,stockTitle:adobeCsvText(meta.stockTitle||idea?.conceptName||idea?.mainSubject||'Stock asset',70).replace(/[,;<>]/g,
'').trim(),keywords:normalizeAdobeKeywords(meta.keywords,idea,meta),adobeCategory:ADOBE_STOCK_CATEGORIES[adobeCategoryCode]||'',
adobeCategoryCode,releases:normalizeAdobeReleases(meta.releases??meta.releaseNames)};}
function getMetadataAssetFilename(idea,exportedFilename=''){
  const base=getCardBaseFilename(idea);
  if(!isRasterIdea(idea))return`${base}-edt.svg`;
  const exportedExt=(String(exportedFilename||'').match(/\.([^.\/\\]+)$/)||[])[1]?.toLowerCase();
  const configuredExt=String(rasterSnapshot(idea).format||'jpg').toLowerCase();
  const ext=exportedExt==='png'||(!exportedExt&&configuredExt==='png')?'png':'jpg';
  return`${base}-edt.${ext}`;
}
function buildAdobeStockCsvRow(idea,metaInput=idea?.metadata||{},filenameOverride=''){
  const meta=normalizeAdobeStockMetadata(idea,metaInput);
  const filename=getMetadataAssetFilename(idea,filenameOverride);
  return[adobeCsvCell(filename),adobeCsvCell(meta.stockTitle),adobeCsvCell(meta.keywords.join(', ')),
    String(meta.adobeCategoryCode),adobeCsvCell(meta.releases)].join(',');
}
function buildAdobeStockCsv(ideas){const rows=(Array.isArray(ideas)?ideas:[ideas]).filter(Boolean).flatMap(idea=>idea.productionType==='series'&&Array.isArray(idea.seriesScenes)?idea.seriesScenes.filter(scene=>scene.metadata).map((scene,i)=>{const child=seriesSceneAssetIdea(idea,scene,i);return buildAdobeStockCsvRow(child,scene.metadata); }):[buildAdobeStockCsvRow(idea)]);
return`Filename,Title,Keywords,Category,Releases\r\n${rows.join('\r\n')}`;}
function checkForDuplicateConcept(idea,currentList){if(!idea||!currentList||!currentList.length)return false;
const cleanTitle=(idea.conceptName||'').toLowerCase().trim();const cleanPrompt=(idea.finalGenerationPrompt||'').toLowerCase().trim();
return currentList.some(item=>{if(item.ideaId===idea.ideaId)return false;const itemTitle=(item.conceptName||'').toLowerCase().trim();
const itemPrompt=(item.finalGenerationPrompt||'').toLowerCase().trim();return(cleanTitle&&cleanTitle===itemTitle)||(cleanPrompt&&cleanPrompt===itemPrompt);
});}
const IP_RISK_PATTERN=/\b(?:disney|pixar|marvel|star\s*wars|pokemon|pokémon|hello\s*kitty|mickey\s*mouse|barbie|lego|nintendo|playstation|coca[ -]?cola|starbucks|nike|adidas|gucci|louis\s*vuitton|iphone|ipad|macbook|samsung\s+galaxy|harry\s*potter|spider[ -]?man|batman|superman|totoro|studio\s+ghibli|tesla\s+(?:car|model)|ferrari|lambo(?:rghini)?)\b/gi;
const COLOR_FAMILIES={red:'red',crimson:'red',scarlet:'red',maroon:'red',burgundy:'red',
orange:'orange',coral:'orange',peach:'orange',amber:'orange',yellow:'yellow',gold:'yellow',lime:'green',green:'green',emerald:'green',
olive:'green',mint:'green',teal:'cyan',turquoise:'cyan',cyan:'cyan',aqua:'cyan',blue:'blue',navy:'blue',azure:'blue',indigo:'blue',
purple:'purple',violet:'purple',lavender:'purple',lilac:'purple',pink:'pink',magenta:'pink',fuchsia:'pink',brown:'orange',grey:'neutral',
gray:'neutral',white:'neutral',black:'neutral',silver:'neutral',beige:'neutral',cream:'neutral'};
function hexFamily(hex){const n=parseInt(hex.slice(1),
16),r=(n>>16)&255,g=(n>>8)&255,b=n&255;const max=Math.max(r,g,b)/255,min=Math.min(r,g,b)/255,d=max-min;if(d<0.14)return'neutral';
let h;if(max===r/255)h=((g-b)/255)/d%6;else if(max===g/255)h=((b-r)/255)/d+2;else h=((r-g)/255)/d+4;h=(h*60+360)%360;return h<15||h>=345?'red':h<45?'orange':h<68?'yellow':h<165?'green':h<195?'cyan':h<255?'blue':h<295?'purple':'pink';
}
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,
ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function showToast(msg,type='info'){const container=byId('toastContainer');
if(!container)return;const toast=document.createElement('div');const colors={success:'bg-emerald-950 border-emerald-600 text-emerald-200',
error:'bg-red-950 border-red-600 text-red-200',info:'bg-blue-950 border-blue-600 text-blue-200'};toast.className=`px-4 py-3 rounded-lg shadow-2xl border text-xs font-bold flex items-center gap-2 animate-fadeIn ${colors[type]||colors.info}`;
toast.innerHTML=`<span></span>`;toast.querySelector('span').textContent=String(msg);container.appendChild(toast);setTimeout(()=>{toast.remove();
},3500);}
async function safeCopyToClipboard(text){if(!text)return false;try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);
return true;}}catch(e){}try{const textArea=document.createElement("textarea");textArea.value=text;textArea.style.position="fixed";
textArea.style.left="-999999px";document.body.appendChild(textArea);textArea.focus();textArea.select();const ok=document.execCommand('copy');
document.body.removeChild(textArea);return ok;}catch(e){return false;}}
function clearSimplePrompt(){const input=byId('simplePromptInput');
if(!input)return;input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();showToast('Simple Prompt cleared.',
'info');}
async function copySimplePrompt(btnEl){const input=byId('simplePromptInput');const text=input?.value||'';if(!text.trim()){showToast('Simple Prompt is empty.',
'info');input?.focus();return;}const ok=await safeCopyToClipboard(text);showToast(ok?'Simple Prompt copied.':'Copy failed. Please copy manually.',
ok?'success':'error');if(ok&&btnEl){const original=btnEl.innerHTML;btnEl.innerHTML=' Copied';setTimeout(()=>{if(!btnEl.isConnected)return;
btnEl.innerHTML=original;},1200);}}
async function executeDownloadManager({data,filename,mimeType}){if(!data){showToast('Download gagal: data kosong.',
'error');return false;}const sanitizedFilename=(filename||'export_file').replace(/[^a-zA-Z0-9._-]/g,'_');try{let blob;if(data instanceof Blob)blob=data;
else if(typeof data==='string'&&data.startsWith('data:image/'))blob=(await imageDataUrlToVerifiedBlob(data)).blob;else if(typeof data==='string'&&!data.startsWith('data:'))blob=new Blob([data],
{type:mimeType||'text/plain;charset=utf-8'});else throw new Error('Format data unduhan tidak dikenali.');if(blob.size===0)throw new Error('Ukuran file nol byte.');
if(/\.(?:jpe?g|png|webp)$/i.test(sanitizedFilename)){const verified=await verifiedImageBlob(blob);const expected=/\.png$/i.test(sanitizedFilename)?'image/png':/\.webp$/i.test(sanitizedFilename)?'image/webp':'image/jpeg';
if(verified.mimeType!==expected)throw new Error('Ekstensi file tidak sesuai isi gambar.');blob=verified.blob;}const url=URL.createObjectURL(blob);
const a=document.createElement('a');a.href=url;a.download=sanitizedFilename;a.style.display='none';document.body.appendChild(a);
a.click();showToast(`Download siap: ${sanitizedFilename}`,'success');setTimeout(()=>{a.remove();URL.revokeObjectURL(url);},5000);
return true;}catch(error){console.error('Download integrity error:',error);showToast('Gagal download: '+error.message,'error');
return false;}}
function calculateOpportunityScore(idea){const rubric={buyer:'Pembeli',use:'Kegunaan',difference:'Pembeda',
execution:'Kelayakan'};const breakdown={};const reasons=[];for(const[key,label]of Object.entries(rubric)){const part=idea.conceptReview?.[key];
if(!Number.isInteger(part?.points)||part.points<0||part.points>5||typeof part.reason!=='string'||!part.reason.trim()){return{totalScore:null,
breakdown:{},reasoning:'Belum ada penilaian konsep dengan rincian.'};}breakdown[key]=part.points;reasons.push(label+' '+part.points+'/5 — '+part.reason.trim());
}return{totalScore:Object.values(breakdown).reduce((sum,n)=>sum+n,0)*5,breakdown,reasoning:reasons.join(' · ')};}
function conceptBadge(idea){const score=calculateOpportunityScore(idea);
const caption=score.totalScore===null?'Ide · Belum dinilai':'Ide · '+score.totalScore+'/100';return`<details class="relative text-xs"><summary class="cursor-pointer rounded-full border border-emerald-800 px-2 text-emerald-400">${caption}</summary><div class="absolute right-0 top-full z-30 w-52 max-h-64 overflow-auto whitespace-normal rounded border border-slate-700 bg-slate-900 p-2 text-left text-slate-200">${score.totalScore===null?escapeHtml(score.reasoning):Object.entries({buyer:'Pembeli',
use:'Kegunaan',difference:'Pembeda',execution:'Kelayakan'}).map(([key,label])=>`<p class="mb-1"><strong>${label}·${score.breakdown[key]}/5</strong><br>${escapeHtml(idea.conceptReview[key].reason)}</p>`).join('')}</div></details>`;
}
document.addEventListener('DOMContentLoaded',()=>updateFloatingShortcut());
function updateFloatingShortcut(){
 const targets=[['sideTabIdeaStudio','idea_studio'],['sideTabLibrary','saved_ideas'],['sideTabCloudGallery','cloud_library']];
 for(const [id,tab] of targets){
  const button=byId(id);if(!button)continue;
  const active=state.activeTab===tab;
  button.classList.toggle('is-active',active);
  if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
  button.setAttribute('aria-pressed',String(active));
 }
 const count=byId('sideShortcutCount');
 if(count)count.textContent=String(Array.isArray(state.savedIdeas)?state.savedIdeas.length:0);
}
/* Hide the three-tab shortcut on downward scroll, restore on upward scroll. */
(function installFloatingShortcutScrollBehavior(){
 let lastDirectionY=Math.max(0,window.scrollY||0);
 let pending=false;
 function sync(){
  pending=false;
  const y=Math.max(0,window.scrollY||window.pageYOffset||0);
  const rail=byId('floatingSideTabs');
  if(!rail)return;
  const delta=y-lastDirectionY;
  if(y<=12){rail.classList.remove('is-hidden');lastDirectionY=y;}
  else if(delta>=12){rail.classList.add('is-hidden');lastDirectionY=y;}
  else if(delta<=-12){rail.classList.remove('is-hidden');lastDirectionY=y;}
 }
 window.addEventListener('scroll',()=>{
  if(pending)return;
  pending=true;
  window.requestAnimationFrame(sync);
 },{passive:true});
 window.addEventListener('resize',()=>{
  if(window.scrollY<=12)byId('floatingSideTabs')?.classList.remove('is-hidden');
 },{passive:true});
})();
function switchTab(tabId){
if(!['idea_studio','saved_ideas','meta_gen','cloud_library'].includes(tabId))return;
state.activeTab=tabId;document.querySelectorAll('.tab-section').forEach(el=>el.classList.add('hidden'));
const tabs=[
 {id:'idea_studio',button:'navTabIdeaStudioTop',gradient:'from-purple-600 to-blue-600 shadow-purple-600/30'},
 {id:'saved_ideas',button:'navTabSavedIdeasTop',gradient:'from-emerald-600 to-teal-600 shadow-emerald-600/30'},
 {id:'meta_gen',button:'navTabMetaGenTop',gradient:'from-fuchsia-600 to-violet-600 shadow-fuchsia-600/30'},
 {id:'cloud_library',button:'navTabCloudLibraryTop',gradient:'from-sky-600 to-cyan-600 shadow-sky-600/30'}
];
for(const tab of tabs){const btn=byId(tab.button);if(!btn)continue;const active=tab.id===tabId;
btn.className=active?`nav-tab active-tab flex-1 sm:flex-none px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 md:gap-2 bg-gradient-to-r ${tab.gradient} text-white shadow-lg`:'nav-tab flex-1 sm:flex-none px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 md:gap-2 text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800/60';
}
updateFloatingShortcut();
if(tabId==='idea_studio'){byId('tabSectionIdeaStudio')?.classList.remove('hidden');}
else if(tabId==='saved_ideas'){byId('tabSectionSavedIdeas')?.classList.remove('hidden');refreshStorageStatus();renderSavedIdeasGrid(null,true);}
else if(tabId==='meta_gen'){byId('tabSectionMetaGen')?.classList.remove('hidden');window.RIVIS_INIT_META_GEN?.();}
else if(tabId==='cloud_library'){byId('tabSectionCloudLibrary')?.classList.remove('hidden');window.RIVIS_CLOUD_INIT?.();}
window.scrollTo({top:0,behavior:'smooth'});
}
function updateBadges(){const count=state.savedIdeas.length;updateFloatingShortcut();document.querySelectorAll('.savedIdeasCountBadge').forEach(el=>{if(el.textContent!==String(count))el.textContent=count;
});const countEl=byId('savedIdeasCountBadge');if(countEl&&countEl.textContent!==String(count))countEl.textContent=count;}
function populateDropdowns(){renderSeasonalCalendarWidget();
const prompts=[{label:'Tropical Botanical',prompt:'Create an original premium tropical botanical vector illustration featuring an artfully balanced arrangement of monstera leaves, heliconia, and small exotic blooms. Use a distinctive editorial composition, a limited harmonious palette of deep jungle green, warm coral, and soft cream, crisp silhouettes, closed solid-color shapes, clean separable layers, and generous negative space. Make the design versatile for packaging, stationery, and modern lifestyle branding; no text, mockup, border, gradients, textures, watermark, or recognizable existing artwork.'},
{label:'Future Business',prompt:'Develop an original, commercially useful futuristic business concept illustration about connected teams, smart workflows, and responsible innovation. Build a clear visual story around a central modular hub linked to a few simple data and collaboration symbols; use a refined cobalt, teal, and pale-lime palette, deliberate hierarchy, geometric forms, and ample negative space. Keep it polished and distinctive rather than generic sci-fi, with flat 2D shapes, clean closed paths, and separated color regions suitable for SVG tracing; no text, logos, UI screenshot, glow, photorealism, or watermark.'},
{label:'Cute Animal Collection',prompt:'Design a cohesive original collection of four charming woodland animal characters—a red panda, otter, fox, and hedgehog—with friendly expressions and simple memorable silhouettes. Keep each character equally detailed, consistent in scale and stroke weight, and visually distinct, using a coordinated earthy pastel palette with small accent colors. Arrange them evenly as separate isolated assets with clean closed shapes and minimal interior details for easy SVG conversion and use in stickers, children’s products, and educational materials; no text, shadows, scenery, logos, gradients, or imitation of known characters.'},
{label:'Abstract Geometry',prompt:'Create an original premium abstract geometric background for contemporary business presentations, web banners, and editorial layouts. Combine a small number of interlocking arcs, rounded blocks, circles, and confident diagonal forms into an asymmetrical but balanced composition, with clear focal hierarchy and generous usable negative space. Use a sophisticated palette of midnight navy, muted lavender, and warm amber; keep edges crisp, shapes closed, colors flat, and overlaps intentional for clean SVG conversion. No text, gradients, noise, 3D effects, mockup, logo, or watermark.'},
{label:'Finance App Icons',prompt:'Create an original, production-ready set of eight minimal finance app icons for budgeting, savings, payments, analytics, cards, transfers, security, and investment growth. Use one consistent geometric grid, matching corner radii, uniform stroke weight, simple recognizable metaphors, and a restrained navy, emerald, and mint palette. Make every icon distinct, centered, optically balanced, and isolated with consistent spacing; prefer closed shapes and a small number of clean paths for easy SVG conversion and interface use. No letters, numbers, currency symbols tied to a specific brand, tiny details, gradients, shadows, mockup, or watermark.'}];
const qpContainer=byId('quickPromptContainer');if(qpContainer){qpContainer.innerHTML=prompts.map((item,i)=>`<button type="button" data-booster-prompt="${i}" title="Use ${item.label} booster prompt" class="text-[10px] bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-purple-300 border border-slate-800 px-2 py-1 rounded transition-colors">+ ${item.label}</button>`).join('');
qpContainer.querySelectorAll('[data-booster-prompt]').forEach(btn=>{btn.dataset.presetConcept=prompts[Number(btn.dataset.boosterPrompt)].prompt;
btn.addEventListener('click',()=>{const item=prompts[Number(btn.dataset.boosterPrompt)];const input=byId('simplePromptInput');
if(input&&item){input.value=item.prompt;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();}});});}const refSelect=byId('refModeSelect');
if(refSelect)refSelect.innerHTML=REFERENCE_MODES.map(m=>`<option value="${m.id}">${m.name}</option>`).join('');const catSelect=byId('stockCategorySelect');
if(catSelect){catSelect.innerHTML=STOCK_CATEGORIES.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');catSelect.value='custom';
handleCategoryChange('custom');}const purposeSel=byId('commercialPurposeSelect');if(purposeSel)purposeSel.innerHTML=COMMERCIAL_PURPOSES.map(p=>'<option value="'+escapeHtml(p)+'">'+escapeHtml(p)+'</option>').join('');
const paletteSel=byId('colorPaletteSelect');if(paletteSel){paletteSel.innerHTML='<option value="__auto__">Auto · Match artwork / reference</option>'+Object.entries(PALETTE_GROUPS).map(([group,names])=>'<optgroup label="'+escapeHtml(group)+'">'+names.map(name=>'<option value="'+escapeHtml(name)+'">'+escapeHtml(name)+'</option>').join('')+'</optgroup>').join('')+'<option value="Custom Palette">Custom Palette · HEX Manual</option>';paletteSel.value='__auto__';handlePaletteChange('__auto__');}
const compSel=byId('compositionSelect');if(compSel)compSel.innerHTML=COMPOSITIONS.map(c=>'<option value="'+escapeHtml(c)+'">'+escapeHtml(c)+'</option>').join('');
const subSelect=byId('stockSubcategorySelect');if(subSelect)subSelect.onchange=()=>handleSubcategoryChange(subSelect.value);
syncCreativeOptionsForMode(state.outputMode||'vector');
const sizeSelect=byId('ideaStudioSizeSelect');if(sizeSelect)sizeSelect.innerHTML=IDEA_STUDIO_SIZES.map(s=>`<option value="${s.id}">${s.label}</option>`).join('');
updateBadges();}
function parseManualPaletteHex(text){const colors=[...new Set((String(text||'').match(/#[0-9A-Fa-f]{6}\b/g)||[]).map(c=>c.toUpperCase()))];
return colors.slice(0,8);}
function handleCustomPaletteHexInput(value){const colors=parseManualPaletteHex(value);const custom=byId('colorPaletteSelect')?.value==='Custom Palette';
const hint=byId('customPaletteHint');const preview=byId('customPaletteSwatches');state.manualPaletteHex=colors.length>=3?colors:[];
if(custom&&state.paletteMode==='manual'){state.selectedPalette=state.manualPaletteHex.length?'Custom Palette: '+state.manualPaletteHex.join(', '):'Custom Palette';
}if(preview){preview.replaceChildren();preview.classList.toggle('hidden',colors.length===0);colors.forEach(color=>{const chip=document.createElement('span');
chip.className='flex-1 min-w-0';chip.style.backgroundColor=color;chip.title=color;preview.appendChild(chip);});}if(hint){hint.textContent=!String(value||'').trim()?'Kosong = AI memilih warna yang sesuai dengan konsep.':colors.length>=3?'Palet manual siap: '+colors.length+' warna HEX.':'Gunakan minimal 3 kode HEX valid (#RRGGBB); sebelum lengkap, AI memilih warna otomatis.';
hint.classList.toggle('text-amber-300',Boolean(String(value||'').trim())&&colors.length<3);}}
function handlePaletteChange(value){const chosen=value||byId('colorPaletteSelect')?.value||'__auto__';
state.paletteMode=chosen==='__auto__'?'auto':'manual';const custom=chosen==='Custom Palette';const customEditor=byId('customPaletteEditor');
if(customEditor)customEditor.classList.toggle('hidden',!custom);if(custom){handleCustomPaletteHexInput(byId('customPaletteHexInput')?.value||'');
}else{const mapped=paletteHexForSelection(chosen);state.manualPaletteHex=state.paletteMode==='manual'?(mapped.length?mapped:parseManualPaletteHex(chosen)):[];
state.selectedPalette=state.paletteMode==='manual'?(mapped.length?chosen+' ('+mapped.join(', ')+')':chosen):'__auto__';
}}
function setPaletteByName(name){const select=byId('colorPaletteSelect');if(!select||typeof name!=='string'||!name.trim())return;
const aliases={'Vibrant Colors':'Vibrant Editorial','Natural Green':'Soft Botanical','Pastel':'Playful Pastel','Dark':'Modern Neutral','Vintage':'Muted Vintage','Retro':'Retro Mid-Century','Cold':'Cool Ocean','Blue & Indigo':'Corporate Blue','Neutral Minimalist':'Modern Neutral','Black & White':'Monochrome','Patterns':'Retro Mid-Century'};
const normalized=name.trim(),target=aliases[normalized]||normalized;
if(!Array.from(select.options).some(o=>o.value===target)){const extracted=parseManualPaletteHex(target);if(extracted.length>=3){const input=byId('customPaletteHexInput');if(input)input.value=extracted.join(', ');select.value='Custom Palette';handlePaletteChange('Custom Palette');return;}
select.value='__auto__';handlePaletteChange('__auto__');return;}
select.value=target;handlePaletteChange(target);}
function setInnerProgress(btn,percent,estimated=false){if(!btn)return;const pct=Math.max(0,
Math.min(100,Math.round(percent)));btn.classList.add('inner-progress');btn.style.setProperty('--fill',pct+'%');btn.dataset.progress=(estimated&&pct<100?'~':'')+pct+'%';
btn.setAttribute('aria-busy',pct<100?'true':'false');}
function clearInnerProgress(btn){if(!btn)return;btn.classList.remove('inner-progress');
btn.style.removeProperty('--fill');delete btn.dataset.progress;btn.removeAttribute('aria-busy');}
function handleCategoryChange(catId){
const cat=categoryForId(catId),subSelect=byId('stockSubcategorySelect'),customCatInput=byId('customCategoryInput'),customSubInput=byId('customSubcategoryInput');
state.selectedCategory=cat;const custom=cat?.id==='custom';if(customCatInput)customCatInput.classList.toggle('hidden',!custom);
if(customSubInput)customSubInput.classList.toggle('hidden',!custom);
if(subSelect){subSelect.classList.toggle('hidden',custom);if(custom){subSelect.innerHTML='';subSelect.value='';state.selectedSubcategory='';}
else{subSelect.innerHTML='<option value="">— Pilih subkategori (opsional) —</option>'+(cat?cat.subcategories.map(s=>'<option value="'+escapeHtml(s)+'">'+escapeHtml(s)+'</option>').join(''):'')+'<option value="__custom__">+ Subkategori lain…</option>';
subSelect.value='';state.selectedSubcategory='';}}
}
function handleSubcategoryChange(value){const selected=String(value||'');state.selectedSubcategory=selected;const input=byId('customSubcategoryInput');
const isCustom=selected==='__custom__'||byId('stockCategorySelect')?.value==='custom';if(input)input.classList.toggle('hidden',!isCustom);
if(selected==='__custom__'&&input)input.focus();}
const AUTO_PROMPT_HISTORY_KEY='richVector.autoPromptHistory.v1';
let autoPromptHistory=(()=>{try{const entries=JSON.parse(safeStorageGet(AUTO_PROMPT_HISTORY_KEY,'[]'));return Array.isArray(entries)?entries.filter(x=>x&&typeof x.prompt==='string').slice(-30):[];
}catch(_){return[];}})();
const OFFLINE_PROMPT_LENSES={
 business:['a customer onboarding journey from request to confirmed service','a small business workflow connecting orders with inventory','a financial planning interaction with a clear action and outcome'],
 tech:['a privacy-first exchange between connected devices','an AI workflow that requires a clear human review step','a robotics process solving an operational problem'],
 people:['an everyday lifestyle moment with meaningful human interaction','a creative self-expression activity grounded in a physical scene','an inclusive community action with natural gestures'],
 health:['a preventive healthcare routine with one clear action','an accessible wellbeing tool used in everyday life','a nutrition or recovery journey depicted with useful objects'],
 food:['an ingredient journey from preparation to serving','a specific craft or beverage ritual with recognizable equipment','a freshness and storage task with a useful visual arrangement'],
 animals:['a species-specific behavior in a plausible habitat','a pet care activity featuring one relevant accessory','a conservation moment revealing an ecological relationship'],
 nature:['a plant life cycle with clearly different growth stages','a habitat scene showing one ecological interaction','an environmental improvement activity with a visible benefit'],
 edu:['a hands-on classroom experiment showing cause and effect','a tactile or accessible learning resource in use','a learning activity with separated visual stages'],
 travel:['a traveler navigating an unfamiliar destination with a practical aid','an arrival and local mobility journey with a recognizable context','a hospitality experience meeting a specific visitor need'],
 home:['a home organization solution with functional grouped objects','a DIY repair with recognizable tools and materials','an interior detail connecting utility and aesthetics'],
 industry:['a production process showing a meaningful quality checkpoint','a warehouse or logistics handoff from one stage to another','an infrastructure system with identifiable operating components'],
 arts:['an artistic craft process with tools and distinct outcomes','a musical performance moment with clear spatial relationships','a cultural practice represented through appropriate original objects'],
 sports:['a sport-specific movement with believable equipment','a recreational activity with a clear preparation and action','a team strategy moment with defined body positions'],
 seasonal:['a neighborhood preparing decorations for a celebration','an assembly task for a reusable seasonal craft','a practical seasonal service for a specific audience'],
 abstract:['broad interlocking geometric forms with deliberate hierarchy','an organic visual rhythm with controlled negative space','a repeat-friendly motif with an original structural relationship'],
 custom:['a practical problem and a clear visual solution','a meaningful interaction between two relevant elements','an overlooked user need represented by a simple visual metaphor']
};
const offlinePromptCursors=new Map();
const OFFLINE_PRESET_SUBJECTS=['renewable energy generation through solar panels and wind turbines',
'tropical monstera and palm leaves with clearly differentiated silhouettes','a business team analyzing cloud data growth at a shared desk',
'artisanal coffee roasting with coffee beans and leaves','flowing organic waves with a clear structural rhythm'];
const RASTER_MODES=Object.freeze({photo:'Clean Commercial Photography',editorial:'Editorial Lifestyle Photography',advertising:'Premium Advertising Photography',
'3d':'Premium 3D Commercial Render'});
const RASTER_PRESETS={lab:{mode:'photo',prompt:'Original scene of a multidisciplinary research team conducting a precise experiment in a contemporary biomedical laboratory, with a foreground scientist manipulating samples and colleagues collaborating at different depths.',
people:'small',shot:'environmental',lighting:'cinematic',color:'natural',authenticity:'documentary',copySpace:'right'},community:{mode:'photo',
prompt:'Original candid group portrait of adults from diverse backgrounds joining a local community volunteer event, authentic warm smiles and genuine relaxed interactions, a clear shared purpose.',
people:'large',shot:'environmental',lighting:'natural',color:'warm',authenticity:'candid',copySpace:'auto'},fashion:{mode:'editorial',
prompt:'Original energetic fashion lifestyle portrait of an expressive adult creative in an architectural color-block playground, confident styling and immersive selfie-like perspective, bold modern color relationships.',
people:'one',shot:'dynamic',lighting:'highkey',color:'colorpop',authenticity:'editorial',copySpace:'none'}};
function getOutputMode(){const value=byId('outputModeSelect')?.value||state.outputMode||'vector';
return Object.hasOwn(RASTER_MODES,value)?value:'vector';}
function ideaOutputMode(idea){const v=idea?.outputMode;if(v==='vector'||Object.hasOwn(RASTER_MODES,
v))return v;return/3d|render/i.test(idea?.suggestedAssetType||'')?'3d':/photograph/i.test(idea?.suggestedAssetType||'')?'photo':'vector';
}
function isRasterIdea(idea){return ideaOutputMode(idea)!=='vector';}
function rasterSnapshot(idea){return{people:'auto',
shot:'auto',lighting:'auto',color:'auto',authenticity:'candid',copySpace:'auto',format:'jpg',jpegQuality:0.95,...(idea?.rasterSettings||{})};
}
function saveRasterOutputPreferences(){const data=readRasterSettings();safeStorageSet(STORAGE_KEYS.RASTER_PREFS,JSON.stringify(data));
}
const studioModeRatios={vector:'1:1',raster:'16:9'};
function handleOutputModeChange(mode){
 const previous=state.outputMode;if(previous==='vector')state.vectorSvgPreference=byId('svgFriendlyCheckbox')?.checked!==false;
 const chosen=Object.prototype.hasOwnProperty.call(RASTER_MODES,mode)?mode:'vector';const el=byId('outputModeSelect');if(el)el.value=chosen;state.outputMode=chosen;
 syncCreativeOptionsForMode(chosen);safeStorageSet(STORAGE_KEYS.OUTPUT_MODE,chosen);const raster=chosen!=='vector';
 byId('rasterControls')?.classList.toggle('hidden',!raster);const hint=byId('outputModeHint');
 if(hint)hint.textContent=raster?(chosen==='3d'?'Original 3D commercial scenes':'Photography with relevant asset types'):'Clean vector-friendly art';
 const svgLabel=byId('svgFriendlyCheckbox')?.closest('label');if(svgLabel)svgLabel.classList.toggle('hidden',raster);
 const gradientLabel=byId('gradientColorCheckbox')?.closest('label');if(gradientLabel)gradientLabel.classList.toggle('hidden',raster);
 const collection=byId('prodTypeCollectionBtn');if(collection)collection.classList.toggle('hidden',raster);const seriesBtn=byId('prodTypeSeriesBtn');if(seriesBtn)seriesBtn.classList.remove('hidden');
 const select=byId('assetTypeSelect');if(raster){if(state.productionType==='collection')setProductionType('single');else setProductionType(state.productionType==='series'?'series':'single');state.svgFriendly=false;const svg=byId('svgFriendlyCheckbox');if(svg)svg.checked=false;
 if(select){const chosenAsset=ASSET_TYPES_BY_MODE[chosen].includes(select.value)?select.value:getDefaultAssetTypeForMode(chosen);select.value=chosenAsset;state.selectedAssetType=chosenAsset;}
 if(chosen==='editorial'){byId('rasterColorSelect').value='colorpop';byId('rasterAuthenticitySelect').value='editorial';}
 else if(chosen==='advertising'){byId('rasterAuthenticitySelect').value='polished';}else if(chosen==='photo'){byId('rasterAuthenticitySelect').value='candid';}
 }else{const svg=byId('svgFriendlyCheckbox');if(svg)svg.checked=state.vectorSvgPreference!==false;
 state.svgFriendly=state.vectorSvgPreference!==false;if(select){if(!ASSET_TYPES_BY_MODE.vector.includes(select.value))select.value='Vector Illustration';state.selectedAssetType=select.value;}}
 const ratio=studioModeRatios[raster?'raster':'vector'];const ratioSelect=byId('ideaStudioSizeSelect');
 if(ratioSelect){ratioSelect.value=ratio;handleIdeaSizeChange(ratio);}syncModeResolution(chosen);updateRatioHint();
}
function applyRasterScenePreset(name){const p=RASTER_PRESETS[name];
if(!p)return;handleOutputModeChange(p.mode);const el=byId('simplePromptInput');if(el){el.value=p.prompt;el.dispatchEvent(new Event('input',
{bubbles:true}));}for(const[key,value]of Object.entries(p)){const id={people:'rasterPeopleSelect',shot:'rasterShotSelect',lighting:'rasterLightingSelect',
color:'rasterColorSelect',authenticity:'rasterAuthenticitySelect',copySpace:'rasterCopySpaceSelect'}[key];if(id&&byId(id))byId(id).value=value;
}saveRasterOutputPreferences();showToast('Raster scene preset diterapkan. Klik Discover Ideas untuk variasi orisinal.','success');
}
const HYBRID_BLUEPRINT_SCHEMA=1;
const HYBRID_MODE_LABELS={vector:'Vector illustration',photo:'Clean commercial photography',
editorial:'Editorial lifestyle photography',advertising:'Premium advertising photography','3d':'Commercial 3D render'};
function hybridText(value,
max=1800){return String(value??'').replace(/\s+/g,' ').trim().slice(0,max);}
function hybridBrief(value,mode){let t=cleanImagePrompt(String(value||'')).replace(/(?:^|\n)\s*(?:COLOR PALETTE PRIORITY|COMMERCIAL BRIEF PRIORITY):[^\n]*/gi,
' ').replace(/\s+/g,' ').trim();if(mode!=='vector'){t=t.replace(/\b(?:SVG-friendly|easy to trace as SVG|closed (?:vector )?paths|clean Bézier paths|flat vector|clipart|icon pack|sticker sheet)\b/gi,
'').replace(/\s{2,}/g,' ').trim();}return t.slice(0,2300);}
function hybridGuardPanel(idea){const checks=hybridConflictChecks(idea);const n=checks.filter(c=>c.ok).length;return`<details class="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-[10px]"><summary class="cursor-pointer font-bold ${n===5?'text-emerald-400':'text-amber-400'}">Hybrid Prompt Guard (${n}/5)</summary><div class="space-y-1 pt-2">${checks.map(c=>`<p class="${c.ok?'text-slate-300':'text-amber-300'}">${c.ok?'✓':'!'} ${escapeHtml(c.label)} — ${escapeHtml(c.detail)}</p>`).join('')}</div><p class="text-slate-500 mt-2">Audit instruksi sebelum gambar dibuat; bukan jaminan hasil atau penerimaan microstock.</p></details>`;
}
function hybridAddDistinct(parts,text,existing){const cleaned=hybridText(text,400);if(cleaned&&cleaned.toLowerCase()!=='auto'&&!existing.toLowerCase().includes(cleaned.toLowerCase())){parts.push(cleaned.replace(/[.!?\s]+$/,
'')+'.');}}
function cardPromptEditor(idea,location){const code=escapeHtml(idea.ideaId);const isLib=location==='library';
const updating=isLib&&activeCardUpdates.has(idea.ideaId);
// Library cards without an image show the prompt by default; after image generation it collapses.
// Manual open/close choices remain respected until the next successful image generation.
const promptOpen=isLib&&(openPromptAccordions.has(idea.ideaId)||(!idea.generatedImageUrl&&!closedPromptAccordions.has(idea.ideaId)));
const disclosureStart=isLib?`<details class="rounded-lg border border-purple-900/50 bg-slate-900/60 text-[10px]" ontoggle="trackLibraryAccordion(this,'prompt','${code}')" ${promptOpen?'open':''}><summary class="cursor-pointer select-none px-2.5 py-2 text-purple-300 font-bold">Visual Prompt <span class="text-slate-500 font-normal">· klik untuk membuka</span></summary><div class="px-2 pb-2.5">`:'';
return`${disclosureStart}<div data-card-prompt="${location}" data-idea-id="${code}" class="p-2.5 rounded-lg border border-purple-900/50 bg-slate-900/60 space-y-2 text-[10px]"> <textarea data-role="visual" rows="4" maxlength="10000" spellcheck="true" aria-label="Visual Prompt" ${updating?'disabled':''} oninput="handleCardPromptInput(this)" class="w-full min-w-0 bg-slate-950 border border-slate-700 rounded p-2.5 text-[11px] text-slate-200 font-mono resize-y outline-none focus:border-purple-500 leading-relaxed">${escapeHtml(idea.finalGenerationPrompt||'')}</textarea> <div class="card-prompt-actions"> <button type="button" onclick="toggleCardBlueprint(this)" class="card-blueprint-pill" title="Buka atau tutup JSON Blueprint yang tersinkron otomatis." aria-label="Lihat JSON Blueprint"><span class="truncate">JSON Blueprint</span></button> <div class="card-prompt-btns"> <button type="button" onclick="copyCardPrompt(this)" title="Salin Visual Prompt kartu ini." class="card-prompt-btn bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"> Copy</button>
        ${isLib?`<button type="button" onclick="generateFromCardPrompt(this)" ${updating?'disabled':''} title="Generate ulang gambar dan metadata dari Visual Prompt terbaru." class="card-prompt-btn bg-gradient-to-r from-purple-600 to-blue-600 text-white disabled:opacity-60"> ${updating?'Updating…':'Update'}</button>`:`<button type="button" onclick="saveIdeaToLibrary('${code}',this)" title="Simpan konsep ini ke Library" class="card-prompt-btn bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm">Save</button>`}
      </div> </div> <div data-role="blueprint-wrap" class="card-blueprint-panel hidden">  <pre data-role="blueprint" aria-label="JSON Blueprint hanya baca" class="mt-2 rounded bg-slate-950 border border-slate-800 p-2 text-[10px] leading-relaxed text-slate-300 whitespace-pre-wrap break-words select-text"></pre> </div> <p data-card-prompt-status class="${idea.imagePromptOutdated||idea.metadataOutdated?'':'hidden'} text-[10px] text-amber-300" aria-live="polite">${idea.imagePromptOutdated||idea.metadataOutdated?'Prompt berubah — klik Update untuk menyelaraskan gambar dan metadata.':''}</p> </div>${isLib?'</div></details>':''}`;
}
function toggleCardBlueprint(btn){const root=btn?.closest('[data-card-prompt]');const panel=root?.querySelector('[data-role="blueprint-wrap"]');
if(panel){const opened=panel.classList.toggle('hidden')===false;if(opened){const idea=cardPromptIdea(root);const pre=panel.querySelector('[data-role="blueprint"]');
if(pre&&idea)pre.textContent=readonlyBlueprintText(idea);}}}
const cardPromptSaveTimers=new Map();
function cardPromptIdea(root){if(!root)return null;
const id=root.dataset.ideaId;const collection=root.dataset.cardPrompt==='discover'?state.discoveredIdeas:state.savedIdeas;return collection.find(item=>item.ideaId===id)||null;
}
function handleCardPromptInput(textarea){const root=textarea?.closest('[data-card-prompt]'),idea=cardPromptIdea(root);if(!idea)return false;
const next=textarea.value,old=idea.finalGenerationPrompt||'';if(next!==old){idea.finalGenerationPrompt=next;idea.promptManualOverride=true;
idea.hybridInitialized=true;syncConceptBlueprintFromVisual(idea,true);markPromptChanged(idea,old);if(root.dataset.cardPrompt==='library'){clearTimeout(cardPromptSaveTimers.get(idea.ideaId));
cardPromptSaveTimers.set(idea.ideaId,setTimeout(()=>{cardPromptSaveTimers.delete(idea.ideaId);if(state.savedIdeas.includes(idea))persistSavedIdeas();
},700));}}const blueprintEl=root.querySelector('[data-role="blueprint"]');if(blueprintEl&&!blueprintEl.closest('[data-role="blueprint-wrap"]')?.classList.contains('hidden'))blueprintEl.textContent=readonlyBlueprintText(idea);
const status=root.querySelector('[data-card-prompt-status]');if(status){const hasIpRisk=scanIpRisk(next).length>0;status.textContent=!next.trim()?'Prompt kosong. Isi teks sebelum generate.':hasIpRisk?'Periksa istilah merek/karakter pada prompt sebelum generate.':idea.generatedImageUrl?'Prompt berubah — klik Update untuk gambar dan metadata baru.':'Prompt siap digunakan untuk generate.';
status.classList.toggle('text-amber-300',!next.trim()||hasIpRisk);}return true;}
async function copyCardPrompt(btn){const root=btn?.closest('[data-card-prompt]');
const txt=root?.querySelector('[data-role="visual"]')?.value||'';const ok=await safeCopyToClipboard(txt);if(!ok)showToast('Prompt kosong atau gagal disalin.',
'error');else showToast('Prompt copied.','success');}
function markPromptChanged(idea,previousPrompt){if(previousPrompt!==idea.finalGenerationPrompt){idea.imagePromptOutdated=Boolean(idea.generatedImageUrl);
idea.metadataOutdated=Boolean(idea.metadata);if(idea.productionType==='collection'){idea.collectionItems=undefined;idea.collectionCheck=null;}}}
function sniffImageMime(bytes){if(bytes.length>=3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return'image/jpeg';
if(bytes.length>=8&&bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71&&bytes[4]===13&&bytes[5]===10&&bytes[6]===26&&bytes[7]===10)return'image/png';
if(bytes.length>=12&&bytes[0]===82&&bytes[1]===73&&bytes[2]===70&&bytes[3]===70&&bytes[8]===87&&bytes[9]===69&&bytes[10]===66&&bytes[11]===80)return'image/webp';
return null;}
async function verifiedImageBlob(blob,level=0){if(!(blob instanceof Blob)||blob.size<32)throw new Error('Data gambar tidak lengkap atau kosong.');
const header=new Uint8Array(await blob.slice(0,80).arrayBuffer());const mime=sniffImageMime(header);if(mime)return{blob:blob.type===mime?blob:blob.slice(0,
blob.size,mime),mimeType:mime};const prefix=new TextDecoder('ascii').decode(header);if(level<2&&/^data:image\/(?:jpeg|png|webp);base64,/i.test(prefix)){const nested=await blob.text();
return imageDataUrlToVerifiedBlob(nested,level+1);}throw new Error('File gambar tidak valid: header JPEG/PNG/WebP tidak ditemukan. Ekspor dihentikan agar tidak menghasilkan file rusak.');
}
async function imageDataUrlToVerifiedBlob(value,level=0){if(typeof value!=='string'||!/^data:image\/(?:jpeg|png|webp);base64,[a-zA-Z0-9+/=\s]+$/i.test(value)){throw new Error('Data URL gambar tidak valid atau Base64 tidak lengkap.');
}const response=await fetch(value);if(!response.ok)throw new Error('Gagal mengubah data gambar ke format biner.');return verifiedImageBlob(await response.blob(),
level);}
async function getExportedAsset(idea){if(!idea?.generatedImageUrl)throw new Error('Gambar belum tersedia.');const mode=ideaOutputMode(idea),
p=rasterSnapshot(idea);const format=mode==='vector'?'png':(p.format==='png'?'png':'jpg');const mime=format==='jpg'?'image/jpeg':'image/png';
const filename=`${getCardBaseFilename(idea)}.${format}`;const original=await imageDataUrlToVerifiedBlob(idea.generatedImageUrl);
if(original.mimeType===mime)return{filename,mimeType:mime,data:original.blob};const source=URL.createObjectURL(original.blob);
let canvas=null,img=null;try{img=new Image();img.src=source;await img.decode();if(!img.naturalWidth||!img.naturalHeight)throw new Error('Resolusi gambar tidak terbaca.');
canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;const ctx=canvas.getContext('2d',
{alpha:format!=='jpg'});if(!ctx)throw new Error('Browser tidak dapat menyiapkan canvas ekspor.');if(format==='jpg'){ctx.fillStyle='#fff';
ctx.fillRect(0,0,canvas.width,canvas.height);}ctx.drawImage(img,0,0);const quality=Number.isFinite(p.jpegQuality)?Math.max(0.7,
Math.min(1,p.jpegQuality)):0.95;const converted=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Gagal konversi gambar.')),
mime,quality));const checked=await verifiedImageBlob(converted);if(checked.mimeType!==mime)throw new Error('Browser menghasilkan tipe gambar yang salah.');
return{filename,mimeType:mime,data:checked.blob};}finally{if(canvas){canvas.width=0;canvas.height=0;}if(img){img.src='';img.removeAttribute('src');}URL.revokeObjectURL(source);
}}
function toggleAutoSelectBest(val){state.autoSelectBest=val;const ctrls=byId('creativeDirectionControls');if(ctrls){if(val)ctrls.classList.add('hidden');
else ctrls.classList.remove('hidden');}}
function handleIdeaSizeChange(val){state.ideaStudioSizeId=val;studioModeRatios[getOutputMode()==='vector'?'vector':'raster']=val;
const box=byId('customSizeDimensionsBox');if(box){if(val==='custom')box.classList.remove('hidden');else box.classList.add('hidden');
}}
const MODE_RESOLUTION_KEYS={vector:'rvis_vector_image_resolution_v1',raster:'rvis_raster_image_resolution_v1'};
function loadModeResolution(mode){const raster=mode!=='vector';const key=MODE_RESOLUTION_KEYS[raster?'raster':'vector'];const fallback=raster?'4K':'1K';return validImageResolution(safeStorageGet(key,fallback));}
function syncModeResolution(mode){const resolution=loadModeResolution(mode);state.imageResolution=resolution;const control=byId('imageResolutionSelect');if(control)control.value=resolution;}
function handleImageResolutionChange(value){state.imageResolution=validImageResolution(value);const mode=getOutputMode();safeStorageSet(MODE_RESOLUTION_KEYS[mode==='vector'?'vector':'raster'],state.imageResolution);if(mode!=='vector')safeStorageSet(STORAGE_KEYS.IMAGE_RESOLUTION,state.imageResolution);updateRatioHint();}
const PRODUCTION_BUTTON_ACTIVE="p-2.5 rounded-lg border text-left transition-all flex flex-col gap-1 bg-purple-600/20 border-purple-500 text-white shadow";
const PRODUCTION_BUTTON_IDLE="p-2.5 rounded-lg border text-left transition-all flex flex-col gap-1 bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700";
function setProductionType(type){const allowed=['single','collection','series'];type=allowed.includes(type)?type:'single';if(getOutputMode()!=='vector'&&type==='collection')type='single';state.productionType=type;
for(const [id,key] of [['prodTypeSingleBtn','single'],['prodTypeCollectionBtn','collection'],['prodTypeSeriesBtn','series']]){const btn=byId(id);if(btn){const hidden=key==='collection'&&getOutputMode()!=='vector';btn.className=(type===key?PRODUCTION_BUTTON_ACTIVE:PRODUCTION_BUTTON_IDLE)+(hidden?' hidden':'');}}
byId('collectionItemCountBox')?.classList.toggle('hidden',type!=='collection');byId('seriesLengthBox')?.classList.toggle('hidden',type!=='series');updateSeriesEstimate();if(type==='series')renderSeriesManualInputs();}
function currentSeriesLength(){const select=byId('seriesLengthSelect')?.value||String(state.seriesLength||5);const custom=select==='custom';const raw=custom?byId('seriesLengthCustomInput')?.value:select;const n=Number(raw);return Number.isInteger(n)&&n>=2&&n<=12?n:5;}
function setSeriesLength(value){const custom=value==='custom';const customInput=byId('seriesLengthCustomInput');if(customInput)customInput.classList.toggle('hidden',!custom);const n=custom?Number(customInput?.value):Number(value);if(Number.isInteger(n)&&n>=2&&n<=12)state.seriesLength=n;updateSeriesEstimate();renderSeriesManualInputs();}
function currentSeriesCreationMode(){return byId('seriesCreationModeSelect')?.value==='manual'?'manual':'auto';}
function currentManualSeriesScenes(){const n=currentSeriesLength();return Array.from({length:n},(_,i)=>String(state.seriesManualScenes?.[i]||'').trim().slice(0,1600));}
function setSeriesCreationMode(value){const mode=value==='manual'?'manual':'auto';state.seriesCreationMode=mode;
 const select=byId('seriesCreationModeSelect');if(select)select.value=mode;
 byId('seriesManualSceneBox')?.classList.toggle('hidden',mode!=='manual');
 safeStorageSet('rvis_series_creation_mode_v1',mode);renderSeriesManualInputs();}
function setSeriesManualScene(index,value){if(!Number.isInteger(index)||index<0||index>=12)return;
 if(!Array.isArray(state.seriesManualScenes))state.seriesManualScenes=[];
 state.seriesManualScenes[index]=String(value||'').slice(0,1600);
 safeStorageSet('rvis_series_manual_directions_v1',JSON.stringify(state.seriesManualScenes.slice(0,12)));
}
function renderSeriesManualInputs(){const wrap=byId('seriesManualSceneList');if(!wrap)return;
 const mode=currentSeriesCreationMode();byId('seriesManualSceneBox')?.classList.toggle('hidden',mode!=='manual');
 if(mode!=='manual')return;const n=currentSeriesLength();const values=state.seriesManualScenes||[];
 wrap.replaceChildren();for(let i=0;i<n;i++){const label=document.createElement('label');label.className='block space-y-1';
 const title=document.createElement('span');title.className='block text-[10px] font-bold text-slate-300';title.textContent='Scene '+String(i+1).padStart(2,'0');
 const area=document.createElement('textarea');area.rows=2;area.maxLength=1600;area.id='seriesManualSceneInput'+i;
 area.dataset.seriesSceneIndex=String(i);area.className='w-full resize-y min-h-[56px] bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white outline-none focus:border-cyan-500';
 area.placeholder=i===0?'Contoh: Karakter memasuki studio dan meletakkan tas di meja':i===1?'Contoh: Karakter berdiskusi dengan rekannya sambil menunjuk sketsa':'Jelaskan aksi, interaksi, dan momen khusus scene ini…';
 area.value=String(values[i]||'');area.addEventListener('input',()=>setSeriesManualScene(i,area.value));
 label.append(title,area);wrap.appendChild(label);}}
function setSeriesAutomationOption(name,value){if(name==='continuity')state.seriesContinuityLock=Boolean(value);else if(name==='anchor')state.seriesAnchorReference=Boolean(value);else if(name==='autoGenerate')state.seriesAutoGenerate=Boolean(value);try{safeStorageSet('rvis_series_automation_v1',JSON.stringify({continuity:state.seriesContinuityLock,anchor:state.seriesAnchorReference,autoGenerate:state.seriesAutoGenerate}));}catch(_){} }
function updateSeriesEstimate(){const label=byId('seriesEstimateText');if(!label)return;const ideas=Math.max(1,Number(byId('ideaCountSelect')?.value)||5),scenes=currentSeriesLength(),total=ideas*scenes;state.seriesLength=scenes;label.textContent=`${ideas} ${ideas===1?'idea':'ideas'} × ${scenes} scenes = ${total} images planned`;label.classList.toggle('text-amber-300',total>40);label.classList.toggle('text-cyan-200',total<=40);}

function setGradientEnabled(enabled){state.gradientEnabled=Boolean(enabled);safeStorageSet(STORAGE_KEYS.GRADIENT_ENABLED,
String(state.gradientEnabled));}
function setDiscoverBarCollapsed(collapsed){const bar=byId('ideaDiscoverActionBar');const toggle=byId('discoverBarToggleBtn');
if(!bar||!toggle)return;bar.classList.add('is-ready');bar.classList.toggle('is-compact',Boolean(collapsed));document.body.classList.toggle('discover-mini-active',
Boolean(collapsed));const text=collapsed?'Buka panel Discover Ideas':'Sembunyikan panel Discover Ideas';toggle.title=text;toggle.setAttribute('aria-label',
text);toggle.setAttribute('aria-expanded',String(!collapsed));toggle.innerHTML=collapsed?'<svg aria-hidden="true" class="rivis-icon w-5 h-5"><use href="#rivis-sparkles"></use></svg>':'<span aria-hidden="true" class="text-xl">−</span>';
}
function toggleDiscoverActionBar(){const bar=byId('ideaDiscoverActionBar');if(bar)setDiscoverBarCollapsed(!bar.classList.contains('is-compact'));
}
let discoverIdeasController=null;
function makeDupIndex(ideas){const byField=new Map();
for(const item of ideas){for(const [kind,value] of [['title',item.conceptName],['prompt',item.finalGenerationPrompt]]){const key=String(value||'').toLowerCase().trim();
if(!key)continue;const mapKey=kind+':'+key;let ids=byField.get(mapKey);if(!ids){ids=new Set();byField.set(mapKey,ids);}ids.add(item.ideaId);
}}return byField;}
function isDupFromIndex(idea,lookup){for(const [kind,value] of [['title',idea.conceptName],['prompt',idea.finalGenerationPrompt]]){const key=String(value||'').toLowerCase().trim();
if(!key)continue;const ids=lookup.get(kind+':'+key);if(ids&&(ids.size>(ids.has(idea.ideaId)?1:0)))return true;}return false;}
function seriesSceneAssetIdea(parent,scene,index){const n=Number(index)||0;const code=(String(parent?.shortCode||'rvis').slice(0,3)+'s'+(n+1).toString(36)).toLowerCase();const action=scene?.mainAction||scene?.action||'';const character=parent?.seriesBible?.mainCharacter||parent?.mainSubject||'';return{...parent,...scene,ideaId:`${parent?.ideaId||'series'}__scene_${n+1}`,shortCode:code,conceptName:scene?.conceptName||`${parent?.conceptName||'Series'} — ${scene?.sceneTitle||scene?.title||'Scene '+String(n+1).padStart(2,'0')}`,mainSubject:scene?.mainSubject||[character,action].filter(Boolean).join(' — ')||parent?.mainSubject,mainAction:action,environment:scene?.environment||parent?.seriesBible?.primaryLocation||parent?.environment,finalGenerationPrompt:scene?.finalGenerationPrompt||scene?.scenePrompt||parent?.finalGenerationPrompt,productionType:'single',collectionItemCount:null,seriesScenes:undefined,seriesBible:parent?.seriesBible,metadata:scene?.metadata||null,generatedImageUrl:scene?.generatedImageUrl||null,generatedImagePreviewUrl:scene?.generatedImagePreviewUrl||null,generatedImageWidth:scene?.generatedImageWidth||0,generatedImageHeight:scene?.generatedImageHeight||0,outputMode:parent?.outputMode||'vector',imagePromptOutdated:Boolean(scene?.imagePromptOutdated),metadataOutdated:Boolean(scene?.metadataOutdated)};}
function seriesImageCount(idea){return Array.isArray(idea?.seriesScenes)?idea.seriesScenes.filter(s=>Boolean(s?.generatedImageUrl)).length:0;}
function pendingSeriesSceneCount(idea){if(idea?.productionType!=='series')return 1;const scenes=Array.isArray(idea.seriesScenes)?idea.seriesScenes:[];return idea.imagePromptOutdated?scenes.length:scenes.filter(s=>!s.generatedImageUrl||s.imagePromptOutdated).length;}
function seriesNeedsImages(idea){if(idea?.productionType!=='series')return!idea?.generatedImageUrl||Boolean(idea?.imagePromptOutdated);const scenes=Array.isArray(idea.seriesScenes)?idea.seriesScenes:[];return!scenes.length||scenes.some(s=>!s?.generatedImageUrl||s.imagePromptOutdated)||Boolean(idea.imagePromptOutdated);}
function seriesNeedsMetadata(idea){if(idea?.productionType!=='series')return!idea?.metadata||Boolean(idea?.metadataOutdated);const scenes=Array.isArray(idea.seriesScenes)?idea.seriesScenes:[];return!scenes.length||Boolean(idea.metadataOutdated)||scenes.some(s=>!s?.metadata||s.metadataOutdated);}
function pendingSeriesMetadataCount(idea){if(idea?.productionType!=='series')return 1;return(Array.isArray(idea.seriesScenes)?idea.seriesScenes:[]).filter(scene=>!scene.metadata||scene.metadataOutdated||idea.metadataOutdated).length;}
function seriesIsComplete(idea,requireMetadata=false){if(idea?.productionType!=='series')return Boolean(idea?.generatedImageUrl)&&(!requireMetadata||Boolean(idea?.metadata));const scenes=Array.isArray(idea.seriesScenes)?idea.seriesScenes:[];return scenes.length>0&&scenes.every(s=>Boolean(s?.generatedImageUrl)&&(!requireMetadata||Boolean(s?.metadata)));}
function renderSeriesSceneSummary(idea){if(idea?.productionType!=='series')return'';const scenes=Array.isArray(idea.seriesScenes)?idea.seriesScenes:[];const done=seriesImageCount(idea);const bible=idea.seriesBible||{};return`<details class=\"rounded-lg border border-cyan-900/50 bg-cyan-950/10 text-[10px]\"><summary class=\"cursor-pointer px-2.5 py-2 font-bold text-cyan-200\">SERIES BLUEPRINT · ${done}/${scenes.length} scenes generated</summary><div class=\"px-2.5 pb-2.5 space-y-1.5\"><p><strong class=\"text-slate-200\">Character:</strong> ${escapeHtml(bible.mainCharacter||idea.mainSubject||'AI-defined protagonist')}</p><p><strong class=\"text-slate-200\">Location:</strong> ${escapeHtml(bible.primaryLocation||idea.environment||'Related setting')}</p><p><strong class=\"text-slate-200\">Visual continuity:</strong> ${escapeHtml(bible.visualStyle||idea.creativeDirection||'Consistent art direction')} · ${escapeHtml(bible.palette||idea.suggestedColorPalette||'Shared palette')}</p><ol class=\"list-decimal pl-4 space-y-1 text-slate-300\">${scenes.map((scene,i)=>`<li><strong>${escapeHtml(scene.sceneTitle||scene.title||'Scene '+(i+1))}</strong> — ${escapeHtml(scene.narrativeBeat||scene.mainAction||scene.action||'Distinct story moment')}</li>`).join('')}</ol></div></details>`;}
function renderSeriesSceneGallery(idea){if(idea?.productionType!=='series')return'';const scenes=Array.isArray(idea.seriesScenes)?idea.seriesScenes:[];const done=seriesImageCount(idea);return`<section class=\"rounded-xl border border-cyan-900/50 bg-slate-900/70 p-2.5 space-y-2\"><div class=\"flex items-center justify-between gap-2\"><strong class=\"text-[10px] text-cyan-200\">STORYBOARD · ${idea.seriesStatus==='generating'?`Generating ${idea.seriesProgress?.currentScene||1}/${scenes.length}`:`${done}/${scenes.length} SCENES`}</strong><button type=\"button\" onclick=\"handleDownloadSingleCardZip('${escapeHtml(idea.ideaId)}',this)\" class=\"px-2 py-1 rounded bg-cyan-900/60 border border-cyan-700/60 text-cyan-100 text-[9px] font-bold\">Download Series ZIP</button></div><div class=\"grid grid-cols-2 sm:grid-cols-3 gap-2\">${scenes.map((scene,i)=>{const src=scene.generatedImagePreviewUrl||scene.generatedImageUrl||'';const status=scene.status==='generating'?'Generating':scene.status==='failed'?(scene.generatedImageUrl?'Retry failed · old image retained':'Failed'):scene.generatedImageUrl?'Generated':'Pending';return`<div class=\"min-w-0 rounded-lg border border-slate-800 bg-slate-950 overflow-hidden\"><div class=\"aspect-[4/3] bg-slate-900 flex items-center justify-center\">${src?`<img loading=\"lazy\" decoding=\"async\" src=\"${src}\" alt=\"${escapeHtml(scene.sceneTitle||'Scene '+(i+1))}\" onclick=\"openSeriesSceneLightbox('${escapeHtml(idea.ideaId)}',${i})\" class=\"w-full h-full object-contain cursor-zoom-in\"/>`:`<div class=\"text-center text-slate-600 p-2\"><span class=\"block text-xl\">${scene.status==='failed'?'!':'◷'}</span><span class=\"text-[9px]\">${status}</span></div>`}</div><div class=\"p-2 space-y-1\"><div class=\"flex items-center justify-between gap-1\"><strong class=\"text-[9px] text-slate-200 truncate\">${String(i+1).padStart(2,'0')} · ${escapeHtml(scene.sceneTitle||'Scene '+(i+1))}</strong><span class=\"text-[8px] ${scene.status==='failed'?'text-rose-400':scene.generatedImageUrl?'text-emerald-400':'text-slate-500'}\">${status}</span></div><p class=\"text-[9px] text-slate-500 line-clamp-2\">${escapeHtml(scene.mainAction||scene.narrativeBeat||'')}</p>${scene.visualPreflight?`<p class=\"text-[8px] ${scene.visualPreflight.status==='PASS'?'text-emerald-400':scene.visualPreflight.status==='REVIEW'?'text-amber-400':'text-rose-400'}\">Visual Preflight ${scene.visualPreflight.score}/100 · ${scene.visualPreflight.status}</p>`:''}<div class=\"flex gap-1 flex-wrap\"><button type=\"button\" onclick=\"copySeriesScenePrompt('${escapeHtml(idea.ideaId)}',${i})\" class=\"flex-1 px-1.5 py-1 rounded bg-slate-800 text-slate-300 text-[8px]\">Copy Prompt</button><button type=\"button\" onclick=\"regenerateSeriesScene('${escapeHtml(idea.ideaId)}',${i},this)\" ${idea.seriesStatus==='generating'?'disabled':''} class=\"flex-1 px-1.5 py-1 rounded border border-cyan-800/70 bg-cyan-900/40 hover:bg-cyan-800/70 text-cyan-100 text-[8px] disabled:opacity-50\" title=\"${scene.generatedImageUrl?'Regenerate hanya scene ini':'Generate hanya scene ini'}\">${scene.status==='generating'?'Generating…':scene.generatedImageUrl?'Regenerate':'Generate Scene'}</button>${scene.generatedImageUrl?`<button type=\"button\" onclick=\"downloadSeriesScene('${escapeHtml(idea.ideaId)}',${i})\" class=\"flex-1 px-1.5 py-1 rounded bg-emerald-900/60 text-emerald-200 text-[8px]\">Download</button>`:''}</div>${scene.metadata?`<p class=\"text-[8px] text-emerald-400\">Metadata ready</p>`:`<p class=\"text-[8px] text-slate-600\">Metadata pending</p>`}</div></div>`;}).join('')}</div></section>`;}
async function regenerateSeriesScene(ideaId,index,button){const idea=state.savedIdeas.find(x=>x.ideaId===ideaId);if(!idea){showToast('Simpan Series ke Library untuk membuat gambar scene.','info');return;}if(!Number.isInteger(index)||index<0||index>=idea.seriesScenes.length)return;try{await handleGenerateSeriesImagesForIdea(ideaId,button,{sceneIndex:index,forceRegenerate:true});}catch(err){showToast('Regenerate scene gagal: '+String(err?.message||err).slice(0,180),'error');}}
function copySeriesScenePrompt(ideaId,index){const idea=state.savedIdeas.find(x=>x.ideaId===ideaId)||state.discoveredIdeas.find(x=>x.ideaId===ideaId);const scene=idea?.seriesScenes?.[index];if(scene?.finalGenerationPrompt)safeCopyToClipboard(scene.finalGenerationPrompt).then(ok=>showToast(ok?'Scene prompt copied.':'Could not copy prompt.',ok?'success':'error'));}
async function downloadSeriesScene(ideaId,index){const idea=state.savedIdeas.find(x=>x.ideaId===ideaId);const scene=idea?.seriesScenes?.[index];if(!scene?.generatedImageUrl)return;const sceneIdea=seriesSceneAssetIdea(idea,scene,index);try{const exported=await getExportedAsset(sceneIdea);await executeDownloadManager({data:exported.data,filename:exported.filename,mimeType:exported.mimeType});}catch(err){showToast('Gagal mengunduh scene: '+err.message,'error');}}
function updateSeriesLightboxNavigation(){
 const ideaId=lightboxState.seriesLightboxIdeaId,index=lightboxState.seriesLightboxIndex;
 const idea=state.savedIdeas.find(x=>x.ideaId===ideaId)||state.discoveredIdeas.find(x=>x.ideaId===ideaId);
 const scenes=Array.isArray(idea?.seriesScenes)?idea.seriesScenes:[];
 const{seriesPrev,seriesNext}=lightboxElements();if(!seriesPrev||!seriesNext)return;
 const hasPrev=Number.isInteger(index)&&scenes.slice(0,index).some(scene=>!!scene?.generatedImageUrl);
 const hasNext=Number.isInteger(index)&&scenes.slice(index+1).some(scene=>!!scene?.generatedImageUrl);
 seriesPrev.classList.toggle('hidden',false);seriesPrev.classList.toggle('flex',true);seriesPrev.disabled=!hasPrev;
 seriesNext.classList.toggle('hidden',false);seriesNext.classList.toggle('flex',true);seriesNext.disabled=!hasNext;
}
function openSeriesSceneLightbox(ideaId,index){
 const idea=state.savedIdeas.find(x=>x.ideaId===ideaId)||state.discoveredIdeas.find(x=>x.ideaId===ideaId);
 const scene=idea?.seriesScenes?.[index];if(!scene?.generatedImageUrl)return;
 lightboxState.seriesLightboxIdeaId=ideaId;lightboxState.seriesLightboxIndex=index;
 const{modal,img,title,downloadBtn,seriesPrev,seriesNext}=lightboxElements();if(!modal||!img)return;
 img.src=scene.generatedImageUrl;if(title)title.textContent=(idea.conceptName||'Series')+' · '+(scene.sceneTitle||'Scene '+(index+1));
 if(downloadBtn)downloadBtn.onclick=()=>downloadSeriesScene(ideaId,index);
 updateSeriesLightboxNavigation();
 if(seriesPrev)seriesPrev.classList.remove('hidden');if(seriesNext)seriesNext.classList.remove('hidden');
 modal.classList.remove('hidden');modal.classList.add('flex');document.body.style.overflow='hidden';lightboxState.pointers.clear();lightboxState.dragging=false;resetLightboxZoom();img.onload=resetLightboxZoom;
}
function navigateSeriesSceneLightbox(delta,event){
 event?.stopPropagation();if(!lightboxState.seriesLightboxIdeaId)return;
 const idea=state.savedIdeas.find(x=>x.ideaId===lightboxState.seriesLightboxIdeaId)||state.discoveredIdeas.find(x=>x.ideaId===lightboxState.seriesLightboxIdeaId);
 const scenes=Array.isArray(idea?.seriesScenes)?idea.seriesScenes:[];let next=lightboxState.seriesLightboxIndex;
 const step=delta<0?-1:1;
 while(Number.isInteger(next)){next+=step;if(next<0||next>=scenes.length)return;if(scenes[next]?.generatedImageUrl)break;}
 if(!Number.isInteger(next)||next<0||next>=scenes.length||!scenes[next]?.generatedImageUrl)return;
 lightboxState.seriesLightboxIndex=next;
 const scene=scenes[next],{img,title,downloadBtn}=lightboxElements();if(!img)return;
 img.src=scene.generatedImageUrl;if(title)title.textContent=(idea.conceptName||'Series')+' · '+(scene.sceneTitle||'Scene '+(next+1));
 if(downloadBtn)downloadBtn.onclick=()=>downloadSeriesScene(lightboxState.seriesLightboxIdeaId,next);
 updateSeriesLightboxNavigation();lightboxState.pointers.clear();lightboxState.dragging=false;resetLightboxZoom();img.onload=resetLightboxZoom;
}
async function copyIdeaPrompt(ideaId,
btnEl){const idea=state.discoveredIdeas.find(i=>i.ideaId===ideaId)||state.savedIdeas.find(i=>i.ideaId===ideaId);if(idea){const ok=await safeCopyToClipboard(idea.finalGenerationPrompt);
if(ok){showToast("Prompt copied!","success");if(btnEl){const origHTML=btnEl.innerHTML;btnEl.innerHTML=` <span>Copied!</span>`;
setTimeout(()=>{btnEl.innerHTML=origHTML;},1500);}}}}
async function saveSimplePromptIdea(btnEl){
 const input=byId('simplePromptInput'),prompt=String(input?.value||'').trim();
 if(!prompt){showToast('Isi SIMPLE PROMPT terlebih dahulu.','error');input?.focus();return false;}
 const label=value=>typeof value==='string'?value:(value?.label||value?.name||value?.title||value?.id||'');
 const title=prompt.split(/[.!?\n]/)[0].trim().slice(0,68)||'Saved Prompt Idea';
 const now=new Date().toISOString(),ideaId='prompt_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);
 const promptId=ideaId+'_p1';
 const idea={ideaId,shortCode:ideaId.slice(-4),conceptName:title,productionType:state.productionType||'single',dataType:'prompt',activePromptId:promptId,categoryId:state.selectedCategory?.id||'custom',categoryName:label(state.selectedCategory)||'Custom',subcategory:state.selectedSubcategory||'',mainSubject:prompt.slice(0,700),simplePrompt:prompt,visualPrompt:prompt,finalGenerationPrompt:prompt,outputMode:getOutputMode(),aspectRatio:state.ideaStudioSizeId||'1:1',creativeDirection:label(state.selectedStyle),commercialUseCase:label(state.selectedPurpose),targetBuyer:state.selectedPurpose?.targetBuyer||state.selectedPurpose?.buyer||'',designNeed:state.selectedPurpose?.designNeed||'',suggestedAssetType:label(state.selectedAssetType),suggestedComposition:label(state.selectedComposition),suggestedColorPalette:label(state.selectedPalette),colorPaletteHex:Array.isArray(state.selectedPalette?.hex)?state.selectedPalette.hex.slice():[],status:'Draft',createdAt:now,updatedAt:now,generatedImageUrl:null,generatedImagePreviewUrl:null,metadata:null,referenceImageUrl:state.refImageUrl||null,referenceMode:state.refMode||'',referenceStyleFingerprint:state.referenceFingerprint?{...state.referenceFingerprint}:null,prompts:[{promptId,ideaId,promptType:'simple',version:1,simplePrompt:prompt,visualPrompt:prompt,finalPrompt:prompt,referenceAssetId:'',activeVersion:true,createdAt:now,updatedAt:now,notes:'Saved from Idea Studio'}]};
 try{ensureConceptBlueprint(idea);}catch(error){console.warn('Prompt idea blueprint initialization:',error);}
 const referenceSource=state.refImageFile instanceof Blob?state.refImageFile:(state.refImageUrl||null);
 const oldText=btnEl?.textContent||'Save Idea';
 if(btnEl){btnEl.disabled=true;btnEl.textContent='Saving...';}
 try{
  if(typeof window.RIVIS_SAVE_IDEA_TO_CLOUD!=='function')throw new Error('Cloud Gallery belum siap. Muat ulang RIVIS lalu coba kembali.');
  const saved=await window.RIVIS_SAVE_IDEA_TO_CLOUD(idea,referenceSource);
  if(saved===false)return false;
  showToast('Idea berhasil disimpan ke Cloud Gallery: '+title,'success');
  if(btnEl){btnEl.textContent='Saved to Cloud';setTimeout(()=>{if(btnEl.isConnected){btnEl.textContent=oldText;btnEl.disabled=false;}},1400);}
  return true;
 }catch(error){
  showToast('Gagal menyimpan ide ke Cloud Gallery: '+String(error?.message||error).slice(0,220),'error');
  return false;
 }finally{
  if(btnEl&&btnEl.textContent==='Saving...'){btnEl.textContent=oldText;btnEl.disabled=false;}
 }
}

function saveGeneratedIdeasToLibrary(ideas){
 if(!Array.isArray(ideas)||!ideas.length)throw new Error('Tidak ada konsep baru yang valid untuk disimpan.');
 const existing=state.savedIdeas;
 const existingIds=new Set(existing.map(x=>String(x.ideaId)));
 const newIdeas=[];
 for(const source of ideas){
  if(!source||!source.ideaId||existingIds.has(String(source.ideaId)))continue;
  const idea={...source};
  if(state.refImageUrl&&!idea.referenceImageUrl)idea.referenceImageUrl=state.refImageUrl;
  if(!idea.referenceMode)idea.referenceMode=state.refMode||'STYLE REFERENCE';
  if(state.referenceFingerprint&&!idea.referenceStyleFingerprint)idea.referenceStyleFingerprint={...state.referenceFingerprint};
  ensureConceptBlueprint(idea);
  newIdeas.push(idea);existingIds.add(String(idea.ideaId));
 }
 if(!newIdeas.length)throw new Error('Semua konsep hasil generate sudah ada dalam Library.');
 state.savedIdeas=[...newIdeas,...existing];
 if(!persistSavedIdeas()){
  state.savedIdeas=existing;
  throw new Error('Gagal menyimpan konsep ke Library lokal. Tidak ada hasil baru yang diganti.');
 }
 state.discoveredIdeas=[];
 updateBadges();
 switchTab('saved_ideas');
 updateFloatingShortcut();
 const autoSeries=state.productionType==='series'&&Boolean(byId('seriesAutoGenerateCheckbox')?.checked);
 if(autoSeries)setTimeout(()=>handleGenerateAllImages(byId('generateAllImagesBtn'),true),180);
 return newIdeas.length;
}
function isRasterMedium(type){return/photograph|3d|render/i.test(String(type||''));}
function mediumStyle(type,style){const t=String(type||''),s=String(style||'');
if(/photograph/i.test(t)&&/vector|logo|sticker|badge|line art|3d|clay|paper cut|hand drawn|engraving|risograph/i.test(s))return'Natural Commercial Photography';
if(/3d|render/i.test(t)&&/flat vector|line art|minimalist logo|engraving|woodcut/i.test(s))return'Stylized 3D Illustration';return style;
}
function paletteBrief(palette,type){const use=isRasterMedium(type)?'distribute colors across the subject, materials, lighting and setting':'assign dominant, supporting, accent and background colors to distinguish adjacent shapes';
return'Palette: '+palette+'. '+use+'. Keep the subject legible at thumbnail size and preserve space for the intended placement.';
}
function updateRatioHint(){const size=byId('ideaStudioSizeSelect').value;const w=Number(byId('ideaCustomWidthInput').value);
const h=Number(byId('ideaCustomHeightInput').value);const hint=byId('stockRatioHint');hint.textContent=size==='custom'&&!(w>=64&&w<=4096&&h>=64&&h<=4096)?'Isi dimensi 64–4096 px.':'Rasio '+generationRatio(size==='custom'?w/h:size)+' · Meminta '+state.imageResolution+' (~'+({'1K':'1',
'2K':'4','4K':'17'})[state.imageResolution]+' MP). Ukuran aktual ditampilkan setelah generate.';}
function assetGuidance(type){const t=String(type||'');
if(/editorial illustration/i.test(t))return'Use a clear editorial storytelling moment, expressive but controlled character proportions, distinctive silhouette design, purposeful wardrobe or prop details, graphic color blocking, and a composition tailored to magazine, campaign or lifestyle placement.';
if(/food photography/i.test(t))return'Keep ingredient texture credible, food styling accurate and lighting appetizing but natural.';
if(/product photography/i.test(t))return'Use accurate product proportions, clean material rendering and deliberate studio reflections.';
if(/portrait photography/i.test(t))return'Use natural expression, believable anatomy, realistic skin texture and meaningful environmental context.';
if(/architecture photography|travel photography/i.test(t))return'Use believable perspective, accurate structures and appropriate natural lighting.';
if(/photograph/i.test(t))return'Use photographic lighting, credible materials, purposeful scene depth and believable details.';
if(/3d|render/i.test(t))return'Use dimensional forms, realistic scale, consistent materials and physically coherent lighting.';
if(/seamless pattern/i.test(t))return'Design a repeatable motif tile with perfectly matching opposite edges and no seams.';
if(/background|texture/i.test(t))return'Create a full-frame design with controlled visual rhythm and intentional copy space.';
if(/icon|infographic|diagram|map|wayfinding/i.test(t))return'Use readable silhouettes, a consistent grid and clearly understandable symbols.';
if(/sticker|clipart|character|mascot/i.test(t))return'Use distinct readable silhouettes, consistent contour logic and clearly differentiated items.';
if(/badge|emblem|logo/i.test(t))return'Build a scalable original mark with meaningful generic symbols and clean outlines.';
if(/isolated object/i.test(t))return'Place a single legible subject with sufficient margins for reuse.';
if(/packaging/i.test(t))return'Produce print-ready graphics with safe margins and space for separate labels.';
return'Use clear forms and a composition suited to the intended buyer and placement.';}
function generationRatio(request){const ratios=['1:1','2:3','3:2','4:3','3:4','4:5','5:4','9:16','16:9','21:9'];function fraction(value){const[w,
h=1]=String(value).split(':').map(Number);return w/h;}const target=fraction(request);if(!(target>0&&Number.isFinite(target)))return'1:1';
return ratios.reduce((best,r)=>Math.abs(Math.log(fraction(r)/target))<Math.abs(Math.log(fraction(best)/target))?r:best);}
function rivisDisplayDate(value){const text=String(value||'').trim();const m=text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);if(!m)return text;
let a=Number(m[1]),b=Number(m[2]);if(a>12)return String(a).padStart(2,'0')+'/'+String(b).padStart(2,'0')+'/'+m[3];if(b>12)return String(b).padStart(2,'0')+'/'+String(a).padStart(2,'0')+'/'+m[3];return text;}
function showNativeSize(img){const w=Number(img?.dataset?.nativeWidth)||img.naturalWidth,h=Number(img?.dataset?.nativeHeight)||img.naturalHeight;
const label=img.parentElement?.nextElementSibling;if(!label||!w||!h)return;const mp=w*h/1e6;
const badge=document.createElement('span');badge.className='font-bold '+(mp>=4?'text-emerald-400':'text-rose-400');
badge.textContent=mp.toLocaleString('id-ID',{minimumFractionDigits:2,maximumFractionDigits:2})+' MP';
label.replaceChildren(document.createTextNode('Hasil asli: '+w+' × '+h+' px · '),badge);}
const QUALITY_FIRST_STORE='rvis_quality_first_v1';
const qualityFirstPrefs=(()=>{try{const p=JSON.parse(safeStorageGet(QUALITY_FIRST_STORE,
'{}'));return{enabled:p.enabled!==false,repair:p.repair!==false};}catch(_){return{enabled:true,repair:true};}})();
function qualityFirstEnabled(){return qualityFirstPrefs.enabled;
}
function setQualityFirstOption(field,value){if(field!=='enabled'&&field!=='repair')return;qualityFirstPrefs[field]=Boolean(value);
safeStorageSet(QUALITY_FIRST_STORE,JSON.stringify(qualityFirstPrefs));syncQualityFirstControls();}
function syncQualityFirstControls(){const a=byId('qualityFirstToggle'),
b=byId('qualityRepairToggle');if(a)a.checked=qualityFirstPrefs.enabled;if(b){b.checked=qualityFirstPrefs.repair;b.disabled=!qualityFirstPrefs.enabled;
}}
document.addEventListener('DOMContentLoaded',syncQualityFirstControls);
function decodedPicture(url){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{if(!img.naturalWidth||!img.naturalHeight)reject(new Error('Dimensi gambar tidak valid.'));
else resolve(img);};img.onerror=()=>reject(new Error('Data gambar tidak dapat didekode.'));img.src=url;});}
function visualPreflightIssueText(issue){if(typeof issue==='string')return issue;
const area=issue?.area?issue.area+': ':'';return area+(issue?.text||'Perlu pengecekan visual.');}
const batchState={images:null,
meta:null};
function toggleBatchCancellation(type,btnEl,idleLabel){const running=batchState[type];if(!running)return false;running.abort();
if(btnEl){btnEl.disabled=true;btnEl.innerHTML=` Stopping...`;}showToast(`Stopping ${idleLabel}...`,"info");return true;}
function batchProgressLabel(done,
total){return total>0?`Generating.. (${Math.min(total,done+1)}/${total})`:'Generating..';}
function updateBatchPanel(type,done,
total){const btn=type==='images'?byId('generateAllImagesBtn'):byId('generateAllMetaBtn');if(total){setInnerProgress(btn,Math.round(done/total*100));
if(btn)btn.title=`${type==='images'?'Image All':'Meta All'}: ${done}/${total} selesai. Klik ulang untuk menghentikan proses ini.`;
}else{clearInnerProgress(btn);if(btn)btn.title=type==='images'?'Generate gambar semua kartu Library.':'Generate metadata semua kartu Library.';
}const panel=byId('batchQueuePanel');if(panel)panel.classList.add('hidden');}
function buildCardMetadataText(idea){const meta=normalizeAdobeStockMetadata(idea,
idea.metadata||{});return['RICH VECTOR IDEA STUDIO - ADOBE STOCK METADATA',`Card Code: ${getCardUniqueCode(idea).toUpperCase()}`,
`Concept Name: ${idea.conceptName||'-'}`,`Asset Filename: ${getMetadataAssetFilename(idea)}`,'',`Adobe Stock Title (${meta.stockTitle.length}/70 chars):`,
meta.stockTitle,'',`Adobe Stock Category (${meta.adobeCategoryCode}): ${meta.adobeCategory}`,`Adobe Stock Releases: ${meta.releases||'(none)'}`,
`Adobe Stock AI Disclosure: ${meta.aiDisclosure!==false?'Yes (Generative AI)':'No'}`,'',`Adobe Stock Keywords (${meta.keywords.length}/40):`,
meta.keywords.join(', ')].join('\r\n');}
async function helperCreateCardZipContent(zip,idea,folderName="",includeBlueprint=true){const baseName=getCardBaseFilename(idea);const metadataFilename=getMetadataAssetFilename(idea);
const prefix=folderName?`${folderName}/`:"";const promptContent=`RICH VECTOR IDEA STUDIO - ASSET BRIEF
--------------------------------------------------
Card Code: ${getCardUniqueCode(idea).toUpperCase()}
Concept Name: ${idea.conceptName}
Category: ${idea.categoryName||'-'} / ${idea.subcategory||'-'}
Production Type: ${idea.productionType||'single'}
Asset Type: ${idea.suggestedAssetType||'-'}
Visual Style: ${idea.creativeDirection||'-'}
Composition: ${idea.suggestedComposition||'-'}
Color Palette: ${idea.suggestedColorPalette||'-'}
${idea.colorPaletteHex?`Extracted HEX Palette: ${idea.colorPaletteHex.join(', ')}\n`:''}Target Buyer: ${idea.targetBuyer||'-'}
Commercial Use: ${idea.commercialUseCase||'-'}
Opportunity Score: ${calculateOpportunityScore(idea).totalScore===null?'Belum dinilai':calculateOpportunityScore(idea).totalScore+'/100'}

IMAGE GENERATION PROMPT:
${idea.finalGenerationPrompt}
`;zip.file(`${prefix}${baseName}_prompt.txt`,promptContent);if(idea.metadata){const meta=normalizeAdobeStockMetadata(idea,idea.metadata);
const metaText=`ADOBE STOCK METADATA & SEO
--------------------------------------------------
Card Code: ${getCardUniqueCode(idea).toUpperCase()}
Concept: ${idea.conceptName}
Filename (CSV): ${metadataFilename}
Title: ${meta.stockTitle}
Category: ${meta.adobeCategoryCode} (${meta.adobeCategory})
Releases: ${meta.releases||'(empty)'}
AI Disclosure: ${meta.aiDisclosure!==false?'Yes (Generative AI)':'No'}

Keywords (${meta.keywords.length} tags ordered by relevance):
${meta.keywords.join(', ')}
`;zip.file(`${prefix}${baseName}_metadata.txt`,metaText);zip.file(`${prefix}${baseName}_metadata.csv`,buildAdobeStockCsv([idea]));
}if(includeBlueprint)zip.file(`${prefix}${baseName}_blueprint.json`,readonlyBlueprintText(idea));
if(idea.productionType==='series'&&Array.isArray(idea.seriesScenes)){const sceneRows=[];const prompts=[];zip.file(`${prefix}${baseName}_series_bible.json`,JSON.stringify({seriesTitle:idea.conceptName,seriesBible:idea.seriesBible||{},seriesLength:idea.seriesScenes.length,continuityLock:idea.seriesContinuityLock!==false,anchorReference:idea.seriesAnchorReference!==false,scenes:idea.seriesScenes.map((scene,i)=>({sceneNumber:i+1,sceneTitle:scene.sceneTitle,narrativeBeat:scene.narrativeBeat,mainAction:scene.mainAction,interaction:scene.interaction,camera:scene.camera,environment:scene.environment,finalGenerationPrompt:scene.finalGenerationPrompt}))},null,2));
for(let i=0;i<idea.seriesScenes.length;i++){const scene=idea.seriesScenes[i],sceneIdea=seriesSceneAssetIdea(idea,scene,i);prompts.push(`SCENE ${String(i+1).padStart(2,'0')} — ${sceneIdea.conceptName}\n${scene.finalGenerationPrompt||''}`);let exported=null;if(scene.generatedImageUrl){exported=await getExportedAsset(sceneIdea);zip.file(`${prefix}scenes/${exported.filename}`,exported.data,{compression:'STORE'});}if(scene.metadata)sceneRows.push(buildAdobeStockCsvRow(sceneIdea,scene.metadata,exported?.filename||''));}
zip.file(`${prefix}${baseName}_scene_prompts.txt`,prompts.join('\n\n'));if(sceneRows.length)zip.file(`${prefix}${baseName}_scene_metadata.csv`,'Filename,Title,Keywords,Category,Releases\r\n'+sceneRows.join('\r\n'));
}else if(idea.generatedImageUrl){const exported=await getExportedAsset(idea);zip.file(`${prefix}${exported.filename}`,exported.data,{compression:'STORE'});}
const jsonClean={...idea,cardCode:getCardUniqueCode(idea).toUpperCase(),exportedFilename:metadataFilename};delete jsonClean.generatedImageUrl;delete jsonClean.generatedImagePreviewUrl;delete jsonClean.visualPreflightPending;if(Array.isArray(jsonClean.seriesScenes))jsonClean.seriesScenes=jsonClean.seriesScenes.map(scene=>{const copy={...scene};delete copy.generatedImageUrl;delete copy.generatedImagePreviewUrl;return copy;});if(jsonClean.metadata)jsonClean.metadata=normalizeAdobeStockMetadata(idea,jsonClean.metadata);zip.file(`${prefix}${baseName}_data.json`,JSON.stringify(jsonClean,null,2));}
function qualityDownloadNotice(ideas){const flagged=(Array.isArray(ideas)?ideas:[ideas]).filter(x=>x?.visualPreflight&&x.visualPreflight.status!=='PASS');
if(flagged.length){showToast(`${flagged.length} aset memiliki catatan Visual Preflight (${flagged.map(x=>x.visualPreflight.status).join(', ')}). Periksa 100% sebelum submit.`,
'info');}}
async function handleDownloadSingleCardZip(ideaId,btnEl){const idea=state.savedIdeas.find(i=>i.ideaId===ideaId);if(!idea)return;
if(typeof JSZip==='undefined'){showToast("JSZip library failed to load.","error");return;}qualityDownloadNotice([idea]);if(btnEl){btnEl.disabled=true;
btnEl.innerHTML=` <span>ZIP...</span>`;}try{const zip=new JSZip();const baseName=getCardBaseFilename(idea);await helperCreateCardZipContent(zip,
idea,"");const zipBlob=await zip.generateAsync({type:"blob"});await executeDownloadManager({data:zipBlob,filename:`${baseName}.zip`,
mimeType:"application/zip"});}catch(err){console.error("Single card ZIP error:",err);showToast("Failed to create card ZIP: "+err.message,
"error");}finally{if(btnEl){btnEl.disabled=false;btnEl.innerHTML=` <span>ZIP Card</span>`;}}}
async function createFourFileCardZip(idea){
  const base=getCardBaseFilename(idea);
  if(idea.productionType==='series'){const seriesZip=new JSZip();await helperCreateCardZipContent(seriesZip,idea,'');return seriesZip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:6}});}
  const exported=await getExportedAsset(idea);
  const zip=new JSZip();
  zip.file(exported.filename,exported.data,{compression:'STORE'});
  zip.file(base+'_prompt.txt',String(idea.finalGenerationPrompt||''));
  zip.file(base+'_blueprint.json',readonlyBlueprintText(idea));
  zip.file(base+'_metadata.csv','Filename,Title,Keywords,Category,Releases\r\n'+buildAdobeStockCsvRow(idea,idea.metadata,exported.filename));

  return zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:6}});
}
/* Canvas can suppress window.confirm in sandboxed iframes. Use a self-owned dialog. */
async function confirmIncompleteLibraryExport(kind,ideas){
  const list=Array.isArray(ideas)?ideas:[];
  const withoutImage=list.filter(x=>x?.productionType==='series'?!seriesIsComplete(x,false):!x?.generatedImageUrl);
  const withoutMetadata=list.filter(x=>x?.productionType==='series'?!seriesIsComplete(x,true):!x?.metadata);
  if(!withoutImage.length&&!withoutMetadata.length)return true;
  const incomplete=list.filter(x=>!x?.generatedImageUrl||!x?.metadata).length;
  const complete=list.length-incomplete;
  const isCards=kind==='cards';
  const heading=isCards?'DOWNLOAD ALL CARD':'DOWNLOAD RESULT';
  const summary=isCards
    ?`Hanya ${complete} kartu lengkap yang akan diunduh. ${incomplete} kartu tidak lengkap akan dilewati.`
    :`ZIP hanya berisi gambar dan/atau metadata yang sudah tersedia; file yang belum digenerate tidak disertakan.`;
  return new Promise(resolve=>{
    const backdrop=document.createElement('div');
    backdrop.id='rivisExportConfirmation';backdrop.setAttribute('role','presentation');
    backdrop.style.cssText='position:fixed;inset:0;background:rgba(2,6,23,.84);z-index:2147483645;display:flex;align-items:center;justify-content:center;padding:16px;';
    const dialog=document.createElement('section');
    dialog.setAttribute('role','alertdialog');dialog.setAttribute('aria-modal','true');
    dialog.setAttribute('aria-label','Konfirmasi '+heading);
    dialog.style.cssText='width:min(440px,100%);max-height:90vh;overflow:auto;background:#0f172a;border:1px solid #475569;border-radius:14px;box-shadow:0 25px 60px rgba(0,0,0,.4);padding:20px;color:#e2e8f0;font:13px/1.55 system-ui,sans-serif;';
    const title=document.createElement('h2');title.textContent='Peringatan — '+heading;
    title.style.cssText='font-size:16px;font-weight:800;color:#fbbf24;margin:0 0 10px;';dialog.appendChild(title);
    const desc=document.createElement('p');
    desc.textContent=`Total kartu: ${list.length}\nGambar belum digenerate: ${withoutImage.length}\nMetadata belum digenerate: ${withoutMetadata.length}\nKartu lengkap: ${complete}\n\n${summary}\n\nTetap download?`.replace(/\\n/g,'\n');
    desc.style.cssText='white-space:pre-line;margin:0 0 18px;color:#cbd5e1;';dialog.appendChild(desc);
    const actions=document.createElement('div');actions.style.cssText='display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;';
    const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Batal';
    cancel.style.cssText='padding:9px 16px;border:1px solid #475569;border-radius:8px;background:#1e293b;color:white;font-weight:700;cursor:pointer;';
    const proceed=document.createElement('button');proceed.type='button';proceed.textContent='Tetap Download';
    proceed.style.cssText='padding:9px 16px;border:0;border-radius:8px;background:#059669;color:white;font-weight:700;cursor:pointer;';
    actions.append(cancel,proceed);dialog.appendChild(actions);backdrop.appendChild(dialog);document.body.appendChild(backdrop);
    const prev=document.activeElement;
    let settled=false;
    const finish=ok=>{if(settled)return;settled=true;document.removeEventListener('keydown',keys,true);backdrop.remove();
      if(prev?.isConnected)prev.focus();resolve(ok);};
    const keys=e=>{if(e.key==='Escape'){e.preventDefault();finish(false);}else if(e.key==='Tab'){
      const controls=[cancel,proceed],idx=controls.indexOf(document.activeElement);
      if(e.shiftKey&&idx<=0){e.preventDefault();proceed.focus();}
      else if(!e.shiftKey&&idx===1){e.preventDefault();cancel.focus();}
    }};
    document.addEventListener('keydown',keys,true);
    cancel.addEventListener('click',()=>finish(false));proceed.addEventListener('click',()=>finish(true));
    backdrop.addEventListener('click',e=>{if(e.target===backdrop)finish(false);});
    cancel.focus();
  });
}
async function handleDownloadAllCardsZip(btnEl){
  if(typeof JSZip==='undefined'){showToast('JSZip library failed to load.','error');return;}
  const all=state.savedIdeas;
  if(!all.length){showToast('Library is empty. Nothing to download.','error');return;}
  const complete=all.filter(i=>seriesIsComplete(i,true));
  const skipped=all.length-complete.length;
  if(skipped&&!(await confirmIncompleteLibraryExport('cards',all)))return;
  if(!complete.length){showToast('Download All Card: belum ada kartu dengan gambar dan metadata lengkap. Tidak ada file yang diunduh.',
'error');return;}
  qualityDownloadNotice(complete);
  const btn=btnEl||byId('downloadAllZipBtn'),old=btn?.innerHTML||'';
  if(btn){btn.disabled=true;btn.textContent='Preparing ZIP...';}
  let downloaded=0;
  try{
    for(let i=0;i<complete.length;i++){
      const idea=complete[i];
      if(btn)btn.textContent=`ZIP ${i+1}/${complete.length}...`;
      const blob=await createFourFileCardZip(idea);
      const ok=await executeDownloadManager({data:blob,filename:getCardBaseFilename(idea)+'.zip',mimeType:'application/zip'});

      if(ok)downloaded++;
      if(i<complete.length-1)await new Promise(resolve=>setTimeout(resolve,350));
    }
    showToast(downloaded===complete.length?`${downloaded} ZIP kartu berhasil diunduh.`:`${downloaded}/${complete.length} ZIP terunduh. Izinkan multiple downloads di browser.`,
downloaded===complete.length?'success':'info');
    if(skipped)showToast(`${skipped} kartu/Series dilewati karena gambar atau metadata scene belum lengkap.`,'info');
  }catch(err){console.error('Download All Card ZIP error:',err);showToast('Gagal membuat ZIP kartu: '+err.message,'error');}
  finally{if(btn){btn.disabled=false;btn.innerHTML=old||'Download All Card';}}
}
function getResultZipFilename(idea,count){const date=new Date().toISOString().slice(0,10);const theme=idea?.metadata?.stockTitle||idea?.conceptName||idea?.mainSubject||'rich_vector_results';
return`${sanitizeTitleForFilename(theme)}${count>1?`_dan_${count-1}_lainnya`:''}_${date}.zip`;}
async function handleDownloadResultsZip(btnEl){
  const all=state.savedIdeas;
  if(!all.length){showToast('Library kosong. Tidak ada hasil yang dapat diunduh.','error');return;}
  const generated=all.filter(i=>i.generatedImageUrl||i.metadata||(i.productionType==='series'&&i.seriesScenes?.some(scene=>scene.generatedImageUrl||scene.metadata)));
  if(!generated.length){showToast('Belum ada gambar atau metadata yang digenerate. Tidak ada hasil yang dapat diunduh.','error');return;}
  if(typeof JSZip==='undefined'){showToast('JSZip library failed to load.','error');return;}
  if(!(await confirmIncompleteLibraryExport('results',all)))return;
  qualityDownloadNotice(generated);
  const btn=btnEl||byId('downloadResultsZipBtn'),old=btn?.innerHTML||'';
  if(btn){btn.disabled=true;btn.textContent='Packaging...';}
  try{
    const zip=new JSZip(),metadataRows=[];
    for(const idea of generated){
      if(idea.productionType==='series'&&Array.isArray(idea.seriesScenes)){
        for(let i=0;i<idea.seriesScenes.length;i++){const scene=idea.seriesScenes[i],sceneIdea=seriesSceneAssetIdea(idea,scene,i);let exported=null;if(scene.generatedImageUrl){exported=await getExportedAsset(sceneIdea);zip.file(`series/${getCardBaseFilename(idea)}/${exported.filename}`,exported.data,{compression:'STORE'});}if(scene.metadata)metadataRows.push(buildAdobeStockCsvRow(sceneIdea,scene.metadata,exported?.filename||''));}
        zip.file(`series/${getCardBaseFilename(idea)}/series_bible.json`,JSON.stringify(idea.seriesBible||{},null,2));
      }else{
        let exported=null;if(idea.generatedImageUrl){exported=await getExportedAsset(idea);zip.file(exported.filename,exported.data,{compression:'STORE'});}
        if(idea.metadata)metadataRows.push(buildAdobeStockCsvRow(idea,idea.metadata,exported?.filename||''));
      }
    }
    if(metadataRows.length)zip.file('metadata.csv','Filename,Title,Keywords,Category,Releases\r\n'+metadataRows.join('\r\n'));

    const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:6}});
    await executeDownloadManager({data:blob,filename:getResultZipFilename(generated[0],generated.length),mimeType:'application/zip'});

  }catch(err){console.error('Download Result ZIP error:',err);showToast('Failed to build ZIP: '+err.message,'error');}
  finally{if(btn){btn.disabled=false;btn.innerHTML=old||'Download Result';}}
}
async function downloadGeneratedImage(ideaId){const idea=state.savedIdeas.find(i=>i.ideaId===ideaId);if(!idea?.generatedImageUrl)return;
try{qualityDownloadNotice([idea]);const exported=await getExportedAsset(idea);await executeDownloadManager({data:exported.data,
filename:exported.filename,mimeType:exported.mimeType});}catch(err){showToast("Gagal menyiapkan download gambar: "+err.message,
"error");}}
async function exportSavedIdeaMetadataTXT(ideaId){const idea=state.savedIdeas.find(i=>i.ideaId===ideaId);if(!idea||!idea.metadata)return;
const meta=normalizeAdobeStockMetadata(idea,idea.metadata);const baseName=getCardBaseFilename(idea);const metadataFilename=getMetadataAssetFilename(idea);const content=`ADOBE STOCK METADATA & SEO
----------------------------------------
Card Code: ${getCardUniqueCode(idea).toUpperCase()}
Concept: ${idea.conceptName}
Filename (CSV): ${metadataFilename}
Title: ${meta.stockTitle}
Category: ${meta.adobeCategoryCode} (${meta.adobeCategory})
Releases: ${meta.releases||'(empty)'}
AI Disclosure: ${meta.aiDisclosure!==false?'Yes (Generative AI)':'No'}

Keywords (${meta.keywords.length} tags ordered by relevance):
${meta.keywords.join(', ')}`;await executeDownloadManager({data:content,filename:`${baseName}_metadata.txt`,mimeType:'text/plain;charset=utf-8'});
}
async function exportSavedIdeaMetadataCSV(ideaId){const idea=state.savedIdeas.find(i=>i.ideaId===ideaId);if(!idea||!idea.metadata)return;
const baseName=getCardBaseFilename(idea);await executeDownloadManager({data:buildAdobeStockCsv([idea]),filename:`${baseName}_metadata.csv`,
mimeType:'text/csv;charset=utf-8'});}
async function copyIdeaKeywords(ideaId,btnEl){const idea=state.savedIdeas.find(i=>i.ideaId===ideaId);
if(idea&&idea.metadata){const ok=await safeCopyToClipboard(normalizeAdobeStockMetadata(idea,idea.metadata).keywords.join(', '));
if(ok){showToast("Keywords copied!","success");if(btnEl){const origHTML=btnEl.innerHTML;btnEl.innerHTML=` <span>Copied!</span>`;
setTimeout(()=>{btnEl.innerHTML=origHTML;},1500);}}}}
async function copyPaletteSwatches(hexArray,btnEl){if(!hexArray||!hexArray.length)return;
const ok=await safeCopyToClipboard(hexArray.join(', '));if(ok){showToast(`Copied HEX Palette: ${hexArray.join(', ')}`,"success");
if(btnEl){const origHTML=btnEl.innerHTML;btnEl.innerHTML=` Copied!`;setTimeout(()=>{btnEl.innerHTML=origHTML;},1500);}}}
async function copySingleHexCode(hex){const ok=await safeCopyToClipboard(hex);
if(ok)showToast(`Copied color ${hex}`,"success");}
function persistSavedIdeas(){try{libraryPaintDirty=true;state.savedIdeas.forEach(ensureConceptBlueprint);
const backupOk=safeStorageSet(STORAGE_KEYS.SAVED_IDEAS,JSON.stringify(compactLibraryBackup(state.savedIdeas)));refreshStorageStatus();
if(idbAvailable){const generation=++writeRev;libraryPersistQueue=libraryPersistQueue.catch(()=>{}).then(async()=>{if(generation!==writeRev)return;
// Shallow snapshot avoids an extra deep copy of every 4K Base64 image string.
const latest=state.savedIdeas.map(i=>({...i}));await idbSet(IDB_LIBRARY_KEY,latest);}).catch(err=>{console.warn('IndexedDB save issue:',
err?.message||err);showToast('IndexedDB gagal menyimpan gambar. Simpan card ke Cloud atau unduh ZIP sebelum menutup RIVIS; cadangan lokal hanya berisi metadata.','error');});}else if(!backupOk){showToast('Penyimpanan penuh. Unduh ZIP Library sebagai cadangan.',
'error');return false;}return true;}catch(err){console.warn('Library save failed',err?.message||err);return false;}}
function removeSavedIdea(ideaId){state.savedIdeas=state.savedIdeas.filter(i=>i.ideaId!==ideaId);
persistSavedIdeas();updateBadges();renderSavedIdeasGrid();showToast("Idea removed from Library.","info");}
let clearAllSavedArmed=false;
let clearAllSavedTimer=null;
function handleClearAllSavedIdeas(btnEl){if(!state.savedIdeas.length){showToast("Library is already empty.",
"info");return;}const btn=btnEl||byId('clearAllSavedBtn');if(!clearAllSavedArmed){clearAllSavedArmed=true;if(btn){btn.innerHTML=` Confirm Clear (${state.savedIdeas.length})`;
btn.classList.remove('bg-red-950/80','text-red-300');btn.classList.add('bg-red-600','text-white');}showToast(`Click "Confirm Clear" again within 4 seconds to delete all ${state.savedIdeas.length} cards.`,
"info");clearTimeout(clearAllSavedTimer);clearAllSavedTimer=setTimeout(()=>{clearAllSavedArmed=false;if(btn){btn.innerHTML=` Clear All Cards`;
btn.classList.remove('bg-red-600','text-white');btn.classList.add('bg-red-950/80','text-red-300');}},4000);return;}clearTimeout(clearAllSavedTimer);
clearAllSavedArmed=false;state.savedIdeas=[];persistSavedIdeas();updateBadges();renderSavedIdeasGrid();if(btn){btn.innerHTML=` Clear All Cards`;
btn.classList.remove('bg-red-600','text-white');btn.classList.add('bg-red-950/80','text-red-300');}showToast("All cards cleared from Library.",
"success");}
/* Only a completed click/tap outside closes the five Library info disclosures.
   Do not react to pointerdown, touchstart, scroll, or gestures: users can scroll
   the page on mobile without losing an expanded panel. */
(function installRivisLibraryAutoMinimize(){
 const active='#savedIdeasGridContainer details[data-rivis-auto-minimize][open]';
 document.addEventListener('click',event=>{
  const target=event.target;
  document.querySelectorAll(active).forEach(details=>{
   if(!details.contains(target))details.open=false;
  });
 },true);
})();
function toggleStatusTile(detailsEl){if(!detailsEl||!detailsEl.open)return;const bar=detailsEl.closest('.rivis-status-bar');
if(!bar)return;bar.querySelectorAll('details.rivis-status-tile[open]').forEach(other=>{if(other!==detailsEl)other.open=false;
});}
function libraryStatusToolbar(idea,audit,location='library'){const isLib=location==='library';const opp=calculateOpportunityScore(idea);
const qOk=audit.passedCount===audit.totalChecks;const qStatus=qOk?'status-pass':'status-warning';const qValue=`${audit.passedCount}/${audit.totalChecks}`;
const qBody=audit.checks.map(c=>`<div class="status-detail-row"><span class="${c.passed?'text-emerald-400':'text-amber-400'} font-bold">${c.passed?'✓':'!'} ${escapeHtml(c.label)}</span><div>${escapeHtml(c.detail)}</div></div>`).join('');
const hChecks=hybridConflictChecks(idea);const hPassed=hChecks.filter(c=>c.ok).length;const hOk=hPassed===hChecks.length;const hStatus=hOk?'status-pass':'status-warning';
const hValue=`${hPassed}/${hChecks.length}`;const hBody=hChecks.map(c=>`<div class="status-detail-row"><span class="${c.ok?'text-emerald-400':'text-amber-400'} font-bold">${c.ok?'✓':'!'} ${escapeHtml(c.label)}</span><div>${escapeHtml(c.detail)}</div></div>`).join('');
const oValue=opp.totalScore===null?'—':`${opp.totalScore}/100`;const oStatus=opp.totalScore===null?'status-empty':opp.totalScore>=75?'status-pass':opp.totalScore>=50?'status-warning':'status-brief';
const oBody=opp.totalScore===null?`<div class="status-detail-row">${escapeHtml(opp.reasoning)}</div>`:Object.entries({buyer:'Pembeli',use:'Kegunaan',difference:'Pembeda',execution:'Kelayakan'}).map(([key,label])=>`<div class="status-detail-row"><strong class="text-slate-100">${label} · ${opp.breakdown[key]}/5</strong><div>${escapeHtml(idea.conceptReview?.[key]?.reason||'')}</div></div>`).join('');
const buyerLabel=idea.requestedTargetBuyer||idea.targetBuyer||'Designers';const needLabel=idea.requestedDesignNeed||idea.commercialUseCase||'Commercial Asset';
const statusLabel=isLib?(idea.productionType==='series'?(seriesIsComplete(idea,true)?'Ready':seriesImageCount(idea)?`Series ${seriesImageCount(idea)}/${idea.seriesScenes?.length||0}`:'Draft'):(!idea.generatedImageUrl?'Draft':idea.imagePromptOutdated||idea.metadataOutdated?'Outdated':idea.metadata?'Ready':'Image')):escapeHtml(String(idea.aspectRatio||'1:1'));
const cStatus=isLib?(idea.productionType==='series'?(seriesIsComplete(idea,true)?'status-pass':seriesImageCount(idea)?'status-warning':'status-brief'):(idea.imagePromptOutdated||idea.metadataOutdated?'status-warning':idea.generatedImageUrl&&idea.metadata?'status-pass':'status-brief')):'status-brief';
const cBody=`<div class="status-detail-row"><strong class="text-slate-100">Target Pembeli:</strong> ${escapeHtml(buyerLabel)}</div> <div class="status-detail-row"><strong class="text-slate-100">Kebutuhan Desain:</strong> ${escapeHtml(needLabel)}</div> <div class="status-detail-row"><strong class="text-slate-100">Medium &amp; Gaya:</strong> ${isRasterIdea(idea)?escapeHtml(RASTER_MODES[ideaOutputMode(idea)]):'Vector / SVG-Friendly'} · ${escapeHtml(idea.creativeDirection||'Commercial')}</div> <div class="status-detail-row"><strong class="text-slate-100">Rasio &amp; Kode:</strong> ${escapeHtml(idea.aspectRatio||'1:1')} · ${escapeHtml(getCardUniqueCode(idea).toUpperCase())}${isLib?(idea.productionType==='series'?` · ${seriesImageCount(idea)}/${idea.seriesScenes?.length||0} scene · ${idea.seriesScenes?.filter(x=>x.metadata).length||0} metadata`:` · ${idea.generatedImageUrl?'Gambar siap':'Belum ada gambar'} · ${idea.metadata?'Metadata siap':'Belum ada metadata'}`):''}</div>`;
return`<div class="rivis-status-bar"> <details class="rivis-status-tile" data-rivis-auto-minimize="status" ontoggle="toggleStatusTile(this)"><summary class="rivis-status-summary ${qStatus}" title="Quality Guard (${qValue})"><span class="status-top"><span>${qValue}</span></span><span class="status-label">Quality Guard</span></summary><div class="rivis-status-panel">${qBody}</div></details> <details class="rivis-status-tile" data-rivis-auto-minimize="status" ontoggle="toggleStatusTile(this)"><summary class="rivis-status-summary ${hStatus}" title="Hybrid Prompt Guard (${hValue})"><span class="status-top"><span>${hValue}</span></span><span class="status-label">Hybrid Guard</span></summary><div class="rivis-status-panel">${hBody}</div></details> <details class="rivis-status-tile" data-rivis-auto-minimize="status" ontoggle="toggleStatusTile(this)"><summary class="rivis-status-summary ${oStatus}" title="Opportunity Score (${oValue})"><span class="status-top"><span>${oValue}</span></span><span class="status-label">Opportunity</span></summary><div class="rivis-status-panel">${oBody}</div></details> <details class="rivis-status-tile" data-rivis-auto-minimize="status" ontoggle="toggleStatusTile(this)"><summary class="rivis-status-summary ${cStatus}" title="Arahan Komersial"><span class="status-top"><span>${statusLabel}</span></span><span class="status-label">Komersial</span></summary><div class="rivis-status-panel">${cBody}</div></details> </div>`;
}
function libraryDuplicateIds(ideas){const firstSeen=new Map(),duplicates=new Set();for(const idea of ideas){const id=idea.ideaId;
for(const [prefix,value] of [['title',idea.conceptName],['prompt',idea.finalGenerationPrompt]]){const normalized=String(value||'').toLowerCase().trim();
if(!normalized)continue;const key=prefix+':'+normalized;if(!firstSeen.has(key))firstSeen.set(key,id);else if(firstSeen.get(key)!==id){duplicates.add(firstSeen.get(key));
duplicates.add(id);}}}return duplicates;}
const RIVIS_THUMB_PLACEHOLDER='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
function renderSavedCardHtml(idea,libraryDuplicates){const code=getCardUniqueCode(idea);
const previewSrc=(typeof idea.generatedImagePreviewUrl==='string'&&/^(data:image\/|blob:|https?:\/\/)/i.test(idea.generatedImagePreviewUrl))?idea.generatedImagePreviewUrl:RIVIS_THUMB_PLACEHOLDER;
const nativeWidth=Number(idea.generatedImageWidth||idea.visualPreflight?.technical?.width)||0;
const nativeHeight=Number(idea.generatedImageHeight||idea.visualPreflight?.technical?.height)||0;
const thumbReady=previewSrc!==RIVIS_THUMB_PLACEHOLDER;
const baseName=getCardBaseFilename(idea);const metadataFilename=getMetadataAssetFilename(idea);const audit=auditIdeaQuality(idea);const isDuplicate=libraryDuplicates.has(idea.ideaId);
const meta=idea.metadata?normalizeAdobeStockMetadata(idea,idea.metadata):null;const titleLength=meta?.stockTitle.length||0;const keywordCount=meta?.keywords.length||0;
const titleValid=titleLength>0&&titleLength<=70;const keywordsValid=keywordCount>=30&&keywordCount<=40;const csvReady=Boolean(meta&&titleValid&&keywordsValid&&meta.adobeCategoryCode>=1&&meta.adobeCategoryCode<=21);
return`<div data-rivis-card-id="${escapeHtml(String(idea.ideaId))}" class="p-4 rounded-xl bg-slate-950 border ${isDuplicate?'border-amber-700/80 shadow-lg shadow-amber-950/20':'border-slate-800 hover:border-purple-600/60'} transition-all flex flex-col justify-between space-y-4">
      ${isDuplicate?`<div class="${uiClasses[1]}"><span class="flex items-center gap-1.5"> Duplicate Warning</span><span class="${uiClasses[2]}">Duplicate in Library</span></div>`:''}
      <div class="space-y-3"> <div class="flex justify-between items-start gap-2"> <div> <div class="flex items-center gap-1.5 mb-0.5"> <span class="text-[9px] font-mono text-purple-400 font-bold tracking-wider">${code.toUpperCase()}</span> <span class="text-[9px] font-bold uppercase bg-slate-900 px-1.5 py-0.2 rounded border border-slate-700 text-slate-300">${idea.productionType==='collection'?'Collection Set'+(Number(idea.collectionItemCount)>0?' · '+Number(idea.collectionItemCount)+' items':''):idea.productionType==='series'?'Series · '+(idea.seriesScenes?.length||idea.seriesLength||5)+' scenes':'Single Asset'}</span> </div> <h4 class="text-sm font-bold text-white leading-snug">${escapeHtml(idea.conceptName)}</h4> <div class="text-[10px] text-cyan-300 font-semibold">${isRasterIdea(idea)?'RASTER · '+escapeHtml(RASTER_MODES[ideaOutputMode(idea)])+' · '+rasterSnapshot(idea).format.toUpperCase():'VECTOR · SVG-Friendly'}</div> </div> <div class="flex items-center gap-1 shrink-0"> <button type="button" onclick="removeSavedIdea('${escapeHtml(idea.ideaId)}')" class="p-1 text-slate-500 hover:text-red-400 transition-colors" title="Remove" aria-label="Hapus kartu">×</button> </div> </div>
        ${libraryStatusToolbar(idea,audit,'library')}
        ${idea.generatedImageUrl&&idea.productionType!=='series'?`<div class="flex gap-1.5 flex-wrap"><button type="button" onclick="downloadGeneratedImage('${escapeHtml(idea.ideaId)}')" class="flex-1 px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-cyan-200 font-bold text-[10px]">Unduh PNG/JPG Asli</button><button type="button" onclick="RIVIS_VECTOR.open('${escapeHtml(idea.ideaId)}')" class="flex-1 px-2 py-1.5 rounded-lg bg-violet-700 hover:bg-violet-600 text-white font-bold text-[10px]">AI Vector SVG</button></div><div class="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900 group shadow-inner"> <img loading="lazy" decoding="async" src="${previewSrc}" onload="if(this.dataset.thumbReady==='1')showNativeSize(this)" onerror="rivisRecoverLibraryImage(this)" data-thumb-ready="${thumbReady?'1':'0'}" data-native-width="${nativeWidth}" data-native-height="${nativeHeight}" data-rivis-thumb-id="${escapeHtml(idea.ideaId)}" data-lightbox-id="${escapeHtml(idea.ideaId)}" class="w-full h-48 object-contain bg-slate-950 cursor-zoom-in transition-transform duration-300 group-hover:scale-105" alt="Generated stock preview" /> <div class="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none"> <span class="px-3 py-1.5 bg-purple-600/90 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-lg"> Zoom Preview</span> </div> ${idea.imageGeneratedOn?`<span class="absolute left-2 bottom-2 z-20 pointer-events-none bg-slate-950/80 border border-slate-600/50 text-slate-100 text-[9px] font-semibold px-2 py-1 rounded-md shadow" aria-label="Tanggal generate">Generated: ${escapeHtml(rivisDisplayDate(idea.imageGeneratedOn))}</span>`:''} </div> <p class="mt-1 text-xs text-slate-400">Memeriksa dimensi gambar…</p>`:''}
        ${renderSeriesSceneGallery(idea)}
        ${idea.generatedImageUrl?(idea.visualPreflight?`<div class="rivis-preflight-row"> <details class="rounded-lg bg-slate-900/80 border border-slate-800 text-[10px]"> <summary class="rivis-preflight-summary cursor-pointer font-bold ${idea.visualPreflight.status==='PASS'?'text-emerald-400':idea.visualPreflight.status==='REVIEW'?'text-amber-400':'text-rose-400'}"> <span class="rivis-preflight-title">Visual Preflight: ${idea.visualPreflight.score}/100</span> <span class="rivis-preflight-status shrink-0">(${idea.visualPreflight.status})</span> </summary> <div class="space-y-1.5 px-2.5 pb-2.5 pt-2 border-t border-slate-800/80">
              ${idea.visualPreflight.technical?`<p class="text-[10px] text-cyan-300">Teknis: ${idea.visualPreflight.technical.width}×${idea.visualPreflight.technical.height} px (<span class="font-bold ${Number(idea.visualPreflight.technical.mp)>=4?'text-emerald-400':'text-rose-400'}">${idea.visualPreflight.technical.mp} MP</span>) · Kontras ${idea.visualPreflight.technical.lumaStd}</p>`:''}
              ${idea.promptQualityOptimization?.ruleCount?`<p class="text-[10px] text-violet-300">Smart Prompt Guard: ${idea.promptQualityOptimization.ruleCount} koreksi preventif tanpa request AI tambahan.</p>`:''}${idea.qualityRepairMessage?`<p class="text-[10px] text-amber-300">${escapeHtml(idea.qualityRepairMessage)}</p>`:''}
              ${idea.visualPreflight.components?Object.values(idea.visualPreflight.components).map(c=>`<p class="text-slate-300"><strong class="text-slate-200">${escapeHtml(c.label)} (${c.weight}%): ${c.score}/100</strong> — ${escapeHtml(c.reason)}</p>`).join(''):''}
              ${(idea.visualPreflight.issues||[]).map(issue=>`<p class="text-amber-300">! ${escapeHtml(visualPreflightIssueText(issue))}</p>`).join('')}
              ${(idea.visualPreflight.manualChecks||[]).map(check=>`<p class="text-slate-400">• ${escapeHtml(check)}</p>`).join('')}
              <p class="text-slate-500 pt-1">Penilaian AI berbasis gambar yang dirender; bukan jaminan persetujuan Adobe Stock. Periksa 100% dan vectorize sebelum unggah.</p> </div> </details> <button type="button" onclick="handleAuditGeneratedImage('${escapeHtml(idea.ideaId)}',this)" class="rivis-preflight-recheck rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700" title="Periksa Ulang Visual Preflight">Periksa Ulang</button> </div>`:`<div class="rivis-preflight-row"> <div class="rivis-preflight-empty rounded-lg bg-slate-900/60 border border-slate-800 text-[10px] text-slate-400"><span class="rivis-preflight-title">${idea.visualPreflightPending?'Memeriksa detail 1:1 & teknis…':'Visual Preflight belum tersedia.'}</span></div> <button type="button" ${idea.visualPreflightPending?'disabled':''} onclick="handleAuditGeneratedImage('${escapeHtml(idea.ideaId)}',this)" class="rivis-preflight-recheck rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-semibold border border-slate-700" title="Periksa Ulang Visual Preflight">${idea.visualPreflightPending?'Memeriksa…':'Periksa Ulang'}</button> </div>`):''}
        ${idea.productionType==='collection'&&idea.collectionCheck?`<div class="text-[10px] rounded-lg border px-2.5 py-2 ${idea.collectionCheck.pass?'border-emerald-800/70 bg-emerald-950/25 text-emerald-300':'border-amber-800/70 bg-amber-950/20 text-amber-300'}">Collection AI Check: ${escapeHtml(idea.collectionCheck.summary||'Perlu verifikasi manual')} · Target ${Number(idea.collectionItemCount)||'?'} item</div>`:''}
        ${idea.colorPaletteHex&&Array.isArray(idea.colorPaletteHex)?`<details class="rounded-lg border border-slate-800 bg-slate-900/60 text-[10px]" data-rivis-auto-minimize="palette" ontoggle="trackLibraryAccordion(this,'palette','${escapeHtml(idea.ideaId)}')" ${openPaletteAccordions.has(idea.ideaId)?'open':''}><summary class="cursor-pointer select-none px-2.5 py-2 font-bold text-slate-300">Extracted Dominant Colors <span class="text-slate-500">(${idea.colorPaletteHex.length})</span></summary><div class="px-2 pb-2 space-y-1"><div class="flex items-center justify-end gap-1.5"><button type="button" onclick="copyCardPalette('${escapeHtml(idea.ideaId)}','library',this)" title="Salin semua warna HEX kartu ini." class="px-2 py-1 rounded border border-slate-700 bg-slate-900 text-purple-200 text-[9px] font-bold flex items-center gap-1"> Copy Palette</button></div> <div class="flex items-center gap-1.5 flex-wrap">
            ${idea.colorPaletteHex.map(hex=>`<button type="button" onclick="copySingleHexCode('${hex}')" title="Click to copy ${hex}" class="flex items-center gap-1 bg-slate-900 border border-slate-800 hover:border-purple-500 rounded px-1.5 py-0.5 text-[9px] font-mono text-slate-300 transition-colors"><span class="w-2.5 h-2.5 rounded-full border border-white/20" style="background-color: ${hex}"></span>${hex}</button>`).join('')}
          </div> </div></details>`:''}
        ${cardPromptEditor(idea,'library')}
        ${meta?`<details class="rivis-meta-accordion rounded-lg bg-blue-950/30 border border-blue-900/60 text-[10px]" data-meta-id="${escapeHtml(idea.ideaId)}" ontoggle="handleMetadataAccordionToggle(this,'${escapeHtml(idea.ideaId)}')" ${openMetadataAccordions.has(idea.ideaId)?'open':''}> <summary class="rivis-meta-summary" title="Buka atau tutup metadata Adobe Stock."> <span class="font-bold text-blue-300 truncate">ADOBE STOCK CSV METADATA</span> <span class="flex items-center gap-1.5 shrink-0"><span class="px-1.5 py-0.5 rounded border ${csvReady?'bg-emerald-950/80 border-emerald-700 text-emerald-300':'bg-amber-950/80 border-amber-700 text-amber-300'} text-[9px] font-mono">${csvReady?'CSV READY':'CHECK'}</span></span> </summary> <div class="p-3 space-y-2 border-t border-blue-900/40"> <div class="flex justify-end gap-1.5"><button type="button" onclick="exportSavedIdeaMetadataTXT('${escapeHtml(idea.ideaId)}')" title="Unduh metadata TXT." class="px-2 py-1 bg-slate-800 rounded text-slate-200">TXT</button><button type="button" onclick="exportSavedIdeaMetadataCSV('${escapeHtml(idea.ideaId)}')" title="Unduh metadata CSV." class="px-2 py-1 bg-slate-800 rounded text-slate-200">CSV</button></div> <div class="rivis-meta-line rounded border border-slate-800 bg-slate-950/70 p-2 text-[9px] font-mono text-slate-400"> <span class="rivis-meta-file" title="${escapeHtml(metadataFilename)}"><span>Filename:</span> <span class="text-cyan-300">${escapeHtml(metadataFilename)}</span></span> <span class="rivis-meta-category"><span>Category:</span> <span class="text-slate-200">${meta.adobeCategoryCode} (${escapeHtml(meta.adobeCategory)})</span></span> </div> <div><div class="flex justify-between items-center text-[9px] mb-0.5"><span class="font-bold text-slate-400">Title</span><span class="font-mono ${titleValid?'text-emerald-400':'text-amber-400'}">${titleLength}/70 chars</span></div><p class="font-bold text-white bg-slate-900/80 p-1.5 rounded border border-slate-800">${escapeHtml(meta.stockTitle)}</p></div> <div class="space-y-1"><div class="flex justify-between text-[9px]"><span class="text-slate-400 font-bold">Keywords (relevance-ordered)</span><span class="font-mono ${keywordsValid?'text-emerald-400':'text-amber-400'}">${keywordCount}/40 tags</span></div><div class="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">${meta.keywords.map(kw=>`<span class="px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 rounded text-[9px]">${escapeHtml(kw)}</span>`).join('')}</div></div> <button type="button" onclick="copyIdeaKeywords('${escapeHtml(idea.ideaId)}',this)" title="Salin semua keyword Adobe Stock." class="w-full py-1.5 bg-blue-900/50 hover:bg-blue-800 text-blue-200 font-bold rounded text-[9px] border border-blue-700/50"> Copy All Keywords</button> </div> </details>`:''}
      </div> <div class="space-y-2 pt-3 border-t border-slate-800"> <div class="rivis-library-action-row ${idea.productionType==='series'?'is-series':''}"> <button type="button" data-card-meta-btn="${escapeHtml(idea.ideaId)}" onclick="handleGenerateMetadataForIdea('${escapeHtml(idea.ideaId)}', this)" class="flex-1 min-w-[75px] py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold rounded text-[10px] flex items-center justify-center gap-1 border border-slate-700 transition-all active:scale-95"> <span>${idea.productionType==='series'?'Re Metadata · Scenes':'Re Metadata'}</span></button> ${idea.productionType!=='series'?`<button type="button" onclick="handleRemixStyleVariations('${escapeHtml(idea.ideaId)}', this)" class="px-2.5 py-1 bg-purple-900/60 hover:bg-purple-800 text-purple-200 font-bold rounded text-[10px] flex items-center gap-1 border border-purple-700 transition-all active:scale-95"> <span>Remix</span></button>`:''} <button type="button" onclick="RIVIS_SAVE_CARD_TO_CLOUD(&quot;${escapeHtml(idea.ideaId)}&quot;,this)" class="px-2.5 py-1 bg-sky-950/70 hover:bg-sky-900 text-sky-200 font-bold rounded text-[10px] flex items-center gap-1 border border-sky-700/70 transition-all active:scale-95"><span>Save to Cloud</span></button> <button type="button" onclick="handleDownloadSingleCardZip('${escapeHtml(idea.ideaId)}', this)" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold rounded text-[10px] flex items-center gap-1 border border-slate-700 transition-all active:scale-95" title="Download full ZIP for this card"> <span>ZIP Card</span></button> </div> <button type="button" data-card-image-btn="${escapeHtml(idea.ideaId)}" onclick="handleGenerateStockImageForIdea('${escapeHtml(idea.ideaId)}', this)" class="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition-all active:scale-95"><svg aria-hidden="true" class="rivis-icon w-3.5 h-3.5"><use href="#rivis-sparkles"></use></svg> <span>${idea.productionType==='series'?(seriesImageCount(idea)===(idea.seriesScenes?.length||0)?'Regenerate Series':seriesImageCount(idea)?'Resume Series · '+((idea.seriesScenes?.length||0)-seriesImageCount(idea))+' left':'Generate Series · '+(idea.seriesScenes?.length||idea.seriesLength||5)+' scenes'):(idea.generatedImageUrl?'Regenerate Image':'Generate High-Res Image')}</span></button> </div> </div>`;
}
let libraryPaintDirty=true,libraryRenderedDuplicateIds=new Set();
function renderSavedIdeasGrid(changedId=null,skipWhenClean=false){const container=byId('savedIdeasGridContainer');
if(!container||state.activeTab!=='saved_ideas'||byId('tabSectionSavedIdeas')?.classList.contains('hidden'))return;const ideas=state.savedIdeas;
if(!ideas.length){container.innerHTML=`<div class="text-center py-16 text-slate-500 text-xs space-y-2"><p>Belum ada ide. Generate dari Idea Studio untuk menyimpan otomatis ke Library.</p></div>`;
libraryPaintDirty=false;libraryRenderedDuplicateIds=new Set();return;}container.className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5";
const sameOrder=container.children.length===ideas.length&&ideas.every((idea,i)=>container.children[i].getAttribute('data-rivis-card-id')===String(idea.ideaId));
if(changedId==null&&skipWhenClean&&!libraryPaintDirty&&sameOrder)return;const duplicates=libraryDuplicateIds(ideas);if(changedId!=null&&sameOrder){const affected=new Set([String(changedId)]);
for(const id of libraryRenderedDuplicateIds)if(!duplicates.has(id))affected.add(String(id));for(const id of duplicates)if(!libraryRenderedDuplicateIds.has(id))affected.add(String(id));
for(let i=0;i<ideas.length;i++){const idea=ideas[i];if(!affected.has(String(idea.ideaId)))continue;const existing=container.children[i];
const template=document.createElement('template');template.innerHTML=renderSavedCardHtml(idea,duplicates);const replacement=template.content.firstElementChild;
if(!replacement)continue;const oldPreflight=existing.querySelector('.rivis-preflight-row details');const newPreflight=replacement.querySelector('.rivis-preflight-row details');
if(oldPreflight&&newPreflight)newPreflight.open=oldPreflight.open;
// A metadata update can redraw this card while image AI is still running.
// Move the *existing* busy button into the new card: its timer and progress
// continue targeting the same element rather than a disconnected old button.
for(const [kind,attribute] of [['image','data-card-image-btn'],['meta','data-card-meta-btn']]){
  if(!hasCardJob(idea.ideaId,kind))continue;
  const live=existing.querySelector('['+attribute+']');
  const placeholder=replacement.querySelector('['+attribute+']');
  if(live&&placeholder)placeholder.replaceWith(live);
}
existing.replaceWith(replacement);}}else{
  const preserved=new Map();
  for(const idea of ideas){
    const oldCard=Array.from(container.children).find(node=>node.getAttribute('data-rivis-card-id')===String(idea.ideaId));
    if(!oldCard)continue;
    for(const [kind,attr] of [['image','data-card-image-btn'],['meta','data-card-meta-btn']]){
      if(!hasCardJob(idea.ideaId,kind))continue;
      const live=oldCard.querySelector('['+attr+']');
      if(live)preserved.set(String(idea.ideaId)+':'+kind,live);
    }
  }
  container.innerHTML=ideas.map(idea=>renderSavedCardHtml(idea,duplicates)).join('');
  for(const [key,live] of preserved){
    const i=key.lastIndexOf(':'),id=key.slice(0,i),kind=key.slice(i+1);
    const card=Array.from(container.children).find(node=>node.getAttribute('data-rivis-card-id')===id);
    const target=card?.querySelector('['+(kind==='image'?'data-card-image-btn':'data-card-meta-btn')+']');
    if(target)target.replaceWith(live);
  }
}libraryPaintDirty=false;libraryRenderedDuplicateIds=duplicates;observeMissingLibraryThumbnails();}
let libraryThumbObserver=null,libraryThumbQueue=[],libraryThumbQueued=new Set(),libraryThumbWorker=false;
function rivisRecoverLibraryImage(img){
 if(!img)return;
 const id=img.dataset.rivisThumbId;
 const idea=state.savedIdeas.find(item=>String(item.ideaId)===String(id));
 const source=idea?.generatedImageUrl;
 if(!source||img.dataset.rivisFallbackSource==='attempted'){
  img.removeAttribute('onerror');
  img.removeAttribute('src');
  img.alt='Gambar tidak dapat dibaca. Muat ulang card dari Cloud Gallery jika tersedia.';
  img.closest('[data-rivis-card-id]')?.setAttribute('data-rivis-image-error','1');
  console.warn('RIVIS Library image unavailable:',id);
  return;
 }
 img.dataset.rivisFallbackSource='attempted';
 img.dataset.thumbReady='1';
 img.src=source;
}

function observeMissingLibraryThumbnails(){
 const root=byId('savedIdeasGridContainer');if(!root)return;
 const imgs=root.querySelectorAll('img[data-rivis-thumb-id][data-thumb-ready="0"]');
 if(!imgs.length)return;
 if(typeof IntersectionObserver==='undefined'){
  for(const img of imgs){const id=img.dataset.rivisThumbId;if(id&&!libraryThumbQueued.has(id)){libraryThumbQueued.add(id);libraryThumbQueue.push(id);}}
  processLibraryThumbnailQueue();return;
 }
 if(!libraryThumbObserver)libraryThumbObserver=new IntersectionObserver(entries=>{
  for(const entry of entries){if(!entry.isIntersecting)continue;const img=entry.target;libraryThumbObserver.unobserve(img);
   const id=img.dataset.rivisThumbId;if(id&&!libraryThumbQueued.has(id)){libraryThumbQueued.add(id);libraryThumbQueue.push(id);}
  }processLibraryThumbnailQueue();
 },{rootMargin:'240px 0px'});
 imgs.forEach(img=>libraryThumbObserver.observe(img));
}
async function processLibraryThumbnailQueue(){
 if(libraryThumbWorker)return;libraryThumbWorker=true;let changed=false;
 try{
  while(libraryThumbQueue.length){
   const id=libraryThumbQueue.shift();libraryThumbQueued.delete(id);
   const idea=state.savedIdeas.find(item=>String(item.ideaId)===String(id));
   const img=Array.from(byId('savedIdeasGridContainer')?.querySelectorAll('img[data-rivis-thumb-id]')||[]).find(el=>el.dataset.rivisThumbId===String(id));
   if(!idea?.generatedImageUrl||idea.generatedImagePreviewUrl||!img)continue;
   const source=idea.generatedImageUrl;
   // Show the original immediately. Thumbnail generation is an optimization,
   // not a prerequisite for displaying a saved image.
   if(img.getAttribute('src')===RIVIS_THUMB_PLACEHOLDER){
    img.dataset.thumbReady='1';
    img.src=source;
   }
   try{
    const thumb=await rivisCreateLibraryThumbnail(source);
    const current=state.savedIdeas.find(item=>String(item.ideaId)===String(id));
    if(!current||current.generatedImageUrl!==source)continue;
    current.generatedImagePreviewUrl=thumb.url;current.generatedImageWidth=thumb.width;current.generatedImageHeight=thumb.height;
    const live=Array.from(byId('savedIdeasGridContainer')?.querySelectorAll('img[data-rivis-thumb-id]')||[]).find(el=>el.dataset.rivisThumbId===String(id));
    if(live){
     live.dataset.thumbReady='1';live.dataset.nativeWidth=String(thumb.width);live.dataset.nativeHeight=String(thumb.height);
     live.dataset.rivisFallbackSource='';live.src=thumb.url;
    }
    if(img.complete)showNativeSize(img);changed=true;
   }catch(error){console.warn('Library thumbnail skipped; original remains visible:',id,error?.message||error);if(img.isConnected&&img.getAttribute('src')===RIVIS_THUMB_PLACEHOLDER)rivisRecoverLibraryImage(img);}
   await new Promise(resolve=>setTimeout(resolve,0));
  }
  if(changed)persistSavedIdeas();
 }finally{libraryThumbWorker=false;if(libraryThumbQueue.length)processLibraryThumbnailQueue();}
}
let lightboxState={scale:1,x:0,y:0,min:1,
max:8,dragging:false,startX:0,startY:0,originX:0,originY:0,pointers:new Map(),pinchDistance:0,pinchScale:1,pinchCenterX:0,pinchCenterY:0,
lastTap:0,seriesLightboxIdeaId:null,seriesLightboxIndex:null};
function lightboxElements(){return{modal:byId('imageLightboxModal'),viewport:byId('lightboxViewport'),img:byId('lightboxImg'),
title:byId('lightboxTitle'),downloadBtn:byId('lightboxDownloadBtn'),label:byId('lightboxZoomLabel'),zoomOut:byId('lightboxZoomOut'),
zoomIn:byId('lightboxZoomIn'),seriesPrev:byId('seriesLightboxPrev'),seriesNext:byId('seriesLightboxNext')};}
function clampLightboxPan(){const{viewport,img}=lightboxElements();if(!viewport||!img)return;
const vw=viewport.clientWidth,vh=viewport.clientHeight;const bw=img.offsetWidth,bh=img.offsetHeight;const maxX=Math.max(0,(bw*lightboxState.scale-vw)/2);
const maxY=Math.max(0,(bh*lightboxState.scale-vh)/2);lightboxState.x=Math.min(maxX,Math.max(-maxX,lightboxState.x));lightboxState.y=Math.min(maxY,
Math.max(-maxY,lightboxState.y));}
function applyLightboxTransform(){const{viewport,img,label,zoomOut,zoomIn}=lightboxElements();
if(!viewport||!img)return;clampLightboxPan();img.style.transform=`translate(calc(-50% + ${lightboxState.x}px), calc(-50% + ${lightboxState.y}px)) scale(${lightboxState.scale})`;
viewport.classList.toggle('is-zoomed',lightboxState.scale>1.001);viewport.classList.toggle('is-dragging',lightboxState.dragging);
if(label)label.textContent=lightboxState.scale.toFixed(1)+'×';if(zoomOut)zoomOut.disabled=lightboxState.scale<=lightboxState.min+0.001;
if(zoomIn)zoomIn.disabled=lightboxState.scale>=lightboxState.max-0.001;}
function setLightboxZoom(nextScale,clientX,clientY){const{viewport}=lightboxElements();
if(!viewport)return;const oldScale=lightboxState.scale;const scale=Math.min(lightboxState.max,Math.max(lightboxState.min,nextScale));
if(scale<=1.001){lightboxState.scale=1;lightboxState.x=0;lightboxState.y=0;applyLightboxTransform();return;}if(typeof clientX==='number'&&typeof clientY==='number'){const rect=viewport.getBoundingClientRect();
const px=clientX-rect.left-rect.width/2;const py=clientY-rect.top-rect.height/2;const ratio=scale/oldScale;lightboxState.x=px-(px-lightboxState.x)*ratio;
lightboxState.y=py-(py-lightboxState.y)*ratio;}lightboxState.scale=scale;applyLightboxTransform();}
function changeLightboxZoom(factor){setLightboxZoom(lightboxState.scale*factor);
}
function resetLightboxZoom(){setLightboxZoom(1);}
function setLightboxNativeZoom(){const{img}=lightboxElements();if(!img?.naturalWidth||!img.offsetWidth){resetLightboxZoom();
return;}const nativeScale=img.naturalWidth/img.offsetWidth;if(nativeScale<=1.02){resetLightboxZoom();showToast('Gambar sudah pada ukuran asli atau lebih kecil dari jendela.',
'info');return;}setLightboxZoom(Math.min(lightboxState.max,nativeScale));}
function openImageLightbox(imgUrl,title,ideaId){if(!imgUrl)return;
lightboxState.seriesLightboxIdeaId=null;lightboxState.seriesLightboxIndex=null;
const{modal,img,title:titleEl,downloadBtn,seriesPrev,seriesNext}=lightboxElements();if(!modal||!img)return;img.src=imgUrl;if(titleEl)titleEl.innerText=title||'Stock Image Preview';
if(downloadBtn)downloadBtn.onclick=()=>{if(ideaId)downloadGeneratedImage(ideaId);};
seriesPrev?.classList.add('hidden');seriesNext?.classList.add('hidden');
modal.classList.remove('hidden');modal.classList.add('flex');
document.body.style.overflow='hidden';lightboxState.pointers.clear();lightboxState.dragging=false;resetLightboxZoom();img.onload=resetLightboxZoom;
}
function closeImageLightbox(e){const{modal,img,seriesPrev,seriesNext}=lightboxElements();if(!modal)return;if(!e||e.target===modal){modal.classList.add('hidden');
modal.classList.remove('flex');document.body.style.overflow='';lightboxState.pointers.clear();lightboxState.dragging=false;lightboxState.seriesLightboxIdeaId=null;lightboxState.seriesLightboxIndex=null;
seriesPrev?.classList.add('hidden');seriesNext?.classList.add('hidden');if(img)img.src='';
}}
function openIdeaLightbox(ideaId){const idea=state.savedIdeas.find(i=>i.ideaId===ideaId)||state.discoveredIdeas.find(i=>i.ideaId===ideaId);
if(idea?.generatedImageUrl)openImageLightbox(idea.generatedImageUrl,idea.conceptName,idea.ideaId);}
function initLightboxZoom(){const{viewport}=lightboxElements();
if(!viewport||viewport.dataset.zoomReady)return;viewport.dataset.zoomReady='1';viewport.addEventListener('wheel',e=>{e.preventDefault();
const factor=e.deltaY<0?1.2:1/1.2;setLightboxZoom(lightboxState.scale*factor,e.clientX,e.clientY);},{passive:false});viewport.addEventListener('dblclick',
e=>{if(e.target.closest('button'))return;e.preventDefault();if(lightboxState.scale>1.05)resetLightboxZoom();else setLightboxZoom(2.5,
e.clientX,e.clientY);});viewport.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;viewport.setPointerCapture(e.pointerId);
lightboxState.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(lightboxState.pointers.size===2){const pts=[...lightboxState.pointers.values()];
lightboxState.dragging=false;lightboxState.pinchDistance=Math.hypot(pts[1].x-pts[0].x,pts[1].y-pts[0].y)||1;lightboxState.pinchScale=lightboxState.scale;
lightboxState.pinchCenterX=(pts[0].x+pts[1].x)/2;lightboxState.pinchCenterY=(pts[0].y+pts[1].y)/2;}else if(lightboxState.pointers.size===1){if(e.pointerType==='touch'){const now=Date.now();
if(now-lightboxState.lastTap<300){lightboxState.lastTap=0;if(lightboxState.scale>1.05)resetLightboxZoom();else setLightboxZoom(2.5,
e.clientX,e.clientY);return;}lightboxState.lastTap=now;}if(lightboxState.scale>1.001){lightboxState.dragging=true;lightboxState.startX=e.clientX;
lightboxState.startY=e.clientY;lightboxState.originX=lightboxState.x;lightboxState.originY=lightboxState.y;applyLightboxTransform();
}}});viewport.addEventListener('pointermove',e=>{if(!lightboxState.pointers.has(e.pointerId))return;lightboxState.pointers.set(e.pointerId,
{x:e.clientX,y:e.clientY});if(lightboxState.pointers.size===2){const pts=[...lightboxState.pointers.values()];const dist=Math.hypot(pts[1].x-pts[0].x,
pts[1].y-pts[0].y)||1;const cx=(pts[0].x+pts[1].x)/2;const cy=(pts[0].y+pts[1].y)/2;const nextScale=lightboxState.pinchScale*(dist/lightboxState.pinchDistance);
setLightboxZoom(nextScale,lightboxState.pinchCenterX,lightboxState.pinchCenterY);lightboxState.x+=cx-lightboxState.pinchCenterX;
lightboxState.y+=cy-lightboxState.pinchCenterY;lightboxState.pinchCenterX=cx;lightboxState.pinchCenterY=cy;applyLightboxTransform();
}else if(lightboxState.dragging){lightboxState.x=lightboxState.originX+(e.clientX-lightboxState.startX);lightboxState.y=lightboxState.originY+(e.clientY-lightboxState.startY);
applyLightboxTransform();}});function endPointer(e){lightboxState.pointers.delete(e.pointerId);if(lightboxState.pointers.size<2)lightboxState.pinchDistance=0;
if(lightboxState.pointers.size===0){lightboxState.dragging=false;applyLightboxTransform();}}viewport.addEventListener('pointerup',
endPointer);viewport.addEventListener('pointercancel',endPointer);window.addEventListener('resize',()=>{if(!byId('imageLightboxModal')?.classList.contains('hidden'))applyLightboxTransform();
});}
let offlineTestMode=false;
function syncImageTestOfflineButton(){const btn=byId('imageTestOfflineBtn');const tag=byId('imageTestOfflineState');
if(!btn)return;btn.setAttribute('aria-pressed',String(offlineTestMode));if(tag)tag.hidden=!offlineTestMode;btn.classList.toggle('border-indigo-400',
offlineTestMode);btn.classList.toggle('bg-indigo-900/70',offlineTestMode);btn.classList.toggle('text-white',offlineTestMode);
btn.classList.toggle('border-indigo-700/60',!offlineTestMode);btn.classList.toggle('bg-slate-800',!offlineTestMode);btn.classList.toggle('text-indigo-200',
!offlineTestMode);}
function offlineSampleIdeas(){const base=Date.now().toString(36);const list=[{ideaId:'OFFLINE-'+base+'-1',
shortCode:'of01',conceptName:'Botanical Coffee Packaging Set',productionType:'collection',categoryId:'food',categoryName:'Food & Beverage',
subcategory:'Coffee & Cafe',mainSubject:'Artisanal coffee packaging vector badge and botanical bean branches',creativeDirection:'Flat Vector',
commercialUseCase:'Product Packaging',targetBuyer:'Specialty Coffee Roasters',visualDifferentiation:'Coordinated emblem and botanical corner set with clear editable regions',
suggestedAssetType:'Vector Illustration',suggestedComposition:'Centered',suggestedColorPalette:'Warm Earth (#3B2416, #C97A42, #F4EBD0)',
outputMode:'vector',rasterSettings:{people:'auto',shot:'auto',lighting:'auto',color:'auto',authenticity:'candid',copySpace:'auto',
format:'jpg',jpegQuality:0.95},gradientEnabled:false,svgFriendly:true,noTextChecked:true,aspectRatio:'1:1',finalGenerationPrompt:'Original commercial vector-style illustration: Artisanal coffee packaging botanical branches and roasted beans arranged with clean closed shapes and generous negative space. Visual direction — art direction: Flat Vector; composition: Centered; coordinated colors: Warm Earth (#3B2416, #C97A42, #F4EBD0). Construct bold readable silhouettes, closed separated areas, simple Bézier-friendly contours and minimal unnecessary nodes. No text, lettering, numbers or typography.',
conceptReview:{buyer:{points:4,reason:'Menargetkan roastery kopi spesialti dan desainer kemasan.'},use:{points:4,reason:'Cocok untuk label kemasan dan materi merek.'},
difference:{points:4,reason:'Kombinasi cabang botani dan emblem siap trace SVG.'},execution:{points:5,reason:'Bentuk tertutup bersih tanpa teks acak.'}}},
{ideaId:'OFFLINE-'+base+'-2',shortCode:'of02',conceptName:'Biomedical Lab Collaboration Scene',productionType:'single',categoryId:'edu',
categoryName:'Education & Science',subcategory:'STEM & Research',mainSubject:'Diverse biomedical researchers examining samples in modern laboratory',
creativeDirection:'Clean Commercial Photography',commercialUseCase:'Corporate Presentation',targetBuyer:'Biotech & Healthcare Companies',
visualDifferentiation:'Authentic foreground-midground lab workflow with clean copy space on the right',suggestedAssetType:'Commercial Photography',
suggestedComposition:'Negative Space',suggestedColorPalette:'Cinematic Teal & Warm Neutral (#0F293A, #14B8A6, #F8FAFC)',outputMode:'photo',
rasterSettings:{people:'small',shot:'environmental',lighting:'cinematic',color:'natural',authenticity:'documentary',copySpace:'right',
format:'jpg',jpegQuality:0.95},gradientEnabled:false,svgFriendly:false,noTextChecked:true,aspectRatio:'16:9',finalGenerationPrompt:'Original high-detail commercial photograph: Diverse biomedical research team inspecting laboratory samples with precision instruments in a contemporary glass lab, leaving clean negative space on the right for presentation headlines. Photographic direction — shot: environmental; lighting: cinematic; color direction: natural; authenticity: documentary; people: small. No text, lettering, numbers or typography.',
conceptReview:{buyer:{points:4,reason:'Relevan untuk perusahaan biotek dan laporan kesehatan.'},use:{points:4,reason:'Ruang kosong kanan siap untuk slide presentasi.'},
difference:{points:4,reason:'Interaksi riset autentik, bukan pose kaku.'},execution:{points:4,reason:'Komposisi widescreen siap ekspor JPG.'}}},
{ideaId:'OFFLINE-'+base+'-3',shortCode:'of03',conceptName:'Modular Cloud Security 3D Isometric',productionType:'single',categoryId:'tech',
categoryName:'Technology & AI',subcategory:'Cybersecurity',mainSubject:'Modular 3D geometric shield vault connected to encrypted cloud nodes',
creativeDirection:'Premium 3D Commercial Render',commercialUseCase:'Website Hero',targetBuyer:'SaaS & Cloud Security Teams',visualDifferentiation:'Tactile matte glass and brushed metal blocks with clear focal hierarchy',
suggestedAssetType:'3D Illustration',suggestedComposition:'Centered',suggestedColorPalette:'Corporate Blue (#0B132B, #2563EB, #38BDF8)',
outputMode:'3d',rasterSettings:{people:'none',shot:'auto',lighting:'studio',color:'auto',authenticity:'polished',copySpace:'left',
format:'jpg',jpegQuality:0.95},gradientEnabled:false,svgFriendly:false,noTextChecked:true,aspectRatio:'3:2',finalGenerationPrompt:'Original premium commercial 3D-rendered scene: Modular isometric geometric vault shield linked to translucent cloud storage blocks on a clean studio stage with soft rim lighting and copy space on the left. Maintain plausible physical materials, coherent geometry, accurate surfaces and grounded shadows. No text, lettering, numbers or typography.',
conceptReview:{buyer:{points:5,reason:'Spesifik untuk tim produk SaaS dan keamanan cloud.'},use:{points:4,reason:'Ideal untuk hero banner halaman arahan.'},
difference:{points:4,reason:'Material kaca matte dan logam terstruktur rapi.'},execution:{points:4,reason:'Geometri bersih tanpa teks.'}}}];
list.forEach(item=>{const sc=calculateOpportunityScore(item);item.opportunityScore=sc.totalScore;item.scoreBreakdown=sc.breakdown;
item.scoreReasoning=sc.reasoning;ensureConceptBlueprint(item);});return list;}
function seedOfflineSampleCards(){const existingTitles=new Set(state.savedIdeas.map(i=>String(i.conceptName||'').toLowerCase().trim()));
const samples=offlineSampleIdeas().filter(s=>!existingTitles.has(s.conceptName.toLowerCase().trim()));if(!samples.length)return 0;
state.savedIdeas.unshift(...samples);persistSavedIdeas();updateBadges();renderSavedIdeasGrid();return samples.length;}
function toggleImageTestOffline(){offlineTestMode=!offlineTestMode;
syncImageTestOfflineButton();if(offlineTestMode){const added=seedOfflineSampleCards();showToast(added>0?`Image Test Offline aktif • ${added} kartu contoh ditambahkan ke Library.`:'Image Test Offline aktif • Klik Image, Meta, Image All, atau Meta All untuk uji alur.',
'info');}else{showToast('Image Test Offline dimatikan • Kembali ke mode API Gemini.','info');}}
function offlineRatioDimensions(ratio){const resScale={'1K':1,
'2K':2,'4K':4}[state.imageResolution]||2;const map={'1:1':[1024,1024],'2:3':[832,1248],'3:2':[1248,832],'4:3':[1152,864],'3:4':[864,
1152],'4:5':[896,1120],'5:4':[1120,896],'9:16':[768,1344],'16:9':[1344,768],'21:9':[1536,640]};const[bw,bh]=map[ratio]||[1024,
1024];return[bw*resScale,bh*resScale];}
async function offlineImageResponse(idea,ratio,signal){await new Promise((resolve,reject)=>{if(signal?.aborted)return reject(Object.assign(new Error('Aborted'),
{name:'AbortError'}));const t=setTimeout(resolve,420);if(signal)signal.addEventListener('abort',()=>{clearTimeout(t);reject(Object.assign(new Error('Aborted'),
{name:'AbortError'}));},{once:true});});const[w,h]=offlineRatioDimensions(ratio);const canvas=document.createElement('canvas');
canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');const raster=isRasterIdea(idea);const hexes=parseManualPaletteHex(idea.suggestedColorPalette||'');
const c1=hexes[0]||(raster?'#0f172a':'#1e293b');const c2=hexes[1]||(raster?'#0284c7':'#10b981');const c3=hexes[2]||(raster?'#f59e0b':'#f43f5e');
const bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,c1);bg.addColorStop(1,raster?'#1e293b':'#f8fafc');ctx.fillStyle=bg;
ctx.fillRect(0,0,w,h);ctx.save();ctx.fillStyle=c2;ctx.beginPath();ctx.arc(w*0.38,h*0.5,Math.min(w,h)*0.24,0,Math.PI*2);ctx.fill();
ctx.fillStyle=c3;ctx.beginPath();ctx.moveTo(w*0.56,h*0.28);ctx.lineTo(w*0.76,h*0.68);ctx.lineTo(w*0.44,h*0.68);ctx.closePath();
ctx.fill();ctx.strokeStyle=raster?'rgba(248,250,252,.65)':'#0f172a';ctx.lineWidth=Math.max(4,Math.round(Math.min(w,h)*0.008));
ctx.strokeRect(w*0.12,h*0.14,w*0.76,h*0.72);ctx.restore();const mime=raster&&rasterSnapshot(idea).format==='jpg'?'image/jpeg':'image/png';
const dataUrl=canvas.toDataURL(mime,0.95);const base64=dataUrl.slice(dataUrl.indexOf(',')+1);canvas.width=0;canvas.height=0;return{candidates:[{content:{parts:[{inlineData:{mimeType:mime,
data:base64}}]}}]};}
function offlineMetaObject(idea){const subject=(idea.mainSubject||idea.conceptName||'Commercial design asset').replace(/[^\w\s-]/g,
' ').replace(/\s+/g,' ').trim();const title=adobeCsvText(`${subject} for modern commercial design`,70);const basePool=[...subject.toLowerCase().split(/\s+/).filter(w=>w.length>=3),
isRasterIdea(idea)?'commercial photography':'vector illustration',idea.creativeDirection||'modern style',idea.commercialUseCase||'commercial design',
idea.targetBuyer||'creative business','isolated composition','clean layout','minimalist aesthetic','vibrant color palette','digital marketing',
'brand identity','editorial concept','website banner','social media graphic','print template','creative background','contemporary design',
'professional asset','visual communication','high contrast','balanced framing','copy space','studio quality','modern lifestyle',
'business growth','innovative solution','artistic composition','graphic element','design resource','commercial use','visual storytelling',
'clean shapes','harmonious colors','modern workplace','creative concept','eye catching','versatile layout','digital art','sleek design',
'curated palette'];const normalized=normalizeAdobeKeywords(basePool,idea,{stockTitle:title});while(normalized.length<35){normalized.push(`design element ${normalized.length+1}`);
}return normalizeAdobeStockMetadata(idea,{stockTitle:title,keywords:normalized.slice(0,38),adobeCategoryCode:resolveAdobeCategoryCode(idea,
{}),releases:'',aiDisclosure:true});}
async function offlineMetadataResponse(idea,signal){await new Promise((resolve,reject)=>{if(signal?.aborted)return reject(Object.assign(new Error('Aborted'),
{name:'AbortError'}));const t=setTimeout(resolve,280);if(signal)signal.addEventListener('abort',()=>{clearTimeout(t);reject(Object.assign(new Error('Aborted'),
{name:'AbortError'}));},{once:true});});return offlineMetaObject(idea);}
function offlinePreflightResult(idea,tech){const score=Math.max(84,
Math.min(96,tech.score));return{score,status:'PASS',technical:tech,components:{c1:{label:isRasterIdea(idea)?'Anatomy & Detail':'Contour & Shape Cleanliness',
weight:35,score:92,reason:'Simulasi offline: struktur bentuk dan proporsi terbaca jelas.'},c2:{label:isRasterIdea(idea)?'Sharpness & Lighting':'Color & Gradient Control',
weight:25,score:90,reason:'Simulasi offline: kontras dan pemisahan warna stabil.'},c3:{label:'Composition & Usability',weight:20,
score:88,reason:'Simulasi offline: tata letak seimbang dengan ruang bersih.'},c4:{label:'Brand, IP & Text Safety',weight:20,score:96,
reason:'Simulasi offline: bebas teks acak dan merek terlindungi.'}},issues:[],repairFocus:'',manualChecks:['Mode Image Test Offline — hasil simulasi lokal tanpa API.'],
inspectedAt:new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})};}
document.addEventListener('click',(e)=>{const img=e.target?.closest?.('img[data-lightbox-id]');
if(img)openIdeaLightbox(img.dataset.lightboxId);});
document.addEventListener('keydown',(e)=>{if(e.key==='Escape'&&!byId('imageLightboxModal')?.classList.contains('hidden'))closeImageLightbox();
});
window.addEventListener('DOMContentLoaded',()=>{initLightboxZoom();populateDropdowns();state.imageResolution='1K';const resolutionSelect=byId('imageResolutionSelect');if(resolutionSelect)resolutionSelect.value=state.imageResolution;
const gradientCheckbox=byId('gradientColorCheckbox');if(gradientCheckbox)gradientCheckbox.checked=state.gradientEnabled;const savedMode=safeStorageGet(STORAGE_KEYS.OUTPUT_MODE,
'vector');if(byId('outputModeSelect'))handleOutputModeChange(savedMode);try{const rp=JSON.parse(safeStorageGet(STORAGE_KEYS.RASTER_PREFS,
'{}'));for(const[k,v]of Object.entries(rp)){const id={people:'rasterPeopleSelect',shot:'rasterShotSelect',lighting:'rasterLightingSelect',
color:'rasterColorSelect',authenticity:'rasterAuthenticitySelect',copySpace:'rasterCopySpaceSelect',format:'rasterFormatSelect',
jpegQuality:'rasterJpegQualitySelect'}[k];if(id&&byId(id))byId(id).value=String(v);}}catch(_){}updateRatioHint();const apiInput=byId('apiKeyInput');
if(apiInput&&state.apiKey){apiInput.value=state.apiKey;saveApiKey(state.apiKey);}initializePersistentLibrary();try{const sp=JSON.parse(safeStorageGet('rvis_series_automation_v1','{}'));state.seriesContinuityLock=sp.continuity!==false;state.seriesAnchorReference=sp.anchor!==false;state.seriesAutoGenerate=sp.autoGenerate===true;const c=byId('seriesContinuityLockCheckbox'),a=byId('seriesAnchorReferenceCheckbox'),g=byId('seriesAutoGenerateCheckbox');if(c)c.checked=state.seriesContinuityLock;if(a)a.checked=state.seriesAnchorReference;if(g)g.checked=state.seriesAutoGenerate;}catch(_){}try{const savedMode=safeStorageGet('rvis_series_creation_mode_v1','auto');const raw=JSON.parse(safeStorageGet('rvis_series_manual_directions_v1','[]'));state.seriesManualScenes=Array.isArray(raw)?raw.slice(0,12).map(v=>String(v||'').slice(0,1600)):[];setSeriesCreationMode(savedMode);}catch(_){setSeriesCreationMode('auto');}updateSeriesEstimate();updateAutoPromptMode();
syncImageTestOfflineButton();});
const activeCardUpdates=new Set();
const cardPromptRevisions=new Map();
const activeCardJobs=new Map();
const openMetadataAccordions=new Set();
const openPromptAccordions=new Set();
const closedPromptAccordions=new Set();
const openPaletteAccordions=new Set();
function trackLibraryAccordion(details,kind,id){
 if(kind==='prompt'){
  const key=String(id||'');
  if(details?.open){openPromptAccordions.add(key);closedPromptAccordions.delete(key);}
  else{openPromptAccordions.delete(key);closedPromptAccordions.add(key);}
  return;
 }
 if(details?.open)openPaletteAccordions.add(id);else openPaletteAccordions.delete(id);
}
function collapseLibraryPromptAfterImage(id){const key=String(id||'');if(!key)return;openPromptAccordions.delete(key);closedPromptAccordions.delete(key);}
let libraryPersistQueue=Promise.resolve(),writeRev=0;
function getCardRevision(id){return cardPromptRevisions.get(id)||0;
}
function bumpCardRevision(id){const v=getCardRevision(id)+1;cardPromptRevisions.set(id,v);return v;}
function hasCardJob(id,kind){return Boolean(activeCardJobs.get(id)?.[kind]);
}
function claimCardJob(id,kind,owner){const jobs=activeCardJobs.get(id)||{};if(jobs[kind]&&jobs[kind]!==owner)return false;jobs[kind]=owner;
activeCardJobs.set(id,jobs);return true;}
function releaseCardJob(id,kind,owner){const jobs=activeCardJobs.get(id);if(!jobs||jobs[kind]!==owner)return;
delete jobs[kind];if(!jobs.image&&!jobs.meta)activeCardJobs.delete(id);}
function handleMetadataAccordionToggle(el,id){if(!el||!id)return;
if(el.open)openMetadataAccordions.add(id);else openMetadataAccordions.delete(id);}
async function copyCardPalette(id,location,
btn){const list=location==='library'?state.savedIdeas:state.discoveredIdeas;const idea=list.find(i=>i.ideaId===id);if(!idea)return;
const hex=(Array.isArray(idea.colorPaletteHex)?idea.colorPaletteHex:[]).filter(c=>/^#[0-9a-f]{6}$/i.test(String(c)));const txt=hex.length?hex.join(', '):(idea.paletteName||'');
if(!txt){showToast('Palet kartu ini belum tersedia.','info');return;}const ok=await safeCopyToClipboard(txt);showToast(ok?'Palette copied':'Gagal menyalin palet.',
ok?'success':'error');}
function sanitizeApiErrorText(value){let msg=String(value||'');const key=String(state.apiKey||'').trim();
if(key)msg=msg.split(key).join('[REDACTED]');return msg.replace(/([?&]key=)[^&\s"']+/gi,'$1[REDACTED]').replace(/AIza[0-9A-Za-z_-]{20,}/g,
'[REDACTED]');}
const RIVIS_TOOLTIP_HINTS=Object.freeze({handleDiscoverIdeas:'Temukan ide komersial baru. Klik ulang saat berjalan untuk membatalkan.',
handleAutoPrompt:'Susun Simple Prompt otomatis dari pengaturan studio.',handleGenerateAllImages:'Buat gambar untuk semua kartu; klik lagi untuk membatalkan Image All.',
handleGenerateAllMetadata:'Buat metadata semua kartu; klik lagi untuk membatalkan Meta All.',generateFromCardPrompt:'Perbarui gambar dan metadata kartu dari Visual Prompt.',
handleRemixStyleVariations:'Buat empat variasi gaya dari konsep ini.',copyCardPalette:'Salin semua kode HEX warna milik kartu.',
copyPaletteSwatches:'Salin palet HEX konsep ke clipboard.',copySingleHexCode:'Salin kode HEX warna ini.',copyIdeaKeywords:'Salin seluruh keyword Adobe Stock.',
handleDownloadSingleCardZip:'Unduh paket ZIP lengkap untuk kartu ini.',handleDownloadAllCardsZip:'Unduh paket ZIP terpisah untuk setiap kartu.',
handleDownloadResultsZip:'Unduh gambar dan satu metadata.csv gabungan sebagai ZIP.',exportSavedIdeaMetadataTXT:'Unduh metadata kartu sebagai file TXT.',
exportSavedIdeaMetadataCSV:'Unduh metadata kartu sebagai file CSV.',handleGenerateStockImageForIdea:'Buat atau perbarui gambar resolusi tinggi untuk kartu ini.',
handleGenerateMetadataForIdea:'Buat metadata Adobe Stock untuk kartu ini.',toggleCardBlueprint:'Lihat JSON Blueprint otomatis (hanya baca).',
handleAuditGeneratedImage:'Periksa ulang kualitas visual gambar.',toggleImageTestOffline:'Aktifkan atau matikan tiga kartu uji gambar tanpa API.',
removeSavedIdea:'Hapus hanya kartu Library ini.',
toggleApiKeyModal:'Buka atau tutup pengaturan Gemini API Key.',clearSimplePrompt:'Bersihkan isi Simple Prompt.',copySimplePrompt:'Salin Simple Prompt ke clipboard.',
copyCardPrompt:'Salin Visual Prompt kartu ini.',handleClearAllSavedIdeas:'Hapus seluruh kartu Library (memerlukan konfirmasi).',
openImageLightbox:'Perbesar gambar untuk memeriksa detail.',
downloadGeneratedImage:'Unduh gambar kartu pada format yang dipilih.'});
function rivisTooltipOnDemand(evt){const node=evt.target?.closest?.('button,summary,[role="button"]');
if(!node)return;if(!node.getAttribute('title')){const m=(node.getAttribute('onclick')||'').match(/^\s*([\w$]+)\s*\(/),hint=m&&RIVIS_TOOLTIP_HINTS[m[1]],
label=(node.textContent||'').trim().replace(/\s+/g,' ');node.setAttribute('title',hint||node.getAttribute('aria-label')||(label?'Jalankan: '+label.slice(0,
65):'Jalankan tindakan'));}if(!node.getAttribute('aria-label')&&!node.textContent.trim())node.setAttribute('aria-label',node.getAttribute('title'));
}
document.addEventListener('pointerover',rivisTooltipOnDemand,{passive:true});
document.addEventListener('focusin',rivisTooltipOnDemand);
/* Boot after external script is loaded. AI declarations are in Canvas. */
if(document.readyState!=='loading')document.dispatchEvent(new Event('DOMContentLoaded',{bubbles:true}));


/* RIVIS 3.1.50 — AI Vector Studio UI (GitHub support, AI API stays in Canvas) */
(function(){'use strict';if(window.RIVIS_VECTOR)return;
const el=id=>document.getElementById(id),cache=new Map();let busy=false;
function ideaById(id){return ((typeof state!=='undefined'&&state.savedIdeas)||[]).find(x=>String(x.ideaId)===String(id));}
function create(){if(el('rivisVectorModal'))return;const div=document.createElement('div');div.id='rivisVectorModal';div.style.cssText='position:fixed;inset:0;z-index:2147483000;background:#020617e8;display:none;align-items:center;justify-content:center;padding:10px;overflow:auto';div.innerHTML=`<section role="dialog" aria-modal="true" aria-labelledby="rvTitle" style="width:min(100%,1220px);max-height:min(96vh,980px);overflow:auto;background:#0f172a;color:#e2e8f0;border:1px solid #475569;border-radius:16px;padding:18px;box-shadow:0 25px 70px rgba(2,6,23,.55);font:13px system-ui,sans-serif">
<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div style="min-width:0"><strong id="rvTitle" style="font-size:18px;display:block">AI Vector Studio</strong><div style="color:#94a3b8;font-size:11px;line-height:1.5;margin-top:2px">Rekonstruksi SVG menggunakan AI Vision · PNG/JPG asli tetap tersedia untuk diunduh</div></div><button id="rvClose" type="button" aria-label="Tutup" style="background:transparent;color:white;border:1px solid #475569;border-radius:8px;padding:7px 10px;line-height:1">✕</button></div>
<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:end;margin:14px 0 10px 0;padding:12px;border:1px solid #334155;border-radius:12px;background:#02061766">
<label style="display:grid;gap:4px;flex:1 1 150px">AI Provider<select id="rvProvider" style="background:#020617;color:white;padding:8px;border:1px solid #475569;border-radius:8px"><option value="gemini">Gemini Vision (Canvas)</option><option value="openrouter">OpenRouter Vision</option><option value="groq">Groq Vision</option></select></label>
<label style="display:grid;gap:4px;flex:0 1 150px">Detail<select id="rvDetail" style="background:#020617;color:white;padding:8px;border:1px solid #475569;border-radius:8px"><option value="smooth">Clean / Minimal</option><option value="balanced" selected>Balanced</option><option value="detailed">Detailed</option></select></label>
<label style="display:grid;gap:4px;flex:1 1 220px">Model ID<input list="rvModelOptions" id="rvModel" autocomplete="off" placeholder="gemini-3-flash-preview" style="background:#020617;color:white;padding:8px;border:1px solid #475569;border-radius:8px;min-width:0"><datalist id="rvModelOptions"></datalist></label>
<label id="rvKeyBox" style="display:none;gap:4px;flex:1 1 200px">API Key (tidak disimpan)<input id="rvKey" type="password" autocomplete="off" style="background:#020617;color:white;padding:8px;border:1px solid #475569;border-radius:8px;min-width:0"></label>
<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:end;justify-content:flex-end;flex:1 1 260px"><button id="rvConvert" style="background:#7c3aed;color:white;border:0;border-radius:8px;padding:10px 13px;font-weight:bold">Generate AI SVG</button><button id="rvOriginal" style="background:#1e293b;color:white;border:1px solid #475569;border-radius:8px;padding:10px 13px">Unduh PNG/JPG Asli</button><button id="rvDownload" disabled style="background:#047857;color:white;border:0;border-radius:8px;padding:10px 13px;font-weight:bold;opacity:.5">Unduh SVG</button></div></div>
<div id="rvMessage" role="status" aria-live="polite" style="margin:0 0 12px 0;color:#a5b4fc;min-height:24px;line-height:1.5;padding:10px 12px;background:#1e1b4b55;border:1px solid #4338ca40;border-radius:10px">AI melakukan rekonstruksi, bukan pixel tracing. Hasil dapat berbeda dari sumber.</div>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:14px;align-items:stretch">
<div style="display:flex;flex-direction:column;gap:6px;min-width:0"><b style="font-size:11px;letter-spacing:.04em;color:#e2e8f0">PNG/JPG ASLI</b><div style="height:min(56vh,500px);min-height:320px;background:#020617;border:1px solid #334155;border-radius:12px;display:grid;place-items:center;padding:10px;overflow:hidden"><img id="rvSource" alt="Original" style="max-height:100%;max-width:100%;object-fit:contain"></div></div>
<div style="display:flex;flex-direction:column;gap:6px;min-width:0"><b style="font-size:11px;letter-spacing:.04em;color:#e2e8f0">AI SVG EDITABLE</b><div id="rvPreview" style="height:min(56vh,500px);min-height:320px;background:#020617;border:1px solid #334155;border-radius:12px;display:grid;place-items:center;padding:10px;overflow:auto;text-align:center;color:#cbd5e1">Belum dibuat</div></div></div>
<div style="display:grid;grid-template-columns:1.2fr .8fr;gap:10px;margin-top:12px;align-items:start"><div id="rvStats" style="font-size:12px;color:#cbd5e1;line-height:1.6;padding:10px 12px;background:#02061766;border:1px solid #334155;border-radius:10px;min-height:46px">Statistik SVG akan muncul setelah generate.</div><div style="font-size:11px;line-height:1.6;color:#94a3b8;padding:10px 12px;background:#02061766;border:1px solid #334155;border-radius:10px">QC hanya memeriksa struktur SVG. OpenRouter memilih model yang mendukung input gambar; model gratis tergantung ketersediaan. Pemanggilan AI dilakukan di HTML Canvas, bukan modul GitHub.</div></div>
</section>`;document.body.appendChild(div);
el('rvClose').onclick=close;div.onclick=e=>{if(e.target===div)close()};el('rvProvider').onchange=async()=>{const p=el('rvProvider').value;el('rvKeyBox').style.display=p==='gemini'?'none':'grid';el('rvModel').placeholder=p==='gemini'?'gemini-3-flash-preview':p==='openrouter'?'Memuat daftar model Vision…':'masukkan model vision Groq';el('rvModel').value='';el('rvModelOptions').replaceChildren();if(p==='openrouter'){try{const models=await window.RIVIS_AI_VECTOR.listOpenRouterModels();if(el('rvProvider').value!=='openrouter')return;for(const m of models){const o=document.createElement('option');o.value=m.id;o.label=(m.free?'GRATIS · ':'Berbayar · ')+m.name;el('rvModelOptions').appendChild(o)}const first=models.find(m=>m.free);el('rvModel').value=first?.id||'';el('rvModel').placeholder='Pilih model Vision';report(models.length+' model vision ditemukan. '+(models.filter(m=>m.free).length)+' gratis. Model otomatis dipilih.');}catch(err){el('rvModel').placeholder='Masukkan ID model vision';report('Katalog OpenRouter gagal: '+err.message+'. Isi model Vision secara manual.',true)}}};el('rvConvert').onclick=convert;el('rvOriginal').onclick=()=>{if(div.dataset.idea)downloadGeneratedImage(div.dataset.idea)};el('rvDownload').onclick=downloadSvg;document.addEventListener('keydown',e=>{if(e.key==='Escape'&&div.style.display!=='none')close()});}
function report(msg,error){el('rvMessage').textContent=msg;el('rvMessage').style.color=error?'#fca5a5':'#a5b4fc'}
function open(id){create();const idea=ideaById(id);if(!idea?.generatedImageUrl){if(typeof showToast==='function')showToast('Generate image dahulu.','error');return;}const modal=el('rivisVectorModal');modal.dataset.idea=String(id);modal.style.display='flex';el('rvSource').src=idea.generatedImageUrl;el('rvPreview').textContent='Belum dibuat';el('rvStats').textContent='';el('rvDownload').disabled=true;el('rvDownload').style.opacity='.5';report('Pilih AI Provider, atur detail jika perlu, lalu klik Generate AI SVG.');}
function close(){if(el('rivisVectorModal'))el('rivisVectorModal').style.display='none';}
async function convert(){if(busy)return;const id=el('rivisVectorModal').dataset.idea,idea=ideaById(id);if(!idea?.generatedImageUrl)return;const bridge=window.RIVIS_AI_VECTOR;if(!bridge?.generate){report('AI Vector API Canvas tidak tersedia. Perbarui HTML Canvas agar mendukung AI Vector.',true);return;}busy=true;const btn=el('rvConvert');btn.disabled=true;btn.textContent='AI memproses…';el('rvDownload').disabled=true;el('rvDownload').style.opacity='.5';try{report('AI Vision sedang membangun ulang objek menjadi SVG…');const result=await bridge.generate({imageUrl:idea.generatedImageUrl,idea,provider:el('rvProvider').value,apiKey:el('rvKey').value,model:el('rvModel').value,detail:el('rvDetail').value});const svg=result.svg,info=result.info;
cache.set(id,{svg,source:idea.generatedImageUrl,filename:(typeof getCardBaseFilename==='function'?getCardBaseFilename(idea):'rivis_vector')+'.svg'});const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));const img=new Image();img.alt='SVG AI preview';img.style.cssText='max-width:100%;max-height:100%;object-fit:contain';img.onload=()=>URL.revokeObjectURL(url);img.onerror=()=>URL.revokeObjectURL(url);img.src=url;el('rvPreview').replaceChildren(img);el('rvStats').textContent=`Provider: ${info.provider} · Objek: ${info.vectorCount} · Path: ${info.paths} · Gradien: ${info.gradients} · Ukuran: ${(info.bytes/1024).toFixed(1)} KB · Status: SVG valid`;el('rvDownload').disabled=false;el('rvDownload').style.opacity='1';report('SVG AI siap. Bandingkan preview dengan raster asli sebelum digunakan.');}
catch(e){console.error('RIVIS AI SVG',e);report('AI SVG gagal: '+String(e.message||e),true);}finally{btn.disabled=false;btn.textContent='Generate AI SVG';busy=false;}}
async function downloadSvg(){const id=el('rivisVectorModal').dataset.idea,result=cache.get(id),idea=ideaById(id);if(!result||result.source!==idea?.generatedImageUrl){report('SVG belum tersedia atau gambar sudah berubah.',true);return;}const blob=new Blob([result.svg],{type:'image/svg+xml;charset=utf-8'});if(typeof executeDownloadManager==='function')await executeDownloadManager({data:blob,filename:result.filename,mimeType:'image/svg+xml'});else{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=result.filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}}
window.RIVIS_VECTOR=Object.freeze({open,close,convert,downloadSVG:downloadSvg});
})();

/* RIVIS v3.4.71 — META GEN tab. Metadata Generator is isolated in a lazy-loaded iframe,
   while all Gemini requests reuse the authenticated RIVIS AI request manager. */
(function installRivisMetaGen(){
 'use strict';
 if(window.RIVIS_META_GEN_INSTALLED)return;
 window.RIVIS_META_GEN_INSTALLED=true;
 const byId=id=>document.getElementById(id);
 const css=document.createElement('style');
 css.textContent=`
 #tabSectionMetaGen{min-width:0;padding:.5rem!important;background:rgba(15,23,42,.72);border:1px solid rgba(51,65,85,.85);border-radius:1rem;box-shadow:0 18px 45px rgba(2,6,23,.28)}
 #metaGenFrame{display:block;width:100%;height:calc(100dvh - 190px);min-height:760px;border:1px solid #3c3154;border-radius:14px;background:#100d1b}
 #metaGenFrame[hidden],#metaGenLoading[hidden]{display:none!important}
 #metaGenLoading{min-height:420px;display:grid;place-items:center;text-align:center;padding:28px;color:#c4b5fd;background:#100d1b;border:1px dashed #57416f;border-radius:14px}
 #metaGenLoading .meta-gen-load-inner{max-width:420px;display:grid;gap:10px;justify-items:center}
 #metaGenLoading button{padding:8px 14px;border:1px solid #8b5cf6;border-radius:9px;background:#5b21b6;color:white;font-weight:700;font-size:12px}
 @media(max-width:639px){#tabSectionMetaGen{padding:.35rem!important}#metaGenFrame{height:calc(100dvh - 155px);min-height:690px}}
 `;
 document.head.appendChild(css);
 const nav=byId('navTabSavedIdeasTop');
 if(nav&&!byId('navTabMetaGenTop')){
  nav.insertAdjacentHTML('afterend',`<button id="navTabMetaGenTop" type="button" onclick="switchTab('meta_gen')" class="nav-tab flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800/60" aria-label="Open META GEN"><span aria-hidden="true">✦</span> META GEN</button>`);
 }
 const metaNav=byId('navTabMetaGenTop');
 if(metaNav&&!byId('navTabVectorichQcTop')){
  metaNav.insertAdjacentHTML('afterend',`<a id="navTabVectorichQcTop" href="https://rivis-cloud.pages.dev/vectorichqc/launch" target="_blank" rel="noopener noreferrer" class="nav-tab flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 text-cyan-300 hover:text-white bg-cyan-950/60 border border-cyan-800/70 hover:bg-cyan-900/70" aria-label="Open VECTORICH QC in a new tab" title="Buka Vectorich QC di tab baru"><span aria-hidden="true">↗</span> VECTORICH QC</a>`);
 }
 const saved=byId('tabSectionSavedIdeas');
 if(saved&&!byId('tabSectionMetaGen')){
  const section=document.createElement('section');
  section.id='tabSectionMetaGen';section.className='tab-section hidden space-y-3';
  section.innerHTML=`<div class="flex items-center justify-between gap-3 flex-wrap px-1 py-1"><div><h2 class="text-sm md:text-base font-black tracking-wide text-white">METADATA Generator</h2></div><span class="inline-flex items-center gap-1.5 rounded-full border border-emerald-700/60 bg-emerald-950/50 px-2.5 py-1 text-[10px] font-bold text-emerald-300"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> RIVIS CONNECTED</span></div><div id="metaGenHost"><div id="metaGenLoading" role="status" aria-live="polite"><div class="meta-gen-load-inner"><div style="font-size:28px">✦</div><strong>Memuat METADATA Generator</strong><span style="font-size:12px;color:#a89abf">Modul metadata akan dimuat saat tab pertama kali dibuka.</span></div></div><iframe id="metaGenFrame" title="METADATA Generator" loading="lazy" sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups allow-popups-to-escape-sandbox" allow="clipboard-read; clipboard-write" hidden></iframe></div>`;
  saved.insertAdjacentElement('afterend',section);
 }
 window.RIVIS_META_GEN_API=async function(payload){
  try{
   if(typeof callGeminiApi!=='function')throw new Error('RIVIS Gemini API manager is not loaded.');
   const result=await callGeminiApi('gemini-3-flash-preview',payload);
   return new Response(JSON.stringify(result),{status:200,headers:{'Content-Type':'application/json'}});
  }catch(error){
   const rawStatus=Number(error?.httpStatus)||500;
   const status=[400,401,403,404,408,413,429,500,502,503,504].includes(rawStatus)?rawStatus:500;
   return new Response(JSON.stringify({error:{message:String(error?.message||error||'Gemini request failed.')}}),{status,headers:{'Content-Type':'application/json'}});
  }
 };
 let loadingPromise=null;
 async function getMetaGenHtml(){
  const urls=[
   'https://raw.githubusercontent.com/permatane/hybrid/main/hybrid/rivis.meta-gen.html',
   'https://cdn.jsdelivr.net/gh/permatane/hybrid@main/hybrid/rivis.meta-gen.html'
  ];
  const errors=[];
  for(const base of urls){
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
   try{
    const response=await fetch(base+'?rv=3.4.71',{cache:'no-store',signal:controller.signal,headers:{Accept:'text/html, text/plain, */*'}});
    if(!response.ok)throw new Error('HTTP '+response.status);
    const html=await response.text();
    if(html.length<50000||!html.includes('RIVIS_META_GEN_API')||!html.includes('<title>METADATA Generator</title>'))throw new Error('File META GEN tidak lengkap atau belum diperbarui.');
    return html;
   }catch(error){errors.push(String(error?.message||error));}
   finally{clearTimeout(timer);}
  }
  throw new Error('Modul META GEN tidak dapat dimuat: '+errors.join(' · '));
 }
 window.RIVIS_INIT_META_GEN=async function(){
  const frame=byId('metaGenFrame'),loading=byId('metaGenLoading');
  if(!frame||frame.dataset.loaded==='true'||frame.dataset.loading==='true')return loadingPromise;
  frame.dataset.loading='true';
  if(loading)loading.innerHTML=`<div class="meta-gen-load-inner"><div style="font-size:28px">✦</div><strong>Menyiapkan META GEN…</strong><span style="font-size:12px;color:#a89abf">Mengambil modul metadata dari GitHub.</span></div>`;
  loadingPromise=(async()=>{
   try{
    const html=await getMetaGenHtml();
    frame.srcdoc=html;frame.hidden=false;frame.dataset.loaded='true';
    if(loading)loading.hidden=true;
   }catch(error){
    frame.dataset.loading='false';
    if(loading)loading.innerHTML=`<div class="meta-gen-load-inner"><div style="font-size:28px">⚠</div><strong>Gagal memuat META GEN</strong><span style="font-size:12px;color:#fca5a5">${String(error?.message||error).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</span><button type="button" id="metaGenRetryBtn">Coba Muat Ulang</button></div>`;
    byId('metaGenRetryBtn')?.addEventListener('click',()=>{frame.dataset.loading='false';loadingPromise=null;window.RIVIS_INIT_META_GEN();});
   }finally{if(frame.dataset.loaded==='true')frame.dataset.loading='false';}
  })();
  return loadingPromise;
 };

window.RIVIS_LIBRARY_BRIDGE=Object.freeze({
 getIdeas:()=>state.savedIdeas.map(item=>JSON.parse(JSON.stringify(item))),
 // Cloud transfer consumes live source only; avoid duplicating every 4K Base64 image
 // and persist upload fingerprints back to the original IndexedDB record.
 getCloudSource:id=>state.savedIdeas.find(x=>String(x.ideaId)===String(id))||null,
 getCloudSourceIds:()=>state.savedIdeas.map(x=>String(x.ideaId)),
 getIdea:id=>{const item=state.savedIdeas.find(x=>String(x.ideaId)===String(id));return item?JSON.parse(JSON.stringify(item)):null;},
 upsertIdea:idea=>{
  if(!idea||typeof idea!=='object'||!idea.ideaId)throw new Error('Data ide atau ideaId tidak valid.');
  const copy=JSON.parse(JSON.stringify(idea));ensureConceptBlueprint(copy);
  const index=state.savedIdeas.findIndex(x=>String(x.ideaId)===String(copy.ideaId));
  if(index>=0)state.savedIdeas[index]=copy;else state.savedIdeas.unshift(copy);
  persistSavedIdeas();updateBadges();renderSavedIdeasGrid();refreshStorageStatus();
  return JSON.parse(JSON.stringify(copy));
 },
 exploreIdea:idea=>{
  if(!idea||typeof idea!=='object')throw new Error('Data ide tidak valid.');
  const prompt=String(idea.simplePrompt||idea.finalGenerationPrompt||idea.visualPrompt||'');
  const input=byId('simplePromptInput');
  if(input){input.value=prompt;input.dispatchEvent(new Event('input',{bubbles:true}));}
  state.refImageUrl=idea.referenceImageUrl||idea.refImageUrl||null;
  state.refImageFile=null;state.referenceFingerprint=idea.referenceStyleFingerprint?{...idea.referenceStyleFingerprint}:null;state.referenceAnalysis=null;
  const mode=String(idea.referenceMode||'');
  if(mode&&REFERENCE_MODES.some(x=>x.id===mode))state.refMode=mode;
  const modeSelect=byId('refModeSelect');if(modeSelect)modeSelect.value=state.refMode;
  const preview=byId('refPreviewImg'),name=byId('refFileName');
  const empty=byId('refUploadEmptyState'),active=byId('refUploadActiveState'),analyze=byId('analyzeRefAiBtn');
  if(state.refImageUrl){
   if(preview)preview.src=state.refImageUrl;
   if(name)name.textContent='Cloud reference image';
   empty?.classList.add('hidden');active?.classList.remove('hidden');
   analyze?.classList.remove('hidden');analyze?.classList.add('flex');
  }else{
   if(preview)preview.removeAttribute('src');
   empty?.classList.remove('hidden');active?.classList.add('hidden');
   analyze?.classList.add('hidden');analyze?.classList.remove('flex');
   const fileInput=byId('refFileInput');if(fileInput)fileInput.value='';
  }
  const instruction=byId('refModInstructionInput');if(instruction)instruction.value=idea.refModInstruction||'';
  if(idea.outputMode&&typeof handleOutputModeChange==='function')handleOutputModeChange(idea.outputMode);
  switchTab('idea_studio');
  return true;
 },
 openLibrary:()=>switchTab('saved_ideas')
});

})();




/* RIVIS v3.4.79 — Cloud Library Foundation: Google OAuth + Drive/Sheets connection setup. */
(function installRivisCloudFoundation(){
'use strict';
if(window.RIVIS_CLOUD_FOUNDATION_INSTALLED)return;
window.RIVIS_CLOUD_FOUNDATION_INSTALLED=true;
const $=id=>document.getElementById(id),KEY='rivis.cloud.foundation.v1';
const DEFAULT={clientId:'',apiKey:'',appId:'',folderId:'',spreadsheetId:'',folderPicked:false,sheetPicked:false,oauthGranted:false};
let token=null,expires=0,loadPromise=null;
const cloudPending=new Map();
const GATEWAY_ORIGIN='https://rivis-cloud.pages.dev';
const GATEWAY_FALLBACK_ORIGIN='https://vectorichqc2026.netlify.app';
let gatewayPopup=null,gatewayChannel='',gatewayConnected=false,gatewayVerified=false;
let cloudGalleryItems=[],cloudGalleryPage=1,cloudGalleryTotal=0;
let cloudGallerySelectedIds=new Set();
let cloudBulkProgress=null;
const CLOUD_GALLERY_CACHE_KEY='rivis.cloud.gallery.cache.v1';
const CLOUD_GALLERY_PAGE_SIZE=20;
const cloudGalleryPageCache=new Map(),cloudGalleryPageRequests=new Map();
let cloudGalleryNavigationId=0,cloudGalleryPrefetchTimer=null;
function readCloudGalleryCache(page=1){
 try{
  const cached=JSON.parse(localStorage.getItem(CLOUD_GALLERY_CACHE_KEY)||'null');
  return (Number(cached?.page)||1)===Number(page)&&Array.isArray(cached.items)?cached.items:[];
 }catch(_){return [];}
}
function cloudRememberPage(page,items,total){
 if(!Array.isArray(items))return;
 const p=Math.max(1,Number(page)||1);
 cloudGalleryPageCache.delete(p);
 cloudGalleryPageCache.set(p,{ideas:items.slice(0,CLOUD_GALLERY_PAGE_SIZE),total:Math.max(0,Number(total)||0)});
 while(cloudGalleryPageCache.size>12)cloudGalleryPageCache.delete(cloudGalleryPageCache.keys().next().value);
}
function persistCloudGalleryCache(){
 if(!cloudGalleryItems.length)return;
 try{localStorage.setItem(CLOUD_GALLERY_CACHE_KEY,JSON.stringify({
  page:cloudGalleryPage,total:cloudGalleryTotal,savedAt:Date.now(),items:cloudGalleryItems.slice(0,CLOUD_GALLERY_PAGE_SIZE)
 }));}catch(_){}
}
function openCloudGateway(event){
 if(gatewayPopup&&!gatewayPopup.closed){
  try{gatewayPopup.focus();}catch(_){}
  event.preventDefault();
  return;
 }
 const bytes=new Uint8Array(24);
 if(!window.crypto?.getRandomValues){status('Browser tidak mendukung secure random generator.','error');event.preventDefault();return;}
 window.crypto.getRandomValues(bytes);
 gatewayChannel=Array.from(bytes,n=>n.toString(16).padStart(2,'0')).join('');
 event.currentTarget.href=GATEWAY_ORIGIN+'/rivis-cloud/?channel='+encodeURIComponent(gatewayChannel);
 gatewayPopup=null;
 gatewayConnected=false;
 gatewayVerified=false;
 const channel= gatewayChannel;
 status('Membuka Cloud Gateway. Pilih Connect Google jika diminta.','info');
 window.setTimeout(()=>{
  if(gatewayChannel===channel&&!gatewayPopup)status('Tab Cloud Gateway belum tersambung. Jika memakai browser dalam aplikasi, buka RIVIS dan Cloud Gateway di Chrome.','warning');
 },12000);
}
window.addEventListener('message',event=>{
 if(event.origin!==GATEWAY_ORIGIN || !event.source || !gatewayChannel)return;
 const d=event.data;
 if(!d || d.channel!==gatewayChannel)return;
 if(!gatewayPopup && d.type==='RIVIS_CLOUD_HELLO')gatewayPopup=event.source;
 if(event.source!==gatewayPopup)return;
 if(d.type==='RIVIS_CLOUD_BLOB_REQUEST'){
  const pending=cloudPending.get(d.requestId);
  if(!pending?.blob)return;
  pending.renew?.();
  const start=Number(d.start),end=Number(d.end),chunkId=String(d.chunkId||'');
  const reply=(error,buffer)=>{
   if(!cloudPending.has(d.requestId)||gatewayPopup?.closed)return;
   const response={type:'RIVIS_CLOUD_BLOB_RESPONSE',channel:gatewayChannel,requestId:d.requestId,chunkId,start,end,error:error||null};
   if(buffer){
    response.buffer=buffer;
    try{gatewayPopup.postMessage(response,GATEWAY_ORIGIN,[buffer]);return;}catch(_){gatewayPopup.postMessage(response,GATEWAY_ORIGIN);}
   }else gatewayPopup.postMessage(response,GATEWAY_ORIGIN);
  };
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||end<=start||end>pending.blob.size||end-start>2*1024*1024||!/^\d{1,10}$/.test(chunkId)){
   reply('Rentang potongan gambar tidak valid.',null);return;
  }
  pending.blob.slice(start,end).arrayBuffer().then(buffer=>reply(null,buffer)).catch(error=>reply(String(error?.message||error),null));
  return;
 }
 if(d.type==='RIVIS_CLOUD_PROGRESS'){
  const pending=cloudPending.get(d.requestId);
  if(!pending)return;
  pending.renew?.();
  if(d.message)cloudSyncStatus(String(d.message));
  if(cloudBulkProgress?.onProgress)cloudBulkProgress.onProgress(d);
  return;
 }
 if(d.type==='RIVIS_CLOUD_RESULT'){
  const pending=cloudPending.get(d.requestId);if(!pending)return;
  cloudBulkProgress?.onComplete?.(d.requestId);
  cloudPending.delete(d.requestId);
  if(d.ok)pending.resolve(d.result);else pending.reject(new Error(d.error||'Cloud operation failed'));
  return;
 }
 if(d.type==='RIVIS_CLOUD_HELLO'){
  event.source.postMessage({type:'RIVIS_CLOUD_ACK',channel:gatewayChannel},GATEWAY_ORIGIN);
  status('Cloud Gateway aktif. Proses login dan akses Google Drive dilakukan di Cloudflare.','info');
 }else if(d.type==='RIVIS_CLOUD_STATUS'){
  gatewayConnected=d.connected===true;
  gatewayVerified=d.verified===true;
  status(gatewayVerified?'CLOUD CONNECTED · Google Drive JSON siap digunakan.':gatewayConnected?'GOOGLE SIGNED IN · Penyimpanan sedang diverifikasi.':'CLOUD NOT CONNECTED · Klik Connect Google untuk memulai.',gatewayVerified?'success':gatewayConnected?'info':'warning');
  updateCloudControls();
  if(gatewayVerified)refreshCloudGallery();
 }else if(d.type==='RIVIS_CLOUD_SELECTED'){
  if(d.verified!==true || !/^[A-Za-z0-9_-]{8,128}$/.test(d.folderId||'') || !/^[A-Za-z0-9_-]{8,128}$/.test(d.spreadsheetId||''))return;
  gatewayConnected=true;gatewayVerified=true;
  save({folderId:d.folderId,spreadsheetId:d.spreadsheetId,folderPicked:true,sheetPicked:true});
  if($('rvCloudFolderId'))$('rvCloudFolderId').value=d.folderId;
  if($('rvCloudSpreadsheetId'))$('rvCloudSpreadsheetId').value=d.spreadsheetId;
  if($('rvCloudFolderPicked'))$('rvCloudFolderPicked').textContent='Dipilih via Cloud Gateway: '+(d.folderName||'Folder');
  if($('rvCloudSheetPicked'))$('rvCloudSheetPicked').textContent='Dipilih via Cloud Gateway: '+(d.sheetName||'Spreadsheet');
  status('CLOUD CONNECTED · Google Drive JSON siap digunakan. Save & Load siap.','success');
  updateCloudControls();
 }
});

const cfg=()=>{try{return Object.assign({},DEFAULT,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(e){return Object.assign({},DEFAULT);}};
const save=o=>{const c=Object.assign(cfg(),o);try{localStorage.setItem(KEY,JSON.stringify(c));}catch(e){}return c;};
function status(t,type){
 const e=$('rvCloudStatusMessage');
 if(e)e.textContent=t;
 // Status label is now on the clickable reconnect button, based strictly on verification.
 updateCloudControls();
}

function fields(){return save({clientId:$('rvCloudClientId')?.value.trim()||'',apiKey:$('rvCloudApiKey')?.value.trim()||'',appId:$('rvCloudAppId')?.value.trim()||'',folderId:$('rvCloudFolderId')?.value.trim()||'',spreadsheetId:$('rvCloudSpreadsheetId')?.value.trim()||''});}
function script(id,url,ready){if(ready())return Promise.resolve();return new Promise((ok,no)=>{let s=$(id);if(!s){s=document.createElement('script');s.id=id;s.src=url;s.async=true;s.onload=ok;s.onerror=()=>no(new Error('Tidak dapat memuat '+url));document.head.appendChild(s);}else{s.addEventListener('load',ok,{once:true});s.addEventListener('error',()=>no(new Error('Tidak dapat memuat '+url)),{once:true});}});}
async function libraries(){if(loadPromise)return loadPromise;loadPromise=(async()=>{await Promise.all([script('rvGis','https://accounts.google.com/gsi/client',()=>!!window.google?.accounts?.oauth2),script('rvGapi','https://apis.google.com/js/api.js',()=>!!window.gapi)]);await new Promise((ok,no)=>window.gapi.load('picker',{callback:ok,onerror:()=>no(new Error('Google Picker gagal dimuat.'))}));})();return loadPromise;}
function connect(){
 const c=fields();if(!c.clientId)throw new Error('OAuth Client ID belum diisi.');
 if(!window.google?.accounts?.oauth2)throw new Error('Google Identity Services belum siap. Buka ulang tab Cloud Library setelah library dimuat.');
 return new Promise((ok,no)=>{const tc=google.accounts.oauth2.initTokenClient({client_id:c.clientId,scope:'https://www.googleapis.com/auth/drive.file',callback:r=>{if(r.error){no(new Error(r.error_description||r.error));return;}token=r.access_token;expires=Date.now()+(Number(r.expires_in)||3600)*1000;save({oauthGranted:true});ok(token);},error_callback:e=>no(new Error(e.message||'OAuth popup gagal.'))});tc.requestAccessToken({prompt:c.oauthGranted?'':'consent'});});
}
function getPickerTopOrigin(){
 try{
  const topLocation=window.top.location;
  if(topLocation&&topLocation.protocol&&topLocation.host)return topLocation.protocol+'//'+topLocation.host;
 }catch(_){}
 try{
  if(document.referrer){
   const referrerUrl=new URL(document.referrer);
   if(referrerUrl.protocol==='https:'||referrerUrl.protocol==='http:')return referrerUrl.origin;
  }
 }catch(_){}
 return window.location.origin;
}
function pick(kind){
 const c=fields();if(!token)throw new Error('Connect Google terlebih dahulu.');if(!c.apiKey||!c.appId)throw new Error('API Key dan Project Number wajib diisi.');
 const view=new google.picker.DocsView(kind==='folder'?google.picker.ViewId.FOLDERS:google.picker.ViewId.SPREADSHEETS);
 if(kind==='folder'){view.setIncludeFolders(true);view.setSelectFolderEnabled(true);}else view.setMimeTypes('application/vnd.google-apps.spreadsheet');
 const p=new google.picker.PickerBuilder().setAppId(c.appId).setDeveloperKey(c.apiKey).setOAuthToken(token).setOrigin(getPickerTopOrigin()).addView(view).setCallback(d=>{if(d.action!==google.picker.Action.PICKED)return;const doc=d.docs&&d.docs[0];if(!doc||!doc.id)return;if(kind==='folder'){save({folderId:doc.id,folderPicked:true});$('rvCloudFolderId').value=doc.id;$('rvCloudFolderPicked').textContent='Dipilih: '+doc.name;}else{save({spreadsheetId:doc.id,sheetPicked:true});$('rvCloudSpreadsheetId').value=doc.id;$('rvCloudSheetPicked').textContent='Dipilih: '+doc.name;}status('File dipilih. Jalankan Test Connection.','success');}).build();p.setVisible(true);
}
async function get(url){if(!token||Date.now()>expires-30000)throw new Error('Sesi Google habis. Connect Google kembali.');const r=await fetch(url,{headers:{Authorization:'Bearer '+token}});if(!r.ok)throw new Error('Google API HTTP '+r.status+': '+(await r.text()).slice(0,200));return r.json();}
async function test(){
 const c=fields();if(!c.folderPicked||!c.sheetPicked)throw new Error('Pilih folder dan spreadsheet melalui Google Picker terlebih dahulu.');
 const f=await get('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(c.folderId)+'?fields=id,name,mimeType,capabilities(canAddChildren)');
 const d=await get('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(c.spreadsheetId)+'?fields=id,name,mimeType,capabilities(canEdit)');
 const s=await get('https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(c.spreadsheetId)+'?fields=spreadsheetId,properties(title),sheets(properties(title))');
 const names=(s.sheets||[]).map(x=>x.properties.title),required=['IDEAS','PROMPTS','ASSETS','GROUPS','GROUP ITEMS','GENERATION LOG'],missing=required.filter(x=>!names.includes(x));
 if(f.mimeType!=='application/vnd.google-apps.folder')throw new Error('Pilihan Drive bukan folder.');
 if(d.mimeType!=='application/vnd.google-apps.spreadsheet')throw new Error('Pilihan file bukan Google Sheets.');
 if((f.capabilities&&f.capabilities.canAddChildren===false)||(d.capabilities&&d.capabilities.canEdit===false))throw new Error('Folder atau spreadsheet tidak memiliki izin tulis.');
 if(missing.length){status('Folder terhubung. Tab spreadsheet belum lengkap: '+missing.join(', '),'warning');return;}
 status('Koneksi berhasil: '+f.name+' · '+s.properties.title+' · 6 tab tersedia.','success');
}
function getCloudOriginDiagnostics(){
 const own=window.location.origin;
 let parent='Tidak dapat dibaca (cross-origin iframe)';
 try{parent=window.top.location.origin||parent;}catch(_){}
 let referrer='Tidak tersedia';
 try{if(document.referrer)referrer=new URL(document.referrer).origin;}catch(_){}
 return {own,parent,referrer};
}
function render(){
 if($('tabSectionCloudLibrary'))return;
 const nav=$('navTabMetaGenTop');
 if(nav&&!$('navTabCloudLibraryTop')){
  const b=document.createElement('button');b.id='navTabCloudLibraryTop';b.type='button';
  b.className='nav-tab flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs font-bold text-sky-300 bg-sky-950/60 border border-sky-800/70';
  b.textContent='☁ CLOUD GALLERY';b.addEventListener('click',()=>window.switchTab('cloud_library'));
  nav.insertAdjacentElement('afterend',b);
 }
 const sec=document.createElement('section');sec.id='tabSectionCloudLibrary';sec.className='tab-section hidden space-y-3';
 sec.innerHTML=
 '<div class="rv-cloud-header"><h2 class="text-sm font-black text-white">RIVIS CLOUD GALLERY</h2><div class="rv-cloud-header-actions"><a id="rvCloudOpenGateway" href="'+GATEWAY_ORIGIN+'/rivis-cloud/" target="_blank" rel="opener" class="rv-primary" data-state="disconnected" aria-live="polite" title="Reconnect Cloud">RECONNECT CLOUD</a><button id="rvCloudRefreshGallery" type="button" class="rv-primary">↻ Refresh Gallery</button></div></div>'+
 '<div class="rv-cloud-card space-y-3"><div class="rv-cloud-selection-toolbar"><div class="rv-cloud-selection-count" id="rvCloudSelectionCount" aria-live="polite">0 card dipilih</div><div class="rv-cloud-selection-actions"><button id="rvCloudSelectAll" type="button">Pilih Semua</button><button id="rvCloudClearSelection" type="button" disabled>Batalkan Pilihan</button><button id="rvCloudDownloadSelected" type="button" class="rv-cloud-download-selected" disabled>Download Selected ZIP</button></div></div><div id="rvCloudGalleryGrid" class="rv-cloud-gallery-grid"><div class="rv-cloud-empty">Reconnect Google to view your Cloud Gallery.</div></div><div id="rvCloudGalleryPagination" class="rv-cloud-gallery-pagination" aria-label="Cloud Gallery pagination" hidden></div><p id="rvCloudSyncStatus" class="text-xs text-slate-400" aria-live="polite">Cloud Gallery siap setelah koneksi Google diverifikasi.</p></div>';
 const style=document.createElement('style');
 style.textContent='#rvCloudOpenGateway{display:inline-flex;align-items:center;padding:9px 12px;border-radius:8px;color:white;font-size:11px;font-weight:800;text-decoration:none}.rv-cloud-header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}.rv-cloud-header-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:nowrap;margin-left:auto;white-space:nowrap;min-width:0}#tabSectionCloudLibrary #rvCloudOpenGateway[data-state=connected]{background:#047857!important;color:#ecfdf5!important;border:1px solid #10b981!important}#tabSectionCloudLibrary #rvCloudOpenGateway[data-state=disconnected]{background:#1d4ed8!important;color:#eff6ff!important}#tabSectionCloudLibrary #rvCloudRefreshGallery:disabled{opacity:.4;cursor:not-allowed}@media(max-width:440px){.rv-cloud-header-actions{gap:6px}#tabSectionCloudLibrary .rv-cloud-header-actions button{padding:8px 9px;font-size:10px}}#tabSectionCloudLibrary{padding:12px;background:rgba(15,23,42,.76);border:1px solid #334155;border-radius:16px}#tabSectionCloudLibrary .rv-cloud-card{padding:14px;border:1px solid #334155;border-radius:12px;background:#02061788}#tabSectionCloudLibrary button{padding:9px 12px;border-radius:8px;background:#1e293b;color:white;font-size:11px;font-weight:800}#tabSectionCloudLibrary .rv-primary{background:#0369a1}#tabSectionCloudLibrary [hidden]{display:none!important}.rv-cloud-gallery-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,220px),1fr));gap:12px}.rv-cloud-gallery-card{min-width:0;overflow:hidden;border:1px solid #334155;border-radius:12px;background:#0b1220;display:flex;flex-direction:column}.rv-cloud-gallery-preview{height:170px;background:linear-gradient(135deg,#111827,#1e293b);display:grid;place-items:center;overflow:hidden}.rv-cloud-gallery-preview img{width:100%;height:100%;object-fit:contain;background:#020617}.rv-cloud-gallery-body{padding:11px;display:flex;flex-direction:column;gap:7px;flex:1}.rv-cloud-gallery-prompt{font-size:10px;line-height:1.5;color:#cbd5e1;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}.rv-cloud-prompt-preview{height:100%;width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:#c4b5fd;background:radial-gradient(circle at 50% 35%,#312e8166,transparent 60%),#020617}.rv-cloud-prompt-preview span{font-size:28px}.rv-cloud-prompt-preview strong{font-size:10px;letter-spacing:.12em}.rv-cloud-prompt-preview small{font-size:9px;color:#64748b}.rv-cloud-gallery-actions{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) 42px;gap:4px;margin-top:auto}.rv-cloud-gallery-actions button{min-width:0;margin-top:0!important;padding:8px 5px!important;font-size:10px!important}.rv-cloud-gallery-explore{background:#312e81!important;color:#ede9fe!important}.rv-cloud-gallery-load{background:#075985!important;color:#e0f2fe!important}.rv-cloud-gallery-delete{background:#3f1720!important;color:#fecaca!important;border:1px solid #7f1d1d!important}.rv-cloud-gallery-delete:hover{background:#7f1d1d!important}.rv-cloud-gallery-body h4{font-size:12px;line-height:1.4;font-weight:800;color:#f8fafc}.rv-cloud-gallery-meta{font-size:10px;color:#94a3b8}.rv-cloud-gallery-load{margin-top:auto;background:#075985!important;color:#e0f2fe!important}.rv-cloud-gallery-pagination{display:flex;align-items:center;justify-content:center;gap:5px;flex-wrap:wrap;padding:7px 0 2px}.rv-cloud-page-info{font-size:10px;color:#94a3b8;margin-right:6px}.rv-cloud-page-btn{min-width:32px;height:30px;padding:0 9px!important;border:1px solid #334155!important;border-radius:7px!important;background:#0f172a!important;color:#cbd5e1!important;font-size:11px!important;font-weight:800}.rv-cloud-page-btn:hover:not(:disabled){background:#1e3a5f!important;border-color:#0ea5e9!important}.rv-cloud-page-btn.is-active{background:#075985!important;border-color:#0ea5e9!important;color:#fff!important}.rv-cloud-page-btn:disabled{opacity:.35;cursor:not-allowed}.rv-cloud-page-ellipsis{padding:0 3px;color:#64748b;font-size:11px}.rv-cloud-empty{grid-column:1/-1;padding:32px 14px;text-align:center;border:1px dashed #475569;border-radius:12px;color:#94a3b8;font-size:11px}.rv-cloud-selection-toolbar{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:9px 10px;border:1px solid #334155;border-radius:10px;background:#0b1220}.rv-cloud-selection-count{font-size:11px;font-weight:800;color:#cbd5e1}.rv-cloud-selection-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.rv-cloud-selection-actions button{padding:7px 10px!important;font-size:10px!important}.rv-cloud-selection-actions button:disabled{opacity:.38;cursor:not-allowed}.rv-cloud-selection-actions .rv-cloud-download-selected{background:#047857!important;color:#ecfdf5!important}.rv-cloud-gallery-preview.rv-cloud-gallery-selectable{position:relative;cursor:pointer;outline:none;transition:filter .15s ease}.rv-cloud-gallery-preview.rv-cloud-gallery-selectable:hover{filter:brightness(1.12)}.rv-cloud-gallery-preview.rv-cloud-gallery-selectable:focus-visible{outline:2px solid #38bdf8;outline-offset:-3px}.rv-cloud-gallery-preview.rv-cloud-gallery-selectable::after{content:"○";position:absolute;top:9px;right:10px;width:27px;height:27px;display:grid;place-items:center;border-radius:50%;background:#0f172acc;color:#fff;border:1px solid #94a3b8;font-size:19px;font-weight:900;line-height:1;box-shadow:0 2px 8px #0008;pointer-events:none}.rv-cloud-gallery-card.is-selected{border-color:#06b6d4;box-shadow:0 0 0 1px #0891b2,0 8px 24px #0891b21c}.rv-cloud-gallery-card.is-selected .rv-cloud-gallery-preview.rv-cloud-gallery-selectable::after{content:"✓";background:#0284c7;border-color:#7dd3fc;color:#fff;font-size:16px}';
 /* Series mosaic renders every available scene in one Cloud Gallery card. */
 style.textContent+='.rv-cloud-gallery-preview.rv-cloud-series-preview{height:194px;display:block;position:relative}.rv-cloud-series-mosaic{width:100%;height:100%;display:grid;grid-template-columns:repeat(var(--rv-series-columns,3),minmax(0,1fr));grid-auto-rows:minmax(0,1fr);gap:3px;padding:4px 4px 23px;box-sizing:border-box}.rv-cloud-series-tile{position:relative;min-height:0;min-width:0;overflow:hidden;border:1px solid #334155;border-radius:4px;background:#111c2e;display:grid;place-items:center}.rv-cloud-gallery-preview .rv-cloud-series-tile img{display:block;width:100%;height:100%;object-fit:cover;min-width:0;min-height:0;background:#0f172a}.rv-cloud-series-index{position:absolute;bottom:2px;left:3px;padding:1px 3px;border-radius:3px;background:#020617c9;color:#e2e8f0;font-size:8px;line-height:1.1;pointer-events:none}.rv-cloud-series-empty{font-size:14px;color:#475569}.rv-cloud-series-count{position:absolute;bottom:3px;left:0;width:100%;text-align:center;color:#cbd5e1;font-size:9px;font-weight:800;line-height:17px;pointer-events:none}.rv-cloud-thumb-error{opacity:.48}.rv-cloud-gallery-preview.rv-cloud-series-preview.rv-cloud-gallery-selectable::after{top:7px;right:7px}';
 /* Series missing assets remain visible while detail manifest is retrieved. */
 style.textContent+='.rv-cloud-series-waiting{height:100%;display:grid;place-items:center;box-sizing:border-box;padding:18px;text-align:center;background:#0f172a;color:#94a3b8;font-size:11px;line-height:1.45}';
 /* Full-frame Cloud Gallery previews: preserve the whole source image for every ratio. */
 style.textContent+='.rv-cloud-gallery-preview:not(.rv-cloud-series-preview){height:auto!important;min-height:0!important;aspect-ratio:var(--rv-cloud-aspect,1);grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(0,1fr)}.rv-cloud-gallery-preview:not(.rv-cloud-series-preview)>img{display:block;box-sizing:border-box;min-width:0;min-height:0;max-width:100%;max-height:100%;width:100%;height:100%;object-fit:contain!important;object-position:center center!important;background:#020617}.rv-cloud-gallery-preview.rv-cloud-series-preview{height:194px!important;aspect-ratio:auto!important}.rv-cloud-gallery-preview .rv-cloud-series-tile img{object-fit:contain!important;object-position:center center!important;background:#0f172a}.rv-cloud-gallery-preview .rv-cloud-prompt-preview{min-height:170px}';
 /* No selection circle; selected border is the sole visual state. */
 style.textContent+='#tabSectionCloudLibrary .rv-cloud-gallery-preview.rv-cloud-gallery-selectable::after{display:none!important}#tabSectionCloudLibrary .rv-cloud-thumb-retry{position:absolute!important;right:8px;top:8px;z-index:5;display:grid;place-items:center;width:34px;height:34px;min-width:34px;min-height:34px;margin:0!important;padding:0!important;border-radius:50%!important;border:1px solid #94a3b8!important;background:#0f172ae8!important;color:#f8fafc!important;box-shadow:0 3px 11px #0008;cursor:pointer;touch-action:manipulation}#tabSectionCloudLibrary .rv-cloud-thumb-retry:focus-visible{outline:2px solid #67e8f9;outline-offset:2px}#tabSectionCloudLibrary .rv-cloud-thumb-retry.is-loading svg{animation:rvThumbSpin 1s linear infinite}@keyframes rvThumbSpin{to{transform:rotate(360deg)}}';
 /* Cloud Gallery: three selection actions stay on one mobile row. */
 style.textContent+='@media(max-width:639px){#tabSectionCloudLibrary .rv-cloud-selection-toolbar{display:flex;flex-direction:column;align-items:stretch;gap:7px}#tabSectionCloudLibrary .rv-cloud-selection-actions{display:grid!important;grid-template-columns:minmax(0,.95fr) minmax(0,1.35fr) minmax(0,1.75fr);gap:4px!important;width:100%;min-width:0;align-items:stretch;flex-wrap:nowrap!important}#tabSectionCloudLibrary .rv-cloud-selection-actions>button{box-sizing:border-box;display:flex;align-items:center;justify-content:center;min-width:0;width:100%;margin:0!important;padding:8px 2px!important;font-size:clamp(8px,2.45vw,10px)!important;line-height:1.15;white-space:nowrap!important;overflow:hidden;text-overflow:ellipsis;text-align:center}}';
 document.head.appendChild(style);
 const after=$('tabSectionMetaGen')||$('tabSectionSavedIdeas');if(after)after.insertAdjacentElement('afterend',sec);
 $('rvCloudOpenGateway').addEventListener('click',openCloudGateway);
 $('rvCloudRefreshGallery').addEventListener('click',()=>refreshCloudGallery(cloudGalleryPage,true));
 $('rvCloudSelectAll').addEventListener('click',selectAllCloudGalleryCards);
 $('rvCloudClearSelection').addEventListener('click',clearCloudGallerySelection);
 $('rvCloudDownloadSelected').addEventListener('click',()=>downloadSelectedCloudResultsZip($('rvCloudDownloadSelected')));
 $('rvCloudGalleryGrid').addEventListener('click',event=>{
  const retry=event.target?.closest?.('.rv-cloud-thumb-retry');
  if(retry){event.preventDefault();event.stopPropagation();retryCloudGalleryCardThumbnails(retry);return;}
  const preview=event.target?.closest?.('.rv-cloud-gallery-selectable');
  if(preview)toggleCloudGalleryCardSelection(preview.dataset.cloudSelectId);
 });
 $('rvCloudGalleryGrid').addEventListener('keydown',event=>{
  if(event.target?.closest?.('button'))return;
  const preview=event.target?.closest?.('.rv-cloud-gallery-selectable');
  if(!preview||!['Enter',' '].includes(event.key))return;
  event.preventDefault();toggleCloudGalleryCardSelection(preview.dataset.cloudSelectId);
 });
 renderCloudGallery([]);
}

function updateCloudControls(){
 const enabled=!!gatewayVerified;
 const refresh=$('rvCloudRefreshGallery');
 if(refresh)refresh.disabled=!enabled;
 const connect=$('rvCloudOpenGateway');
 if(connect){
  connect.textContent=enabled?'CLOUD CONNECTED':'RECONNECT CLOUD';
  connect.dataset.state=enabled?'connected':'disconnected';
  connect.title=enabled?'Cloud Connected · klik untuk reconnect ulang':'Reconnect Cloud';
  connect.setAttribute('aria-label',connect.title);
 }
 updateCloudGallerySelectionUI();
}

function cloudSyncStatus(message){const el=$('rvCloudSyncStatus');if(el)el.textContent=String(message||'');}
function cloudEscape(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function cloudSafeIdea(idea){
 // Strip multi-megabyte image Data URLs DURING serialization, not after
 // cloning the entire image. Keeps Cloud JSON small on mobile devices.
 return JSON.parse(JSON.stringify(idea,(key,value)=>{
  const binary=typeof value==='string'&&/^(data:image\/|blob:)/i.test(value);
  if(binary&&['generatedImageUrl','generatedImagePreviewUrl','refImageUrl','referenceImage','imageBase64'].includes(key))return undefined;
  if(binary)return '';
  if((key==='referenceImageBlob'||key==='referenceImageFile')&&value instanceof Blob)return undefined;
  return value;
 }));
}
function sendCloudCommand(command,payload){
 return new Promise((resolve,reject)=>{
  if(!gatewayPopup||gatewayPopup.closed||!gatewayChannel){reject(new Error('Klik Reconnect Google dan biarkan jendela Gateway tetap terbuka.'));return;}
  const requestId='req_'+Math.random().toString(36).slice(2)+Date.now().toString(36);
  const uploadBlob=command==='upload'&&payload?.blob instanceof Blob?payload.blob:null;
  const outgoing=uploadBlob?{...payload,blob:undefined,streamedBlob:true,size:uploadBlob.size,mimeType:payload.mimeType||uploadBlob.type}:payload||{};
  const inactivityMs=command==='upload'?70000:90000;
  const absoluteMs=command==='upload'?15*60*1000:(command==='list'||command==='save'||command==='load'||command==='delete'?15*60*1000:2*60*1000);
  let inactivityTimer=null,absoluteTimer=null,initialTimer=null,hasProgress=false;
  const cleanup=()=>{clearTimeout(inactivityTimer);clearTimeout(absoluteTimer);clearTimeout(initialTimer);cloudPending.delete(requestId);};
  const renew=()=>{
   hasProgress=true;clearTimeout(initialTimer);clearTimeout(inactivityTimer);
   inactivityTimer=setTimeout(()=>{cleanup();reject(new Error('Cloud Gateway berhenti merespons selama '+Math.round(inactivityMs/1000)+' detik. Periksa status popup dan koneksi.'));},inactivityMs);
  };
  absoluteTimer=setTimeout(()=>{cleanup();reject(new Error('Batas waktu total operasi Cloud tercapai. Coba kembali saat koneksi stabil.'));},absoluteMs);
  cloudPending.set(requestId,{blob:uploadBlob,renew,resolve:value=>{cleanup();resolve(value);},reject:error=>{cleanup();reject(error);}});
  if(uploadBlob){
   initialTimer=setTimeout(()=>{
    if(!hasProgress){cleanup();reject(new Error('Gateway tidak menerima perintah upload dalam 20 detik. Di Chrome Android, buka ulang popup Google lalu coba 1 card.'));}
   },20000);
  }else renew();
  try{gatewayPopup.postMessage({type:'RIVIS_CLOUD_COMMAND',channel:gatewayChannel,requestId,command,payload:outgoing},GATEWAY_ORIGIN);}
  catch(error){cleanup();reject(error);}
 });
}

async function sourceImageBlob(source){
 if(source instanceof Blob){
  const inferred=/\.svg$/i.test(String(source.name||''))?'image/svg+xml':source.type;
  return inferred&&inferred!==source.type?source.slice(0,source.size,inferred):source;
 }
 if(typeof source!=='string'||!source)throw new Error('Sumber gambar tidak tersedia.');
 if(/^data:image\//i.test(source)){
  const comma=source.indexOf(',');
  if(comma<0)throw new Error('Data URL gambar tidak lengkap.');
  const header=source.slice(0,comma),mime=header.match(/^data:([^;,]+)/i)?.[1]||'image/png';
  let bytes;
  try{
   if(/;base64/i.test(header)){
    const binary=atob(source.slice(comma+1).replace(/\s/g,''));
    bytes=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
   }else bytes=new TextEncoder().encode(decodeURIComponent(source.slice(comma+1)));
  }catch(error){throw new Error('Data gambar tidak dapat didekode: '+String(error?.message||error));}
  const blob=new Blob([bytes],{type:mime});
  if(!blob.size||!blob.type.startsWith('image/'))throw new Error('Data URL tidak berisi gambar yang valid.');
  return blob;
 }
 let response;
 try{response=await fetch(source,{mode:'cors',credentials:'omit',cache:'no-store'});}
 catch(error){
  if(/^blob:/i.test(source))throw new Error('URL gambar lokal sudah tidak tersedia. Unggah ulang gambar referensi.');
  throw new Error('Browser tidak dapat membaca URL gambar eksternal (kemungkinan diblokir CORS). Gunakan file gambar yang diunggah ke RIVIS.');
 }
 if(!response.ok)throw new Error('Tidak dapat membaca gambar (HTTP '+response.status+').');
 let blob=await response.blob();
 const inferred=/\.svg(?:[?#].*)?$/i.test(source)?'image/svg+xml':blob.type;
 if(inferred&&inferred!==blob.type)blob=blob.slice(0,blob.size,inferred);
 if(!blob.type.startsWith('image/'))throw new Error('Asset bukan file gambar.');
 if(!blob.size)throw new Error('File gambar kosong.');
 return blob;
}

async function cloudImageFingerprint(blob){
 try{const digest=await crypto.subtle.digest('SHA-256',await blob.arrayBuffer());return Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('');}
 catch(_){return blob.type+':'+blob.size;}
}
function safeAssetId(){return 'as_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,9);}
function imageExtension(mime){return mime==='image/svg+xml'?'svg':mime==='image/jpeg'?'jpg':mime==='image/webp'?'webp':mime==='image/gif'?'gif':'png';}
async function uploadCloudImage(idea,source,assetType,sceneId,fileName,existingRef,dimensions={}){
 if(!source)return existingRef||null;
 let blob;
 try{blob=await sourceImageBlob(source);}catch(error){throw new Error('Gagal menyiapkan '+assetType+' image: '+String(error?.message||error));}
 const fingerprint=await cloudImageFingerprint(blob);
 if(existingRef?.driveFileId&&existingRef?.fingerprint===fingerprint)return existingRef;
 if(blob.size>100*1024*1024)throw new Error('Gambar melebihi batas aman 100 MB per file.');
 let assetId=safeAssetId();
 try{
  const key=String(idea.ideaId||'')+'|'+String(assetType||'')+'|'+String(sceneId||'')+'|'+fingerprint;
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key));
  assetId='as_'+Array.from(new Uint8Array(digest)).slice(0,16).map(x=>x.toString(16).padStart(2,'0')).join('');
 }catch(_){}
 const mimeType=blob.type||'image/png';
 if(mimeType==='image/svg+xml'&&assetType!=='reference')throw new Error('File SVG hanya didukung sebagai gambar referensi, bukan gambar hasil generate.');
 const name=fileName?( /\.(png|jpe?g|webp|gif|svg)$/i.test(fileName)?fileName:fileName+'.'+imageExtension(mimeType)):assetId+'.'+imageExtension(mimeType);
 let result;
 try{
  result=await sendCloudCommand('upload',{
   ideaId:idea.ideaId,assetId,sceneId:sceneId||'',assetType,fileName:name,mimeType,size:blob.size,blob,
   width:Number(dimensions.width||idea.generatedImageWidth)||undefined,
   height:Number(dimensions.height||idea.generatedImageHeight)||undefined,
   megapixels:Number(dimensions.megapixels||idea.megapixels)||undefined,version:1
  });
 }catch(error){throw new Error('Cloud Gateway gagal mengunggah '+name+': '+String(error?.message||error));}
 const asset=result.asset||result;
 return {...asset,fingerprint,sceneId:sceneId||'',assetType};
}

function updateCloudGalleryCache(idea){
 cloudGalleryPageCache.clear();clearTimeout(cloudGalleryPrefetchTimer);
 const safe=cloudSafeIdea({...idea,updatedAt:new Date().toISOString()});
 cloudGalleryItems=[safe,...cloudGalleryItems.filter(item=>String(item.ideaId)!==String(safe.ideaId))];
 if($('rvCloudGalleryGrid')&&!cloudBulkProgress)renderCloudGallery(cloudGalleryItems.slice(0,CLOUD_GALLERY_PAGE_SIZE),1,Math.max(cloudGalleryTotal,cloudGalleryItems.length));
}

async function saveIdeaToCloud(sourceIdea,referenceSourceOverride=null){
 const referenceSource=referenceSourceOverride||sourceIdea.referenceImageBlob||sourceIdea.referenceImageFile||sourceIdea.referenceImageUrl||sourceIdea.refImageUrl||sourceIdea.referenceImageDataUrl||null;
 const idea={...sourceIdea,seriesScenes:Array.isArray(sourceIdea.seriesScenes)?sourceIdea.seriesScenes.map(scene=>({...scene})):sourceIdea.seriesScenes},old=idea.cloudAssetRefs||{};
 delete idea.referenceImageBlob;delete idea.referenceImageFile;
 const refs={cover:old.cover||null,reference:old.reference||null,scenes:[]};
 const base=(idea.conceptName||idea.ideaId||'rivis').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,50)||'rivis';
 const tasks=[];
 if(idea.generatedImageUrl)tasks.push(async()=>{refs.cover=await uploadCloudImage(idea,idea.generatedImageUrl,'generated','',base+'-cover',old.cover,{width:idea.generatedImageWidth,height:idea.generatedImageHeight,megapixels:idea.megapixels});});
 if(referenceSource)tasks.push(async()=>{refs.reference=await uploadCloudImage(idea,referenceSource,'reference','',base+'-reference',old.reference);});
 if(Array.isArray(idea.seriesScenes)){
  for(let i=0;i<idea.seriesScenes.length;i++){
   const scene=idea.seriesScenes[i];scene.sceneId=scene.sceneId||idea.ideaId+'_scene_'+(i+1);
   const previous=(old.scenes||[]).find(x=>String(x.sceneId)===String(scene.sceneId));
   if(scene.generatedImageUrl)tasks.push(async()=>{
    const asset=await uploadCloudImage(idea,scene.generatedImageUrl,'generated',scene.sceneId,base+'-scene-'+(i+1),previous,{width:scene.generatedImageWidth||scene.width,height:scene.generatedImageHeight||scene.height,megapixels:scene.megapixels});
    refs.scenes.push({...asset,sceneId:scene.sceneId});scene.activeAssetId=asset?.assetId||scene.activeAssetId||'';
   });
   else if(previous)refs.scenes.push(previous);
  }
 }
 let taskIndex=0;
 const workers=Array.from({length:Math.min(2,tasks.length)},async()=>{while(taskIndex<tasks.length){const task=tasks[taskIndex++];await task();}});
 await Promise.all(workers);
 idea.cloudAssetRefs=refs;
 idea.cloudAssets=[refs.cover,refs.reference,...refs.scenes].filter(Boolean);
 idea.coverAssetId=refs.cover?.assetId||idea.coverAssetId||'';
 const sourcePrompts=Array.isArray(idea.cloudPrompts)?idea.cloudPrompts:(Array.isArray(idea.prompts)?idea.prompts:[]);
 const promptText=String(idea.simplePrompt||idea.finalGenerationPrompt||idea.visualPrompt||'').trim();
 const promptRows=sourcePrompts.length?sourcePrompts.map((p,index)=>({
  ...p,promptId:p.promptId||idea.ideaId+'_p'+(index+1),ideaId:idea.ideaId,
  promptType:p.promptType||'simple',version:Number(p.version)||1,
  simplePrompt:p.simplePrompt||promptText,visualPrompt:p.visualPrompt||idea.visualPrompt||promptText,
  finalPrompt:p.finalPrompt||idea.finalGenerationPrompt||promptText,
  referenceAssetId:refs.reference?.assetId||p.referenceAssetId||'',
  activeVersion:p.activeVersion??true,createdAt:p.createdAt||idea.createdAt||new Date().toISOString(),
  updatedAt:idea.updatedAt||new Date().toISOString()
 })):promptText?[{
  promptId:idea.activePromptId||idea.ideaId+'_p1',ideaId:idea.ideaId,promptType:'simple',version:1,
  simplePrompt:promptText,visualPrompt:idea.visualPrompt||promptText,
  finalPrompt:idea.finalGenerationPrompt||promptText,referenceAssetId:refs.reference?.assetId||'',
  activeVersion:true,createdAt:idea.createdAt||new Date().toISOString(),
  updatedAt:idea.updatedAt||new Date().toISOString(),notes:'Saved from RIVIS'
 }]:[];
 if(promptRows.length){idea.activePromptId=idea.activePromptId||promptRows[0].promptId;idea.prompts=promptRows;}
 const safe=cloudSafeIdea(idea);
 const saved=await sendCloudCommand('save',{idea:safe,prompts:promptRows,assets:idea.cloudAssets||[],groups:idea.cloudGroups||[],groupItems:idea.cloudGroupItems||[],generationLogs:idea.cloudGenerationLogs||[]});
 Object.assign(sourceIdea,{cloudAssetRefs:refs,cloudAssets:idea.cloudAssets,coverAssetId:idea.coverAssetId,activePromptId:idea.activePromptId,cloudSavedAt:new Date().toISOString(),cloudMetadataPending:false});
 if(state.savedIdeas.some(item=>item===sourceIdea))persistSavedIdeas();
 updateCloudGalleryCache(idea);
 return saved;
}

async function syncIdeaMetadataToCloud(idea,force=false){
 if(!idea||!idea.ideaId)return {synced:false,reason:'invalid-idea'};
 const knownCloud=Boolean(force||idea.cloudSavedAt||idea.cloudAssetRefs||cloudGalleryItems.some(item=>String(item.ideaId)===String(idea.ideaId)));
 if(!knownCloud)return {synced:false,reason:'not-cloud-saved'};
 if(!gatewayVerified){idea.cloudMetadataPending=true;return {synced:false,reason:'gateway-not-connected'};}
 const seriesScenes=Array.isArray(idea.seriesScenes)?idea.seriesScenes.map((scene,index)=>({
  index,sceneId:scene.sceneId||'',metadata:scene.metadata||null,metadataOutdated:Boolean(scene.metadataOutdated)
 })): [];
 await sendCloudCommand('metadata',{
  ideaId:idea.ideaId,metadata:idea.metadata||null,
  metadataOutdated:Boolean(idea.metadataOutdated),seriesScenes
 });
 idea.cloudMetadataPending=false;
 return {synced:true};
}
window.RIVIS_SYNC_IDEA_METADATA_TO_CLOUD=syncIdeaMetadataToCloud;

async function downloadCloudAsset(fileId){
 const parts=[];let start=0,total=0,mimeType='image/png',done=false;
 while(!done){
  const chunk=await sendCloudCommand('download',{fileId,start,chunkSize:2*1024*1024});
  if(!chunk?.base64)throw new Error('Chunk gambar dari Drive kosong.');
  mimeType=chunk.mimeType||mimeType;total=Number(chunk.totalBytes)||total;
  const binary=atob(chunk.base64),bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  parts.push(bytes);start=Number(chunk.end)+1;done=chunk.done===true;
  if(!total||start>total+1)throw new Error('Ukuran atau rentang gambar dari Drive tidak valid.');
 }
 const blob=new Blob(parts,{type:mimeType});
 return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Gagal membangun ulang gambar dari Drive.'));reader.readAsDataURL(blob);});
}
async function restoreCloudIdeaAssets(idea,assets,options={}){
 const latest=new Map(),onlyReference=options.onlyReference===true;
 for(const asset of assets||[]){
  if(!asset?.driveFileId)continue;
  if(onlyReference&&asset.assetType!=='reference')continue;
  const key=String(asset.assetType||'generated')+':'+String(asset.sceneId||'');latest.set(key,asset);
 }
 const queue=[...latest.values()];let cursor=0;
 const worker=async()=>{while(cursor<queue.length){const asset=queue[cursor++],url=await downloadCloudAsset(asset.driveFileId);
  if(asset.assetType==='reference'){idea.referenceImageUrl=url;idea.refImageUrl=url;continue;}
  if(asset.assetType==='generated'){
   if(asset.sceneId&&Array.isArray(idea.seriesScenes)){
    const scene=idea.seriesScenes.find(x=>String(x.sceneId)===String(asset.sceneId));
    if(scene){scene.generatedImageUrl=url;scene.generatedImagePreviewUrl=null;scene.generatedImageWidth=Number(asset.width)||scene.generatedImageWidth||0;scene.generatedImageHeight=Number(asset.height)||scene.generatedImageHeight||0;}
   }else{idea.generatedImageUrl=url;idea.generatedImagePreviewUrl=null;idea.generatedImageWidth=Number(asset.width)||idea.generatedImageWidth||0;idea.generatedImageHeight=Number(asset.height)||idea.generatedImageHeight||0;}
  }
 }};
 await Promise.all(Array.from({length:Math.min(3,queue.length)},worker));
}

function cloudCoverAsset(idea){
 const assets=Array.isArray(idea.cloudAssets)?idea.cloudAssets:[];
 const generated=assets.filter(a=>a.assetType==='generated'&&String(a.isActive).toLowerCase()!=='false');
 const cover=generated.filter(a=>!a.sceneId).at(-1)||generated.at(-1);
 return cover||idea.cloudAssetRefs?.cover||null;
}
function cloudReferenceAsset(idea){
 const assets=Array.isArray(idea.cloudAssets)?idea.cloudAssets:[];
 return assets.filter(a=>a.assetType==='reference').at(-1)||idea.cloudAssetRefs?.reference||null;
}
function toggleCloudGalleryCardSelection(ideaId){
 const id=String(ideaId||'');if(!id)return;
 if(cloudGallerySelectedIds.has(id))cloudGallerySelectedIds.delete(id);else cloudGallerySelectedIds.add(id);
 updateCloudGallerySelectionUI();
}
function updateCloudGallerySelectionUI(){
 const count=cloudGallerySelectedIds.size;
 const countEl=$('rvCloudSelectionCount'),selectAll=$('rvCloudSelectAll'),clear=$('rvCloudClearSelection'),download=$('rvCloudDownloadSelected'),grid=$('rvCloudGalleryGrid');
 if(countEl)countEl.textContent=count+' card dipilih';
 if(selectAll)selectAll.disabled=!cloudGalleryTotal||count>=cloudGalleryTotal;
 if(clear)clear.disabled=count===0;
 if(download)download.disabled=count===0||!gatewayVerified;
 if(grid)grid.querySelectorAll('[data-cloud-select-id]').forEach(preview=>{
  const selected=cloudGallerySelectedIds.has(String(preview.dataset.cloudSelectId||''));
  preview.setAttribute('aria-checked',selected?'true':'false');
  preview.closest('.rv-cloud-gallery-card')?.classList.toggle('is-selected',selected);
 });
}
async function selectAllCloudGalleryCards(){
 if(!gatewayVerified){showToast('Hubungkan Google terlebih dahulu.','error');return;}
 const button=$('rvCloudSelectAll'),old=button?.textContent||'Pilih Semua';
 if(button){button.disabled=true;button.textContent='Memuat ID...';}
 try{
  const result=await sendCloudCommand('list',{idsOnly:true});
  const ids=Array.isArray(result.ids)?result.ids:[];
  ids.forEach(id=>{if(id)cloudGallerySelectedIds.add(String(id));});
  cloudGalleryTotal=Number(result.total)||ids.length;
  cloudSyncStatus(ids.length+' card tersedia untuk dipilih.');
 }catch(error){showToast('Gagal mengambil daftar pilihan: '+error.message,'error');}
 finally{if(button){button.textContent=old;}updateCloudGallerySelectionUI();}
}
function clearCloudGallerySelection(){
 cloudGallerySelectedIds.clear();
 updateCloudGallerySelectionUI();
}
function cloudGeneratedAssets(idea){
 const all=[...(Array.isArray(idea?.cloudAssets)?idea.cloudAssets:[])];
 const refs=idea?.cloudAssetRefs||{};
 if(refs.cover)all.push(refs.cover);
 if(Array.isArray(refs.scenes))all.push(...refs.scenes);
 const seen=new Set();
 return all.filter(asset=>{
  if(!asset?.driveFileId||asset.assetType!=='generated'||String(asset.isActive).toLowerCase()==='false')return false;
  const key=String(asset.driveFileId);
  if(seen.has(key))return false;
  seen.add(key);return true;
 });
}
async function downloadSelectedCloudResultsZip(btnEl){
 const selectedIds=Array.from(cloudGallerySelectedIds);
 if(!selectedIds.length){showToast('Pilih minimal satu card dari Cloud Gallery.','info');return;}
 if(selectedIds.length>30){showToast('Maksimal 30 card per ZIP untuk menjaga kestabilan browser. Pilih maksimal 30 card lalu ulangi.','warning');return;}
 if(!gatewayVerified){showToast('Hubungkan Google terlebih dahulu untuk mengunduh aset Cloud.','error');return;}
 if(typeof JSZip==='undefined'){showToast('JSZip library failed to load.','error');return;}
 const btn=btnEl||$('rvCloudDownloadSelected'),old=btn?.textContent||'Download Selected ZIP';
 if(btn){btn.disabled=true;btn.textContent='Loading cards...';}
 try{
  const selected=new Array(selectedIds.length);let cursor=0,loadedCount=0,metadataSynced=0,metadataRecovered=0;
  const loadWorker=async()=>{
   while(true){
    const index=cursor++;if(index>=selectedIds.length)return;
    const ideaId=selectedIds[index];
    const result=await sendCloudCommand('load',{ideaId,mode:'library'});
    const idea=result?.idea;if(!idea)throw new Error('Data card tidak ditemukan: '+ideaId);
    idea.cloudAssets=result.assets||[];idea.cloudPrompts=result.prompts||[];
    idea.cloudGroups=result.groups||[];idea.cloudGroupItems=result.groupItems||[];
    idea.cloudGenerationLogs=result.generationLogs||[];
    const localIdea=window.RIVIS_LIBRARY_BRIDGE?.getIdea?.(ideaId)||null;
    if(localIdea){
     if(localIdea.metadata&&!localIdea.metadataOutdated){idea.metadata=localIdea.metadata;idea.metadataOutdated=false;metadataRecovered++;}
     if(Array.isArray(localIdea.seriesScenes)){
      const remoteScenes=Array.isArray(idea.seriesScenes)?idea.seriesScenes:[];
      const remoteById=new Map(remoteScenes.map((scene,i)=>[String(scene.sceneId||i),scene]));
      const localById=new Map(localIdea.seriesScenes.map((scene,i)=>[String(scene.sceneId||i),scene]));
      const sceneIds=Array.from(new Set([...remoteById.keys(),...localById.keys()]));
      idea.seriesScenes=sceneIds.map((sceneId,i)=>{
       const localScene=localById.get(sceneId)||{},remoteScene=remoteById.get(sceneId)||{};
       const current={...localScene,...remoteScene};
       const localMetadataReady=Boolean(localScene.metadata)&&!localScene.metadataOutdated&&!localIdea.metadataOutdated;
       current.metadata=localMetadataReady?localScene.metadata:(remoteScene.metadata||null);
       current.metadataOutdated=localMetadataReady?false:Boolean(localScene.metadataOutdated||localIdea.metadataOutdated||remoteScene.metadataOutdated);
       if(localMetadataReady)metadataRecovered++;
       return current;
      });
      if(localIdea.metadataOutdated)idea.metadataOutdated=true;
     }
    }
    if(!idea.cloudAssetRefs){
     const assets=idea.cloudAssets;
     const generated=assets.filter(asset=>asset.assetType==='generated'&&String(asset.isActive).toLowerCase()!=='false');
     idea.cloudAssetRefs={
      cover:generated.find(asset=>!asset.sceneId)||null,
      reference:assets.find(asset=>asset.assetType==='reference'&&String(asset.isActive).toLowerCase()!=='false')||null,
      scenes:generated.filter(asset=>Boolean(asset.sceneId))
     };
    }
    if(localIdea&&(localIdea.metadata||Array.isArray(localIdea.seriesScenes)&&localIdea.seriesScenes.some(scene=>scene.metadata))){
     try{
      const sync=await window.RIVIS_SYNC_IDEA_METADATA_TO_CLOUD?.(idea,true);
      if(sync?.synced)metadataSynced++;
     }catch(syncError){console.warn('Cloud metadata sync during ZIP skipped:',ideaId,syncError?.message||syncError);}
    }
    selected[index]=idea;loadedCount++;
    if(btn)btn.textContent='Loading cards '+loadedCount+'/'+selectedIds.length+'...';
   }
  };
  await Promise.all(Array.from({length:Math.min(3,selectedIds.length)},loadWorker));
  const exportable=selected.filter(idea=>{
   const assets=cloudGeneratedAssets(idea);
   return idea.productionType==='series'
    ?assets.some(asset=>Boolean(asset.sceneId))||(Array.isArray(idea.seriesScenes)&&idea.seriesScenes.some(scene=>scene.metadata))
    :Boolean(cloudCoverAsset(idea)?.driveFileId||idea.metadata);
  });
  if(!exportable.length)throw new Error('Card terpilih belum memiliki gambar hasil generate atau metadata.');
  const skipped=selected.length-exportable.length;
  const zip=new JSZip(),metadataRows=[],missingMetadata=[];
  let completed=0,totalWork=exportable.reduce((sum,idea)=>sum+(idea.productionType==='series'?Math.max(1,(idea.seriesScenes||[]).length):1),0);
  const progress=label=>{if(btn)btn.textContent=label;};
  for(const idea of exportable){
   const base=getCardBaseFilename(idea);
   if(idea.productionType==='series'&&Array.isArray(idea.seriesScenes)){
    const assets=cloudGeneratedAssets(idea).filter(asset=>Boolean(asset.sceneId));
    for(let i=0;i<idea.seriesScenes.length;i++){
     const scene=idea.seriesScenes[i],asset=assets.find(item=>String(item.sceneId)===String(scene.sceneId));
     let exported=null;
     if(asset?.driveFileId){
      progress('Downloading '+(completed+1)+'/'+totalWork+'...');
      const dataUrl=await downloadCloudAsset(asset.driveFileId);
      const sceneIdea=seriesSceneAssetIdea(idea,scene,i);
      sceneIdea.generatedImageUrl=dataUrl;
      sceneIdea.generatedImageWidth=Number(asset.width)||sceneIdea.generatedImageWidth||0;
      sceneIdea.generatedImageHeight=Number(asset.height)||sceneIdea.generatedImageHeight||0;
      exported=await getExportedAsset(sceneIdea);
      zip.file('series/'+base+'/'+exported.filename,exported.data,{compression:'STORE'});
     }
     if(scene.metadata&&!scene.metadataOutdated&&!idea.metadataOutdated)metadataRows.push(buildAdobeStockCsvRow(seriesSceneAssetIdea(idea,scene,i),scene.metadata,exported?.filename||''));
     else missingMetadata.push(base+' · '+(scene.sceneTitle||'Scene '+(i+1)));
     completed++;progress('Preparing '+Math.min(completed,totalWork)+'/'+totalWork+'...');
    }
    zip.file('series/'+base+'/series_bible.json',JSON.stringify(idea.seriesBible||{},null,2));
   }else{
    const asset=cloudCoverAsset(idea);let exported=null;
    if(asset?.driveFileId){
     progress('Downloading '+(completed+1)+'/'+totalWork+'...');
     const dataUrl=await downloadCloudAsset(asset.driveFileId);
     const exportIdea={...idea,generatedImageUrl:dataUrl,
      generatedImageWidth:Number(asset.width)||idea.generatedImageWidth||0,
      generatedImageHeight:Number(asset.height)||idea.generatedImageHeight||0};
     exported=await getExportedAsset(exportIdea);
     zip.file(exported.filename,exported.data,{compression:'STORE'});
    }
    if(idea.metadata&&!idea.metadataOutdated)metadataRows.push(buildAdobeStockCsvRow(idea,idea.metadata,exported?.filename||''));
    else missingMetadata.push(base);
    completed++;progress('Preparing '+Math.min(completed,totalWork)+'/'+totalWork+'...');
   }
  }
  if(metadataRows.length)zip.file('metadata.csv','Filename,Title,Keywords,Category,Releases\r\n'+metadataRows.join('\r\n'));
  if(missingMetadata.length)zip.file('metadata_missing.txt','Metadata belum tersedia untuk item berikut:\r\n'+missingMetadata.join('\r\n')+'\r\n\r\nBuat atau perbarui metadata pada Library, lalu simpan kembali ke Cloud Gallery.');
  if(!metadataRows.length)zip.file('README_METADATA.txt','Tidak ada metadata yang tersedia untuk card terpilih. Periksa metadata_missing.txt. Metadata tidak dibuat otomatis agar judul dan keyword tidak direkayasa.');
  progress('Packaging ZIP...');
  const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:6}},meta=>{
   if(btn)btn.textContent='Packaging '+Math.round(meta.percent)+'%...';
  });
  const filename=getResultZipFilename(exportable[0],exportable.length);
  const ok=await executeDownloadManager({data:blob,filename,mimeType:'application/zip'});
  if(ok){
   const notes=[];
   if(metadataRows.length)notes.push(metadataRows.length+' metadata row');
   if(missingMetadata.length)notes.push(missingMetadata.length+' belum ada metadata');
   if(metadataRecovered)notes.push(metadataRecovered+' metadata dipulihkan dari Library lokal');
   if(metadataSynced)notes.push(metadataSynced+' card disinkronkan ke Cloud');
   showToast('ZIP Cloud Gallery berhasil dibuat: '+exportable.length+' card · '+(notes.join(' · ')||'tanpa metadata'),'success');
  }
 }catch(error){
  console.error('Cloud Gallery selected ZIP error:',error);
  showToast('Gagal membuat ZIP Cloud Gallery: '+String(error?.message||error),'error');
 }finally{
  if(btn){btn.disabled=false;btn.textContent=old;}
  updateCloudGallerySelectionUI();
 }
}
function mergeCloudSeriesGalleryItem(incoming,previous){
 if(!incoming)return incoming;
 const incomingScenes=Array.isArray(incoming.seriesScenes)?incoming.seriesScenes:[];
 const incomingAssets=Array.isArray(incoming.cloudAssets)?incoming.cloudAssets:[];
 const hasSceneEvidence=incomingScenes.length>1||incomingAssets.some(a=>a?.sceneId)||
  (Array.isArray(incoming.cloudAssetRefs?.scenes)&&incoming.cloudAssetRefs.scenes.length>0);
 const priorSeries=previous?.productionType==='series';
 if(incoming.productionType!=='series'&&!priorSeries&&!hasSceneEvidence)return incoming;
 // Incomplete list responses may omit productionType or provide a generic type.
 incoming={...incoming,productionType:'series'};
 if(!previous||previous.productionType!=='series')return incoming;
 const currentAssets=Array.isArray(incoming.cloudAssets)?incoming.cloudAssets:[];
 const previousAssets=Array.isArray(previous.cloudAssets)?previous.cloudAssets:[];
 const key=a=>a?.sceneId?'scene:'+String(a.sceneId):a?.assetType==='reference'?'reference':'cover';
 const merged=new Map();
 for(const asset of previousAssets)if(asset?.driveFileId)merged.set(key(asset),asset);
 for(const asset of currentAssets)if(asset?.driveFileId)merged.set(key(asset),asset);
 const currentRefs=incoming.cloudAssetRefs||{},priorRefs=previous.cloudAssetRefs||{};
 const mergedScenes=new Map();
 for(const asset of priorRefs.scenes||[])if(asset?.driveFileId&&asset.sceneId)mergedScenes.set(String(asset.sceneId),asset);
 for(const asset of currentRefs.scenes||[])if(asset?.driveFileId&&asset.sceneId)mergedScenes.set(String(asset.sceneId),asset);
 // A compact list response must not erase a complete cached Series manifest.
 const sceneList=Array.isArray(incoming.seriesScenes)?incoming.seriesScenes:[];
 const oldList=Array.isArray(previous.seriesScenes)?previous.seriesScenes:[];
 const chosenScenes=sceneList.length>=oldList.length?sceneList:oldList;
 return {
  ...incoming,seriesScenes:chosenScenes,
  cloudAssets:[...merged.values()],
  cloudAssetRefs:{
   ...priorRefs,...currentRefs,
   cover:currentRefs.cover||priorRefs.cover||null,
   reference:currentRefs.reference||priorRefs.reference||null,
   scenes:[...mergedScenes.values()]
  },
  seriesLength:incoming.seriesLength||previous.seriesLength||chosenScenes.length
 };
}
function cloudSeriesPreviewAssets(idea){
 if(idea?.productionType!=='series')return [];
 const rawAssets=[
  ...(Array.isArray(idea.cloudAssets)?idea.cloudAssets:[]),
  ...(Array.isArray(idea.cloudAssetRefs?.scenes)?idea.cloudAssetRefs.scenes:[])
 ];
 const byScene=new Map();
 for(const asset of rawAssets){
  if(!asset?.driveFileId||!asset.sceneId||asset.assetType==='reference'||String(asset.isActive).toLowerCase()==='false')continue;
  const id=String(asset.sceneId);
  const prior=byScene.get(id);
  if(!prior||prior.assetId===asset.assetId)byScene.set(id,asset);
 }
 const scenes=Array.isArray(idea.seriesScenes)?idea.seriesScenes:[];
 const planned=Number(idea.seriesLength)||0;
 const count=Math.min(12,Math.max(scenes.length,byScene.size,Number.isFinite(planned)?Math.max(0,Math.min(12,planned)):0));
 if(count===0)return [];
 const ordinal=value=>{
  const match=String(value||'').match(/(?:scene[_-]?)(\d+)$/i);
  return match?Number(match[1]):0;
 };
 const ordered=[...byScene.values()].sort((a,b)=>{
  const numA=ordinal(a.sceneId),numB=ordinal(b.sceneId);
  if(numA&&numB)return numA-numB;
  return String(a.sceneId||'').localeCompare(String(b.sceneId||''),undefined,{numeric:true});
 });
 const used=new Set();
 return Array.from({length:count},(_,index)=>{
  const scene=scenes[index]||{};
  const id=String(scene.sceneId||idea.ideaId+'_scene_'+(index+1));
  let asset=byScene.get(id)||null;
  if(asset&&used.has(String(asset.sceneId)))asset=null;
  if(!asset)asset=ordered.find(item=>!used.has(String(item.sceneId))&&ordinal(item.sceneId)===index+1)||null;
  if(!asset)asset=ordered.find(item=>!used.has(String(item.sceneId)))||null;
  if(asset)used.add(String(asset.sceneId));
  return {index:index+1,asset};
 });
}
function cloudSeriesPreviewMarkup(idea){
 const entries=cloudSeriesPreviewAssets(idea);
 if(!entries.length){
  return '<div class="rv-cloud-series-waiting">Memuat thumbnail Series dari Cloud…</div>';
 }
 const ready=entries.filter(entry=>Boolean(entry.asset?.driveFileId)).length;
 const columns=entries.length<=4?2:entries.length<=9?3:4;
 return '<div class="rv-cloud-series-mosaic" style="--rv-series-columns:'+columns+'" aria-label="'+ready+' dari '+entries.length+' scene tersedia">'+
  entries.map(entry=>'<div class="rv-cloud-series-tile">'+
   (entry.asset?.driveFileId?'<img loading="lazy" decoding="async" alt="Scene '+entry.index+'" data-cloud-thumb-id="'+cloudEscape(entry.asset.driveFileId)+'" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=">':'<span class="rv-cloud-series-empty">—</span>')+
   '<span class="rv-cloud-series-index">'+String(entry.index)+'</span></div>').join('')+
  '</div><span class="rv-cloud-series-count">'+ready+'/'+entries.length+' scenes</span>';
}
function renderCloudGallery(ideas,page=1,totalCount=null){
 const priorItems=new Map();
 const cachedPage=Math.max(1,Number(page)||1);
 for(const item of readCloudGalleryCache(cachedPage))if(item?.ideaId)priorItems.set(String(item.ideaId),item);
 for(const cached of cloudGalleryPageCache.values())
  for(const item of cached.ideas||[])if(item?.ideaId)priorItems.set(String(item.ideaId),item);
 for(const item of cloudGalleryItems)if(item?.ideaId)priorItems.set(String(item.ideaId),item);
 cloudGalleryItems=Array.isArray(ideas)?ideas.map(item=>mergeCloudSeriesGalleryItem(item,priorItems.get(String(item?.ideaId)))):[];
 cloudGalleryTotal=Number.isFinite(Number(totalCount))&&totalCount!==null?Math.max(0,Number(totalCount)):cloudGalleryItems.length;
 const grid=$('rvCloudGalleryGrid'),pager=$('rvCloudGalleryPagination');if(!grid)return;
 const total=cloudGalleryTotal,totalPages=Math.max(1,Math.ceil(total/CLOUD_GALLERY_PAGE_SIZE));
 cloudGalleryPage=Math.max(1,Math.min(totalPages,cachedPage));
 if(cloudGalleryItems.length){cloudRememberPage(cloudGalleryPage,cloudGalleryItems,total);persistCloudGalleryCache();}
 if(!total){
  grid.innerHTML='<div class="rv-cloud-empty">Belum ada item di Cloud Gallery. Simpan card dari Library atau gunakan Save Idea di Idea Studio.</div>';
  if(pager){pager.hidden=true;pager.innerHTML='';}
  updateCloudGallerySelectionUI();
  return;
 }
 const start=(cloudGalleryPage-1)*CLOUD_GALLERY_PAGE_SIZE,end=Math.min(total,start+cloudGalleryItems.length);
 const pageItems=cloudGalleryItems;
 grid.innerHTML=pageItems.map(idea=>{
  const asset=cloudCoverAsset(idea),reference=cloudReferenceAsset(idea),displayAsset=asset||reference,fileId=displayAsset?.driveFileId||'';
  const promptRows=Array.isArray(idea.prompts)?idea.prompts:(Array.isArray(idea.cloudPrompts)?idea.cloudPrompts:[]);
  const activePrompt=promptRows.find(p=>String(p.promptId||'')===String(idea.activePromptId||''))||promptRows.find(p=>['true','1','yes'].includes(String(p.activeVersion).toLowerCase()))||promptRows.at(-1)||{};
  const prompt=String(idea.simplePrompt||idea.finalGenerationPrompt||idea.visualPrompt||activePrompt.simplePrompt||activePrompt.finalPrompt||activePrompt.visualPrompt||'').trim();
  const isPromptIdea=String(idea.dataType||'').toLowerCase()==='prompt'||(!asset&&Boolean(prompt));
  const type=isPromptIdea?(reference?'Prompt + Reference':'Prompt Idea'):idea.productionType==='series'?'Series':idea.productionType==='collection'?'Collection Set':'Single Asset';
  const score=idea.commercialValueScore??idea.opportunityScore??idea.score;
  const title=cloudEscape(idea.conceptName||idea.title||'Untitled Idea'),id=cloudEscape(idea.ideaId);
  // Match the preview to the source artwork's actual proportions, never crop it.
  const sourceWidth=Number(displayAsset?.width||idea.generatedImageWidth)||0;
  const sourceHeight=Number(displayAsset?.height||idea.generatedImageHeight)||0;
  const ratioText=String(idea.aspectRatio||'').trim();
  const ratioParts=/^(\d+(?:\.\d+)?)\s*[:/]\s*(\d+(?:\.\d+)?)$/.exec(ratioText);
  const ratio=sourceWidth>0&&sourceHeight>0?sourceWidth/sourceHeight:
   ratioParts&&Number(ratioParts[2])>0?Number(ratioParts[1])/Number(ratioParts[2]):1;
  const safeRatio=Number.isFinite(ratio)&&ratio>=.25&&ratio<=4?ratio:1;
  const previewRatio=String(Number(safeRatio.toFixed(5)));
  const seriesVisible=idea.productionType==='series';
  const preview=seriesVisible?cloudSeriesPreviewMarkup(idea):
   fileId?'<img loading="lazy" decoding="async" alt="" data-cloud-thumb-id="'+cloudEscape(fileId)+'" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=">':'<div class="rv-cloud-prompt-preview"><span>✦</span><strong>PROMPT IDEA</strong><small>No generated image</small></div>';
  const promptText=prompt?'<p class="rv-cloud-gallery-prompt">'+cloudEscape(prompt.slice(0,220))+(prompt.length>220?'…':'')+'</p>':'';
  const selected=cloudGallerySelectedIds.has(String(idea.ideaId));
  const retry='<button type="button" class="rv-cloud-thumb-retry" title="Refresh thumbnail gambar" aria-label="Refresh thumbnail '+title+'"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.7 6"/><path d="M20 4v7h-7"/></svg></button>';
  return '<article class="rv-cloud-gallery-card'+(selected?' is-selected':'')+'" data-cloud-gallery-id="'+id+'"><div class="rv-cloud-gallery-preview rv-cloud-gallery-selectable'+(seriesVisible?' rv-cloud-series-preview':'')+'" style="--rv-cloud-aspect:'+previewRatio+';" data-cloud-select-id="'+id+'" role="checkbox" tabindex="0" aria-label="Pilih card '+title+'" aria-checked="'+(selected?'true':'false')+'">'+preview+retry+'</div><div class="rv-cloud-gallery-body"><h4>'+title+'</h4><div class="rv-cloud-gallery-meta">'+type+' · '+(score!==undefined?('Score '+cloudEscape(score)):'Score —')+'</div><div class="rv-cloud-gallery-meta">'+cloudEscape(idea.updatedAt||idea.createdAt||'Cloud saved')+'</div>'+promptText+'<div class="rv-cloud-gallery-actions"><button type="button" class="rv-cloud-gallery-explore" onclick="RIVIS_EXPLORE_CLOUD_IDEA(&quot;'+id+'&quot;,this)">Explore Idea</button><button type="button" class="rv-cloud-gallery-load" onclick="RIVIS_LOAD_CLOUD_IDEA(&quot;'+id+'&quot;,this)">Load to Library</button><button type="button" class="rv-cloud-gallery-delete" onclick="RIVIS_DELETE_CLOUD_IDEA(&quot;'+id+'&quot;,this)" title="Hapus dari Cloud Gallery; file Drive tetap tersimpan" aria-label="Hapus item Cloud Gallery">Hapus</button></div></div></article>';
 }).join('');
 if(pager){
  const button=(label,target,disabled=false,active=false)=>'<button type="button" class="rv-cloud-page-btn'+(active?' is-active':'')+'" data-cloud-page="'+target+'"'+(disabled?' disabled':'')+(active?' aria-current="page"':'')+'>'+label+'</button>';
  let pageTokens=[];
  if(totalPages<=7){for(let n=1;n<=totalPages;n++)pageTokens.push(n);}
  else{
   const candidates=[1,cloudGalleryPage-1,cloudGalleryPage,cloudGalleryPage+1,totalPages].filter(n=>n>=1&&n<=totalPages);
   let last=0;
   for(const n of [...new Set(candidates)].sort((x,y)=>x-y)){if(n-last>1)pageTokens.push('…');pageTokens.push(n);last=n;}
  }
  const numbers=pageTokens.map(n=>n==='…'?'<span class="rv-cloud-page-ellipsis">…</span>':button(String(n),n,false,n===cloudGalleryPage)).join('');
  pager.hidden=totalPages<=1;
  pager.innerHTML='<span class="rv-cloud-page-info">'+(start+1)+'–'+end+' dari '+total+' item</span>'+button('‹',cloudGalleryPage-1,cloudGalleryPage===1)+numbers+button('›',cloudGalleryPage+1,cloudGalleryPage===totalPages);
  pager.onclick=event=>{
   const target=event.target?.closest?.('[data-cloud-page]');if(!target||target.disabled)return;
   const next=Number(target.dataset.cloudPage);
   if(Number.isInteger(next)&&next>=1&&next<=totalPages&&next!==cloudGalleryPage)refreshCloudGallery(next);
  };
 }
 updateCloudGallerySelectionUI();
 loadCloudGalleryThumbnails();
 hydrateCloudSeriesGalleryManifests();
}

const cloudSeriesManifestLoaded=new Set();
const cloudSeriesManifestPending=new Set();
let cloudSeriesManifestQueue=[],cloudSeriesManifestActive=0;
function hydrateCloudSeriesGalleryManifests(){
 if(!gatewayVerified)return;
 for(const item of cloudGalleryItems){
  if(item?.productionType!=='series'||!item.ideaId)continue;
  const id=String(item.ideaId);
  const available=cloudSeriesPreviewAssets(item).filter(entry=>entry.asset?.driveFileId).length;
  const expected=Array.isArray(item.seriesScenes)?item.seriesScenes.length:Math.max(0,Number(item.seriesLength)||0);
  // Compact list items often contain a single cover but no scene assets.
  if(available>=2&&(expected===0||available>=expected))continue;
  if(cloudSeriesManifestLoaded.has(id)||cloudSeriesManifestPending.has(id))continue;
  cloudSeriesManifestPending.add(id);
  cloudSeriesManifestQueue.push(id);
 }
 pumpCloudSeriesGalleryManifests();
}
function pumpCloudSeriesGalleryManifests(){
 while(gatewayVerified&&cloudSeriesManifestActive<2&&cloudSeriesManifestQueue.length){
  const id=cloudSeriesManifestQueue.shift();
  cloudSeriesManifestActive++;
  (async()=>{
   try{
    const result=await sendCloudCommand('load',{ideaId:id,mode:'library'});
    const full=result?.idea||{};
    const cloudAssets=Array.isArray(result?.assets)&&result.assets.length?result.assets:(full.cloudAssets||[]);
    const fullIdea={...full,ideaId:id,productionType:'series',cloudAssets};
    const index=cloudGalleryItems.findIndex(item=>String(item?.ideaId)===id);
    if(index<0)return;
    const previous=cloudGalleryItems[index];
    // The complete load is authoritative; merge it with any earlier scene manifest.
    const merged=mergeCloudSeriesGalleryItem(fullIdea,previous);
    cloudGalleryItems[index]={...previous,
     seriesScenes:merged.seriesScenes,
     seriesLength:merged.seriesLength,
     cloudAssets:merged.cloudAssets,
     cloudAssetRefs:merged.cloudAssetRefs
    };
    cloudRememberPage(cloudGalleryPage,cloudGalleryItems,cloudGalleryTotal);
    persistCloudGalleryCache();
    const grid=$('rvCloudGalleryGrid');
    const card=Array.from(grid?.querySelectorAll('[data-cloud-gallery-id]')||[]).find(el=>el.dataset.cloudGalleryId===id);
    const preview=card?.querySelector('.rv-cloud-gallery-preview');
    if(preview){
     preview.classList.add('rv-cloud-series-preview');
     preview.innerHTML=cloudSeriesPreviewMarkup(cloudGalleryItems[index]);
     loadCloudGalleryThumbnails();
    }
    cloudSeriesManifestLoaded.add(id);
   }catch(err){
    console.warn('Cloud Series manifest fetch failed:',id,String(err?.message||err).slice(0,130));
   }finally{
    cloudSeriesManifestPending.delete(id);
    cloudSeriesManifestActive--;
    pumpCloudSeriesGalleryManifests();
   }
  })();
 }
}
const cloudThumbnailMemoryCache=new Map();
let cloudThumbnailObserver=null;
let cloudThumbnailQueue=[],cloudThumbnailRunning=0;
const cloudThumbnailPendingIds=new Map();
function pumpCloudGalleryThumbnails(){
 while(cloudThumbnailRunning<3&&cloudThumbnailQueue.length){
  const item=cloudThumbnailQueue.shift(),fileId=item.fileId,images=cloudThumbnailPendingIds.get(fileId);
  if(!images||!images.length)continue;
  cloudThumbnailRunning++;
  (async()=>{
   try{
    const result=await sendCloudCommand('thumbnail',{fileId});
    if(!result?.base64)return;
    const mime=String(result.mimeType||'image/jpeg');
    if(!/^image\/(?:jpeg|png|webp|gif)$/i.test(mime))return;
    const url='data:'+mime+';base64,'+result.base64;
    if(url.length<400000){
     cloudThumbnailMemoryCache.set(fileId,url);
     if(cloudThumbnailMemoryCache.size>96)cloudThumbnailMemoryCache.delete(cloudThumbnailMemoryCache.keys().next().value);
    }
    for(const img of images)if(img.isConnected&&img.dataset.cloudThumbId===fileId)img.src=url;
   }catch(error){
    for(const img of images)if(img.isConnected)img.closest('.rv-cloud-series-tile,.rv-cloud-gallery-preview')?.classList.add('rv-cloud-thumb-error');
    console.warn('Cloud thumbnail failed:',fileId,String(error?.message||error).slice(0,100));
   }finally{
    cloudThumbnailPendingIds.delete(fileId);
    cloudThumbnailRunning--;
    pumpCloudGalleryThumbnails();
   }
  })();
 }
}
function queueCloudGalleryThumbnail(img){
 const fileId=String(img?.dataset?.cloudThumbId||'');
 if(!fileId||!img.isConnected)return;
 const cached=cloudThumbnailMemoryCache.get(fileId);
 if(cached){img.src=cached;return;}
 const pending=cloudThumbnailPendingIds.get(fileId);
 if(pending){pending.push(img);return;}
 cloudThumbnailPendingIds.set(fileId,[img]);
 cloudThumbnailQueue.push({fileId});
 pumpCloudGalleryThumbnails();
}
function loadCloudGalleryThumbnails(){
 if(cloudThumbnailObserver){cloudThumbnailObserver.disconnect();cloudThumbnailObserver=null;}
 // Drop only queued requests; keep in-flight requests, and re-register new DOM images.
 for(const item of cloudThumbnailQueue)cloudThumbnailPendingIds.delete(item.fileId);
 cloudThumbnailQueue=[];
 const grid=$('rvCloudGalleryGrid');if(!grid||!gatewayVerified)return;
 const images=Array.from(grid.querySelectorAll('[data-cloud-thumb-id]'));
 if(typeof IntersectionObserver!=='function'){
  images.forEach(queueCloudGalleryThumbnail);return;
 }
 const observer=new IntersectionObserver(entries=>{
  for(const entry of entries){
   if(!entry.isIntersecting||!grid.contains(entry.target))continue;
   observer.unobserve(entry.target);
   queueCloudGalleryThumbnail(entry.target);
  }
 },{rootMargin:'200px 0px',threshold:0.01});
 cloudThumbnailObserver=observer;
 for(const img of images){
  const cached=cloudThumbnailMemoryCache.get(String(img.dataset.cloudThumbId));
  if(cached){img.src=cached;continue;}
  observer.observe(img);
 }
}
async function retryCloudGalleryCardThumbnails(button){
 if(!gatewayVerified){showToast('Reconnect Cloud untuk mengunduh thumbnail.','info');return;}
 if(!button||button.disabled)return;
 const card=button.closest('.rv-cloud-gallery-card'),preview=button.closest('.rv-cloud-gallery-preview');
 const id=String(card?.dataset.cloudGalleryId||'');
 if(!card||!preview||!id)return;
 const idea=cloudGalleryItems.find(x=>String(x.ideaId)===id);
 if(!idea)return;
 button.disabled=true;button.classList.add('is-loading');
 button.setAttribute('aria-busy','true');
 try{
  const images=[...preview.querySelectorAll('img[data-cloud-thumb-id]')];
  const missing=images.filter(img=>!img.complete||img.naturalWidth<=1||img.getAttribute('src')?.includes('R0lGODlh'));
  const targets=missing.length?missing:images;
  let success=0;
  for(let i=0;i<targets.length;i+=3){
   await Promise.all(targets.slice(i,i+3).map(async img=>{
    const fileId=String(img.dataset.cloudThumbId||'');
    if(!fileId)return;
    cloudThumbnailMemoryCache.delete(fileId);
    try{
     const res=await sendCloudCommand('thumbnail',{fileId});
     if(!res?.base64)throw new Error('Empty thumbnail response');
     const mime=String(res.mimeType||'image/jpeg');
     if(!/^image\/(?:jpeg|png|webp|gif)$/i.test(mime))throw new Error('Unsupported thumbnail type');
     const data='data:'+mime+';base64,'+res.base64;
     if(data.length<400000)cloudThumbnailMemoryCache.set(fileId,data);
     if(img.isConnected&&img.dataset.cloudThumbId===fileId){
      img.src=data;img.closest('.rv-cloud-series-tile,.rv-cloud-gallery-preview')?.classList.remove('rv-cloud-thumb-error');success++;
     }
    }catch(err){
     img.closest('.rv-cloud-series-tile,.rv-cloud-gallery-preview')?.classList.add('rv-cloud-thumb-error');
     console.warn('Cloud image retry failed',fileId,String(err?.message||err).slice(0,120));
    }
   }));
  }
  if(idea.productionType==='series'&&(images.length<Math.max(1,Number(idea.seriesLength)||0)||!success)){
   cloudSeriesManifestLoaded.delete(id);
   hydrateCloudSeriesGalleryManifests();
  }
  showToast(success?success+' thumbnail berhasil dimuat ulang.':idea.productionType==='series'?'Memeriksa ulang thumbnail Series.':'Thumbnail cloud belum tersedia.','info');
 }finally{
  if(button.isConnected){button.disabled=false;button.classList.remove('is-loading');button.removeAttribute('aria-busy');}
 }
}
function cloudPageRequest(page){
 const p=Math.max(1,Number(page)||1);
 if(cloudGalleryPageRequests.has(p))return cloudGalleryPageRequests.get(p);
 const task=sendCloudCommand('list',{page:p,pageSize:CLOUD_GALLERY_PAGE_SIZE});
 cloudGalleryPageRequests.set(p,task);
 task.then(()=>{if(cloudGalleryPageRequests.get(p)===task)cloudGalleryPageRequests.delete(p);},
           ()=>{if(cloudGalleryPageRequests.get(p)===task)cloudGalleryPageRequests.delete(p);});
 return task;
}
function cloudPrefetchNextPage(page,total){
 clearTimeout(cloudGalleryPrefetchTimer);
 const next=page+1;
 if(!gatewayVerified||next>Math.ceil(total/CLOUD_GALLERY_PAGE_SIZE)||cloudGalleryPageCache.has(next))return;
 cloudGalleryPrefetchTimer=setTimeout(()=>{
  if(!gatewayVerified||cloudGalleryPageRequests.size||cloudGalleryPageCache.has(next))return;
  cloudPageRequest(next).then(r=>cloudRememberPage(Number(r.page)||next,r.ideas||[],Number(r.total)||0)).catch(()=>{});
 },700);
}
async function refreshCloudGallery(page=cloudGalleryPage,force=false){
 if(!gatewayVerified){cloudSyncStatus('Hubungkan Google terlebih dahulu untuk membuka Cloud Gallery.');return;}
 const requested=Math.max(1,Number(page)||1),nav=++cloudGalleryNavigationId;
 clearTimeout(cloudGalleryPrefetchTimer);
 const cached=cloudGalleryPageCache.get(requested);
 const saved=cached?[]:readCloudGalleryCache(requested);
 if(!force&&(cached||saved.length)){
  const ideas=cached?.ideas||saved,total=cached?.total??Math.max(ideas.length,cloudGalleryTotal);
  renderCloudGallery(ideas,requested,total);
  cloudSyncStatus('Halaman '+requested+' dari cache. Klik Refresh Gallery untuk sinkronisasi terbaru.');
  cloudPrefetchNextPage(requested,total);
  return {ideas,page:requested,total,fromCache:true};
 }
 const btn=$('rvCloudRefreshGallery'),textBefore=btn?.textContent||'Refresh Gallery';
 if(btn){btn.disabled=true;btn.textContent='Loading...';}
 if(!cached&&!saved.length){
  const grid=$('rvCloudGalleryGrid');if(grid)grid.innerHTML='<div class="rv-cloud-empty">Memuat halaman '+requested+'…</div>';
 }
 try{
  cloudSyncStatus('Mengambil halaman '+requested+' dari Cloud Gallery...');
  const result=await cloudPageRequest(requested);
  const loaded=Math.max(1,Number(result.page)||requested),total=Number(result.total)||0;
  cloudRememberPage(loaded,result.ideas||[],total);
  if(nav!==cloudGalleryNavigationId)return result;
  renderCloudGallery(result.ideas||[],loaded,total);
  cloudSyncStatus(total+' card tersedia · halaman '+loaded+'/'+(Number(result.totalPages)||Math.max(1,Math.ceil(total/CLOUD_GALLERY_PAGE_SIZE)))+'.');
  cloudPrefetchNextPage(loaded,total);
  return result;
 }catch(err){
  if(nav===cloudGalleryNavigationId)cloudSyncStatus('Gagal memuat halaman '+requested+': '+err.message);
  throw err;
 }finally{
  if(btn&&nav===cloudGalleryNavigationId){btn.disabled=false;btn.textContent=textBefore;}
 }
}
async function loadCloudGalleryIdea(ideaId,button,mode='library'){
 if(!gatewayVerified){cloudSyncStatus('Hubungkan Google terlebih dahulu.');return;}
 const explore=mode==='explore',old=button?.textContent||(explore?'Explore Idea':'Load to Library');
 if(button){button.disabled=true;button.textContent=explore?'Loading Idea...':'Loading...';}
 try{
  cloudSyncStatus(explore?'Memuat prompt dan referensi ke Idea Studio...':'Mengambil card dan gambar dari Cloud...');
  const result=await sendCloudCommand('load',{ideaId,mode:explore?'explore':'library'}),idea=result.idea;
  if(!idea)throw new Error('Data ide tidak ditemukan.');
  const promptRows=result.prompts||[];
  idea.cloudPrompts=promptRows;idea.prompts=promptRows;
  const activePrompt=promptRows.find(p=>String(p.promptId||'')===String(idea.activePromptId||''))||promptRows.find(p=>['true','1','yes'].includes(String(p.activeVersion).toLowerCase()))||promptRows.at(-1);
  if(activePrompt){
   idea.simplePrompt=idea.simplePrompt||activePrompt.simplePrompt||activePrompt.finalPrompt||activePrompt.visualPrompt||'';
   idea.visualPrompt=idea.visualPrompt||activePrompt.visualPrompt||activePrompt.simplePrompt||'';
   idea.finalGenerationPrompt=idea.finalGenerationPrompt||activePrompt.finalPrompt||activePrompt.visualPrompt||activePrompt.simplePrompt||'';
   idea.activePromptId=idea.activePromptId||activePrompt.promptId||'';
  }
  idea.cloudAssets=result.assets||[];
  idea.cloudGroups=result.groups||[];idea.cloudGroupItems=result.groupItems||[];
  idea.cloudGenerationLogs=result.generationLogs||[];
  await restoreCloudIdeaAssets(idea,result.assets||[],{onlyReference:explore});
  const lib=window.RIVIS_LIBRARY_BRIDGE;if(!lib)throw new Error('Library lokal belum siap.');
  if(explore){
   if(typeof lib.exploreIdea!=='function')throw new Error('Fitur Explore Idea belum tersedia pada runtime ini.');
   lib.exploreIdea(idea);
   cloudSyncStatus('Prompt berhasil dimuat ke Idea Studio: '+(idea.conceptName||idea.ideaId));
   showToast('Idea siap dieksplorasi ulang: '+(idea.conceptName||idea.ideaId),'success');
  }else{
   lib.upsertIdea(idea);lib.openLibrary();
   cloudSyncStatus('Berhasil dimuat ke Library lokal: '+(idea.conceptName||idea.ideaId));
   showToast('Card berhasil dimuat ke Library.','success');
  }
 }catch(error){cloudSyncStatus('Gagal memuat item: '+error.message);showToast('Gagal memuat item Cloud: '+error.message,'error');}
 finally{if(button){button.disabled=false;button.textContent=old;}}
}

async function deleteCloudGalleryIdea(ideaId,button){
 if(!gatewayVerified){showToast('Hubungkan Google sebelum menghapus item Cloud Gallery.','error');return false;}
 const item=cloudGalleryItems.find(x=>String(x.ideaId)===String(ideaId));
 if(!item){showToast('Item Cloud Gallery tidak ditemukan.','error');return false;}
 const title=String(item.conceptName||item.title||ideaId);
 if(button?.dataset?.confirmDelete!==ideaId){
  if(!button)return false;
  button.dataset.confirmDelete=ideaId;button.textContent='Yakin?';
  button.title='Klik lagi untuk menghapus dari Gallery. File di Drive tetap tersimpan.';
  setTimeout(()=>{if(button.isConnected&&button.dataset.confirmDelete===ideaId){delete button.dataset.confirmDelete;button.textContent='Hapus';}},6500);
  return false;
 }
 if(button){delete button.dataset.confirmDelete;button.disabled=true;button.textContent='Menghapus...';}
 try{
  cloudSyncStatus('Menghapus dari Cloud Gallery: '+title);
  const result=await sendCloudCommand('delete',{ideaId});
  if(result?.ok!==true)throw new Error('Gateway tidak mengonfirmasi penghapusan.');
  cloudGallerySelectedIds.delete(String(ideaId));
  cloudGalleryPageCache.clear();
  cloudSyncStatus('Item dihapus dari Cloud Gallery: '+title+'. File Drive tetap aman.');
  await refreshCloudGallery(cloudGalleryPage,true);
  showToast('Item berhasil dihapus dari Cloud Gallery.','success');
  return true;
 }catch(error){
  cloudSyncStatus('Gagal menghapus item: '+error.message);
  showToast('Gagal menghapus dari Cloud Gallery: '+error.message,'error');
  return false;
 }finally{if(button?.isConnected){button.disabled=false;button.textContent='Hapus';}}
}

async function saveCardToCloud(ideaId,button){
 if(!gatewayVerified){cloudSyncStatus('Klik Connect Google terlebih dahulu.');showToast('Hubungkan Google melalui Cloud Gallery sebelum menyimpan ke cloud.','error');return;}
 const idea=window.RIVIS_LIBRARY_BRIDGE?.getCloudSource?.(ideaId);if(!idea){cloudSyncStatus('Card lokal tidak ditemukan.');showToast('Card lokal tidak ditemukan.','error');return;}
 const old=button?.textContent||'Save to Cloud';if(button){button.disabled=true;button.textContent='Saving...';}
 try{await saveIdeaToCloud(idea);cloudSyncStatus('Berhasil disimpan ke Cloud Gallery: '+(idea.conceptName||idea.ideaId));showToast('Berhasil disimpan ke Cloud: '+(idea.conceptName||idea.ideaId),'success');}
 catch(error){cloudSyncStatus('Gagal menyimpan '+(idea.conceptName||idea.ideaId)+': '+error.message);showToast('Gagal menyimpan ke Cloud: '+error.message,'error');}
 finally{if(button){button.disabled=false;button.textContent=old;}}
}
async function saveAllToCloud(button){
 if(!gatewayVerified){cloudSyncStatus('Klik Reconnect Google terlebih dahulu.');showToast('Hubungkan Google melalui Cloud Gallery sebelum menyimpan semua card.','error');return;}
 const ideaIds=window.RIVIS_LIBRARY_BRIDGE?.getCloudSourceIds?.()||[];
 if(!ideaIds.length){cloudSyncStatus('Library lokal masih kosong.');showToast('Library lokal masih kosong.','info');return;}
 if(cloudBulkProgress){showToast('Save All to Cloud sedang berlangsung.','info');return;}
 const total=ideaIds.length,old=button?.textContent||'Save All to Cloud';
 let saved=0,progressPercent=0,cursor=0;
 const failures=[];
 const transferProgress=new Map();
 const paint=value=>{
  progressPercent=Math.max(progressPercent,Math.min(100,Math.round(value)));
  if(button){setInnerProgress(button,progressPercent);button.textContent='Saving '+saved+'/'+total;button.title='Save All to Cloud · '+progressPercent+'% · '+saved+'/'+total+' card';}
 };
 const paintEstimated=()=>{
  const values=[...transferProgress.values()];
  const partial=values.length?Math.min(.92,(values.reduce((sum,value)=>sum+value,0)/values.length/100)*.92):0;
  paint(((saved+partial)/total)*100);
 };
 const bulk={
  onProgress:d=>{
   const current=Number(d.percent);
   if(!Number.isFinite(current))return;
   transferProgress.set(String(d.requestId||''),Math.max(0,Math.min(100,current)));
   paintEstimated();
  },
  onComplete:requestId=>{
   transferProgress.delete(String(requestId||''));
   paintEstimated();
  }
 };
 cloudBulkProgress=bulk;
 if(button){button.disabled=true;button.setAttribute('aria-busy','true');}
 paint(0);
 const worker=async()=>{
  while(true){
   const index=cursor++;
   if(index>=total)return;
   const idea=window.RIVIS_LIBRARY_BRIDGE?.getCloudSource?.(ideaIds[index]);
   if(!idea){failures.push({name:ideaIds[index],error:'Card tidak ditemukan di Library.'});paint(((saved+failures.length)/total)*100);continue;}
   cloudSyncStatus('Menyimpan '+(index+1)+'/'+total+' · '+(idea.conceptName||idea.ideaId));
   try{await saveIdeaToCloud(idea);saved++;}
   catch(error){failures.push({name:idea.conceptName||idea.ideaId,error:String(error?.message||error)});}
   paint(((saved+failures.length)/total)*100);
  }
 };
 try{
  // Drive JSON catalog is one shared file: serialize card saves to avoid 409 conflicts.
  // Image uploads within each card may still run concurrently.
  await worker();
  if(saved&&$('rvCloudGalleryGrid')){
   renderCloudGallery(cloudGalleryItems.slice(0,CLOUD_GALLERY_PAGE_SIZE),1,Math.max(cloudGalleryTotal,cloudGalleryItems.length));
  }
  if(failures.length){
   const first=failures[0];
   cloudSyncStatus(saved+' dari '+total+' card tersimpan. '+failures.length+' gagal; pertama: '+first.name+' — '+first.error);
   showToast(saved+' tersimpan · '+failures.length+' gagal. Periksa status Cloud.','error');
  }else{
   cloudSyncStatus(saved+' card berhasil disimpan ke Cloud Gallery.');
   showToast(saved+' card berhasil disimpan ke Cloud Gallery.','success');
  }
 }finally{
  if(cloudBulkProgress===bulk)cloudBulkProgress=null;
  if(button){clearInnerProgress(button);button.disabled=false;button.removeAttribute('aria-busy');button.textContent=old;button.title='Simpan semua card Library ke Cloud Gallery';}
 }
}
window.RIVIS_SAVE_CARD_TO_CLOUD=saveCardToCloud;
window.RIVIS_SAVE_ALL_TO_CLOUD=saveAllToCloud;
window.RIVIS_LOAD_CLOUD_IDEA=(ideaId,button)=>loadCloudGalleryIdea(ideaId,button,'library');
window.RIVIS_DELETE_CLOUD_IDEA=deleteCloudGalleryIdea;
window.RIVIS_EXPLORE_CLOUD_IDEA=(ideaId,button)=>loadCloudGalleryIdea(ideaId,button,'explore');
window.RIVIS_SAVE_IDEA_TO_CLOUD=async(idea,referenceSource)=>{
 if(!gatewayVerified){cloudSyncStatus('Klik Reconnect Google terlebih dahulu.');showToast('Hubungkan Google melalui Cloud Gallery sebelum menyimpan ide.','error');return false;}
 cloudSyncStatus('Menyimpan prompt idea ke Cloud Gallery...');
 try{
  await saveIdeaToCloud(idea,referenceSource);
  cloudSyncStatus('Prompt idea berhasil disimpan ke Cloud Gallery: '+(idea.conceptName||idea.ideaId));
  return true;
 }catch(error){
  cloudSyncStatus('Gagal menyimpan prompt idea: '+String(error?.message||error));
  throw error;
 }
};
window.RIVIS_CLOUD_INIT=()=>{render();updateCloudControls();status(gatewayVerified?'CLOUD CONNECTED · Google Drive JSON siap digunakan.':'CLOUD NOT CONNECTED · Klik Connect Google untuk mulai.',gatewayVerified?'success':'warning');if(gatewayVerified)refreshCloudGallery();};
window.RIVIS_CLOUD_STATUS=()=>({connected:gatewayConnected,verified:gatewayVerified,gatewayUrl:GATEWAY_ORIGIN+'/rivis-cloud/'});
window.addEventListener('focus',()=>{if(gatewayPopup&&gatewayPopup.closed){gatewayPopup=null;gatewayConnected=false;gatewayVerified=false;updateCloudControls();status('CLOUD NOT CONNECTED · Jendela Gateway sudah ditutup. Hubungkan kembali untuk sinkronisasi.','info');}});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
})();
