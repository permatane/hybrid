'use strict';
const h=require('./_shared.cjs');
exports.handler=async(event)=>{
  if(event.httpMethod!=='POST')return h.json(405,{error:'Method not allowed'});
  // Do not permit cross-site requests to clear the user's local gateway session.
  if(event.headers?.origin!==h.baseUrl())return h.json(403,{error:'Origin not allowed'});
  return h.json(200,{ok:true},{'Set-Cookie':h.cookie(h.COOKIE_SESSION,'',0)});
};
