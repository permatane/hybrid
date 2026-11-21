'use strict';

const nonce = location.hash.slice(1);
if (window.opener && /^[a-f0-9]{48}$/.test(nonce)) {
  const openerWindow = window.opener;
  history.replaceState(null, '', location.pathname);
  const acceptLaunch = event => {
    if (event.source !== openerWindow || event.data?.type !== 'RIVIS_QC_OPEN' || event.data.nonce !== nonce) return;
    window.removeEventListener('message', acceptLaunch);
    document.getElementById('status').textContent = 'Memeriksa sesi RIVIS…';
    window.opener = null;
    document.getElementById('launch').submit();
  };
  window.addEventListener('message', acceptLaunch);
  openerWindow.postMessage({type: 'RIVIS_QC_READY', nonce}, '*');
}
