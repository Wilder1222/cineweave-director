import fs from 'node:fs';
const root='D:/Temp/cineweave-split-p4-multiskill-b3-20261012';
const input=JSON.parse(fs.readFileSync(root+'/C08-revision-input.json','utf8'));
const after=JSON.parse(fs.readFileSync(root+'/C08-revised-documents.json','utf8'));
const section=(text,start,end)=>{const a=text.indexOf(start);const b=text.indexOf(end,a);return text.slice(a,b<0?undefined:b);};
const tags=[['REV-S01：','\nREV-S02：'],['0至4秒REV-S01，','\n4至8秒REV-S02，'],['REV-S01复制正文：','\nREV-S02复制正文：']];
const checks=input.sourceDocuments.map((before,i)=>{
const next=after[i];
return {documentId:before.documentId,fromRevision:before.revision,toRevision:next.revision,cameraChangedOnce:before.text.split('桌南侧偏西略俯').length===2&&next.text.split('桌南侧偏东略俯').length===2,s01Unchanged:section(before.text,...tags[i])===section(next.text,...tags[i]),onlyCameraAndVersionChanged:next.text.replace('桌南侧偏东略俯','桌南侧偏西略俯').replace('设计文本版本2','设计文本版本1').replace('REV-P，版本2','REV-P，版本1')===before.text};
});
const valid=checks.every(c=>c.cameraChangedOnce&&c.s01Unchanged&&c.onlyCameraAndVersionChanged&&c.toRevision===2);
console.log(JSON.stringify({valid,scope:'text_only',checks,mediaVerified:false},null,2));
process.exitCode=valid?0:1;

