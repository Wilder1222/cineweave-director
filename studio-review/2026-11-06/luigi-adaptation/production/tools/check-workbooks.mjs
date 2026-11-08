import {readFile,readdir,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const checker=process.argv[2];
if(!checker)throw new Error('Supply the installed CineWeave check-shot-review.mjs path.');
const {checkShotReview}=await import(pathToFileURL(resolve(checker)));
const results=[];
for(const name of (await readdir(resolve(root,'review'))).filter(x=>/^E\d\d-worksheet\.json$/.test(x)).sort()){
  const result=checkShotReview(JSON.parse(await readFile(resolve(root,'review',name),'utf8')));
  results.push({file:name,...result});
}
const out={scope:'authored_text_coverage_only',checker,episodes:results.length,valid:results.every(x=>x.valid),coverageComplete:results.every(x=>x.coverageComplete),reviewComplete:results.every(x=>x.reviewComplete),mediaVerified:false,results};
await writeFile(resolve(root,'review','worksheet-check.json'),JSON.stringify(out,null,2));
console.log(JSON.stringify({episodes:results.length,valid:out.valid,coverageComplete:out.coverageComplete,reviewComplete:out.reviewComplete,errors:results.flatMap(x=>x.errors)}));
process.exitCode=out.valid&&out.coverageComplete&&out.reviewComplete?0:1;
