'use strict';
const crypto=require('node:crypto');
const h=require('./_shared.cjs');
exports.handler=async(event)=>{
  if(!h.onlyGet(event))return h.json(405,{error:'Method not allowed'});
  const invalid=()=>h.redirect(h.baseUrl()+'/rivis-cloud/?auth=failed',[h.cookie(h.COOKIE_STATE,'',0)]);
  try{
    if(event.queryStringParameters?.error)return invalid();
    const state=event.queryStringParameters?.state;
    const saved=h.parseCookie(event,h.COOKIE_STATE);
    const code=event.queryStringParameters?.code;
    if(typeof state!=='string'||!saved||!code)return invalid();
    const a=Buffer.from(state),b=Buffer.from(saved);
    if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return invalid();
    const {clientId,clientSecret}=h.tokenEnv();
    const tokens=await h.googleToken({client_id:clientId,client_secret:clientSecret,redirect_uri:h.redirectUri(),code,grant_type:'authorization_code'});
    if(!tokens.access_token)return invalid();
    const session={access_token:tokens.access_token,refresh_token:tokens.refresh_token||'',expires_at:Date.now()+(Number(tokens.expires_in)||3600)*1000};
    return h.redirect(h.baseUrl()+'/rivis-cloud/?auth=connected',[h.cookie(h.COOKIE_STATE,'',0),h.sessionCookie(session)]);
  }catch(_){return invalid();}
};
