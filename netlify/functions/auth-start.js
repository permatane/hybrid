'use strict';
const crypto=require('node:crypto');
const h=require('./_shared.cjs');
exports.handler=async(event)=>{
  if(!h.onlyGet(event))return h.json(405,{error:'Method not allowed'});
  try {
    const {clientId}=h.tokenEnv();h.sessionKey();
    const state=crypto.randomBytes(32).toString('base64url');
    const oauth=new URL('https://accounts.google.com/o/oauth2/v2/auth');
    for(const [key,value] of Object.entries({client_id:clientId,redirect_uri:h.redirectUri(),response_type:'code',scope:h.DRIVE_SCOPE,access_type:'offline',prompt:'consent',state}))oauth.searchParams.set(key,value);
    return h.redirect(oauth.href,[h.cookie(h.COOKIE_STATE,state,600)]);
  }catch(e){return h.json(500,{error:h.normalizeError(e)});}
};
