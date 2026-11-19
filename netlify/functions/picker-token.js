'use strict';
const h=require('./_shared.cjs');
exports.handler=async(event)=>{
  if(!h.onlyGet(event))return h.json(405,{error:'Method not allowed'});
  const s=await h.activeSession(event);
  if(s.error)return h.json(401,{error:s.error});
  return h.json(200,{access_token:s.session.access_token,expires_at:s.session.expires_at},s.newCookie?{'Set-Cookie':s.newCookie}:{});
};
