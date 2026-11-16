/* RIVIS HYBRID V2: NON-AI support + original Stage 8 DOM/CSS */
(function(){
 const style=document.createElement('style');style.textContent="body{font-family:'Inter',sans-serif;-webkit-tap-highlight-color:transparent}\n.scrollbar-hide::-webkit-scrollbar{display:none}\n.scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}\n@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}\nto{opacity:1;transform:translateY(0)}\n}\n.animate-fadeIn{animation:fadeIn 0.25s cubic-bezier(0.16,1,0.3,1) forwards}\ninput[type=range]{height:6px;border-radius:9999px}\n#floatingSideTabs{position:fixed;z-index:999;right:0;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:.45rem;padding:.4rem;border:1px solid rgba(51,65,85,.9);border-right:0;border-radius:1rem 0 0 1rem;background:rgba(15,23,42,.94);backdrop-filter:blur(16px);box-shadow:0 12px 35px rgba(2,6,23,.5);transition:transform .24s ease,opacity .24s ease}\n#floatingSideTabs .side-tab{width:48px;min-height:48px;display:flex;align-items:center;justify-content:center;gap:.3rem;border-radius:.75rem;padding:.4rem}\n#floatingSideTabs .side-tab .side-tab-label{display:none !important}\n#floatingSideTabs .side-count{font-size:10px;line-height:1;font-weight:900;min-width:14px;text-align:center}\n#floatingSideTabs.is-hidden{transform:translate(110%,-50%);opacity:0;pointer-events:none}\n#ideaDiscoverActionBar{position:fixed !important;z-index:998;left:50%;bottom:1rem;transform:translateX(-50%);width:min(560px,calc(100vw - 24px));max-width:calc(100vw - 24px);box-sizing:border-box;padding:.65rem;display:flex;flex-wrap:nowrap;gap:.65rem;background:rgba(15,23,42,.96);border:1px solid rgba(71,85,105,.85);border-radius:1rem;box-shadow:0 12px 36px rgba(2,6,23,.6);backdrop-filter:blur(18px);align-items:flex-end}\n#ideaDiscoverActionBar > div{flex:0 0 125px;width:125px;min-width:0}\n#ideaDiscoverActionBar select{height:48px;max-width:100%}\n#ideaDiscoverActionBar #discoverIdeasBtn{flex:1 1 0%;width:auto;min-width:0;max-width:100%;height:50px;min-height:50px;padding-left:.8rem;padding-right:.8rem;box-sizing:border-box;white-space:nowrap}\nbody{padding-bottom:110px !important}\n@media (max-width:639px){#floatingSideTabs .side-tab{width:42px;min-height:44px}\n#ideaDiscoverActionBar{width:calc(100vw - 16px);max-width:calc(100vw - 16px);left:50%;bottom:.6rem;gap:.4rem;padding:.5rem}\n#ideaDiscoverActionBar > div{flex:0 0 88px;width:88px}\n#ideaDiscoverActionBar label{font-size:9px}\n#ideaDiscoverActionBar select{padding:.5rem;font-size:11px}\n#ideaDiscoverActionBar #discoverIdeasBtn{font-size:11px;gap:.3rem;padding:0 .35rem;letter-spacing:0}\n#ideaDiscoverActionBar #discoverIdeasBtn i{width:15px;height:15px;flex-shrink:0}\n#ideaDiscoverActionBar #discoverIdeasBtnText{font-size:clamp(9px,2.8vw,11px);white-space:nowrap}\n}\n@media (max-width:340px){#ideaDiscoverActionBar > div{flex-basis:78px;width:78px}\n#ideaDiscoverActionBar #discoverIdeasBtn i{width:13px;height:13px}\n}\n#ideaDiscoverActionBar #discoverBarToggleBtn{flex:0 0 40px;height:48px;align-self:flex-end;display:flex;align-items:center;justify-content:center;border:1px solid rgba(167,139,250,.45);border-radius:.85rem;background:rgba(76,29,149,.5);color:#e9d5ff;cursor:pointer;transition:background .2s ease,transform .2s ease}\n#ideaDiscoverActionBar #discoverBarToggleBtn:hover{background:rgba(109,40,217,.8)}\n#ideaDiscoverActionBar:not(.is-ready) #discoverBarToggleBtn{display:none !important}\n#ideaDiscoverActionBar.is-compact{width:58px !important;max-width:58px !important;height:58px;padding:5px !important;gap:0 !important;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#4f46e5,#2563eb);border-color:rgba(196,181,253,.7);align-items:center;box-shadow:0 8px 26px rgba(109,40,217,.4);animation:discoverIconAppear .35s ease-out,discoverIconGlow 2.6s ease-in-out .35s infinite}\n#ideaDiscoverActionBar.is-compact #discoverBarFields,#ideaDiscoverActionBar.is-compact #discoverIdeasBtn{display:none !important}\n#ideaDiscoverActionBar.is-compact #discoverBarToggleBtn{flex:0 0 46px;width:46px;height:46px;border:0;border-radius:50%;background:transparent;color:#fff}\n#ideaDiscoverActionBar.is-compact #discoverBarToggleBtn:hover{background:rgba(255,255,255,.13)}\nbody.discover-mini-active{padding-bottom:76px !important}\n@keyframes discoverIconAppear{from{opacity:0;transform:translateY(16px) scale(.75)}\nto{opacity:1;transform:translateY(0) scale(1)}\n}\n@keyframes discoverIconGlow{0%,100%{box-shadow:0 8px 22px rgba(109,40,217,.4)}\n50%{box-shadow:0 8px 32px rgba(129,140,248,.72)}\n}\n@media (prefers-reduced-motion:reduce){#ideaDiscoverActionBar.is-compact{animation:none}\n}\n#batchQueuePanel.progress-only{padding:.7rem}\n#batchQueuePanel.progress-only >:first-child,#batchQueuePanel.progress-only >:last-child{display:none !important}\n#tabSectionSavedIdeas{min-width:0;padding:.75rem;gap:1rem}\n#tabSectionSavedIdeas > div:first-child{align-items:flex-start}\n#tabSectionSavedIdeas > div:first-child > div:first-child{min-width:0}\n#tabSectionSavedIdeas > div:first-child > div:last-child{width:100%;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.5rem}\n#tabSectionSavedIdeas > div:first-child > div:last-child > *{min-width:0;width:100%;justify-content:center;white-space:normal;text-align:center;padding:.6rem .4rem}\n#tabSectionSavedIdeas #savedIdeasGridContainer{min-width:0}\n#tabSectionSavedIdeas #savedIdeasGridContainer img{max-width:100%;height:auto}\n@media (max-width:639px){header{min-width:0}\nheader > div:first-child{min-width:0}\nheader h1{font-size:clamp(11px,3.5vw,16px);line-height:1.25;flex-wrap:wrap}\nheader p{font-size:9px}\nheader > div:last-child{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));width:100%;gap:.4rem}\nheader > div:last-child > button,header > div:last-child > a{min-width:0;width:100%;padding:.6rem .25rem;font-size:10px;white-space:normal;text-align:center}\nheader > div:last-child > a{grid-column:1 / -1}\n#tabSectionSavedIdeas > div:first-child{display:flex;flex-direction:column}\n#tabSectionSavedIdeas > div:first-child > div:last-child{grid-template-columns:repeat(2,minmax(0,1fr))}\n}\n@media (min-width:768px){#tabSectionSavedIdeas{padding:1.5rem}\n#tabSectionSavedIdeas > div:first-child > div:last-child{width:auto;display:flex;flex-wrap:wrap}\n#tabSectionSavedIdeas > div:first-child > div:last-child > *{width:auto;white-space:nowrap;padding:.5rem .75rem}\n}\n.inner-progress{position:relative;isolation:isolate;overflow:hidden;--fill:0%}\n.inner-progress::before{content:\"\";position:absolute;inset:0;right:auto;width:var(--fill);z-index:-1;background:repeating-linear-gradient(115deg,rgba(255,255,255,.28) 0 12px,rgba(103,232,249,.4) 12px 24px);background-size:52px 100%;box-shadow:inset -2px 0 0 #a5f3fc,0 0 18px #22d3ee;transition:width .35s ease;animation:innerFlow 1.4s linear infinite;pointer-events:none}\n.inner-progress::after{content:attr(data-progress);font-size:10px;font-variant-numeric:tabular-nums;margin-left:4px;pointer-events:none}\n@keyframes innerFlow{to{background-position:52px 0}\n}\n@media(prefers-reduced-motion:reduce){.inner-progress::before{animation:none;transition:none}\n}\n.lightbox-shell{height:min(94dvh,1100px);min-height:0}\n.lightbox-viewport{flex:1 1 0;touch-action:none;overscroll-behavior:contain;cursor:zoom-in;user-select:none;-webkit-user-select:none}\n.lightbox-viewport.is-zoomed{cursor:grab}\n.lightbox-viewport.is-dragging{cursor:grabbing}\n.lightbox-zoom-image{position:absolute;left:50%;top:50%;width:auto;height:auto;max-width:100%;max-height:100%;object-fit:contain;pointer-events:none;user-select:none;-webkit-user-drag:none;transform-origin:center center;transform:translate(-50%,-50%) scale(1);will-change:transform}\n.lightbox-control{min-width:34px;height:30px;padding:0 9px;border:1px solid #475569;border-radius:8px;background:#1e293b;color:#f8fafc;font-size:17px;font-weight:700;line-height:1;touch-action:manipulation}\n.lightbox-control:hover{background:#334155}\n.lightbox-control:disabled{opacity:.35;cursor:not-allowed}\n.lightbox-control:focus-visible,.lightbox-viewport:focus-visible{outline:2px solid #a78bfa;outline-offset:2px}\n.lightbox-control-text{font-size:11px;min-width:43px}\n@media(max-width:639px){.lightbox-shell{height:96dvh}\n.lightbox-control{min-width:40px;height:35px}\n.lightbox-viewport{border-radius:10px}\n}\n#generateAllImagesBtn.inner-progress,#generateAllMetaBtn.inner-progress{position:relative;overflow:hidden}\n#generateAllImagesBtn.inner-progress::before,#generateAllMetaBtn.inner-progress::before{inset:auto auto 0 0;height:3px;z-index:1;animation:none;box-shadow:none;background:#c4b5fd;transition:width .18s ease}\n#generateAllMetaBtn.inner-progress::before{background:#67e8f9}\n#generateAllImagesBtn.inner-progress::after,#generateAllMetaBtn.inner-progress::after{display:none}\n.card-blueprint-toggle{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:9999px;border:1px solid rgba(34,211,238,.45);background:rgba(8,47,73,.7);color:#67e8f9;transition:background .2s ease,transform .2s ease}\n.card-blueprint-toggle:hover{background:rgba(14,116,144,.85);transform:translateY(-1px)}\n.card-blueprint-panel.hidden{display:none}\n.card-blueprint-panel{margin-top:.5rem;border:1px solid rgba(51,65,85,.9);border-radius:.75rem;background:rgba(2,6,23,.72);padding:.65rem}\n.card-blueprint-panel pre{max-height:18rem;overflow:auto}\nbody:not(.rivis-show-extra) #rivisSeasonalPanel,body:not(.rivis-show-extra) #rivisReferencePanel{display:none!important}\n/* Plain text accordion; no button chrome or arrow. */\n#tabSectionIdeaStudio{margin-top:.5rem!important}\n#tabSectionIdeaStudio>.rivis-extra-trigger{display:block;margin:0!important;padding:0}\n#rivisExtrasBtn{display:block;width:max-content;max-width:100%;margin:0;padding:2px 0;list-style:none;color:#c084fc;font-size:12px;font-weight:700;line-height:1.5;cursor:pointer;user-select:none}\n#rivisExtrasBtn::-webkit-details-marker{display:none}\n#rivisExtrasBtn::marker{content:''}\n#rivisExtrasBtn:hover{color:#e9d5ff}\n#rivisExtrasBtn:focus-visible{outline:2px solid #a78bfa;outline-offset:2px}\n#tabSectionIdeaStudio>#rivisSeasonalPanel,#tabSectionIdeaStudio>.grid{margin-top:.375rem!important}\n.rivis-status-bar{display:flex;align-items:stretch;gap:6px;min-width:0}\n.rivis-status-tile{flex:1 1 0;min-width:0}\n.rivis-status-summary{min-height:44px;box-sizing:border-box;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:5px 2px;border:1px solid #334155;border-radius:9px;background:#111c2e;color:#cbd5e1;list-style:none;user-select:none;text-align:center;touch-action:manipulation}\n.rivis-status-summary::-webkit-details-marker{display:none}\n.rivis-status-summary::marker{content:''}\n.rivis-status-summary:focus-visible{outline:2px solid #a78bfa;outline-offset:2px}\n.rivis-status-summary:hover,.rivis-status-tile[open]>.rivis-status-summary{background:#1d2e46;border-color:#64748b}\n.rivis-status-summary .status-top{display:flex;align-items:center;justify-content:center;gap:4px;font-size:11px;font-weight:800;line-height:1.1}\n.rivis-status-summary .status-label{font-size:9px;font-weight:650;line-height:1.2}\n.rivis-status-summary.status-pass .status-top{color:#34d399}\n.rivis-status-summary.status-warning .status-top{color:#fbbf24}\n.rivis-status-summary.status-brief .status-top{color:#c4b5fd}\n.rivis-status-summary.status-empty{opacity:.7}\n.rivis-status-panel{box-sizing:border-box;width:calc(300% + 12px);margin-top:6px;padding:10px;border:1px solid #475569;border-radius:9px;background:#111c2e;font-size:10px;line-height:1.5;color:#cbd5e1;overflow-wrap:anywhere;max-height:260px;overflow-y:auto}\n.rivis-status-tile:nth-child(2)>.rivis-status-panel{margin-left:calc(-100% - 6px)}\n.rivis-status-tile:nth-child(3)>.rivis-status-panel{margin-left:calc(-200% - 12px)}\n.rivis-status-panel .status-detail-row{padding:5px 0;border-bottom:1px solid #334155}\n.rivis-status-panel .status-detail-row:last-child{border-bottom:0}\n.rivis-preflight-row{position:relative;min-width:0;margin-top:.5rem}\n.rivis-preflight-row .rivis-preflight-summary,.rivis-preflight-row .rivis-preflight-empty{display:flex;align-items:center;gap:.35rem;box-sizing:border-box;min-width:0;min-height:40px;padding:7px 115px 7px 9px;white-space:nowrap}\n.rivis-preflight-row .rivis-preflight-title{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.rivis-preflight-row .rivis-preflight-recheck{position:absolute;top:5px;right:5px;z-index:1;display:inline-flex;align-items:center;justify-content:center;gap:4px;box-sizing:border-box;min-height:30px;max-width:108px;padding:5px 8px;white-space:nowrap;font-size:10px}\n.rivis-preflight-row .rivis-preflight-summary::-webkit-details-marker{display:none}\n.rivis-preflight-row .rivis-preflight-summary{list-style:none}\n@media(max-width:639px){.rivis-preflight-row .rivis-preflight-status{display:none}\n.rivis-preflight-row .rivis-preflight-summary,.rivis-preflight-row .rivis-preflight-empty{padding-right:113px}\n}\n.card-prompt-actions{display:flex;align-items:center;justify-content:space-between;gap:5px;min-width:0;flex-wrap:nowrap}\n.card-blueprint-pill{display:inline-flex;align-items:center;gap:5px;flex:1 1 0;min-width:0;padding:7px 8px;border-radius:8px;border:1px solid #155e75;background:#083344;color:#67e8f9;font-size:10px;font-weight:700;white-space:nowrap;cursor:pointer}\n.card-blueprint-pill .truncate{overflow:hidden;text-overflow:ellipsis}\n.card-prompt-btns{display:inline-flex;flex:0 0 auto;align-items:center;gap:5px}\n.card-prompt-btn{display:inline-flex;align-items:center;justify-content:center;gap:4px;padding:7px 9px;border-radius:8px;font-size:10px;font-weight:700;white-space:nowrap;cursor:pointer}\n.rivis-meta-summary{display:flex;align-items:center;justify-content:space-between;gap:8px;list-style:none;cursor:pointer;padding:10px;min-width:0}\n.rivis-meta-summary::-webkit-details-marker{display:none}\n.rivis-meta-summary::marker{content:''}\n.rivis-meta-chevron{transition:transform .2s ease}\n.rivis-meta-accordion[open] .rivis-meta-chevron{transform:rotate(180deg)}\n.rivis-meta-line{display:flex;align-items:center;gap:8px;white-space:nowrap;min-width:0}\n.rivis-meta-file{flex:1 1 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}\n.rivis-meta-file span:last-child{overflow:hidden;text-overflow:ellipsis}\n.rivis-meta-category{flex:0 0 auto;white-space:nowrap}\n@media(max-width:375px){.card-prompt-btn{padding:7px 6px;font-size:10px}\n.card-blueprint-pill{padding:7px 5px}\n.rivis-meta-line{font-size:8px}\n}\n.rivis-icon{display:inline-block;vertical-align:middle;flex-shrink:0;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}\n";document.head.appendChild(style);
 document.body.className="bg-slate-950 text-slate-200 p-2 md:p-6 pb-32 min-h-screen relative selection:bg-purple-500 selection:text-white";
 document.body.insertAdjacentHTML('afterbegin',"<svg xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\" focusable=\"false\" width=\"0\" height=\"0\" style=\"position:absolute;overflow:hidden\"><symbol id=\"rivis-sparkles\" viewBox=\"0 0 24 24\"><path d=\"M11.5 2.5C12.5 8.4 13.6 9.5 19.5 10.5c-5.9 1-7 2.1-8 8-1-5.9-2.1-7-8-8 5.9-1 7-2.1 8-8Z\"/><path d=\"M19 3v5M16.5 5.5h5\"/><circle cx=\"5\" cy=\"20\" r=\"1\"/><\/symbol><symbol id=\"rivis-lightbulb\" viewBox=\"0 0 24 24\"><path d=\"M8 16c0-2.1-3-3.2-3-7a7 7 0 0 1 14 0c0 3.8-3 4.9-3 7\"/><path d=\"M8 19h8M10 22h4\"/><\/symbol><symbol id=\"rivis-bookmark\" viewBox=\"0 0 24 24\"><path d=\"M6 3.5A1.5 1.5 0 0 1 7.5 2h9A1.5 1.5 0 0 1 18 3.5V22l-6-4-6 4V3.5Z\"/><\/symbol><\/svg><div id=\"toastContainer\" class=\"fixed top-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-none\"><\/div><div id=\"imageLightboxModal\" role=\"dialog\" aria-modal=\"true\" aria-label=\"Image preview\" class=\"fixed inset-0 z-[1001] bg-slate-950/95 backdrop-blur-md hidden flex-col items-center justify-center p-2 sm:p-4\"\nonclick=\"closeImageLightbox(event)\"><div class=\"lightbox-shell relative w-full max-w-6xl flex flex-col gap-2\" onclick=\"event.stopPropagation()\"><div class=\"w-full flex items-center justify-between gap-2 bg-slate-900/95 border border-slate-800 px-3 py-2 rounded-xl shadow-2xl\"><div class=\"flex items-center gap-2 min-w-0\"><h4 id=\"lightboxTitle\" class=\"text-xs font-bold text-white truncate\">Image Preview<\/h4><\/div><div class=\"flex items-center gap-2 shrink-0\"><button type=\"button\" onclick=\"closeImageLightbox()\" aria-label=\"Close preview\" title=\"Tutup\" class=\"px-2 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg font-bold text-sm\">✕<\/button><\/div><\/div><div id=\"lightboxViewport\" class=\"lightbox-viewport relative w-full min-h-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow-2xl\"\naria-label=\"Zoomable image; use mouse wheel, drag, or pinch on touch devices\" tabindex=\"0\"><img id=\"lightboxImg\" src=\"\" alt=\"Full image preview\" draggable=\"false\" class=\"lightbox-zoom-image\" /><button id=\"lightboxDownloadBtn\" type=\"button\" onclick=\"event.stopPropagation()\" title=\"Download gambar asli\" class=\"absolute bottom-3 right-3 z-20 px-3 py-2 shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5\"><span>Download<\/span><\/button><\/div><div class=\"flex flex-wrap items-center justify-center gap-2 rounded-xl bg-slate-900/95 border border-slate-800 py-2 px-2 text-xs\"><button type=\"button\" id=\"lightboxZoomOut\" aria-label=\"Perkecil gambar\" title=\"Zoom out\" onclick=\"changeLightboxZoom(1/1.4)\" class=\"lightbox-control\">−<\/button><span id=\"lightboxZoomLabel\" role=\"status\" aria-live=\"polite\" aria-label=\"Tingkat zoom\" class=\"text-slate-100 font-mono font-semibold min-w-[52px] text-center\">1.0×<\/span><button type=\"button\" id=\"lightboxZoomIn\" aria-label=\"Perbesar gambar\" title=\"Zoom in\" onclick=\"changeLightboxZoom(1.4)\" class=\"lightbox-control\">+<\/button><button type=\"button\" id=\"lightboxZoomFit\" onclick=\"resetLightboxZoom()\" title=\"Sesuaikan gambar dengan jendela\" class=\"lightbox-control lightbox-control-text\">Pas<\/button><button type=\"button\" id=\"lightboxZoomNative\" onclick=\"setLightboxNativeZoom()\" title=\"Tampilkan 1 piksel gambar = 1 piksel layar\" class=\"lightbox-control lightbox-control-text\">100%<\/button><span class=\"hidden sm:inline text-slate-500 ml-1\">Scroll / + − untuk zoom · Drag untuk geser · Double-click untuk zoom<\/span><span class=\"sm:hidden text-slate-500 text-center w-full\">Cubit untuk zoom · Geser dengan jari<\/span><\/div><\/div><\/div><div class=\"max-w-7xl mx-auto space-y-4\"><header class=\"bg-slate-900 rounded-xl p-3 md:p-4 border border-slate-800 shadow-2xl flex flex-col sm:flex-row justify-between items-center gap-3\"><div class=\"flex items-center justify-between w-full sm:w-auto\"><div class=\"flex items-center gap-2.5\"><div class=\"w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 shrink-0\"><svg aria-hidden=\"true\" class=\"rivis-icon w-5 h-5 md:w-6 md:h-6\"><use href=\"#rivis-lightbulb\"><\/use><\/svg><\/div><div><h1 class=\"text-base md:text-xl font-black tracking-tight text-white flex items-center gap-1.5 flex-wrap\">\nRICH VECTOR <span class=\"text-purple-400\">IDEA STUDIO<\/span><span class=\"px-1.5 py-0.5 rounded-md border border-purple-700/70 bg-purple-950/70 text-[9px] md:text-[10px] font-bold tracking-normal text-purple-200\">v…<\/span><\/h1><p class=\"text-[10px] md:text-xs text-slate-400\">Stock Asset Creator & Idea Intelligence · Vector + Raster<\/p><\/div><\/div><button id=\"apiKeyToggleBtn\" type=\"button\" onclick=\"toggleApiKeyModal()\"\nclass=\"sm:hidden px-2.5 py-1.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 transition-colors whitespace-nowrap bg-slate-800 text-slate-400 border-slate-700 hover:text-white\"><span class=\"apiKeyBtnText\">Key<\/span><\/button><\/div><div class=\"flex items-center gap-1.5 w-full sm:w-auto bg-slate-950/80 p-1 rounded-xl border border-slate-800\"><button id=\"navTabIdeaStudioTop\" type=\"button\" onclick=\"switchTab('idea_studio')\"\nclass=\"nav-tab active-tab flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-600/30\"><svg aria-hidden=\"true\" class=\"rivis-icon w-3.5 h-3.5\"><use href=\"#rivis-lightbulb\"><\/use><\/svg> IDEA STUDIO\n<\/button><button id=\"navTabSavedIdeasTop\" type=\"button\" onclick=\"switchTab('saved_ideas')\"\nclass=\"nav-tab flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800/60\"><svg aria-hidden=\"true\" class=\"rivis-icon w-3.5 h-3.5\"><use href=\"#rivis-bookmark\"><\/use><\/svg> LIBRARY (<span class=\"savedIdeasCountBadge\">0<\/span>)\n<\/button><button type=\"button\" onclick=\"toggleApiKeyModal()\"\nclass=\"hidden sm:flex px-3 py-2 rounded-lg text-xs font-bold border items-center gap-1.5 transition-colors whitespace-nowrap bg-slate-800 text-slate-400 border-slate-700 hover:text-white\"><span class=\"apiKeyBtnText\">Gemini Key<\/span><\/button><\/div><\/header><div id=\"apiKeyModal\" class=\"hidden p-4 bg-slate-900 rounded-xl border border-purple-500/30 space-y-2 animate-fadeIn shadow-2xl\"><div class=\"flex justify-between items-center text-xs font-bold text-purple-300\"><span class=\"flex items-center gap-1.5\"> Custom Gemini API Key<\/span><button type=\"button\" onclick=\"toggleApiKeyModal()\" class=\"text-slate-500 hover:text-white p-1 font-bold\">✕<\/button><\/div><input \ntype=\"password\" \nid=\"apiKeyInput\"\nplaceholder=\"Optional: Enter your Gemini API key...\"\noninput=\"saveApiKey(this.value)\"\nclass=\"w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-base md:text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500\"\n/><p class=\"text-[10px] text-slate-400 leading-relaxed\">\nStandalone HTML memerlukan Gemini API key. Di lingkungan terintegrasi, kredensial dapat disediakan oleh host. Jangan bagikan file yang menyimpan API key Anda.\n<\/p><\/div><section id=\"tabSectionIdeaStudio\" class=\"tab-section space-y-6\"><details id=\"rivisExtrasDisclosure\" class=\"rivis-extra-trigger\" ontoggle=\"toggleRivisExtras(this.open)\"><summary id=\"rivisExtrasBtn\" aria-expanded=\"false\" aria-controls=\"rivisSeasonalPanel rivisReferencePanel\"><span id=\"rivisExtrasText\">ADVANCE 🔽<\/span><\/summary><\/details><div id=\"rivisSeasonalPanel\" class=\"bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900 border border-purple-900/40 rounded-xl p-4 md:p-6 shadow-xl relative overflow-hidden space-y-4\"><div class=\"pt-3 border-t border-purple-900/30 space-y-2\"><div class=\"flex items-center justify-between flex-wrap gap-2\"><span class=\"text-xs font-bold text-amber-300 flex items-center gap-1.5\">\nSEASONAL MARKET CALENDAR & TREND RUSH\n<\/span><div class=\"flex items-center gap-2\"><span class=\"text-[10px] font-mono text-slate-400 hidden sm:inline\">Target upload: 60-90 days before peak season<\/span><button id=\"refreshSeasonalAiBtn\" type=\"button\" onclick=\"generateDynamicSeasonalTrendsWithAI()\"\nclass=\"px-2.5 py-1 bg-gradient-to-r from-amber-500 via-purple-600 to-blue-600 hover:from-amber-400 hover:to-blue-500 text-white font-bold rounded-lg text-[10px] flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer\"><svg aria-hidden=\"true\" class=\"rivis-icon w-3 h-3 text-amber-200 animate-pulse\"><use href=\"#rivis-sparkles\"><\/use><\/svg><span id=\"refreshSeasonalAiText\">Generate AI Trends<\/span><\/button><\/div><\/div><div class=\"flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide\" id=\"seasonalCalendarContainer\"><\/div><\/div><\/div><div class=\"grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch\"><div class=\"lg:col-span-1 bg-slate-900 rounded-xl p-4 md:p-5 border border-slate-800 space-y-5 shadow-xl\"><div id=\"rivisReferencePanel\" class=\"space-y-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800\"><div class=\"flex justify-between items-center\"><label class=\"text-xs font-bold text-slate-200 flex items-center gap-1.5\"> REFERENCE IMAGE (OPTIONAL)\n<\/label><button id=\"analyzeRefAiBtn\" type=\"button\" onclick=\"handleAnalyzeReferenceImageWithAI()\" class=\"hidden px-2.5 py-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded text-[10px] items-center gap-1 shadow transition-all active:scale-95\"><svg aria-hidden=\"true\" class=\"rivis-icon w-3 h-3\"><use href=\"#rivis-sparkles\"><\/use><\/svg><span id=\"analyzeRefAiText\">AI Analyze<\/span><\/button><\/div><div id=\"refUploadEmptyState\"><label class=\"flex items-center justify-center p-3 border border-dashed border-slate-800 hover:border-purple-500 rounded-lg bg-slate-950 cursor-pointer text-xs text-slate-300 hover:text-slate-100 transition-colors gap-2\"> Upload Reference Image\n<input type=\"file\" id=\"refFileInput\" class=\"hidden\" onchange=\"handleRefImageUpload(event)\" /><\/label><\/div><div id=\"refUploadActiveState\" class=\"hidden space-y-3\"><div class=\"flex gap-3 items-center bg-slate-900/80 p-2.5 rounded-lg border border-slate-800\"><img id=\"refPreviewImg\" src=\"\" class=\"w-14 h-14 object-cover rounded border border-slate-700 shadow\" alt=\"Reference preview\" /><div class=\"flex-1 space-y-1 min-w-0\"><span class=\"text-[10px] font-bold text-emerald-400 block flex items-center gap-1\">✓ Reference Image Active<\/span><p id=\"refFileName\" class=\"text-[10px] text-slate-300 font-mono truncate\">reference_image.png<\/p><\/div><div class=\"flex items-center gap-1.5 shrink-0\"><label class=\"px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded cursor-pointer border border-slate-700 flex items-center gap-1\"> Replace\n<input type=\"file\" class=\"hidden\" onchange=\"handleRefImageUpload(event)\" /><\/label><button type=\"button\" onclick=\"removeRefImage()\" class=\"px-2.5 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 text-[10px] font-bold rounded border border-red-800 flex items-center gap-1\"> Remove\n<\/button><\/div><\/div><div><span class=\"text-[10px] font-bold text-slate-400 block mb-1\">Reference Mode:<\/span><select id=\"refModeSelect\" class=\"w-full bg-slate-900 text-white border border-slate-800 rounded p-2 text-base md:text-xs\"><\/select><\/div><div><span class=\"text-[10px] font-bold text-slate-400 block mb-1\">How should the reference image be modified?<\/span><input type=\"text\" id=\"refModInstructionInput\" placeholder=\"e.g. Change color palette to pastel, create flat vector style...\"\nclass=\"w-full bg-slate-900 text-white border border-slate-800 rounded p-2 text-base md:text-xs outline-none focus:border-purple-500\" /><\/div><div id=\"refSuggestionsBox\" class=\"hidden p-3 bg-purple-950/40 border border-purple-800/60 rounded-lg space-y-2 text-xs\"><span class=\"font-bold text-purple-300 flex items-center gap-1\"> AI Creative Modification Suggestions:\n<\/span><ul id=\"refSuggestionsList\" class=\"space-y-1 pl-4 list-disc text-slate-300 text-[11px]\"><\/ul><\/div><\/div><\/div><div class=\"space-y-2\"><div class=\"flex items-center justify-between gap-2 flex-wrap\"><label class=\"text-xs font-bold text-slate-200 flex items-center gap-1.5\"> A. SIMPLE PROMPT\n<\/label><div class=\"flex flex-wrap items-center justify-end gap-1.5 ml-auto max-w-full\"><button type=\"button\" id=\"clearSimplePromptBtn\" onclick=\"clearSimplePrompt()\" title=\"Clear Simple Prompt\" aria-label=\"Clear Simple Prompt\"\nclass=\"px-2 py-1 bg-slate-900 hover:bg-red-950 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-800 rounded text-[10px] font-bold inline-flex items-center gap-1 transition-all active:scale-95\"> Clear\n<\/button><button type=\"button\" id=\"copySimplePromptBtn\" onclick=\"copySimplePrompt(this)\" title=\"Copy Simple Prompt\" aria-label=\"Copy Simple Prompt\"\nclass=\"px-2 py-1 bg-slate-900 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-700 hover:border-emerald-800 rounded text-[10px] font-bold inline-flex items-center gap-1 transition-all active:scale-95\"> Copy\n<\/button><select id=\"autoPromptModeSelect\" onchange=\"updateAutoPromptMode()\" aria-label=\"Mode Auto Prompt\" class=\"min-w-0 max-w-[135px] bg-slate-950 text-slate-200 border border-slate-700 rounded-lg px-1.5 py-1.5 text-[11px]\"><option value=\"online\">AI Online<\/option><option value=\"offline\">Preset Offline<\/option><\/select><button type=\"button\" id=\"autoPromptBtn\" onclick=\"handleAutoPrompt(this)\" \nclass=\"px-2.5 py-1 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all active:scale-95 cursor-pointer\"><svg aria-hidden=\"true\" class=\"rivis-icon w-3.5 h-3.5 text-amber-200 animate-pulse\"><use href=\"#rivis-sparkles\"><\/use><\/svg> Auto Prompt\n<\/button><\/div><\/div><textarea \nid=\"simplePromptInput\"\nrows=\"3\"\nplaceholder=\"Describe your idea in a few words... (or click 'Auto Prompt' to generate automatically)\"\nclass=\"w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-base md:text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500 leading-relaxed font-medium\"\n><\/textarea><p id=\"autoPromptStatus\" role=\"status\" aria-live=\"polite\" class=\"text-[10px] text-slate-400 leading-relaxed\">AI mengikuti opsi B–G. Preset Offline tersedia untuk pengujian tanpa API.<\/p><fieldset class=\"space-y-2 rounded-lg border border-purple-900/50 bg-slate-950/50 p-3\"><legend class=\"px-1 text-[10px] font-bold text-purple-300\">ARAHAN KOMERSIAL · OPSIONAL<\/legend><div class=\"grid grid-cols-1 sm:grid-cols-2 gap-3\"><div class=\"space-y-1.5 min-w-0\"><label for=\"targetBuyerInput\" class=\"block text-xs font-bold text-slate-200\">Target Pembeli<\/label><input id=\"targetBuyerInput\" type=\"text\" maxlength=\"160\" placeholder=\"Contoh: klinik gigi anak, UMKM bakery\"\naria-describedby=\"commercialBriefHint\" class=\"w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-base md:text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500\"\n/><\/div><div class=\"space-y-1.5 min-w-0\"><label for=\"designNeedInput\" class=\"block text-xs font-bold text-slate-200\">Kebutuhan Desain<\/label><textarea id=\"designNeedInput\" rows=\"2\" maxlength=\"600\" placeholder=\"Contoh: ilustrasi poster edukasi sikat gigi, ruang kosong untuk judul\"\naria-describedby=\"commercialBriefHint\" class=\"w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-base md:text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500 leading-relaxed\"><\/textarea><\/div><\/div><p id=\"commercialBriefHint\" class=\"text-[10px] text-slate-400 leading-relaxed\">Berlaku untuk Auto Prompt, Preset Offline, dan Discover Ideas. Kosongkan agar AI memilih. Variasi mengutamakan subjek, aktivitas, atau kegunaan; bukan sekadar warna atau gaya.<\/p><\/fieldset><div class=\"flex flex-wrap gap-1.5 pt-1\" id=\"quickPromptContainer\"><\/div><\/div><section id=\"outputModeSection\" class=\"space-y-2 pt-1 pb-3 border-b border-slate-800\" aria-label=\"Output Medium\"><div class=\"flex justify-between items-center gap-2\"><label for=\"outputModeSelect\" class=\"text-xs font-bold text-amber-200 flex items-center gap-1.5\"> OUTPUT MODE<\/label><span id=\"outputModeHint\" class=\"text-[10px] text-slate-400\">Clean vector-friendly art<\/span><\/div><select id=\"outputModeSelect\" onchange=\"handleOutputModeChange(this.value)\" class=\"w-full bg-slate-950 text-white border border-amber-700/50 rounded-lg p-2.5 text-base md:text-xs font-semibold outline-none focus:border-amber-400\"><option value=\"vector\">Vector / SVG-Friendly Illustration<\/option><option value=\"photo\">Raster · Clean Commercial Photo<\/option><option value=\"editorial\">Raster · Editorial Lifestyle / Color Pop<\/option><option value=\"advertising\">Raster · Premium Advertising Hero<\/option><option value=\"3d\">Raster · Premium 3D Commercial Render<\/option><\/select><div id=\"rasterControls\" class=\"hidden rounded-xl border border-amber-900/40 bg-slate-950/65 p-3 space-y-3\"><p class=\"text-[10px] text-slate-400 leading-relaxed\">Scene komersial realistis, bukan clipart. Setelan disimpan pada setiap konsep, sehingga hasil di Library tidak berubah ketika mode diganti.<\/p><div class=\"grid grid-cols-2 gap-2\"><div><label class=\"block text-[10px] font-bold text-slate-300 mb-1\">People<\/label><select id=\"rasterPeopleSelect\" class=\"raster-control w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white\"><option value=\"auto\">Auto (sesuai scene)<\/option><option value=\"none\">No People<\/option><option value=\"one\">One Person<\/option><option value=\"small\">Small Group (2–4)<\/option><option value=\"large\">Large Group<\/option><\/select><\/div><div><label class=\"block text-[10px] font-bold text-slate-300 mb-1\">Camera / Shot<\/label><select id=\"rasterShotSelect\" class=\"raster-control w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white\"><option value=\"auto\">Auto Cinematography<\/option><option value=\"closeup\">Close-up Portrait · 85mm<\/option><option value=\"environmental\">Environmental · 35mm<\/option><option value=\"wide\">Wide Scene · 24–35mm<\/option><option value=\"dynamic\">Dynamic / Selfie Perspective<\/option><option value=\"macro\">Macro Product Detail<\/option><\/select><\/div><div><label class=\"block text-[10px] font-bold text-slate-300 mb-1\">Lighting<\/label><select id=\"rasterLightingSelect\" class=\"raster-control w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white\"><option value=\"auto\">Auto · Scene Appropriate<\/option><option value=\"natural\">Soft Natural Daylight<\/option><option value=\"studio\">Clean Professional Studio<\/option><option value=\"cinematic\">Cinematic Blue / Amber<\/option><option value=\"highkey\">Bright High-Key<\/option><option value=\"dramatic\">Dramatic Directional<\/option><\/select><\/div><div><label class=\"block text-[10px] font-bold text-slate-300 mb-1\">Color Direction<\/label><select id=\"rasterColorSelect\" class=\"raster-control w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white\"><option value=\"auto\">Auto · Balanced<\/option><option value=\"natural\">True-to-Life Color<\/option><option value=\"colorpop\">Bold Saturated Color Pop<\/option><option value=\"warm\">Warm Editorial<\/option><option value=\"tealorange\">Cinematic Teal / Amber<\/option><option value=\"pastel\">Soft Premium Pastels<\/option><\/select><\/div><div><label class=\"block text-[10px] font-bold text-slate-300 mb-1\">Authenticity<\/label><select id=\"rasterAuthenticitySelect\" class=\"raster-control w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white\"><option value=\"candid\">Natural Candid<\/option><option value=\"polished\">Polished Commercial<\/option><option value=\"editorial\">Creative Editorial<\/option><option value=\"documentary\">Documentary Realism<\/option><\/select><\/div><div><label class=\"block text-[10px] font-bold text-slate-300 mb-1\">Copy Space<\/label><select id=\"rasterCopySpaceSelect\" class=\"raster-control w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white\"><option value=\"auto\">Auto · Best Placement<\/option><option value=\"none\">None / Immersive<\/option><option value=\"left\">Left<\/option><option value=\"right\">Right<\/option><option value=\"top\">Top<\/option><option value=\"bottom\">Bottom<\/option><\/select><\/div><div><label class=\"block text-[10px] font-bold text-slate-300 mb-1\">Download Format<\/label><select id=\"rasterFormatSelect\" onchange=\"saveRasterOutputPreferences()\" class=\"raster-control w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white\"><option value=\"jpg\">JPG · Microstock<\/option><option value=\"png\">PNG · Lossless<\/option><\/select><\/div><div><label class=\"block text-[10px] font-bold text-slate-300 mb-1\">JPEG Quality<\/label><select id=\"rasterJpegQualitySelect\" onchange=\"saveRasterOutputPreferences()\" class=\"raster-control w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white\"><option value=\"0.92\">92% · High<\/option><option value=\"0.95\" selected>95% · Premium<\/option><option value=\"0.98\">98% · Maximum<\/option><\/select><\/div><\/div><div class=\"grid grid-cols-3 gap-1.5\" aria-label=\"Photo scene examples\"><button type=\"button\" onclick=\"applyRasterScenePreset('lab')\" class=\"text-[10px] rounded-lg border border-slate-700 bg-slate-900 hover:border-amber-500 p-2 text-slate-200\">Science Lab<\/button><button type=\"button\" onclick=\"applyRasterScenePreset('community')\" class=\"text-[10px] rounded-lg border border-slate-700 bg-slate-900 hover:border-amber-500 p-2 text-slate-200\">Community<\/button><button type=\"button\" onclick=\"applyRasterScenePreset('fashion')\" class=\"text-[10px] rounded-lg border border-slate-700 bg-slate-900 hover:border-amber-500 p-2 text-slate-200\">Color Pop<\/button><\/div><p class=\"text-[10px] text-slate-500\">Generate konten orisinal, bukan menyalin contoh. Untuk Adobe Stock gunakan JPG sRGB, 4–100 MP, dan label Generative AI saat submit. Resolusi 1K/2K/4K tetap tersedia.<\/p><\/div><\/section><div class=\"space-y-2 pt-2 border-t border-slate-800\"><div class=\"flex items-center justify-between\"><label class=\"text-xs font-bold text-slate-200 flex items-center gap-1.5\"> B. PRODUCTION TYPE\n<\/label><label class=\"flex items-center gap-1.5 text-xs font-bold text-emerald-400 cursor-pointer\"><input type=\"checkbox\" id=\"noTextCheckbox\" checked class=\"accent-emerald-500 rounded\" /> No Text\n<\/label><\/div><label class=\"flex items-start gap-2 rounded-lg border border-emerald-800/50 bg-emerald-950/20 p-2.5 text-xs text-emerald-100 cursor-pointer\"><input type=\"checkbox\" id=\"svgFriendlyCheckbox\" checked class=\"mt-0.5 accent-emerald-500 rounded\" /><span><strong>SVG-Friendly / Clean Paths<\/strong><span class=\"block text-[10px] text-slate-400 mt-0.5\">Utamakan bentuk sederhana, tertutup, terpisah, minim detail kecil, dan mudah ditrace menjadi SVG.<\/span><\/span><\/label><label class=\"flex items-start gap-2 rounded-lg border border-fuchsia-800/50 bg-fuchsia-950/20 p-2.5 text-xs text-fuchsia-100 cursor-pointer\"><input type=\"checkbox\" id=\"gradientColorCheckbox\" onchange=\"setGradientEnabled(this.checked)\" class=\"mt-0.5 accent-fuchsia-500 rounded\" /><span><strong>Gradasi Warna<\/strong><span class=\"block text-[10px] text-slate-400 mt-0.5\">Gunakan gradasi halus dan terkontrol. Pada mode SVG-Friendly, AI dibatasi ke gradasi linear/radial sederhana agar tetap mudah dibuat sebagai vektor.<\/span><\/span><\/label><div class=\"grid grid-cols-2 gap-2\"><button type=\"button\" id=\"prodTypeSingleBtn\" onclick=\"setProductionType('single')\"\nclass=\"p-2.5 rounded-lg border text-left transition-all flex flex-col gap-1 bg-purple-600/20 border-purple-500 text-white shadow\"><div class=\"flex items-center justify-between font-bold text-xs\"><span class=\"flex items-center gap-1.5\"> Single Asset<\/span><\/div><p class=\"text-[10px] text-slate-400 leading-tight\">Single isolated object concept<\/p><\/button><button type=\"button\" id=\"prodTypeCollectionBtn\" onclick=\"setProductionType('collection')\"\nclass=\"p-2.5 rounded-lg border text-left transition-all flex flex-col gap-1 bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700\"><div class=\"flex items-center justify-between font-bold text-xs\"><span class=\"flex items-center gap-1.5\"> Collection / Set<\/span><\/div><p class=\"text-[10px] text-slate-400 leading-tight\">Consistent asset set or pack<\/p><\/button><\/div><div id=\"collectionItemCountBox\" class=\"hidden mt-2 p-3 bg-slate-950 rounded-lg border border-purple-900/40 flex items-center justify-between animate-fadeIn\"><span class=\"text-xs font-bold text-purple-300\">Items in Collection / Set:<\/span><input type=\"number\" id=\"collectionItemCountInput\" min=\"1\" max=\"50\" placeholder=\"Item count...\"\nclass=\"w-28 bg-slate-900 border border-slate-700 rounded p-1.5 text-center text-xs font-bold text-white outline-none focus:border-purple-500 placeholder-slate-600\"\n/><\/div><\/div><div class=\"grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800\"><div class=\"space-y-1.5\"><label class=\"text-xs font-bold text-slate-300\">C. CATEGORY<\/label><select id=\"stockCategorySelect\" onchange=\"handleCategoryChange(this.value)\"\nclass=\"w-full bg-slate-950 text-white border border-slate-800 rounded-lg p-2.5 text-base md:text-xs font-semibold outline-none focus:border-purple-500\"><\/select><input type=\"text\" id=\"customCategoryInput\" placeholder=\"Type custom category...\"\nclass=\"hidden mt-1.5 w-full bg-slate-950 text-white border border-slate-800 rounded p-2 text-xs outline-none focus:border-purple-500\" /><\/div><div class=\"space-y-1.5\"><label class=\"text-xs font-bold text-slate-300\">SUBCATEGORY (OPSIONAL)<\/label><select id=\"stockSubcategorySelect\"\nclass=\"w-full bg-slate-950 text-white border border-slate-800 rounded-lg p-2.5 text-base md:text-xs font-semibold outline-none focus:border-purple-500\"><\/select><input type=\"text\" id=\"customSubcategoryInput\" placeholder=\"Subkategori khusus (opsional)...\"\nclass=\"hidden w-full bg-slate-950 text-white border border-slate-800 rounded p-2.5 text-base md:text-xs outline-none focus:border-purple-500\" /><\/div><\/div><section id=\"colorPaletteSection\" class=\"space-y-2.5 pt-3 border-t border-slate-800\" aria-label=\"Color Palette\">\n<div class=\"flex items-center justify-between gap-2\"><label for=\"colorPaletteSelect\" class=\"text-xs font-bold text-slate-200 flex items-center gap-1.5\"> D. COLOR PALETTE<\/label><\/div>\n<select id=\"colorPaletteSelect\" onchange=\"handlePaletteChange(this.value)\" class=\"w-full bg-slate-950 text-white border border-slate-800 rounded-lg p-2.5 text-base md:text-xs font-semibold outline-none focus:border-fuchsia-500\"\naria-label=\"Select color palette\"><\/select>\n<div id=\"customPaletteEditor\" class=\"hidden p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2\">\n<label for=\"customPaletteHexInput\" class=\"block text-[10px] font-bold text-slate-300\">Custom HEX (opsional · pisahkan dengan koma)<\/label>\n<input id=\"customPaletteHexInput\" type=\"text\" spellcheck=\"false\" autocomplete=\"off\" placeholder=\"#243B53, #00A6A6, #F4EBD0\" oninput=\"handleCustomPaletteHexInput(this.value)\"\nclass=\"w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-base md:text-xs font-mono text-white outline-none focus:border-fuchsia-500\"\n/>\n<div id=\"customPaletteSwatches\" class=\"hidden flex gap-1 h-6 rounded overflow-hidden\" aria-label=\"Manual palette colors\"><\/div>\n<p id=\"customPaletteHint\" class=\"text-[10px] text-slate-400\">Isi minimal 3 warna HEX agar digunakan persis; kosongkan untuk warna otomatis.<\/p>\n<\/div>\n<\/section><div class=\"space-y-3 pt-2 border-t border-slate-800\"><div class=\"flex justify-between items-center\"><label class=\"text-xs font-bold text-slate-200 flex items-center gap-1.5\"> E. CREATIVE DIRECTION\n<\/label><label class=\"flex items-center gap-1.5 text-[11px] font-bold text-purple-400 cursor-pointer\"><input type=\"checkbox\" id=\"autoSelectBestCheckbox\" checked onchange=\"toggleAutoSelectBest(this.checked)\" class=\"accent-purple-500 rounded\" /> Auto Select Best Combination\n<\/label><\/div><div id=\"creativeDirectionControls\" class=\"hidden grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800\"><div><span class=\"text-[10px] font-bold text-slate-400 block mb-1\">Visual Style<\/span><select id=\"visualStyleSelect\" class=\"w-full bg-slate-900 text-white border border-slate-800 rounded p-2 text-base md:text-xs font-medium\"><\/select><\/div><div><span class=\"text-[10px] font-bold text-slate-400 block mb-1\">Commercial Purpose<\/span><select id=\"commercialPurposeSelect\" class=\"w-full bg-slate-900 text-white border border-slate-800 rounded p-2 text-base md:text-xs font-medium\"><\/select><\/div><div><span class=\"text-[10px] font-bold text-slate-400 block mb-1\">Composition<\/span><select id=\"compositionSelect\" class=\"w-full bg-slate-900 text-white border border-slate-800 rounded p-2 text-base md:text-xs font-medium\"><\/select><\/div><\/div><\/div><div class=\"space-y-2 pt-2 border-t border-slate-800\"><label class=\"text-xs font-bold text-slate-200 flex items-center gap-1.5\"> CUSTOM NEGATIVE PROMPT (OPTIONAL)\n<\/label><input type=\"text\" id=\"negativePromptInput\" \nvalue=\"blurry, distorted, watermarks, low resolution, background noise\"\nplaceholder=\"e.g. no gradients, no realistic shadows, no text...\"\nclass=\"w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-base md:text-xs text-slate-300 placeholder-slate-600 outline-none focus:border-purple-500 font-mono\"\n/><p class=\"text-[10px] text-slate-500\">Unwanted visual elements will be explicitly excluded during prompt construction.<\/p><\/div><div class=\"space-y-1.5 pt-2 border-t border-slate-800\"><label class=\"text-xs font-bold text-slate-300\">F. ASSET TYPE<\/label><select id=\"assetTypeSelect\" class=\"w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-base md:text-xs font-semibold outline-none focus:border-purple-500\"><\/select><\/div><div class=\"space-y-3 pt-2 border-t border-slate-800\"><label class=\"text-xs font-bold text-slate-200 flex items-center gap-1.5\"> G. IMAGE SIZE / ASPECT RATIO\n<\/label><div class=\"space-y-2\"><div class=\"grid grid-cols-2 gap-2\"><div><label for=\"ideaStudioSizeSelect\" class=\"block mb-1 text-[10px] text-slate-400 font-bold\">Aspect Ratio<\/label><select id=\"ideaStudioSizeSelect\" onchange=\"handleIdeaSizeChange(this.value);updateRatioHint()\"\nclass=\"w-full bg-slate-950 text-white border border-slate-800 rounded-lg p-2.5 text-base md:text-xs font-semibold outline-none focus:border-purple-500 cursor-pointer\"><\/select><\/div><div><label for=\"imageResolutionSelect\" class=\"block mb-1 text-[10px] text-slate-400 font-bold\">AI Resolution<\/label><select id=\"imageResolutionSelect\" onchange=\"handleImageResolutionChange(this.value)\" class=\"w-full bg-slate-950 text-white border border-slate-800 rounded-lg p-2.5 text-base md:text-xs font-semibold outline-none focus:border-purple-500 cursor-pointer\"><option value=\"1K\">1K · ~1 MP<\/option><option value=\"2K\" selected>2K · ~4 MP<\/option><option value=\"4K\">4K · ~17 MP<\/option><\/select><\/div><\/div><p id=\"stockRatioHint\" aria-live=\"polite\" class=\"text-xs text-slate-400\">Ukuran asli dan megapiksel ditampilkan setelah gambar selesai.<\/p><div id=\"customSizeDimensionsBox\" class=\"hidden bg-slate-950 p-3 rounded-lg border border-purple-900/50 space-y-2.5 animate-fadeIn\"><div class=\"flex items-center justify-between\"><span class=\"text-[11px] font-bold text-purple-300 flex items-center gap-1\"> Custom Dimensions (px)\n<\/span><span class=\"text-[10px] text-slate-400\">64–4096 px · Acuan rasio; generator memakai rasio terdekat.<\/span><\/div><div class=\"grid grid-cols-2 gap-3\"><div><label class=\"text-[10px] font-bold text-slate-400 block mb-1\">Width (px)<\/label><input type=\"number\" oninput=\"updateRatioHint()\" id=\"ideaCustomWidthInput\" min=\"64\" max=\"4096\" value=\"2048\"\nclass=\"w-full bg-slate-900 border border-slate-800 rounded p-2 text-base md:text-xs font-mono text-white outline-none focus:border-purple-500\" /><\/div><div><label class=\"text-[10px] font-bold text-slate-400 block mb-1\">Height (px)<\/label><input type=\"number\" oninput=\"updateRatioHint()\" id=\"ideaCustomHeightInput\" min=\"64\" max=\"4096\" value=\"2048\"\nclass=\"w-full bg-slate-900 border border-slate-800 rounded p-2 text-base md:text-xs font-mono text-white outline-none focus:border-purple-500\" /><\/div><\/div><\/div><\/div><\/div><div id=\"ideaDiscoverActionBar\" class=\"flex flex-row items-end gap-3.5\"><div id=\"discoverBarFields\" class=\"w-full sm:w-36 shrink-0\"><label class=\"text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1\"> Idea Count\n<\/label><select id=\"ideaCountSelect\" class=\"w-full bg-slate-950 text-white border border-slate-800 rounded-xl px-3.5 py-3 text-xs font-bold outline-none focus:border-purple-500 h-[52px] shadow-inner\"><option value=\"1\">1 Idea<\/option><option value=\"2\">2 Ideas<\/option><option value=\"3\">3 Ideas<\/option><option value=\"4\">4 Ideas<\/option><option value=\"5\" selected>5 Ideas<\/option><option value=\"10\">10 Ideas<\/option><\/select><\/div><button id=\"discoverIdeasBtn\" type=\"button\" onclick=\"handleDiscoverIdeas()\"\nclass=\"flex-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black h-[54px] min-h-[54px] px-6 rounded-2xl text-sm tracking-wide flex items-center justify-center gap-2.5 shadow-xl shadow-purple-600/40 border border-purple-400/30 transition-all active:scale-[0.98] cursor-pointer group\"><svg aria-hidden=\"true\" class=\"rivis-icon w-5 h-5 text-amber-300 shrink-0 group-hover:rotate-12 transition-transform\"><use href=\"#rivis-lightbulb\"><\/use><\/svg><span id=\"discoverIdeasBtnText\" class=\"whitespace-nowrap uppercase\">DISCOVER IDEAS<\/span><\/button><button id=\"discoverBarToggleBtn\" type=\"button\" onclick=\"toggleDiscoverActionBar()\"\ntitle=\"Sembunyikan panel Discover Ideas\" aria-label=\"Sembunyikan panel Discover Ideas\"\naria-expanded=\"true\" aria-controls=\"discoverBarFields discoverIdeasBtn\"><span aria-hidden=\"true\" class=\"text-xl\">−<\/span><\/button><\/div><\/div><div class=\"lg:col-span-1 space-y-4 h-full min-w-0\"><div class=\"bg-slate-900 rounded-xl p-4 md:p-5 border border-slate-800 space-y-4 shadow-xl min-h-[350px] h-full flex flex-col\"><div class=\"flex justify-between items-center border-b border-slate-800 pb-3 flex-wrap gap-2\"><h3 class=\"text-xs font-bold text-white flex items-center gap-1.5 whitespace-nowrap shrink-0\"><span>DISCOVERED CONCEPTS<\/span><span class=\"text-purple-400 font-mono\">(<span id=\"discoveredCountBadge\">0<\/span>)<\/span><\/h3><div class=\"flex items-center gap-1.5 ml-auto\"><button id=\"clearAllDiscoveredBtn\" type=\"button\" onclick=\"handleClearAllDiscoveredIdeas(this)\" class=\"hidden px-2.5 py-1 bg-red-950/80 hover:bg-red-900 text-red-300 font-bold rounded text-[10px] items-center gap-1 border border-red-800/80 shadow whitespace-nowrap transition-all active:scale-95\"> Clear All\n<\/button><button id=\"saveAllBtn\" type=\"button\" onclick=\"handleSaveAllDiscoveredIdeas(this)\" class=\"hidden px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[10px] items-center gap-1 shadow whitespace-nowrap transition-all active:scale-95\"> Save All\n<\/button><\/div><\/div><div id=\"discoveredIdeasContainer\" class=\"space-y-3 max-h-[1600px] overflow-y-auto pr-1 flex-1\"><div class=\"text-center py-12 text-slate-500 text-xs space-y-2\"><p>Type a Simple Prompt then click \"DISCOVER IDEAS\".<\/p><\/div><\/div><\/div><\/div><\/div><\/section><section id=\"tabSectionSavedIdeas\" class=\"tab-section hidden bg-slate-900 rounded-xl p-4 md:p-6 border border-slate-800 space-y-6 shadow-2xl\"><div class=\"flex justify-between items-center border-b border-slate-800 pb-4 flex-wrap gap-3\"><div><h2 class=\"text-base md:text-lg font-bold text-white flex items-center gap-2\"> IDEAS LIBRARY\n<\/h2><p class=\"text-xs text-slate-400\">Saved stock concept collection from Idea Studio.<\/p><\/div><div class=\"flex flex-wrap gap-2 justify-end items-center\"><button id=\"generateAllImagesBtn\" type=\"button\" onclick=\"handleGenerateAllImages(this)\" class=\"px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-purple-600/20 flex items-center gap-1.5 whitespace-nowrap transition-all active:scale-95\">Image All\n<\/button><button id=\"generateAllMetaBtn\" type=\"button\" onclick=\"handleGenerateAllMetadata(this)\" class=\"px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-blue-600/20 flex items-center gap-1.5 whitespace-nowrap transition-all active:scale-95\"> Meta All\n<\/button><button id=\"clearAllSavedBtn\" type=\"button\" onclick=\"handleClearAllSavedIdeas(this)\" class=\"px-3 py-2 bg-red-950/80 hover:bg-red-900 text-red-300 rounded-lg text-xs font-bold border border-red-800 flex items-center gap-1.5 whitespace-nowrap transition-all active:scale-95\"> Clear All Cards\n<\/button><button id=\"downloadAllZipBtn\" type=\"button\" onclick=\"handleDownloadAllCardsZip(this)\" class=\"px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 whitespace-nowrap transition-all active:scale-95\"> Download All Card\n<\/button><button id=\"downloadResultsZipBtn\" type=\"button\" onclick=\"handleDownloadResultsZip(this)\" class=\"px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-green-600/20 flex items-center gap-1.5 whitespace-nowrap transition-all active:scale-95\"> Download Result\n<\/button><\/div><\/div><div id=\"libraryStorageTestRow\" class=\"flex items-center justify-between gap-2 min-w-0\">\n<p id=\"storageStatusText\" class=\"min-w-0 flex-1 truncate text-[10px] sm:text-[11px] text-slate-400\" aria-live=\"polite\" title=\"Perkiraan ukuran data Library yang disimpan di perangkat\">IndexedDB lokal • 0 ide • 0.00 MB<\/p>\n<button type=\"button\" id=\"imageTestOfflineBtn\" onclick=\"toggleImageTestOffline()\" aria-pressed=\"false\" title=\"Aktifkan simulasi tanpa API dan muat 3 kartu contoh\"\nclass=\"shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-indigo-700/60 bg-slate-800 hover:bg-indigo-900/70 px-2.5 py-1.5 text-[10px] font-bold text-indigo-200 transition-colors whitespace-nowrap\"><span>Image Test Offline<\/span><span id=\"imageTestOfflineState\" hidden class=\"rounded bg-indigo-300/20 px-1 text-[9px] text-indigo-100\">ON<\/span><\/button>\n<\/div><div id=\"qualityFirstPanel\" class=\"mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-[11px]\"\naria-label=\"Quality First generation settings\"><label class=\"inline-flex items-center gap-1.5 font-bold text-cyan-200 cursor-pointer\"><input type=\"checkbox\" id=\"qualityFirstToggle\" checked onchange=\"setQualityFirstOption('enabled',this.checked)\" class=\"accent-cyan-500\" /> Quality First<\/label><label class=\"inline-flex items-center gap-1.5 text-slate-300 cursor-pointer\"><input type=\"checkbox\" id=\"qualityRepairToggle\" checked onchange=\"setQualityFirstOption('repair',this.checked)\" class=\"accent-cyan-500\" /> Smart Repair (maks. 1×)<\/label><span class=\"text-slate-500\">Crop 100% + AI & pemeriksaan teknis · memakai kuota API tambahan<\/span><\/div><div id=\"savedIdeasGridContainer\"><div class=\"text-center py-16 text-slate-500 text-xs space-y-2\"><p>No saved ideas yet. Open Idea Studio and click \"Save\" on your favorite concept card.<\/p><\/div><\/div><\/section><\/div><nav id=\"floatingSideTabs\" aria-label=\"Shortcut to other tab\"><button id=\"navTabSwitchBottom\" type=\"button\" onclick=\"switchToOtherTab()\" title=\"Open Library\" aria-label=\"Open Library\" class=\"nav-tab side-tab text-slate-200 bg-slate-950/70 border border-slate-700/80 shadow-lg\"><svg id=\"sideShortcutIcon\" aria-hidden=\"true\" class=\"rivis-icon w-4 h-4 shrink-0\"><use href=\"#rivis-bookmark\"><\/use><\/svg><span id=\"sideShortcutCount\" class=\"side-count\">0<\/span><\/button><\/nav>\n\n");
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
const STOCK_CATEGORIES=[{id:'business',name:'Business & Finance',subcategories:['Corporate Tech','Banking & Crypto','Startups & Growth',
'Office & Remote Work','Marketing Analytics']},{id:'tech',name:'Technology & AI',subcategories:['Artificial Intelligence','Cybersecurity',
'Cloud Computing','Robotics & Automation','Data Science']},{id:'nature',name:'Nature & Botanical',subcategories:['Tropical Leaves',
'Wildflowers & Floral','Forest & Wilderness','Ecology & Green Energy','Ocean & Marine Life']},{id:'food',name:'Food & Beverage',
subcategories:['Gourmet & Restaurant','Coffee & Cafe','Fresh Fruits & Vegetables','Bakery & Pastry','Cocktails & Craft Drinks']},
{id:'people',name:'People & Lifestyle',subcategories:['Modern Diversity','Fitness & Wellness','Remote Work & Study','Family & Community',
'Creative Professionals']},{id:'bg',name:'Backgrounds & Textures',subcategories:['Abstract Geometric','Fluid Organic Waves','Minimalist Gradients',
'Seamless Patterns','3D Spatial Waves']},{id:'vector',name:'Vector Illustration & Clipart',subcategories:['Icon','Vector Illustration',
'Clipart','Object','Mascot Characters','Infographic Elements','Badge & Emblem Logos','Sticker Packs']},{id:'3d',name:'3D Commercial Concepts',
subcategories:['Iso 3D Icons','Claymate Characters','Glassmorphism Objects','Product Mockup Stages','Metallic Shapes']},{id:'health',
name:'Health & Wellness',subcategories:['Medical & Healthcare','Mental Health & Yoga','Skincare & Cosmetics','Nutrition & Supplements',
'Spa & Relaxation']},{id:'edu',name:'Education & Science',subcategories:['Online Learning','STEM & Research','School Supplies',
'Space & Astronomy','History & Knowledge']},{id:'travel',name:'Travel & Architecture',subcategories:['City Skylines','Landmarks & Heritage',
'Camping & Adventure','Transportation','Hotel & Hospitality']},{id:'seasonal',name:'Seasonal & Holiday Campaigns',subcategories:['Christmas & Winter',
'Summer Festival','Halloween & Gothic','Spring Renewal','Autumn Harvest']},{id:'custom',name:'Custom Category',subcategories:['custom']}];
const VISUAL_STYLES=['Minimalist Logo','Cutout Sticker','Badge','Minimalist','Flat Vector','Geometric','Botanical','Line Art',
'Isometric','3D Render','Photorealistic','Editorial Illustration','Abstract','Clay Style','Paper Cut','Hand Drawn','Premium Commercial',
'Custom Style'];
const COMMERCIAL_PURPOSES=['Website Hero','Advertising','Product Packaging','Social Media','Corporate Presentation',
'Editorial Illustration','Mobile Application','Infographic','Print Design','Background Design','Stock Illustration'];
const COLOR_PALETTES=['Vintage',
'Retro','Cold','Black & White','Dark','Natural Green','Corporate Blue','Blue & Indigo','Warm Earth','Pastel','Monochrome','Black & Gold',
'Vibrant Colors','Neutral Minimalist','Silhouette','Custom Palette'];
const COMPOSITIONS=['Centered','Isolated Objects','Negative Space',
'Balanced Collection','Symmetrical','Asymmetrical','Seamless Pattern','Wide Banner','Close-up','Top View'];
const ASSET_TYPES=['Logos',
'Object & Characters','Patterns','Backgrounds','Banner Vectors','Infographics','Vector Illustration','Icon','Clipart','Seamless Pattern',
'Abstract Background','3D Illustration','Commercial Photography','Editorial Illustration','Botanical'];
const REFERENCE_MODES=[{id:'STYLE REFERENCE',
name:'1. STYLE REFERENCE',desc:'Use visual style, color, texture, lighting, or illustration technique.'},{id:'CONCEPT REFERENCE',
name:'2. CONCEPT REFERENCE',desc:'Use as concept inspiration, create new composition and details.'},{id:'COMPOSITION REFERENCE',
name:'3. COMPOSITION REFERENCE',desc:'Use general composition structure without copying details.'},{id:'VARIATION',name:'4. VARIATION',
desc:'Create visual alternatives with related themes.'},{id:'CREATIVE REMIX',name:'5. CREATIVE REMIX',desc:'Combine user idea with reference visual characteristics.'}];
let dynamicSeasonalCampaigns=[{id:'xmas',icon:'🎄',name:'Christmas & Winter Holidays',rushWindow:'Upload Rush: Aug–Oct',prompt:'Cute cozy winter holiday Christmas gingerbread cookies and evergreen pine cone sticker set',
category:'seasonal',subcategory:'Christmas & Winter',style:'Cutout Sticker',purpose:'Product Packaging',palette:'Vibrant Colors',
assetType:'Sticker Packs'},{id:'halloween',icon:'🎃',name:'Halloween & Gothic Fall',rushWindow:'Upload Rush: Jul–Sep',prompt:'Mystical Halloween spooky pumpkin skull and magic potion bottle emblem badge set',
category:'seasonal',subcategory:'Halloween & Gothic',style:'Badge',purpose:'Social Media',palette:'Dark',assetType:'Badge & Emblem Logos'},
{id:'back2school',icon:'🎒',name:'Back to School & STEM',rushWindow:'Upload Rush: Jun–Aug',prompt:'Flat vector school supplies set with science chemistry beaker backpack pencil and notebook',
category:'edu',subcategory:'School Supplies',style:'Flat Vector',purpose:'Infographic',palette:'Vibrant Colors',assetType:'Clipart'},
{id:'blackfriday',icon:'🛍️',name:'Black Friday & Shopping',rushWindow:'Upload Rush: Aug–Oct',prompt:'Luxury Black Friday promotional sale discount badge emblem collection with golden ribbons',
category:'business',subcategory:'Marketing Analytics',style:'Badge',purpose:'Advertising',palette:'Black & Gold',assetType:'Badge & Emblem Logos'},
{id:'spring_easter',icon:'🌸',name:'Spring Renewal & Floral',rushWindow:'Upload Rush: Dec–Feb',prompt:'Elegant pastel botanical wildflowers and delicate spring blossom leaf border set',
category:'nature',subcategory:'Wildflowers & Floral',style:'Botanical',purpose:'Product Packaging',palette:'Pastel',assetType:'Botanical'},
{id:'summer_beach',icon:'☀️',name:'Summer Travel & Festival',rushWindow:'Upload Rush: Mar–May',prompt:'Tropical summer beach vacation icons with surfboard coconut cocktail and palm tree',
category:'travel',subcategory:'Camping & Adventure',style:'Minimalist',purpose:'Social Media',palette:'Vibrant Colors',assetType:'Icon'}];
const AUTO_PROMPT_PRESETS=[{prompt:"Minimalist eco friendly green energy solar and wind turbine line art icon set",category:"nature",
subcategory:"Ecology & Green Energy",style:"Line Art",purpose:"Infographic",palette:"Natural Green",composition:"Isolated Objects",
assetType:"Icon",size:"1:1"},{prompt:"Cute tropical monstera and palm leaf sticker pack with pastel color outline",category:"nature",
subcategory:"Tropical Leaves",style:"Cutout Sticker",purpose:"Product Packaging",palette:"Natural Green",composition:"Isolated Objects",
assetType:"Sticker Packs",size:"1:1"},{prompt:"Flat vector illustration of modern business team analyzing cloud data growth chart on desk",
category:"business",subcategory:"Startups & Growth",style:"Flat Vector",purpose:"Website Hero",palette:"Corporate Blue",composition:"Centered",
assetType:"Vector Illustration",size:"16:9"},{prompt:"Vintage artisanal coffee roastery emblem badge collection with coffee bean leaves",
category:"food",subcategory:"Coffee & Cafe",style:"Badge",purpose:"Product Packaging",palette:"Warm Earth",composition:"Centered",
assetType:"Badge & Emblem Logos",size:"1:1"},{prompt:"Abstract fluid organic gradient wave background for futuristic website header",
category:"bg",subcategory:"Fluid Organic Waves",style:"Abstract",purpose:"Background Design",palette:"Vibrant Colors",composition:"Wide Banner",
assetType:"Abstract Background",size:"16:9"}];
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
delete slim.generatedImageUrl;delete slim.refImageUrl;delete slim.referenceImage;delete slim.imageBase64;delete slim.visualPreflightPending;
return slim;});}
async function initializePersistentLibrary(){try{const stored=await idbGet(IDB_LIBRARY_KEY);if(Array.isArray(stored)){state.savedIdeas=stored;
}else{const legacy=readStoredIdeas();await idbSet(IDB_LIBRARY_KEY,legacy);state.savedIdeas=legacy;}state.savedIdeas.forEach(ensureConceptBlueprint);
safeStorageSet(STORAGE_KEYS.SAVED_IDEAS,JSON.stringify(compactLibraryBackup(state.savedIdeas)));renderSavedIdeasGrid();updateBadges();
}catch(err){idbAvailable=false;console.warn('IndexedDB initialization failed:',err);state.savedIdeas=readStoredIdeas();state.savedIdeas.forEach(ensureConceptBlueprint);
renderSavedIdeasGrid();updateBadges();}refreshStorageStatus();}
let sizeFrame=0,sizeDirty=false;
function refreshStorageStatus(){sizeDirty=true;
if(state.activeTab!=='saved_ideas'||byId('tabSectionSavedIdeas')?.classList.contains('hidden'))return;if(sizeFrame)return;sizeFrame=requestAnimationFrame(()=>{sizeFrame=0;
if(!sizeDirty)return;sizeDirty=false;const status=byId('storageStatusText');if(!status)return;let bytes=0;try{bytes=new Blob([JSON.stringify(state.savedIdeas)]).size;
}catch(e){console.warn('Library size calculation failed:',e);}status.textContent=`${idbAvailable?'IndexedDB lokal':'Penyimpanan browser'} • ${state.savedIdeas.length} ide • ${(bytes/1048576).toFixed(2)} MB`;
});}
const state={activeTab:'idea_studio',apiKey:safeStorageGet(STORAGE_KEYS.API_KEY,''),refImageUrl:null,refImageFile:null,refMode:REFERENCE_MODES[0].id,
refModInstruction:'',refSuggestions:null,productionType:'single',collectionItemCount:'',noTextChecked:true,svgFriendly:true,gradientEnabled:safeStorageGet(STORAGE_KEYS.GRADIENT_ENABLED,
'false')==='true',outputMode:'vector',selectedCategory:STOCK_CATEGORIES.find(c=>c.id==='custom'),customCategory:'',selectedSubcategory:'',
customSubcategory:'',autoSelectBest:true,selectedStyle:VISUAL_STYLES[0],selectedPurpose:COMMERCIAL_PURPOSES[0],selectedPalette:COLOR_PALETTES[0],
paletteMode:'auto',manualPaletteHex:[],selectedComposition:COMPOSITIONS[0],selectedAssetType:ASSET_TYPES[0],ideaStudioSizeId:'1:1',
imageResolution:'2K',ideaCustomWidth:2048,ideaCustomHeight:2048,discoveredIdeas:[],selectedIdea:null,savedIdeas:readStoredIdeas()};
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
function metadataEditedFilename(filename){return String(filename||'').replace(/(?:-edt)?(\.[^./\\]+)$/i,
'-edt$1');}
function buildAdobeStockCsvRow(idea,metaInput=idea?.metadata||{},filenameOverride=''){const meta=normalizeAdobeStockMetadata(idea,
metaInput);const actualName=filenameOverride||(isRasterIdea(idea)?`${getCardBaseFilename(idea)}.${rasterSnapshot(idea).format==='png'?'png':'jpg'}`:`${getCardBaseFilename(idea)}.svg`);
const filename=metadataEditedFilename(actualName);return[adobeCsvCell(filename),adobeCsvCell(meta.stockTitle),adobeCsvCell(meta.keywords.join(', ')),
String(meta.adobeCategoryCode),adobeCsvCell(meta.releases)].join(',');}
function buildAdobeStockCsv(ideas){const rows=(Array.isArray(ideas)?ideas:[ideas]).filter(Boolean).map(idea=>buildAdobeStockCsvRow(idea));
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
function switchToOtherTab(){switchTab(state.activeTab==='idea_studio'?'saved_ideas':'idea_studio');
}
function updateFloatingShortcut(){const btn=byId('navTabSwitchBottom');const icon=byId('sideShortcutIcon');const count=byId('sideShortcutCount');
if(!btn||!icon||!count)return;const targetLibrary=state.activeTab==='idea_studio';icon.querySelector('use')?.setAttribute('href',
targetLibrary?'#rivis-bookmark':'#rivis-lightbulb');count.textContent=targetLibrary?String(Array.isArray(state.savedIdeas)?state.savedIdeas.length:0):String(Array.isArray(state.discoveredIdeas)?state.discoveredIdeas.length:0);
btn.title=targetLibrary?'Buka Library':'Kembali ke Idea Studio';btn.setAttribute('aria-label',btn.title);}
(function attachShortcutAutoHide(){let previousY=window.scrollY||0;
let ticking=false;window.addEventListener('scroll',()=>{if(ticking)return;ticking=true;window.requestAnimationFrame(()=>{const currentY=window.scrollY||0;
const rail=byId('floatingSideTabs');if(rail){if(currentY<previousY-2&&currentY>12)rail.classList.add('is-hidden');else if(currentY>previousY+2||currentY<=12)rail.classList.remove('is-hidden');
}previousY=currentY;ticking=false;});},{passive:true});})();
function switchTab(tabId){state.activeTab=tabId;document.querySelectorAll('.tab-section').forEach(el=>el.classList.add('hidden'));
const activeGradient=tabId==='idea_studio'?'from-purple-600 to-blue-600 shadow-purple-600/30':'from-emerald-600 to-teal-600 shadow-emerald-600/30';
['IdeaStudio','SavedIdeas'].forEach(tabKey=>{const isCurrent=(tabId==='idea_studio'&&tabKey==='IdeaStudio')||(tabId==='saved_ideas'&&tabKey==='SavedIdeas');
const btn=byId(`navTab${tabKey}Top`);if(!btn)return;btn.className=isCurrent?`nav-tab active-tab flex-1 sm:flex-none px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 md:gap-2 bg-gradient-to-r ${activeGradient} text-white shadow-lg`:'nav-tab flex-1 sm:flex-none px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 md:gap-2 text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800/60';
});updateFloatingShortcut();if(tabId==='idea_studio'){byId('tabSectionIdeaStudio').classList.remove('hidden');}else if(tabId==='saved_ideas'){byId('tabSectionSavedIdeas').classList.remove('hidden');
refreshStorageStatus();renderSavedIdeasGrid(null,true);}window.scrollTo({top:0,behavior:'smooth'});}
function updateBadges(){const count=state.savedIdeas.length;document.querySelectorAll('.savedIdeasCountBadge').forEach(el=>{if(el.textContent!==String(count))el.textContent=count;
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
handleCategoryChange('custom');}const styleSel=byId('visualStyleSelect');if(styleSel)styleSel.innerHTML=VISUAL_STYLES.map(s=>`<option value="${s}">${s}</option>`).join('');
const purposeSel=byId('commercialPurposeSelect');if(purposeSel)purposeSel.innerHTML=COMMERCIAL_PURPOSES.map(p=>`<option value="${p}">${p}</option>`).join('');
const paletteSel=byId('colorPaletteSelect');if(paletteSel)paletteSel.innerHTML='<option value="__auto__">Auto · Match artwork</option>'+COLOR_PALETTES.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
const compSel=byId('compositionSelect');if(compSel)compSel.innerHTML=COMPOSITIONS.map(c=>`<option value="${c}">${c}</option>`).join('');
const assetSel=byId('assetTypeSelect');if(assetSel)assetSel.innerHTML=ASSET_TYPES.map(a=>`<option value="${a}">${a}</option>`).join('');
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
}else{state.manualPaletteHex=state.paletteMode==='manual'?parseManualPaletteHex(chosen):[];if(state.paletteMode==='manual')state.selectedPalette=chosen;
}}
function setPaletteByName(name){const select=byId('colorPaletteSelect');if(!select||typeof name!=='string'||!name.trim())return;
const target=name.trim();if(!Array.from(select.options).some(o=>o.value===target)){const custom=document.createElement('option');
custom.value=target;custom.textContent=target.length>70?target.slice(0,67)+'…':target;custom.dataset.externalPalette='true';select.add(custom);
}select.value=target;handlePaletteChange(target);}
function setInnerProgress(btn,percent,estimated=false){if(!btn)return;const pct=Math.max(0,
Math.min(100,Math.round(percent)));btn.classList.add('inner-progress');btn.style.setProperty('--fill',pct+'%');btn.dataset.progress=(estimated&&pct<100?'~':'')+pct+'%';
btn.setAttribute('aria-busy',pct<100?'true':'false');}
function clearInnerProgress(btn){if(!btn)return;btn.classList.remove('inner-progress');
btn.style.removeProperty('--fill');delete btn.dataset.progress;btn.removeAttribute('aria-busy');}
function handleCategoryChange(catId){const cat=STOCK_CATEGORIES.find(c=>c.id===catId)||STOCK_CATEGORIES.find(c=>c.id==='custom');
state.selectedCategory=cat;const subSelect=byId('stockSubcategorySelect');const customCatInput=byId('customCategoryInput');const customSubInput=byId('customSubcategoryInput');
const custom=cat?.id==='custom';if(customCatInput)customCatInput.classList.toggle('hidden',!custom);if(customSubInput)customSubInput.classList.toggle('hidden',
!custom);if(subSelect){subSelect.classList.toggle('hidden',custom);if(custom){subSelect.value='';state.selectedSubcategory='';
}else{subSelect.innerHTML='<option value="">— Tanpa subkategori —</option>'+(cat?cat.subcategories.map(s=>`<option value="${s}">${s}</option>`).join(''):'');
subSelect.value=cat?.subcategories[0]||'';state.selectedSubcategory=subSelect.value;}}}
const AUTO_PROMPT_HISTORY_KEY='richVector.autoPromptHistory.v1';
let autoPromptHistory=(()=>{try{const entries=JSON.parse(safeStorageGet(AUTO_PROMPT_HISTORY_KEY,'[]'));return Array.isArray(entries)?entries.filter(x=>x&&typeof x.prompt==='string').slice(-30):[];
}catch(_){return[];}})();
const OFFLINE_PROMPT_LENSES={business:['a service handoff from request to verified completion',
'a resource allocation system with a clear bottleneck','a shared responsibility workflow with an accessible outcome'],tech:['a diagnostic workflow from fault detection to repair',
'a privacy preserving exchange between two devices','a human controlled tool with a visible feedback loop'],nature:['a life cycle with clearly separated stages',
'a habitat cross section showing one ecological relationship','a conservation intervention with a visible before and after contrast'],
food:['an ingredient journey from preparation to serving','a portion planning arrangement with clear grouped elements','a freshness inspection and careful storage workflow'],
people:['an everyday accessibility adaptation in use','a cooperative task shared between generations','a practical skill being passed from mentor to learner'],
bg:['a modular arrangement of broad interlocking shapes','a rhythmic border surrounding a generous empty center','an offset repeat with a clear large scale visual hierarchy'],
vector:['a functional object revealing one useful mechanism','a coordinated family of visual metaphors for a service journey',
'a simple cause and effect relationship with separated elements'],'3d':['a modular object with a clear assembly mechanism','a practical product cutaway explaining a hidden function',
'a tactile arrangement showing contrasting material roles'],health:['a preventive care routine with one clear action','an accessible support tool used in an everyday setting',
'a recovery milestone represented by a practical visual metaphor'],edu:['a hands on experiment showing a cause and its effect',
'an inclusive learning tool with separated tactile components','a knowledge transfer moment with a clear visual analogy'],travel:['a visitor navigation task solved with a clear visual cue',
'a local mobility connection between arrival and destination','a thoughtful hospitality service for an overlooked visitor need'],
seasonal:['a neighborhood preparation activity before a celebration','a reusable decoration with a clear assembly process','a small business seasonal service with an identifiable customer'],
custom:['a practical problem and a clear visual solution','a meaningful interaction between two relevant elements','an overlooked user need represented by a simple visual metaphor']};
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
v))return v;return/3d illustration/i.test(idea?.suggestedAssetType||'')?'3d':/photograph/i.test(idea?.suggestedAssetType||'')?'photo':'vector';
}
function isRasterIdea(idea){return ideaOutputMode(idea)!=='vector';}
function rasterSnapshot(idea){return{people:'auto',
shot:'auto',lighting:'auto',color:'auto',authenticity:'candid',copySpace:'auto',format:'jpg',jpegQuality:0.95,...(idea?.rasterSettings||{})};
}
function saveRasterOutputPreferences(){const data=readRasterSettings();safeStorageSet(STORAGE_KEYS.RASTER_PREFS,JSON.stringify(data));
}
const studioModeRatios={vector:'1:1',raster:'16:9'};
function handleOutputModeChange(mode){const previous=state.outputMode;if(previous==='vector')state.vectorSvgPreference=byId('svgFriendlyCheckbox')?.checked!==false;
const chosen=Object.hasOwn(RASTER_MODES,mode)?mode:'vector';const el=byId('outputModeSelect');if(el)el.value=chosen;state.outputMode=chosen;
safeStorageSet(STORAGE_KEYS.OUTPUT_MODE,chosen);const raster=chosen!=='vector';byId('rasterControls')?.classList.toggle('hidden',
!raster);const hint=byId('outputModeHint');if(hint)hint.textContent=raster?(chosen==='3d'?'Original 3D commercial scenes':'Photorealistic · JPG / PNG'):'Clean vector-friendly art';
const svgLabel=byId('svgFriendlyCheckbox')?.closest('label');if(svgLabel)svgLabel.classList.toggle('hidden',raster);const gradientLabel=byId('gradientColorCheckbox')?.closest('label');
if(gradientLabel)gradientLabel.classList.toggle('hidden',raster);const collection=byId('prodTypeCollectionBtn');if(collection)collection.classList.toggle('hidden',
raster);const select=byId('assetTypeSelect');if(raster){setProductionType('single');state.svgFriendly=false;const svg=byId('svgFriendlyCheckbox');
if(svg)svg.checked=false;if(select){select.value=chosen==='3d'?'3D Illustration':'Commercial Photography';state.selectedAssetType=select.value;
}if(chosen==='editorial'){byId('rasterColorSelect').value='colorpop';byId('rasterAuthenticitySelect').value='editorial';}else if(chosen==='advertising'){byId('rasterAuthenticitySelect').value='polished';
}else if(chosen==='photo'){byId('rasterAuthenticitySelect').value='candid';}}else{const svg=byId('svgFriendlyCheckbox');if(svg)svg.checked=state.vectorSvgPreference!==false;
state.svgFriendly=state.vectorSvgPreference!==false;if(select&&isRasterMedium(select.value)){select.value='Vector Illustration';
state.selectedAssetType=select.value;}}const ratio=studioModeRatios[raster?'raster':'vector'];const ratioSelect=byId('ideaStudioSizeSelect');
if(ratioSelect){ratioSelect.value=ratio;handleIdeaSizeChange(ratio);}updateRatioHint();}
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
const updating=isLib&&activeCardUpdates.has(idea.ideaId);return`<div data-card-prompt="${location}" data-idea-id="${code}" class="p-2.5 rounded-lg border border-purple-900/50 bg-slate-900/60 space-y-2 text-[10px]"> <textarea data-role="visual" rows="4" maxlength="10000" spellcheck="true" aria-label="Visual Prompt" ${updating?'disabled':''} oninput="handleCardPromptInput(this)" class="w-full min-w-0 bg-slate-950 border border-slate-700 rounded p-2.5 text-[11px] text-slate-200 font-mono resize-y outline-none focus:border-purple-500 leading-relaxed">${escapeHtml(idea.finalGenerationPrompt||'')}</textarea> <div class="card-prompt-actions"> <button type="button" onclick="toggleCardBlueprint(this)" class="card-blueprint-pill" title="Buka atau tutup JSON Blueprint yang tersinkron otomatis." aria-label="Lihat JSON Blueprint"><span class="truncate">JSON Blueprint</span></button> <div class="card-prompt-btns"> <button type="button" onclick="copyCardPrompt(this)" title="Salin Visual Prompt kartu ini." class="card-prompt-btn bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"> Copy</button>
        ${isLib?`<button type="button" onclick="generateFromCardPrompt(this)" ${updating?'disabled':''} title="Generate ulang gambar dan metadata dari Visual Prompt terbaru." class="card-prompt-btn bg-gradient-to-r from-purple-600 to-blue-600 text-white disabled:opacity-60"> ${updating?'Updating…':'Update'}</button>`:`<button type="button" onclick="saveIdeaToLibrary('${code}',this)" title="Simpan konsep ini ke Library" class="card-prompt-btn bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm">Save</button>`}
      </div> </div> <div data-role="blueprint-wrap" class="card-blueprint-panel hidden">  <pre data-role="blueprint" aria-label="JSON Blueprint hanya baca" class="mt-2 rounded bg-slate-950 border border-slate-800 p-2 text-[10px] leading-relaxed text-slate-300 whitespace-pre-wrap break-words select-text"></pre> </div> <p data-card-prompt-status class="${idea.imagePromptOutdated||idea.metadataOutdated?'':'hidden'} text-[10px] text-amber-300" aria-live="polite">${idea.imagePromptOutdated||idea.metadataOutdated?'Prompt berubah — klik Update untuk menyelaraskan gambar dan metadata.':''}</p> </div>`;
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
idea.metadataOutdated=Boolean(idea.metadata);}}
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
let canvas;try{const img=new Image();img.src=source;await img.decode();if(!img.naturalWidth||!img.naturalHeight)throw new Error('Resolusi gambar tidak terbaca.');
canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;const ctx=canvas.getContext('2d',
{alpha:format!=='jpg'});if(!ctx)throw new Error('Browser tidak dapat menyiapkan canvas ekspor.');if(format==='jpg'){ctx.fillStyle='#fff';
ctx.fillRect(0,0,canvas.width,canvas.height);}ctx.drawImage(img,0,0);const quality=Number.isFinite(p.jpegQuality)?Math.max(0.7,
Math.min(1,p.jpegQuality)):0.95;const converted=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Gagal konversi gambar.')),
mime,quality));const checked=await verifiedImageBlob(converted);if(checked.mimeType!==mime)throw new Error('Browser menghasilkan tipe gambar yang salah.');
return{filename,mimeType:mime,data:checked.blob};}finally{if(canvas){canvas.width=0;canvas.height=0;}URL.revokeObjectURL(source);
}}
function toggleAutoSelectBest(val){state.autoSelectBest=val;const ctrls=byId('creativeDirectionControls');if(ctrls){if(val)ctrls.classList.add('hidden');
else ctrls.classList.remove('hidden');}}
function handleIdeaSizeChange(val){state.ideaStudioSizeId=val;studioModeRatios[getOutputMode()==='vector'?'vector':'raster']=val;
const box=byId('customSizeDimensionsBox');if(box){if(val==='custom')box.classList.remove('hidden');else box.classList.add('hidden');
}}
function handleImageResolutionChange(value){state.imageResolution=validImageResolution(value);safeStorageSet(STORAGE_KEYS.IMAGE_RESOLUTION,
state.imageResolution);updateRatioHint();}
function setProductionType(type){state.productionType=type;const singleBtn=byId('prodTypeSingleBtn');
const collectionBtn=byId('prodTypeCollectionBtn');const countBox=byId('collectionItemCountBox');if(type==='collection'){if(singleBtn)singleBtn.className="p-2.5 rounded-lg border text-left transition-all flex flex-col gap-1 bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700";
if(collectionBtn)collectionBtn.className="p-2.5 rounded-lg border text-left transition-all flex flex-col gap-1 bg-purple-600/20 border-purple-500 text-white shadow";
if(countBox)countBox.classList.remove('hidden');}else{if(singleBtn)singleBtn.className="p-2.5 rounded-lg border text-left transition-all flex flex-col gap-1 bg-purple-600/20 border-purple-500 text-white shadow";
if(collectionBtn)collectionBtn.className="p-2.5 rounded-lg border text-left transition-all flex flex-col gap-1 bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700";
if(countBox)countBox.classList.add('hidden');}}
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
function renderDiscoveredIdeas(){const container=byId('discoveredIdeasContainer');
const badge=byId('discoveredCountBadge');if(badge)badge.innerText=state.discoveredIdeas.length;const sideDiscovered=byId('sideDiscoveredCount');
if(sideDiscovered)sideDiscovered.innerText=state.discoveredIdeas.length;updateFloatingShortcut();const saveAllBtn=byId('saveAllBtn');
const clearAllBtn=byId('clearAllDiscoveredBtn');if(state.discoveredIdeas.length>0){if(saveAllBtn){saveAllBtn.classList.remove('hidden');
saveAllBtn.classList.add('flex');}if(clearAllBtn){clearAllBtn.classList.remove('hidden');clearAllBtn.classList.add('flex');}}else{if(saveAllBtn){saveAllBtn.classList.add('hidden');
saveAllBtn.classList.remove('flex');}if(clearAllBtn){clearAllBtn.classList.add('hidden');clearAllBtn.classList.remove('flex');
}}if(!state.discoveredIdeas.length){if(container){container.innerHTML=`<div class="${uiClasses[0]}"><p>Type a Simple Prompt then click "DISCOVER IDEAS".</p></div>`;
}return;}if(container){const dupIndex=makeDupIndex(state.savedIdeas);container.innerHTML=state.discoveredIdeas.map((idea)=>{const code=getCardUniqueCode(idea);
const audit=auditIdeaQuality(idea);const isDuplicateInLibrary=isDupFromIndex(idea,dupIndex);return`<div class="p-3.5 rounded-xl border transition-all cursor-pointer space-y-2.5 bg-slate-950 ${isDuplicateInLibrary?'border-amber-700/80 shadow-lg shadow-amber-950/20':'border-slate-800 hover:border-slate-700'}">
        ${isDuplicateInLibrary?`<div class="${uiClasses[1]}"><span class="flex items-center gap-1.5"> Duplicate Warning</span><span class="${uiClasses[2]}">Concept already exists in Library</span></div>`:''}
        <div class="flex justify-between items-start gap-2"> <div> <div class="flex items-center gap-1.5 mb-0.5"> <span class="text-[9px] font-mono text-purple-400 font-bold tracking-wider">${code.toUpperCase()}</span> <span class="text-[9px] font-bold uppercase bg-slate-900 px-1.5 py-0.2 rounded border border-slate-700 text-slate-300">${idea.productionType==='collection'?'Collection Set':'Single Asset'}</span> </div> <h4 class="text-xs font-bold text-slate-100">${escapeHtml(idea.conceptName)}</h4> <div class="text-[10px] text-cyan-300 font-semibold">${isRasterIdea(idea)?'RASTER · '+escapeHtml(RASTER_MODES[ideaOutputMode(idea)])+' · '+rasterSnapshot(idea).format.toUpperCase():'VECTOR · SVG-Friendly'}</div> </div> <div class="text-right shrink-0 flex items-center gap-1.5">
            ${conceptBadge(idea)}
            <button type="button" onclick="deleteDiscoveredIdea('${escapeHtml(idea.ideaId)}')" title="Delete Idea" class="p-1 text-slate-500 hover:text-red-400 font-bold transition-colors"></button> </div> </div>
        ${libraryStatusToolbar(idea,audit,'discover')}
        ${Array.isArray(idea.colorPaletteHex)&&idea.colorPaletteHex.length?`<div class="flex items-center justify-between gap-1.5"><span class="text-[9px] text-slate-400 font-bold">COLOR PALETTE · ${idea.colorPaletteHex.length} HEX</span><button type="button" title="Salin palet HEX konsep ini." onclick="copyCardPalette('${escapeHtml(idea.ideaId)}','discover',this)" class="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[9px] text-purple-200"> Copy Palette</button></div>`:''}

        ${cardPromptEditor(idea,'discover')}
        </div>`;}).join('');}}
