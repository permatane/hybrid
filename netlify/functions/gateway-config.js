'use strict';
const h=require('./_shared.cjs');
exports.handler=async(event)=>{
 if(!h.onlyGet(event))return h.json(405,{error:'Method not allowed'});
 const storageConfigured=h.validFileId(process.env.RIVIS_DRIVE_FOLDER_ID||'');
 return h.json(200,{gatewayVersion:'1.3.8',storageConfigured,storageMode:'drive-json',storageLabel:'RIVIS Drive JSON Gallery',origin:h.baseUrl()});
};
