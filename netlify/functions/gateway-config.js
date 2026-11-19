'use strict';
const h=require('./_shared.cjs');
exports.handler=async(event)=>{
 if(!h.onlyGet(event))return h.json(405,{error:'Method not allowed'});
 const storageConfigured=h.validFileId(process.env.RIVIS_DRIVE_FOLDER_ID||'')&&h.validFileId(process.env.RIVIS_SPREADSHEET_ID||'');
 return h.json(200,{gatewayVersion:'1.3.4',storageConfigured,storageLabel:'RIVIS Cloud Gallery',origin:h.baseUrl()});
};