function deleteDiscoveredIdea(ideaId){state.discoveredIdeas=state.discoveredIdeas.filter(i=>i.ideaId!==ideaId);
renderDiscoveredIdeas();showToast("Idea card deleted.","info");}
function handleClearAllDiscoveredIdeas(btnEl){if(!state.discoveredIdeas.length)return;
state.discoveredIdeas=[];renderDiscoveredIdeas();showToast("All discovered ideas cleared.","info");}
async function copyIdeaPrompt(ideaId,
btnEl){const idea=state.discoveredIdeas.find(i=>i.ideaId===ideaId)||state.savedIdeas.find(i=>i.ideaId===ideaId);if(idea){const ok=await safeCopyToClipboard(idea.finalGenerationPrompt);
if(ok){showToast("Prompt copied!","success");if(btnEl){const origHTML=btnEl.innerHTML;btnEl.innerHTML=` <span>Copied!</span>`;
setTimeout(()=>{btnEl.innerHTML=origHTML;},1500);}}}}
function saveIdeaToLibrary(ideaId,btnEl){const idea=state.discoveredIdeas.find(i=>i.ideaId===ideaId);
if(idea&&!state.savedIdeas.some(i=>i.ideaId===idea.ideaId)){state.savedIdeas.unshift(JSON.parse(JSON.stringify(idea)));persistSavedIdeas();
updateBadges();showToast(`Idea "${escapeHtml(idea.conceptName)}" saved to Library!`,"success");if(btnEl){btnEl.innerHTML=` Saved`;
}}}
function handleSaveAllDiscoveredIdeas(btnEl){if(!state.discoveredIdeas.length)return;if(btnEl){btnEl.disabled=true;btnEl.innerHTML=` Saving...`;
}const discoveredSnapshot=state.discoveredIdeas.map(idea=>JSON.parse(JSON.stringify(idea)));const savedIdeasBeforeSave=state.savedIdeas.map(idea=>JSON.parse(JSON.stringify(idea)));
let addedCount=0;discoveredSnapshot.forEach(idea=>{if(!state.savedIdeas.some(saved=>saved.ideaId===idea.ideaId)){state.savedIdeas.unshift(idea);
addedCount++;}});setTimeout(()=>{const persisted=persistSavedIdeas();if(!persisted){state.savedIdeas=savedIdeasBeforeSave;if(btnEl){btnEl.disabled=false;
btnEl.innerHTML=` Save All`;}return;}updateBadges();state.discoveredIdeas=[];renderDiscoveredIdeas();if(addedCount>0){showToast(`Saved ${addedCount} idea(s) to Library. Discovered cards cleared.`,
"success");}else{showToast("All ideas were already in Library. Discovered cards cleared.","info");}if(btnEl){btnEl.disabled=false;
btnEl.innerHTML=` Save All`;}switchTab('saved_ideas');},300);}
function isRasterMedium(type){return/photograph|3d illustration/i.test(type);
}
function mediumStyle(type,style){if(/photograph/i.test(type)&&/vector|logo|sticker|badge|line art|3d|clay|paper cut|hand drawn/i.test(style))return'Commercial photographic composition';
if(/3d illustration/i.test(type)&&/flat vector|line art|minimalist logo/i.test(style))return'Dimensional illustration';return style;
}
function paletteBrief(palette,type){const use=isRasterMedium(type)?'distribute colors across the subject, materials, lighting and setting':'assign dominant, supporting, accent and background colors to distinguish adjacent shapes';
return'Palette: '+palette+'. '+use+'. Keep the subject legible at thumbnail size and preserve space for the intended placement.';
}
function updateRatioHint(){const size=byId('ideaStudioSizeSelect').value;const w=Number(byId('ideaCustomWidthInput').value);
const h=Number(byId('ideaCustomHeightInput').value);const hint=byId('stockRatioHint');hint.textContent=size==='custom'&&!(w>=64&&w<=4096&&h>=64&&h<=4096)?'Isi dimensi 64–4096 px.':'Rasio '+generationRatio(size==='custom'?w/h:size)+' · Meminta '+state.imageResolution+' (~'+({'1K':'1',
'2K':'4','4K':'17'})[state.imageResolution]+' MP). Ukuran aktual ditampilkan setelah generate.';}
function assetGuidance(type){if(/photograph/i.test(type))return'Photographic lighting, natural materials, credible perspective and believable detail.';
if(/3d illustration/i.test(type))return'Use dimensional forms, consistent materials and coherent lighting.';if(/seamless/i.test(type))return'Design a repeating tile with matching opposite edges and uninterrupted motifs.';
if(/banner|background/i.test(type))return'Fill the frame and reserve uncluttered copy space for the buyer.';if(/icon/i.test(type))return'Use legible silhouettes, a consistent grid, stroke weight and optical spacing.';
return'Use clear forms and a composition suited to the intended placement.';}
function generationRatio(request){const ratios=['1:1','2:3','3:2','4:3','3:4','4:5','5:4','9:16','16:9','21:9'];function fraction(value){const[w,
h=1]=String(value).split(':').map(Number);return w/h;}const target=fraction(request);if(!(target>0&&Number.isFinite(target)))return'1:1';
return ratios.reduce((best,r)=>Math.abs(Math.log(fraction(r)/target))<Math.abs(Math.log(fraction(best)/target))?r:best);}
function showNativeSize(img){const w=img.naturalWidth,
h=img.naturalHeight;img.parentElement.nextElementSibling.textContent='Hasil asli: '+w+' × '+h+' px · '+(w*h/1e6).toLocaleString('id-ID',
{maximumFractionDigits:2})+' MP · '+(w*h<4000000?'Di bawah 4 MP — periksa syarat microstock':'Setidaknya 4 MP');}
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
`Concept Name: ${idea.conceptName||'-'}`,`Asset Filename: ${getCardBaseFilename(idea)}-edt.svg`,'',`Adobe Stock Title (${meta.stockTitle.length}/70 chars):`,
meta.stockTitle,'',`Adobe Stock Category (${meta.adobeCategoryCode}): ${meta.adobeCategory}`,`Adobe Stock Releases: ${meta.releases||'(none)'}`,
`Adobe Stock AI Disclosure: ${meta.aiDisclosure!==false?'Yes (Generative AI)':'No'}`,'',`Adobe Stock Keywords (${meta.keywords.length}/40):`,
meta.keywords.join(', ')].join('\r\n');}
async function helperCreateCardZipContent(zip,idea,folderName="",includeBlueprint=true){const baseName=getCardBaseFilename(idea);
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
Filename (CSV): ${baseName}-edt.svg
Title: ${meta.stockTitle}
Category: ${meta.adobeCategoryCode} (${meta.adobeCategory})
Releases: ${meta.releases||'(empty)'}
AI Disclosure: ${meta.aiDisclosure!==false?'Yes (Generative AI)':'No'}

Keywords (${meta.keywords.length} tags ordered by relevance):
${meta.keywords.join(', ')}
`;zip.file(`${prefix}${baseName}_metadata.txt`,metaText);zip.file(`${prefix}${baseName}_metadata.csv`,buildAdobeStockCsv([idea]));
}const jsonClean={...idea,cardCode:getCardUniqueCode(idea).toUpperCase(),exportedFilename:`${baseName}-edt.svg`};delete jsonClean.generatedImageUrl;
delete jsonClean.visualPreflightPending;if(jsonClean.metadata)jsonClean.metadata=normalizeAdobeStockMetadata(idea,jsonClean.metadata);
zip.file(`${prefix}${baseName}_data.json`,JSON.stringify(jsonClean,null,2));if(includeBlueprint)zip.file(`${prefix}${baseName}_blueprint.json`,
readonlyBlueprintText(idea));if(idea.generatedImageUrl){const exported=await getExportedAsset(idea);zip.file(`${prefix}${exported.filename}`,
exported.data);}}
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
  const exported=await getExportedAsset(idea);
  const zip=new JSZip();
  zip.file(exported.filename,exported.data);
  zip.file(base+'_prompt.txt',String(idea.finalGenerationPrompt||''));
  zip.file(base+'_blueprint.json',readonlyBlueprintText(idea));
  zip.file(base+'_metadata.csv','Filename,Title,Keywords,Category,Releases\r\n'+buildAdobeStockCsvRow(idea,idea.metadata,exported.filename));

  return zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:6}});
}
async function handleDownloadAllCardsZip(btnEl){
  if(typeof JSZip==='undefined'){showToast('JSZip library failed to load.','error');return;}
  const all=state.savedIdeas;
  if(!all.length){showToast('Library is empty. Nothing to download.','error');return;}
  const complete=all.filter(i=>i.generatedImageUrl&&i.metadata);
  const skipped=all.length-complete.length;
  if(!complete.length){showToast('Download All Card: hasilkan gambar dan metadata dahulu agar setiap ZIP memuat tepat 4 file.',
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
    if(skipped)showToast(`${skipped} kartu dilewati karena gambar atau metadata belum tersedia.`,'info');
  }catch(err){console.error('Download All Card ZIP error:',err);showToast('Gagal membuat ZIP kartu: '+err.message,'error');}
  finally{if(btn){btn.disabled=false;btn.innerHTML=old||'Download All Card';}}
}
function getResultZipFilename(idea,count){const date=new Date().toISOString().slice(0,10);const theme=idea?.metadata?.stockTitle||idea?.conceptName||idea?.mainSubject||'rich_vector_results';
return`${sanitizeTitleForFilename(theme)}${count>1?`_dan_${count-1}_lainnya`:''}_${date}.zip`;}
async function handleDownloadResultsZip(btnEl){
  const generated=state.savedIdeas.filter(i=>i.generatedImageUrl||i.metadata);
  if(!generated.length){showToast('No generated images or metadata to download yet.','error');return;}
  if(typeof JSZip==='undefined'){showToast('JSZip library failed to load.','error');return;}
  qualityDownloadNotice(generated);
  const btn=btnEl||byId('downloadResultsZipBtn'),old=btn?.innerHTML||'';
  if(btn){btn.disabled=true;btn.textContent='Packaging...';}
  try{
    const zip=new JSZip(),metadataRows=[];
    for(const idea of generated){
      let exported=null;
      if(idea.generatedImageUrl){
        exported=await getExportedAsset(idea);
        zip.file(exported.filename,exported.data);
      }
      if(idea.metadata){
        // CSV references the later Vectorich QC image (with -edt), while the ZIP image retains its original name.
        metadataRows.push(buildAdobeStockCsvRow(idea,idea.metadata,exported?.filename||''));
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
const meta=normalizeAdobeStockMetadata(idea,idea.metadata);const baseName=getCardBaseFilename(idea);const content=`ADOBE STOCK METADATA & SEO
----------------------------------------
Card Code: ${getCardUniqueCode(idea).toUpperCase()}
Concept: ${idea.conceptName}
Filename (CSV): ${baseName}-edt.svg
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
const latest=state.savedIdeas.map(i=>structuredClone(i));await idbSet(IDB_LIBRARY_KEY,latest);}).catch(err=>{console.warn('IndexedDB save issue:',
err?.message||err);showToast('Gagal menyimpan Library ke IndexedDB; cadangan ringkas tersedia.','error');});}else if(!backupOk){showToast('Penyimpanan penuh. Unduh ZIP Library sebagai cadangan.',
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
function toggleRivisExtras(force){const next=typeof force==='boolean'?force:!document.body.classList.contains('rivis-show-extra');
document.body.classList.toggle('rivis-show-extra',next);const btn=byId('rivisExtrasBtn');const label=byId('rivisExtrasText');
const disclosure=byId('rivisExtrasDisclosure');if(disclosure&&disclosure.open!==next)disclosure.open=next;if(btn)btn.setAttribute('aria-expanded',String(next));if(label)label.textContent=next?'ADVANCE 🔼':'ADVANCE 🔽';
}
function toggleStatusTile(detailsEl){if(!detailsEl||!detailsEl.open)return;const bar=detailsEl.closest('.rivis-status-bar');
if(!bar)return;bar.querySelectorAll('details.rivis-status-tile[open]').forEach(other=>{if(other!==detailsEl)other.open=false;
});}
function libraryStatusToolbar(idea,audit,location='library'){const isLib=location==='library';const opp=calculateOpportunityScore(idea);
const qOk=audit.passedCount===audit.totalChecks;const qStatus=qOk?'status-pass':'status-warning';const qValue=`${audit.passedCount}/${audit.totalChecks}`;
const qBody=audit.checks.map(c=>`<div class="status-detail-row"><span class="${c.passed?'text-emerald-400':'text-amber-400'} font-bold">${c.passed?'✓':'!'} ${escapeHtml(c.label)}</span><div>${escapeHtml(c.detail)}</div></div>`).join('')+(opp.totalScore!==null?`<div class="status-detail-row"><strong class="text-slate-100">Opportunity · ${opp.totalScore}/100</strong><div>${escapeHtml(opp.reasoning)}</div></div>`:'');
const hChecks=hybridConflictChecks(idea);const hPassed=hChecks.filter(c=>c.ok).length;const hOk=hPassed===hChecks.length;const hStatus=hOk?'status-pass':'status-warning';
const hValue=`${hPassed}/${hChecks.length}`;const hBody=hChecks.map(c=>`<div class="status-detail-row"><span class="${c.ok?'text-emerald-400':'text-amber-400'} font-bold">${c.ok?'✓':'!'} ${escapeHtml(c.label)}</span><div>${escapeHtml(c.detail)}</div></div>`).join('');
const buyerLabel=idea.requestedTargetBuyer||idea.targetBuyer||'Designers';const needLabel=idea.requestedDesignNeed||idea.commercialUseCase||'Commercial Asset';
const statusLabel=isLib?(!idea.generatedImageUrl?'Draft':idea.imagePromptOutdated||idea.metadataOutdated?'Outdated':idea.metadata?'Ready':'Image'):escapeHtml(String(idea.aspectRatio||'1:1'));
const cStatus=isLib?(idea.imagePromptOutdated||idea.metadataOutdated?'status-warning':idea.generatedImageUrl&&idea.metadata?'status-pass':'status-brief'):'status-brief';
const cBody=`<div class="status-detail-row"><strong class="text-slate-100">Target Pembeli:</strong> ${escapeHtml(buyerLabel)}</div> <div class="status-detail-row"><strong class="text-slate-100">Kebutuhan Desain:</strong> ${escapeHtml(needLabel)}</div> <div class="status-detail-row"><strong class="text-slate-100">Medium &amp; Gaya:</strong> ${isRasterIdea(idea)?escapeHtml(RASTER_MODES[ideaOutputMode(idea)]):'Vector / SVG-Friendly'} · ${escapeHtml(idea.creativeDirection||'Commercial')}</div> <div class="status-detail-row"><strong class="text-slate-100">Rasio &amp; Kode:</strong> ${escapeHtml(idea.aspectRatio||'1:1')} · ${escapeHtml(getCardUniqueCode(idea).toUpperCase())}${isLib?` · ${idea.generatedImageUrl?'Gambar siap':'Belum ada gambar'} · ${idea.metadata?'Metadata siap':'Belum ada metadata'}`:''}</div>`;
return`<div class="rivis-status-bar"> <details class="rivis-status-tile" ontoggle="toggleStatusTile(this)"><summary class="rivis-status-summary ${qStatus}" title="Quality Guard (${qValue})"><span class="status-top"><span>${qValue}</span></span><span class="status-label">Quality Guard</span></summary><div class="rivis-status-panel">${qBody}</div></details> <details class="rivis-status-tile" ontoggle="toggleStatusTile(this)"><summary class="rivis-status-summary ${hStatus}" title="Hybrid Prompt Guard (${hValue})"><span class="status-top"><span>${hValue}</span></span><span class="status-label">Hybrid Guard</span></summary><div class="rivis-status-panel">${hBody}</div></details> <details class="rivis-status-tile" ontoggle="toggleStatusTile(this)"><summary class="rivis-status-summary ${cStatus}" title="Arahan Komersial"><span class="status-top"><span>${statusLabel}</span></span><span class="status-label">Komersial</span></summary><div class="rivis-status-panel">${cBody}</div></details> </div>`;
}
function libraryDuplicateIds(ideas){const firstSeen=new Map(),duplicates=new Set();for(const idea of ideas){const id=idea.ideaId;
for(const [prefix,value] of [['title',idea.conceptName],['prompt',idea.finalGenerationPrompt]]){const normalized=String(value||'').toLowerCase().trim();
if(!normalized)continue;const key=prefix+':'+normalized;if(!firstSeen.has(key))firstSeen.set(key,id);else if(firstSeen.get(key)!==id){duplicates.add(firstSeen.get(key));
duplicates.add(id);}}}return duplicates;}
function renderSavedCardHtml(idea,libraryDuplicates){const code=getCardUniqueCode(idea);
const baseName=getCardBaseFilename(idea);const audit=auditIdeaQuality(idea);const isDuplicate=libraryDuplicates.has(idea.ideaId);
const meta=idea.metadata?normalizeAdobeStockMetadata(idea,idea.metadata):null;const titleLength=meta?.stockTitle.length||0;const keywordCount=meta?.keywords.length||0;
const titleValid=titleLength>0&&titleLength<=70;const keywordsValid=keywordCount>=30&&keywordCount<=40;const csvReady=Boolean(meta&&titleValid&&keywordsValid&&meta.adobeCategoryCode>=1&&meta.adobeCategoryCode<=21);
return`<div data-rivis-card-id="${escapeHtml(String(idea.ideaId))}" class="p-4 rounded-xl bg-slate-950 border ${isDuplicate?'border-amber-700/80 shadow-lg shadow-amber-950/20':'border-slate-800 hover:border-purple-600/60'} transition-all flex flex-col justify-between space-y-4">
      ${isDuplicate?`<div class="${uiClasses[1]}"><span class="flex items-center gap-1.5"> Duplicate Warning</span><span class="${uiClasses[2]}">Duplicate in Library</span></div>`:''}
      <div class="space-y-3"> <div class="flex justify-between items-start gap-2"> <div> <div class="flex items-center gap-1.5 mb-0.5"> <span class="text-[9px] font-mono text-purple-400 font-bold tracking-wider">${code.toUpperCase()}</span> <span class="text-[9px] font-bold uppercase bg-slate-900 px-1.5 py-0.2 rounded border border-slate-700 text-slate-300">${idea.productionType==='collection'?'Collection Set':'Single Asset'}</span> </div> <h4 class="text-sm font-bold text-white leading-snug">${escapeHtml(idea.conceptName)}</h4> <div class="text-[10px] text-cyan-300 font-semibold">${isRasterIdea(idea)?'RASTER · '+escapeHtml(RASTER_MODES[ideaOutputMode(idea)])+' · '+rasterSnapshot(idea).format.toUpperCase():'VECTOR · SVG-Friendly'}</div> </div> <div class="flex items-center gap-1 shrink-0"> <button type="button" onclick="removeSavedIdea('${escapeHtml(idea.ideaId)}')" class="p-1 text-slate-500 hover:text-red-400 transition-colors" title="Remove" aria-label="Hapus kartu">×</button> </div> </div>
        ${libraryStatusToolbar(idea,audit,'library')}
        ${idea.generatedImageUrl?`<div class="flex gap-1.5 flex-wrap"><button type="button" onclick="downloadGeneratedImage('${escapeHtml(idea.ideaId)}')" class="flex-1 px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-cyan-200 font-bold text-[10px]">Unduh PNG/JPG Asli</button><button type="button" onclick="RIVIS_VECTOR.open('${escapeHtml(idea.ideaId)}')" class="flex-1 px-2 py-1.5 rounded-lg bg-violet-700 hover:bg-violet-600 text-white font-bold text-[10px]">AI Vector SVG</button></div><div class="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900 group shadow-inner"> <img loading="lazy" decoding="async" src="${idea.generatedImageUrl}" onload="showNativeSize(this)" data-lightbox-id="${escapeHtml(idea.ideaId)}" class="w-full h-48 object-contain bg-slate-950 cursor-zoom-in transition-transform duration-300 group-hover:scale-105" alt="Generated stock preview" /> <div class="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none"> <span class="px-3 py-1.5 bg-purple-600/90 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-lg"> Zoom Preview</span> </div> </div> <p class="mt-1 text-xs text-slate-400">Memeriksa dimensi gambar…</p>
        ${idea.imageGeneratedOn?`<p class="mt-0.5 text-[10px] text-slate-500">Generated: ${escapeHtml(idea.imageGeneratedOn)}</p>`:''}`:''}
        ${idea.generatedImageUrl?(idea.visualPreflight?`<div class="rivis-preflight-row"> <details class="rounded-lg bg-slate-900/80 border border-slate-800 text-[10px]"> <summary class="rivis-preflight-summary cursor-pointer font-bold ${idea.visualPreflight.status==='PASS'?'text-emerald-400':idea.visualPreflight.status==='REVIEW'?'text-amber-400':'text-rose-400'}"> <span class="rivis-preflight-title">Visual Preflight: ${idea.visualPreflight.score}/100</span> <span class="rivis-preflight-status shrink-0">(${idea.visualPreflight.status})</span> </summary> <div class="space-y-1.5 px-2.5 pb-2.5 pt-2 border-t border-slate-800/80">
              ${idea.visualPreflight.technical?`<p class="text-[10px] text-cyan-300">Teknis: ${idea.visualPreflight.technical.width}×${idea.visualPreflight.technical.height} px (${idea.visualPreflight.technical.mp} MP) · Kontras ${idea.visualPreflight.technical.lumaStd}</p>`:''}
              ${idea.qualityRepairMessage?`<p class="text-[10px] text-amber-300">${escapeHtml(idea.qualityRepairMessage)}</p>`:''}
              ${idea.visualPreflight.components?Object.values(idea.visualPreflight.components).map(c=>`<p class="text-slate-300"><strong class="text-slate-200">${escapeHtml(c.label)} (${c.weight}%): ${c.score}/100</strong> — ${escapeHtml(c.reason)}</p>`).join(''):''}
              ${(idea.visualPreflight.issues||[]).map(issue=>`<p class="text-amber-300">! ${escapeHtml(visualPreflightIssueText(issue))}</p>`).join('')}
              ${(idea.visualPreflight.manualChecks||[]).map(check=>`<p class="text-slate-400">• ${escapeHtml(check)}</p>`).join('')}
              <p class="text-slate-500 pt-1">Penilaian AI berbasis gambar yang dirender; bukan jaminan persetujuan Adobe Stock. Periksa 100% dan vectorize sebelum unggah.</p> </div> </details> <button type="button" onclick="handleAuditGeneratedImage('${escapeHtml(idea.ideaId)}',this)" class="rivis-preflight-recheck rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700" title="Periksa Ulang Visual Preflight">Periksa Ulang</button> </div>`:`<div class="rivis-preflight-row"> <div class="rivis-preflight-empty rounded-lg bg-slate-900/60 border border-slate-800 text-[10px] text-slate-400"><span class="rivis-preflight-title">${idea.visualPreflightPending?'Memeriksa detail 1:1 & teknis…':'Visual Preflight belum tersedia.'}</span></div> <button type="button" ${idea.visualPreflightPending?'disabled':''} onclick="handleAuditGeneratedImage('${escapeHtml(idea.ideaId)}',this)" class="rivis-preflight-recheck rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-semibold border border-slate-700" title="Periksa Ulang Visual Preflight">${idea.visualPreflightPending?'Memeriksa…':'Periksa Ulang'}</button> </div>`):''}
        ${idea.colorPaletteHex&&Array.isArray(idea.colorPaletteHex)?`<div class="space-y-1"> <div class="flex items-center justify-between gap-1.5"><span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"> Extracted Dominant Colors:</span><button type="button" onclick="copyCardPalette('${escapeHtml(idea.ideaId)}','library',this)" title="Salin semua warna HEX kartu ini." class="px-2 py-1 rounded border border-slate-700 bg-slate-900 text-purple-200 text-[9px] font-bold flex items-center gap-1"> Copy Palette</button></div> <div class="flex items-center gap-1.5 flex-wrap">
            ${idea.colorPaletteHex.map(hex=>`<button type="button" onclick="copySingleHexCode('${hex}')" title="Click to copy ${hex}" class="flex items-center gap-1 bg-slate-900 border border-slate-800 hover:border-purple-500 rounded px-1.5 py-0.5 text-[9px] font-mono text-slate-300 transition-colors"><span class="w-2.5 h-2.5 rounded-full border border-white/20" style="background-color: ${hex}"></span>${hex}</button>`).join('')}
          </div> </div>`:''}
        ${cardPromptEditor(idea,'library')}
        ${meta?`<details class="rivis-meta-accordion rounded-lg bg-blue-950/30 border border-blue-900/60 text-[10px]" data-meta-id="${escapeHtml(idea.ideaId)}" ontoggle="handleMetadataAccordionToggle(this,'${escapeHtml(idea.ideaId)}')" ${openMetadataAccordions.has(idea.ideaId)?'open':''}> <summary class="rivis-meta-summary" title="Buka atau tutup metadata Adobe Stock."> <span class="font-bold text-blue-300 truncate">ADOBE STOCK CSV METADATA</span> <span class="flex items-center gap-1.5 shrink-0"><span class="px-1.5 py-0.5 rounded border ${csvReady?'bg-emerald-950/80 border-emerald-700 text-emerald-300':'bg-amber-950/80 border-amber-700 text-amber-300'} text-[9px] font-mono">${csvReady?'CSV READY':'CHECK'}</span></span> </summary> <div class="p-3 space-y-2 border-t border-blue-900/40"> <div class="flex justify-end gap-1.5"><button type="button" onclick="exportSavedIdeaMetadataTXT('${escapeHtml(idea.ideaId)}')" title="Unduh metadata TXT." class="px-2 py-1 bg-slate-800 rounded text-slate-200">TXT</button><button type="button" onclick="exportSavedIdeaMetadataCSV('${escapeHtml(idea.ideaId)}')" title="Unduh metadata CSV." class="px-2 py-1 bg-slate-800 rounded text-slate-200">CSV</button></div> <div class="rivis-meta-line rounded border border-slate-800 bg-slate-950/70 p-2 text-[9px] font-mono text-slate-400"> <span class="rivis-meta-file" title="${escapeHtml(baseName)}-edt.svg"><span>Filename:</span> <span class="text-cyan-300">${escapeHtml(baseName)}-edt.svg</span></span> <span class="rivis-meta-category"><span>Category:</span> <span class="text-slate-200">${meta.adobeCategoryCode} (${escapeHtml(meta.adobeCategory)})</span></span> </div> <div><div class="flex justify-between items-center text-[9px] mb-0.5"><span class="font-bold text-slate-400">Title</span><span class="font-mono ${titleValid?'text-emerald-400':'text-amber-400'}">${titleLength}/70 chars</span></div><p class="font-bold text-white bg-slate-900/80 p-1.5 rounded border border-slate-800">${escapeHtml(meta.stockTitle)}</p></div> <div class="space-y-1"><div class="flex justify-between text-[9px]"><span class="text-slate-400 font-bold">Keywords (relevance-ordered)</span><span class="font-mono ${keywordsValid?'text-emerald-400':'text-amber-400'}">${keywordCount}/40 tags</span></div><div class="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">${meta.keywords.map(kw=>`<span class="px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 rounded text-[9px]">${escapeHtml(kw)}</span>`).join('')}</div></div> <button type="button" onclick="copyIdeaKeywords('${escapeHtml(idea.ideaId)}',this)" title="Salin semua keyword Adobe Stock." class="w-full py-1.5 bg-blue-900/50 hover:bg-blue-800 text-blue-200 font-bold rounded text-[9px] border border-blue-700/50"> Copy All Keywords</button> </div> </details>`:''}
      </div> <div class="space-y-2 pt-3 border-t border-slate-800"> <div class="flex gap-1.5 flex-wrap"> <button type="button" data-card-meta-btn="${escapeHtml(idea.ideaId)}" onclick="handleGenerateMetadataForIdea('${escapeHtml(idea.ideaId)}', this)" class="flex-1 min-w-[75px] py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold rounded text-[10px] flex items-center justify-center gap-1 border border-slate-700 transition-all active:scale-95"> <span>Re Metadata</span></button> <button type="button" onclick="handleRemixStyleVariations('${escapeHtml(idea.ideaId)}', this)" class="px-2.5 py-1 bg-purple-900/60 hover:bg-purple-800 text-purple-200 font-bold rounded text-[10px] flex items-center gap-1 border border-purple-700 transition-all active:scale-95"> <span>Remix</span></button> <button type="button" onclick="handleDownloadSingleCardZip('${escapeHtml(idea.ideaId)}', this)" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold rounded text-[10px] flex items-center gap-1 border border-slate-700 transition-all active:scale-95" title="Download full ZIP for this card"> <span>ZIP Card</span></button> </div> <button type="button" data-card-image-btn="${escapeHtml(idea.ideaId)}" onclick="handleGenerateStockImageForIdea('${escapeHtml(idea.ideaId)}', this)" class="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition-all active:scale-95"><svg aria-hidden="true" class="rivis-icon w-3.5 h-3.5"><use href="#rivis-sparkles"></use></svg> <span>${idea.generatedImageUrl?'Regenerate Image':'Generate High-Res Image'}</span></button> </div> </div>`;
}
let libraryPaintDirty=true,libraryRenderedDuplicateIds=new Set();
function renderSavedIdeasGrid(changedId=null,skipWhenClean=false){const container=byId('savedIdeasGridContainer');
if(!container||state.activeTab!=='saved_ideas'||byId('tabSectionSavedIdeas')?.classList.contains('hidden'))return;const ideas=state.savedIdeas;
if(!ideas.length){container.innerHTML=`<div class="text-center py-16 text-slate-500 text-xs space-y-2"><p>No saved ideas yet. Open Idea Studio and click "Save" on your favorite concept card.</p></div>`;
libraryPaintDirty=false;libraryRenderedDuplicateIds=new Set();return;}container.className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5";
const sameOrder=container.children.length===ideas.length&&ideas.every((idea,i)=>container.children[i].getAttribute('data-rivis-card-id')===String(idea.ideaId));
if(changedId==null&&skipWhenClean&&!libraryPaintDirty&&sameOrder)return;const duplicates=libraryDuplicateIds(ideas);if(changedId!=null&&sameOrder){const affected=new Set([String(changedId)]);
for(const id of libraryRenderedDuplicateIds)if(!duplicates.has(id))affected.add(String(id));for(const id of duplicates)if(!libraryRenderedDuplicateIds.has(id))affected.add(String(id));
for(let i=0;i<ideas.length;i++){const idea=ideas[i];if(!affected.has(String(idea.ideaId)))continue;const existing=container.children[i];
const template=document.createElement('template');template.innerHTML=renderSavedCardHtml(idea,duplicates);const replacement=template.content.firstElementChild;
if(!replacement)continue;const oldPreflight=existing.querySelector('.rivis-preflight-row details');const newPreflight=replacement.querySelector('.rivis-preflight-row details');
if(oldPreflight&&newPreflight)newPreflight.open=oldPreflight.open;existing.replaceWith(replacement);}}else{container.innerHTML=ideas.map(idea=>renderSavedCardHtml(idea,
duplicates)).join('');}libraryPaintDirty=false;libraryRenderedDuplicateIds=duplicates;}
let lightboxState={scale:1,x:0,y:0,min:1,
max:8,dragging:false,startX:0,startY:0,originX:0,originY:0,pointers:new Map(),pinchDistance:0,pinchScale:1,pinchCenterX:0,pinchCenterY:0,
lastTap:0};
function lightboxElements(){return{modal:byId('imageLightboxModal'),viewport:byId('lightboxViewport'),img:byId('lightboxImg'),
title:byId('lightboxTitle'),downloadBtn:byId('lightboxDownloadBtn'),label:byId('lightboxZoomLabel'),zoomOut:byId('lightboxZoomOut'),
zoomIn:byId('lightboxZoomIn')};}
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
const{modal,img,title:titleEl,downloadBtn}=lightboxElements();if(!modal||!img)return;img.src=imgUrl;if(titleEl)titleEl.innerText=title||'Stock Image Preview';
if(downloadBtn)downloadBtn.onclick=()=>{if(ideaId)downloadGeneratedImage(ideaId);};modal.classList.remove('hidden');modal.classList.add('flex');
document.body.style.overflow='hidden';lightboxState.pointers.clear();lightboxState.dragging=false;resetLightboxZoom();img.onload=resetLightboxZoom;
}
function closeImageLightbox(e){const{modal,img}=lightboxElements();if(!modal)return;if(!e||e.target===modal){modal.classList.add('hidden');
modal.classList.remove('flex');document.body.style.overflow='';lightboxState.pointers.clear();lightboxState.dragging=false;if(img)img.src='';
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
window.addEventListener('DOMContentLoaded',()=>{initLightboxZoom();populateDropdowns();state.imageResolution=validImageResolution(safeStorageGet(STORAGE_KEYS.IMAGE_RESOLUTION,
'2K'));const resolutionSelect=byId('imageResolutionSelect');if(resolutionSelect)resolutionSelect.value=state.imageResolution;
const gradientCheckbox=byId('gradientColorCheckbox');if(gradientCheckbox)gradientCheckbox.checked=state.gradientEnabled;const savedMode=safeStorageGet(STORAGE_KEYS.OUTPUT_MODE,
'vector');if(byId('outputModeSelect'))handleOutputModeChange(savedMode);try{const rp=JSON.parse(safeStorageGet(STORAGE_KEYS.RASTER_PREFS,
'{}'));for(const[k,v]of Object.entries(rp)){const id={people:'rasterPeopleSelect',shot:'rasterShotSelect',lighting:'rasterLightingSelect',
color:'rasterColorSelect',authenticity:'rasterAuthenticitySelect',copySpace:'rasterCopySpaceSelect',format:'rasterFormatSelect',
jpegQuality:'rasterJpegQualitySelect'}[k];if(id&&byId(id))byId(id).value=String(v);}}catch(_){}updateRatioHint();const apiInput=byId('apiKeyInput');
if(apiInput&&state.apiKey){apiInput.value=state.apiKey;saveApiKey(state.apiKey);}initializePersistentLibrary();updateAutoPromptMode();
syncImageTestOfflineButton();});
const activeCardUpdates=new Set();
const cardPromptRevisions=new Map();
const activeCardJobs=new Map();
const openMetadataAccordions=new Set();
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
handleSaveAllDiscoveredIdeas:'Simpan semua konsep baru ke Library.',saveIdeaToLibrary:'Simpan konsep ini ke Library.',removeSavedIdea:'Hapus hanya kartu Library ini.',
toggleApiKeyModal:'Buka atau tutup pengaturan Gemini API Key.',clearSimplePrompt:'Bersihkan isi Simple Prompt.',copySimplePrompt:'Salin Simple Prompt ke clipboard.',
copyCardPrompt:'Salin Visual Prompt kartu ini.',toggleRivisExtras:'Tampilkan atau sembunyikan fitur tambahan.',handleClearAllSavedIdeas:'Hapus seluruh kartu Library (memerlukan konfirmasi).',
handleClearAllDiscoveredIdeas:'Hapus seluruh hasil Discovered Concepts.',openImageLightbox:'Perbesar gambar untuk memeriksa detail.',
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
function create(){if(el('rivisVectorModal'))return;const div=document.createElement('div');div.id='rivisVectorModal';div.style.cssText='position:fixed;inset:0;z-index:2147483000;background:#020617e8;display:none;align-items:center;justify-content:center;padding:12px;overflow:auto';div.innerHTML=`<section role="dialog" aria-modal="true" aria-labelledby="rvTitle" style="width:min(100%,980px);max-height:95vh;overflow:auto;background:#0f172a;color:#e2e8f0;border:1px solid #475569;border-radius:14px;padding:16px;font:13px system-ui,sans-serif">
<div style="display:flex;justify-content:space-between;gap:12px;align-items:center"><div><strong id="rvTitle" style="font-size:17px">AI Vector Studio · v…</strong><div style="color:#94a3b8;font-size:11px">Rekonstruksi SVG menggunakan AI Vision · PNG/JPG asli tetap tersimpan</div></div><button id="rvClose" type="button" aria-label="Tutup" style="background:transparent;color:white;border:1px solid #475569;border-radius:7px;padding:7px">✕</button></div>
<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:end;margin:12px 0">
<label style="display:grid;gap:3px">AI Provider<select id="rvProvider" style="background:#020617;color:white;padding:7px;border:1px solid #475569;border-radius:6px"><option value="gemini">Gemini Vision (Canvas)</option><option value="openrouter">OpenRouter Vision</option><option value="groq">Groq Vision</option></select></label>
<label style="display:grid;gap:3px">Detail<select id="rvDetail" style="background:#020617;color:white;padding:7px;border:1px solid #475569;border-radius:6px"><option value="smooth">Clean / Minimal</option><option value="balanced" selected>Balanced</option><option value="detailed">Detailed</option></select></label>
<label style="display:grid;gap:3px">Model ID<input id="rvModel" autocomplete="off" placeholder="gemini-3-flash-preview" style="background:#020617;color:white;padding:7px;border:1px solid #475569;border-radius:6px;min-width:170px"></label>
<label id="rvKeyBox" style="display:none;gap:3px">API Key (tidak disimpan)<input id="rvKey" type="password" autocomplete="off" style="background:#020617;color:white;padding:7px;border:1px solid #475569;border-radius:6px;min-width:140px"></label>
<button id="rvConvert" style="background:#7c3aed;color:white;border:0;border-radius:7px;padding:9px 12px;font-weight:bold">Generate AI SVG</button>
<button id="rvOriginal" style="background:#1e293b;color:white;border:1px solid #475569;border-radius:7px;padding:9px 12px">Unduh PNG/JPG Asli</button>
<button id="rvDownload" disabled style="background:#047857;color:white;border:0;border-radius:7px;padding:9px 12px;font-weight:bold;opacity:.5">Unduh SVG</button></div>
<div id="rvMessage" role="status" aria-live="polite" style="margin:8px 0;color:#a5b4fc;min-height:28px">AI melakukan rekonstruksi, bukan pixel tracing. Hasil dapat berbeda dari sumber.</div>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px"><div><b style="font-size:11px">PNG/JPG ASLI</b><div style="height:240px;background:#020617;border:1px solid #334155;border-radius:8px;display:grid;place-items:center"><img id="rvSource" alt="Original" style="max-height:100%;max-width:100%;object-fit:contain"></div></div><div><b style="font-size:11px">AI SVG EDITABLE</b><div id="rvPreview" style="height:240px;background:#020617;border:1px solid #334155;border-radius:8px;display:grid;place-items:center;overflow:hidden">Belum dibuat</div></div></div>
<div id="rvStats" style="font-size:12px;color:#cbd5e1;margin-top:9px"></div><p style="font-size:11px;color:#94a3b8">QC memeriksa struktur SVG, tidak menjamin kesamaan visual atau penerimaan microstock. Model vision harus mendukung input gambar dan mengeluarkan kode SVG. Pemanggilan AI dilakukan di HTML Canvas, bukan modul GitHub.</p>
</section>`;document.body.appendChild(div);
el('rvClose').onclick=close;div.onclick=e=>{if(e.target===div)close()};el('rvProvider').onchange=()=>{const p=el('rvProvider').value;el('rvKeyBox').style.display=p==='gemini'?'none':'grid';el('rvModel').placeholder=p==='gemini'?'gemini-3-flash-preview':p==='openrouter'?'masukkan model vision OpenRouter':'masukkan model vision Groq';el('rvModel').value='';};el('rvConvert').onclick=convert;el('rvOriginal').onclick=()=>{if(div.dataset.idea)downloadGeneratedImage(div.dataset.idea)};el('rvDownload').onclick=downloadSvg;document.addEventListener('keydown',e=>{if(e.key==='Escape'&&div.style.display!=='none')close()});}
function report(msg,error){el('rvMessage').textContent=msg;el('rvMessage').style.color=error?'#fca5a5':'#a5b4fc'}
function open(id){create();const idea=ideaById(id);if(!idea?.generatedImageUrl){if(typeof showToast==='function')showToast('Generate image dahulu.','error');return;}const modal=el('rivisVectorModal');modal.dataset.idea=String(id);modal.style.display='flex';el('rvSource').src=idea.generatedImageUrl;el('rvPreview').textContent='Belum dibuat';el('rvStats').textContent='';el('rvDownload').disabled=true;el('rvDownload').style.opacity='.5';report('Pilih AI Provider, lalu klik Generate AI SVG.');}
function close(){if(el('rivisVectorModal'))el('rivisVectorModal').style.display='none';}
async function convert(){if(busy)return;const id=el('rivisVectorModal').dataset.idea,idea=ideaById(id);if(!idea?.generatedImageUrl)return;const bridge=window.RIVIS_AI_VECTOR;if(!bridge?.generate){report('AI Vector API Canvas tidak tersedia. Perbarui HTML Canvas agar mendukung AI Vector.',true);return;}busy=true;const btn=el('rvConvert');btn.disabled=true;btn.textContent='AI memproses…';el('rvDownload').disabled=true;el('rvDownload').style.opacity='.5';try{report('AI Vision sedang membangun ulang objek menjadi SVG…');const result=await bridge.generate({imageUrl:idea.generatedImageUrl,idea,provider:el('rvProvider').value,apiKey:el('rvKey').value,model:el('rvModel').value,detail:el('rvDetail').value});const svg=result.svg,info=result.info;
cache.set(id,{svg,source:idea.generatedImageUrl,filename:(typeof getCardBaseFilename==='function'?getCardBaseFilename(idea):'rivis_vector')+'.svg'});const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));const img=new Image();img.alt='SVG AI preview';img.style.cssText='max-width:100%;max-height:100%;object-fit:contain';img.onload=()=>URL.revokeObjectURL(url);img.onerror=()=>URL.revokeObjectURL(url);img.src=url;el('rvPreview').replaceChildren(img);el('rvStats').textContent=`${info.provider} · ${info.vectorCount} objek · ${info.paths} path · ${info.gradients} gradien · ${(info.bytes/1024).toFixed(1)} KB · SVG valid`;el('rvDownload').disabled=false;el('rvDownload').style.opacity='1';report('SVG AI siap. Bandingkan preview dengan raster asli sebelum digunakan.');}
catch(e){console.error('RIVIS AI SVG',e);report('AI SVG gagal: '+String(e.message||e),true);}finally{btn.disabled=false;btn.textContent='Generate AI SVG';busy=false;}}
async function downloadSvg(){const id=el('rivisVectorModal').dataset.idea,result=cache.get(id),idea=ideaById(id);if(!result||result.source!==idea?.generatedImageUrl){report('SVG belum tersedia atau gambar sudah berubah.',true);return;}const blob=new Blob([result.svg],{type:'image/svg+xml;charset=utf-8'});if(typeof executeDownloadManager==='function')await executeDownloadManager({data:blob,filename:result.filename,mimeType:'image/svg+xml'});else{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=result.filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}}
window.RIVIS_VECTOR=Object.freeze({open,close,convert,downloadSVG:downloadSvg});
})();
