'use strict';
const h=require('./_shared.cjs');
exports.handler=async(event)=>{
  if(!h.onlyGet(event))return h.json(405,{error:'Method not allowed'});
  const result=await h.activeSession(event);
  if(result.error)return h.json(200,{connected:false,reason:result.error});
  const headers=result.newCookie?{'Set-Cookie':result.newCookie}:{};
  return h.json(200,{connected:true,expires_at:result.session.expires_at},headers);
};
