// Controlled local benchmark. These times are not model latency or API token usage.
import { readFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const repo = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const root = resolve(repo, "skills/cineweave-director");
const helper = await import(pathToFileURL(resolve(root,"scripts/read-style-card.mjs")).href);
const requests = [
  {id:"pair",queries:["CG11","MU14"]},
  {id:"names",queries:["宋韵清雅古偶柔光","杏露薄妆清雅日常"]},
  {id:"color_only",queries:["CG11"]},
  {id:"makeup_only",queries:["MU14"]},
  {id:"local_lips",queries:["MU28"]},
  {id:"animation",queries:["CG31","MU37"]},
];
const all = async () => (await Promise.all(helper.STYLE_DOCUMENTS.map(path=>readFile(resolve(root,path),"utf8")))).join("\n");
const sample = async work => {const start=performance.now(); const value=await work(); return {ms:performance.now()-start,value};};
const stats = values => {const sorted=[...values].sort((a,b)=>a-b);return {samples:sorted.length,min:sorted[0],median:sorted[Math.floor(sorted.length/2)],p95:sorted[Math.ceil(sorted.length*.95)-1]};};
const results=[];
for(const request of requests){
  const fullTimes=[], scopedTimes=[];
  let full, scoped, selected;
  for(let i=0;i<35;i++){
    const control=async()=>{const run=await sample(all);full=run.value;if(i>=5)fullTimes.push(run.ms);};
    const targeted=async()=>{const run=await sample(async()=>{selected=await helper.readStyleCards(request.queries);return helper.formatStyleCards(selected);});scoped=run.value;if(i>=5)scopedTimes.push(run.ms);};
    if(i%2){await targeted();await control();}else{await control();await targeted();}
  }
  if(selected.length!==request.queries.length)throw Error("Missing selected card");
  for(const card of selected){const text=await readFile(resolve(root,card.path),"utf8");const offset=text.indexOf(`## ${card.id} `),end=text.indexOf("\n## ",offset+1);if(text.slice(offset,end<0?undefined:end+1)!==card.text)throw Error(`Incomplete ${card.id}`);}
  results.push({id:request.id,queries:request.queries,cardIds:selected.map(card=>`${card.id}@r${card.revision}`),fullCatalogUtf8Bytes:Buffer.byteLength(full),selectedPayloadUtf8Bytes:Buffer.byteLength(scoped),payloadReduction:1-Buffer.byteLength(scoped)/Buffer.byteLength(full),fullCatalogLocalMs:stats(fullTimes),selectedLocalMs:stats(scopedTimes),selectedRulesByteIdentical:true});
}
process.stdout.write(`${JSON.stringify({version:"3.2.2",method:"5 warmups + 30 measured samples per mode and query, alternating order; same current source; read and render only",node:process.version,platform:process.platform,results,limitations:["Both modes read both full local documents; disk I/O is not reduced.","Targeted parsing may take longer locally; returned context size is a separate metric.","No inference tokens, end-to-end model latency or media quality is measured.","Full catalog mode is a controlled reference, not a claim about historical behavior."]},null,2)}\n`);
