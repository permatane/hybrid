'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const API = '/.netlify/functions/';
  const STORAGE = 'rivis.gateway.selection.v1';
  const params = new URL(location.href).searchParams;
  const incomingChannel = params.get('channel') || '';
  if (/^[A-Za-z0-9_-]{16,128}$/.test(incomingChannel)) sessionStorage.setItem('rivis.cloud.bridge.channel', incomingChannel);
  const previousChannel = sessionStorage.getItem('rivis.cloud.bridge.channel') || '';
  const channel = /^[A-Za-z0-9_-]{16,128}$/.test(previousChannel) ? previousChannel : '';
  let targetOrigin = '';
  let config = null;
  let signedIn = false;
  let verifiedSelection = false;
  let storageInfo = null;
  // Keep large image bytes in RIVIS; request only the chunk currently being uploaded.
  const chunkPending = new Map();
  let chunkSequence = 0;
  function remoteChunk(requestId, start, end) {
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end <= start || end - start > 1024*1024) {
      return Promise.reject(new Error('Invalid RIVIS image chunk range'));
    }
    return new Promise((resolve,reject)=>{
      if (!channel || !targetOrigin || !window.opener) { reject(new Error('RIVIS source window disconnected')); return; }
      const chunkId = String(++chunkSequence);
      const key = requestId+':'+chunkId;
      const timer = setTimeout(()=>{
        chunkPending.delete(key);
        reject(new Error('RIVIS belum mengirim potongan gambar selama 20000 ms. Pastikan tab RIVIS tetap aktif.'));
      },20000);
      chunkPending.set(key,{resolve:buffer=>{clearTimeout(timer);resolve(new Blob([buffer]));},reject:error=>{clearTimeout(timer);reject(error);}});
      try {
        window.opener.postMessage({type:'RIVIS_CLOUD_BLOB_REQUEST',channel,requestId,chunkId,start,end},targetOrigin);
      } catch(error){
        clearTimeout(timer);chunkPending.delete(key);reject(error);
      }
    });
  }
  function acceptRemoteChunk(event) {
    const d=event.data||{},key=String(d.requestId||'')+':'+String(d.chunkId||'');
    const pending=chunkPending.get(key);
    if (!pending) return;
    chunkPending.delete(key);
    if (d.error) {pending.reject(new Error(String(d.error)));return;}
    if (!(d.buffer instanceof ArrayBuffer) || d.buffer.byteLength!==Number(d.end)-Number(d.start)) {
      pending.reject(new Error('RIVIS sent invalid binary chunk'));return;
    }
    pending.resolve(d.buffer);
  }


  function status(message, state='info') {
    const box = $('connectionStatus');
    if (!box) return;
    box.dataset.state = state;
    box.lastElementChild.textContent = message;
  }
  function message(text) {
    $('authMessage').textContent = text;
    $('authMessage').hidden = !text;
  }
  function render() {
    $('loginBtn').hidden = signedIn;
    $('logoutBtn').hidden = !signedIn;
    $('storageState').textContent = config?.storageConfigured ? 'Siap · otomatis' : 'Belum dikonfigurasi';
    $('storageState').dataset.state = config?.storageConfigured ? 'success' : 'error';
    $('folderState').textContent = storageInfo?.folder?.name || (config?.storageConfigured ? 'Folder RIVIS sudah ditetapkan di Netlify' : 'Folder belum ditetapkan');
    $('sheetState').textContent = storageInfo?.spreadsheet?.name || (config?.storageConfigured ? 'Spreadsheet RIVIS sudah ditetapkan di Netlify' : 'Spreadsheet belum ditetapkan');
    $('logoutBtn').disabled = !signedIn;
  }
  async function request(path, options={}, timeoutMs=45000) {
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),timeoutMs);
    try {
      let response;
      try {response=await fetch(API+path,{...options,credentials:'same-origin',cache:'no-store',signal:controller.signal});}
      catch(error){
        if(error?.name==='AbortError')throw new Error(path+': koneksi tidak merespons dalam '+Math.ceil(timeoutMs/1000)+' detik.');
        throw new Error(path+': '+(error?.message||'Koneksi ke Netlify gagal.'));
      }
      const raw=await response.text();
      let body={};try{body=raw?JSON.parse(raw):{};}catch(_){body={raw:raw.slice(0,500)};}
      if(!response.ok)throw new Error(body.error||body.raw||('HTTP '+response.status+' di '+path));
      return body;
    }finally{clearTimeout(timer);}
  }
  const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  function progress(requestId,stage,completed,total,messageText){
    const percent=total>0?Math.min(100,Math.round(completed/total*100)):0;
    emit('RIVIS_CLOUD_PROGRESS',{requestId,stage,completed,total,percent,message:messageText||''});
    status(messageText||('Mengunggah gambar '+percent+'%...'), 'info');
  }
  async function sendBinaryChunk(init,blob,start,end,timeoutMs=32000){
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);
    try {
      let response;
      try{
        const part=await blob.slice(start,end+1);
        if(!(part instanceof Blob) || part.size!==end-start+1)throw new Error('Data potongan gambar tidak lengkap.');
        response=await fetch(API+'cloud-upload-chunk',{
          method:'PUT',credentials:'same-origin',cache:'no-store',signal:controller.signal,
          headers:{'Content-Type':'application/octet-stream','X-RIVIS-Upload-Url':init.uploadUrl,
            'X-RIVIS-Mime-Type':init.mimeType,'Content-Range':`bytes ${start}-${end}/${blob.size}`},
          body:part
        });
      }catch(error){
        if(error?.name==='AbortError')throw new Error('Upload chunk '+Math.floor(start/1048576+1)+' timeout setelah '+Math.ceil(timeoutMs/1000)+' detik.');
        throw new Error('Upload chunk ke Netlify gagal: '+(error?.message||'network error'));
      }
      const raw=await response.text();let body={};
      try{body=raw?JSON.parse(raw):{};}catch(_){body={};}
      if(!response.ok||body.ok!==true)throw new Error(body.error||'Upload chunk gagal HTTP '+response.status);
      return body;
    }finally{clearTimeout(timer);}
  }
  async function queryUploadStatus(init,total){
    return request('cloud-upload-chunk',{
      method:'PUT',headers:{'X-RIVIS-Upload-Url':init.uploadUrl,'X-RIVIS-Mime-Type':init.mimeType,
        'X-RIVIS-Query-Status':'1','X-RIVIS-Total-Bytes':String(total)}
    },21000);
  }
  function emit(type, payload={}) {
    if (!channel || !window.opener || !targetOrigin) return;
    try { window.opener.postMessage({type, channel, ...payload}, targetOrigin); } catch (_) {}
  }
  function notifyReady() {
    if (!channel || !window.opener) return;
    try { window.opener.postMessage({type:'RIVIS_CLOUD_HELLO', channel}, '*'); } catch (_) {}
  }
  async function testConnection() {
    try {
      status('Memeriksa akses Google Drive dan Google Sheets...');
      const result = await request('cloud-test');
      storageInfo = result;
      verifiedSelection = result.ok === true && Array.isArray(result.missingTabs) && result.missingTabs.length === 0 && Array.isArray(result.schemaErrors) && result.schemaErrors.length === 0;
      if (!verifiedSelection) {
        const issues = [];
        if (result.missingTabs?.length) issues.push('Tab tidak ditemukan: ' + result.missingTabs.join(', '));
        for (const item of (result.schemaErrors || [])) issues.push(item.tab + ': ' + item.error);
        throw new Error(issues.length ? issues.join(' · ') : 'Struktur spreadsheet belum valid.');
      }
      status('CLOUD CONNECTED · Drive dan Sheets siap digunakan.', 'success');
      $('testResult').textContent = JSON.stringify({folder:result.folder?.name, spreadsheet:result.spreadsheet?.name, tabs:result.spreadsheet?.tabs}, null, 2);
      render();
      emit('RIVIS_CLOUD_STATUS', {connected:true, verified:true, folderName:result.folder?.name, sheetName:result.spreadsheet?.name});
      return true;
    } catch (error) {
      verifiedSelection = false;
      status('Cloud belum siap · ' + error.message, 'error');
      $('testResult').textContent = error.message;
      render();
      emit('RIVIS_CLOUD_STATUS', {connected:signedIn, verified:false});
      return false;
    }
  }
  async function disconnect() {
    try {
      await request('logout', {method:'POST', headers:{'Content-Type':'application/json'}, body:'{}'});
      signedIn = false;
      verifiedSelection = false;
      storageInfo = null;
      render();
      status('Sesi Google diputus.', 'warning');
      emit('RIVIS_CLOUD_STATUS', {connected:false, verified:false});
    } catch (error) { status(error.message, 'error'); }
  }
  async function handleCanvasCommand(event) {
    const d = event.data || {};
    if (!channel || !window.opener || event.source !== window.opener || d.type !== 'RIVIS_CLOUD_COMMAND' || d.channel !== channel) return;
    if (event.origin !== 'null' && targetOrigin && targetOrigin !== '*' && event.origin !== targetOrigin) return;
    const reply = (ok, result, error) => {
      try { event.source.postMessage({type:'RIVIS_CLOUD_RESULT', channel, requestId:d.requestId, ok, result, error}, targetOrigin || '*'); } catch (_) {}
    };
    let heartbeat=null;
    try {
      if (!signedIn || !verifiedSelection) throw new Error('Hubungkan Google terlebih dahulu.');
      let result;
      if(d.command==='upload'){
        // Heartbeats keep the RIVIS caller informed while Netlify / Drive handle a chunk.
        heartbeat=setInterval(()=>emit('RIVIS_CLOUD_PROGRESS',{requestId:d.requestId,stage:'heartbeat',message:'Cloud Gateway sedang memproses upload...'}),12000);
      }
      if (d.command === 'save') {
        const payload = d.payload || {};
        if (!payload.idea || typeof payload.idea !== 'object') throw new Error('Data idea tidak ditemukan.');
        result = await request('cloud-data', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'save', idea:payload.idea, prompts:payload.prompts||[], assets:payload.assets||[], groups:payload.groups||[], groupItems:payload.groupItems||[], generationLogs:payload.generationLogs||[]})});
      } else if (d.command === 'list') {
        result = await request('cloud-data?action=list');
      } else if (d.command === 'load') {
        const ideaId = String(d.payload?.ideaId || '');
        if (!/^[A-Za-z0-9_-]{1,128}$/.test(ideaId)) throw new Error('Idea ID tidak valid.');
        result = await request('cloud-data?action=load&ideaId=' + encodeURIComponent(ideaId));
      } else if (d.command === 'upload') {
        const payload=d.payload||{};
        const streamed=payload.streamedBlob===true;
        if(!streamed&&(!(payload.blob instanceof Blob)||!payload.blob.size))throw new Error('Binary image asset tidak ditemukan.');
        const total=streamed?Number(payload.size):payload.blob.size;
        if(!Number.isSafeInteger(total)||total<1||total>100*1024*1024)throw new Error('Ukuran gambar tidak valid untuk upload.');
        const uploadBlob=streamed?{size:total,slice:(start,end)=>remoteChunk(d.requestId,start,end)}:payload.blob;
        const initPayload={...payload};delete initPayload.blob;delete initPayload.streamedBlob;
        progress(d.requestId,'init',0,total,'Menyiapkan sesi upload Google Drive...');
        const init=await request('cloud-upload-init',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(initPayload)},24000);
        let uploaded=init.existingFileId?{id:init.existingFileId,name:init.fileName,mimeType:init.mimeType,size:total}:null;
        let offset=0,failures=0;
        const chunkSize=1024*1024; // smaller Netlify payload; Google Drive requires 256 KiB alignment.
        const started=Date.now();
        if(uploaded)progress(d.requestId,'resume',total,total,'Gambar ditemukan di Drive, melanjutkan sinkronisasi ASSETS...');
        while(!uploaded&&offset<total){
          if(Date.now()-started>12*60*1000)throw new Error('Batas waktu total upload 12 menit tercapai. Coba kembali dengan jaringan lebih stabil.');
          const end=Math.min(total,offset+chunkSize)-1;
          let part=null;
          try{part=await sendBinaryChunk(init,uploadBlob,offset,end);}
          catch(error){
            failures++;
            progress(d.requestId,'retry',offset,total,'Koneksi upload terputus. Memeriksa byte yang diterima Drive ('+failures+'/3)...');
            let resumeError='';
            try{
              const check=await queryUploadStatus(init,total);
              if(check.done&&check.file?.id){uploaded=check.file;offset=total;break;}
              const recovered=Number(check.nextStart);
              if(Number.isSafeInteger(recovered)&&recovered>offset&&recovered<=total){
                offset=recovered;failures=0;
                progress(d.requestId,'resume',offset,total,'Upload dipulihkan pada '+Math.round(offset/total*100)+'%');
                continue;
              }
            }catch(checkError){resumeError='; pemeriksaan status: '+checkError.message;}
            if(failures>=3)throw new Error('Upload gagal pada '+Math.round(offset/total*100)+'%: '+error.message+resumeError);
            await delay(500*failures);
            continue;
          }
          if(part.done&&part.file?.id){uploaded=part.file;offset=total;}
          else{
            const next=Number(part.nextStart);
            if(!Number.isSafeInteger(next)||next<=offset||next>total){
              // A 308 response without a valid Range must be reconciled before writing again.
              const check=await queryUploadStatus(init,total);
              if(check.done&&check.file?.id){uploaded=check.file;offset=total;}
              else if(Number(check.nextStart)>offset&&Number(check.nextStart)<=total)offset=Number(check.nextStart);
              else throw new Error('Google Drive tidak mengonfirmasi kemajuan upload pada '+offset+' byte.');
            }else offset=next;
          }
          failures=0;
          progress(d.requestId,'upload',offset,total,'Upload gambar '+Math.round(offset/total*100)+'%');
        }
        if(!uploaded?.id)throw new Error('Drive tidak mengonfirmasi file setelah semua chunk dikirim.');
        progress(d.requestId,'index',total,total,'Upload gambar 100% · mencatat file ke ASSETS...');
        let indexed=null;
        for(let attempt=1;attempt<=2;attempt++){
          try{
            indexed=await request('cloud-upload-complete',{method:'POST',headers:{'Content-Type':'application/json'},
              body:JSON.stringify({...init,driveFileId:uploaded.id,fileName:uploaded.name||init.fileName,
                mimeType:uploaded.mimeType||init.mimeType,size:uploaded.size||init.size})},47000);
            break;
          }catch(error){
            if(attempt>=2)throw new Error('File sudah tersimpan di Drive (ID '+uploaded.id+'), tetapi indeks ASSETS gagal: '+error.message);
            progress(d.requestId,'index-retry',total,total,'Gambar tersimpan, mengulang pencatatan ASSETS...');
            await delay(700);
          }
        }
        result=indexed;
        progress(d.requestId,'done',total,total,'Gambar dan indeks ASSETS berhasil disimpan.');
      } else if (d.command === 'download') {
        const fileId = String(d.payload?.fileId || '');
        if (!/^[A-Za-z0-9_-]{8,128}$/.test(fileId)) throw new Error('Drive file ID tidak valid.');
        const start = Math.max(0, Number(d.payload?.start)||0);
        const chunkSize = Math.min(1024*1024, Math.max(1, Number(d.payload?.chunkSize)||1024*1024));
        result = await request('cloud-download?fileId=' + encodeURIComponent(fileId) + '&start=' + start + '&chunkSize=' + chunkSize);
      } else if (d.command === 'thumbnail') {
        const fileId = String(d.payload?.fileId || '');
        if (!/^[A-Za-z0-9_-]{8,128}$/.test(fileId)) throw new Error('Drive file ID tidak valid.');
        result = await request('cloud-thumbnail?fileId=' + encodeURIComponent(fileId));
      } else if (d.command === 'archive') {
        result = await request('cloud-data', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'archive', ideaId:d.payload?.ideaId})});
      } else throw new Error('Perintah Cloud Gallery tidak dikenal.');
      reply(true, result, null);
    } catch (error) {
      status('Cloud upload gagal · '+String(error?.message||error).slice(0,250),'error');
      reply(false, null, error.message || 'Cloud operation failed');
    } finally {
      if(heartbeat!==null)clearInterval(heartbeat);
      for(const [key,pending] of chunkPending){
        if(key.startsWith(d.requestId+':')){chunkPending.delete(key);pending.reject(new Error('Upload request ended'));}
      }
    }
  }
  window.addEventListener('message', event => {
    if (!channel || !window.opener || event.source !== window.opener) return;
    if (event.data?.type === 'RIVIS_CLOUD_BLOB_RESPONSE' && event.data?.channel === channel) {
      if(event.origin !== 'null' && targetOrigin && targetOrigin !== '*' && event.origin !== targetOrigin)return;
      acceptRemoteChunk(event);
      return;
    }
    if (event.data?.type === 'RIVIS_CLOUD_ACK' && event.data?.channel === channel) {
      if (event.origin !== 'null' && !/^https?:\/\//.test(event.origin)) return;
      targetOrigin = event.origin === 'null' ? '*' : event.origin;
      $('bridgeStatus').textContent = 'Terhubung ke RIVIS';
      emit('RIVIS_CLOUD_STATUS', {connected:signedIn, verified:verifiedSelection, folderName:storageInfo?.folder?.name, sheetName:storageInfo?.spreadsheet?.name});
      return;
    }
    handleCanvasCommand(event);
  });
  async function init() {
    $('gatewayOrigin').textContent = location.origin;
    $('oauthRedirect').textContent = location.origin + '/rivis-cloud/callback';
    const auth = params.get('auth');
    if (auth === 'failed') message('Login belum berhasil. Periksa Google OAuth consent screen, Redirect URI, dan Test Users.');
    if (auth === 'connected') message('Login Google berhasil. RIVIS Cloud sedang memeriksa penyimpanan.');
    if (auth) history.replaceState(null, '', location.pathname + (channel ? '?channel=' + encodeURIComponent(channel) : ''));
    $('logoutBtn').addEventListener('click', disconnect);
    try {
      const [cfg, session] = await Promise.all([request('gateway-config'), request('session')]);
      config = cfg;
      signedIn = !!session.connected;
      if (!config.storageConfigured) throw new Error('Atur RIVIS_DRIVE_FOLDER_ID dan RIVIS_SPREADSHEET_ID di Netlify Environment Variables.');
      if (signedIn) await testConnection();
      else status('Belum terhubung · Klik Connect Google untuk mulai.', 'warning');
    } catch (error) { status('Gateway belum siap · ' + error.message, 'error'); }
    render();
    notifyReady();
  }
  init();
})();
