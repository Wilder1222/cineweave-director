import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {validatePayload} from '../scripts/validate-output.mjs';
import {adaptStudioInput,validateStudioTask,traceShotEdit,checkTaskFreshness} from '../skills/cineweave-director/scripts/adapt-studio-input.mjs';
const fixture=()=>JSON.parse(fs.readFileSync(new URL('./fixtures/studio-director-input.json',import.meta.url)));
const hash=s=>createHash('sha256').update(s).digest('hex');
const opts=x=>({projectId:x.project_id,taskId:'task.fixture',shotIds:['shot.001']});
const schema=stem=>fileURLToPath(new URL('../skills/cineweave-director/resources/contracts/schemas/'+stem+'.schema.json',import.meta.url));
const rejected=(fn,code)=>assert.throws(fn,e=>e.code===code);
test('actual Studio fixture becomes schema-valid authoring task, not complete binding/media',async()=>{
 const x=fixture(),before=JSON.stringify(x);const t=adaptStudioInput(x,opts(x));
 for(const [name,payload] of [['studio-director-input',x],['studio-shot-task',t]]){const r=await validatePayload(schema(name),payload);assert.equal(r.valid,true,JSON.stringify(r.errors));}
 assert.equal(t.status,'authoring_required');assert.equal(t.shots[0].design,null);assert.ok(t.authoringRequired.includes('performanceState'));assert.ok(t.authoringRequired.includes('camera'));assert.equal(t.productionReady,false);assert.equal(t.sourceAuthorityVerified,false);assert.equal(t.mediaBytesVerifiedByConsumer,false);assert.equal(JSON.stringify(x),before);
 assert.equal(JSON.stringify(t.sourceRefs.cast),JSON.stringify(x.cast));assert.equal(t.sceneContent.title,x.title);
});
for(const [name,mutate,code] of [
 ['wrong project',(x,o)=>{o.projectId='another-project'},'PROJECT_SCOPE_MISMATCH'],
 ['unknown schema',x=>x.schema='cineweave.director-input/v2','UNSUPPORTED_STUDIO_INPUT'],
 ['legacy without evidence',x=>delete x.provenance,'PROVENANCE_REQUIRED'],
 ['manifest tamper',x=>x.provenance.manifest_json+=' ','MANIFEST_SHA256_MISMATCH'],
 ['source body tamper',x=>x.provenance.story_sources[0].content.title='changed','SOURCE_SHA256_MISMATCH'],
 ['source version tamper',x=>x.provenance.story_sources[0].version++,'SOURCE_VERSION_MISMATCH'],
 ['cross project nested',x=>x.provenance.story_sources[0].project_id='other','PROJECT_SCOPE_MISMATCH'],
 ['source omitted',x=>x.provenance.story_sources.pop(),'SOURCE_SET_MISMATCH'],
 ['duplicate source',x=>x.provenance.story_sources.push(x.provenance.story_sources[0]),'DUPLICATE_SOURCE'],
 ['cast alteration',x=>x.cast[0].actor.identity_revision++,'SCENE_EXPORT_MISMATCH'],
 ['look alteration',x=>x.cast[0].look.revision++,'SCENE_EXPORT_MISMATCH'],
 ['lookbook tamper',x=>x.provenance.lookbook_sources[0].json+=' ','LOOKBOOK_SHA256_MISMATCH'],
 ['missing media',x=>x.media=[],'MEDIA_SOURCE_MISSING'],
 ['bad media hash',x=>x.media[0].sha256='0'.repeat(64),'MEDIA_SHA256_INVALID'],
 ['stale export',x=>x.provenance.source_status='needs_review','SOURCE_STALE'],
 ['fake video',x=>x.generation_status='COMPLETED','GENERATION_CLAIM_REJECTED'],
])test('rejects '+name,()=>{const x=fixture(),o=opts(x);mutate(x,o);rejected(()=>adaptStudioInput(x,o),code)});
test('rehash cannot bypass Studio scene casting identity link',()=>{
 const x=fixture(),m=JSON.parse(x.provenance.manifest_json);m.production.scenes[0].cast[0].actor.identity_revision++;x.cast=m.production.scenes[0].cast;x.provenance.manifest_json=JSON.stringify(m);x.handoff.sha256=hash(x.provenance.manifest_json);
 rejected(()=>adaptStudioInput(x,opts(x)),'CAST_IDENTITY_MISMATCH');
});
test('new verified snapshot invalidates old task without silently repinning it',()=>{
 const x=fixture(),t=adaptStudioInput(x,opts(x)),next=fixture();next.handoff.id='another-handoff';
 assert.equal(checkTaskFreshness(t,next).status,'needs_review');assert.equal(t.sourceRefs.handoff.id,x.handoff.id);
 rejected(()=>traceShotEdit(t,{shotId:'shot.001',expectedRevision:0,design:{},currentInput:next}),'SOURCE_STALE');
});
test('shot edits retain source pins and immutable history, reject conflicts/tampering',async()=>{
 const x=fixture(),t=adaptStudioInput(x,opts(x));const design=JSON.parse(fs.readFileSync(new URL('../skills/cineweave-director/resources/contracts/examples/shot-spec.json',import.meta.url)));
 const valid=await validatePayload(schema('shot-spec'),design);assert.equal(valid.valid,true,JSON.stringify(valid.errors));
 const a=traceShotEdit(t,{shotId:'shot.001',expectedRevision:0,design,currentInput:x});const b=traceShotEdit(a,{shotId:'shot.001',expectedRevision:1,design:{...design,version:2,purpose:'[FIXTURE] explicitly authored revised purpose'},currentInput:x});
 assert.equal(validateStudioTask(b).valid,true);assert.equal(JSON.stringify(b.sourceRefs),JSON.stringify(t.sourceRefs));assert.equal(t.shots[0].revision,0);assert.equal(b.shots[0].history[1].design.version,1);assert.equal(b.status,'design_requires_validation');
 rejected(()=>traceShotEdit(a,{shotId:'shot.001',expectedRevision:0,design,currentInput:x}),'SHOT_VERSION_CONFLICT');
 b.shots[0].design.camera={};rejected(()=>validateStudioTask(b),'SHOT_DESIGN_SHA256_MISMATCH');
});
test('task cannot relabel inherited scene or claim source authenticity/production approval',()=>{
 for(const mutate of [x=>x.sceneContent.body='replaced',x=>x.sourceRefs.cast[0].actor.id='other']){const x=fixture(),t=adaptStudioInput(x,opts(x));mutate(t);assert.throws(()=>validateStudioTask(t));}
 const x=fixture(),t=adaptStudioInput(x,opts(x));t.productionReady=true;rejected(()=>validateStudioTask(t),'UNSUPPORTED_APPROVAL_CLAIM');
});

import {validateStudioShotDesign} from '../scripts/validate-output.mjs';
import {sha256Canonical} from '../scripts/canonical-json.mjs';
const example=name=>JSON.parse(fs.readFileSync(new URL('../skills/cineweave-director/resources/contracts/examples/'+name+'.json',import.meta.url)));
function authoredDesign(){
 const source=fixture(),task=adaptStudioInput(source,opts(source)),characterSpec=example('character-spec'),appearanceState=example('character-appearance-state'),document=example('character-binding'),design=example('shot-spec');
 const cref={characterId:characterSpec.characterId,version:characterSpec.version,contentHash:sha256Canonical(characterSpec)};
 appearanceState.characterSpecRef=cref;document.characterSpecRef=cref;document.appearanceStateRef={appearanceStateId:appearanceState.appearanceStateId,version:appearanceState.version,contentHash:sha256Canonical(appearanceState)};
 design.bindings.characters=[{kind:'character_binding',id:document.bindingId,version:1,contentHash:sha256Canonical(document)}];
 const traced=traceShotEdit(task,{shotId:'shot.001',expectedRevision:0,design,currentInput:source});
 const bindings=[{studioInstanceId:source.cast[0].instance.id,revision:1,document,characterSpec,appearanceState}];
 return {source,task:traced,bindings};
}
test('director-authored existing contracts validate into exact inherited source bindings',async()=>{
 const f=authoredDesign(),r=await validateStudioShotDesign(f.task,{shotId:'shot.001',currentInput:f.source,bindings:f.bindings});
 assert.equal(r.valid,true,JSON.stringify(r.errors));assert.equal(r.sourceBindings[0].studio.actor.identity_revision,f.source.cast[0].actor.identity_revision);assert.equal(r.sourceBindings[0].studio.look.revision,f.source.cast[0].look.revision);assert.equal(r.productionReady,false);assert.ok(r.unverified.length>0);
});
test('missing authored performance and mismatched binding reference fail final design validation',async()=>{
 for(const mutate of [f=>delete f.bindings[0].document.performanceState,f=>f.bindings[0].characterSpec.version++,f=>f.bindings[0].studioInstanceId='foreign-instance']){
  const f=authoredDesign();mutate(f);const r=await validateStudioShotDesign(f.task,{shotId:'shot.001',currentInput:f.source,bindings:f.bindings});assert.equal(r.valid,false);
 }
});

function repin(x, source) {
 source.sha256=hash(JSON.stringify(source.content));
 const m=JSON.parse(x.provenance.manifest_json);
 const old=m.production.sources.find(r=>r.id===source.id);Object.assign(old,{sha256:source.sha256});
 for(const scene of m.production.scenes){if(scene.scene.id===source.id)scene.scene.sha256=source.sha256;for(const c of scene.cast)for(const k of ['instance','role','casting','appearance'])if(c[k].id===source.id)c[k].sha256=source.sha256;}
 x.scene=m.production.scenes.find(s=>s.scene.id===x.scene.id).scene;x.cast=m.production.scenes.find(s=>s.scene.id===x.scene.id).cast;
 x.provenance.manifest_json=JSON.stringify(m);x.handoff.sha256=hash(x.provenance.manifest_json);
}
for(const [name,mutate,code] of [
 ['identity evidence substitution',x=>{x.provenance.identity_sources[0].face_asset_id='b'.repeat(64)},'IDENTITY_SOURCE_MISMATCH'],
 ['identity confirmation digest',x=>{x.provenance.identity_sources[0].confirmation_digest='b'.repeat(64)},'IDENTITY_CONFIRMATION_MISMATCH'],
 ['look from another book',x=>{x.provenance.look_sources[0].lookbook_id='other-book'},'LOOK_SOURCE_MISMATCH'],
 ['look evidence changed',x=>{x.provenance.look_sources[0].json+=' '},'LOOK_SOURCE_MISMATCH'],
 ['instance role rehash',x=>{const s=x.provenance.story_sources.find(s=>s.kind==='instance');s.content.fields.character_id='other-role';repin(x,s)},'INSTANCE_ROLE_MISMATCH'],
 ['appearance target rehash',x=>{const s=x.provenance.story_sources.find(s=>s.kind==='appearance');s.content.spec.target_id='other-scene';repin(x,s)},'APPEARANCE_TARGET_MISMATCH'],
 ['appearance casting pin rehash',x=>{const s=x.provenance.story_sources.find(s=>s.kind==='appearance');s.content.sources=[];repin(x,s)},'APPEARANCE_CAST_PIN_MISMATCH'],
 ['incorrect source kind',x=>{x.provenance.story_sources.find(s=>s.kind==='instance').kind='character'},'CAST_SOURCE_MISMATCH'],
])test('semantic verification rejects '+name,()=>{const x=fixture();mutate(x);rejected(()=>adaptStudioInput(x,opts(x)),code)});
test('task routing, freshness and status cannot be relabeled',()=>{
 for(const mutate of [t=>t.route='render',t=>t.freshness='current',t=>t.targetContracts=[],t=>t.nextRoutes=[],t=>t.status='approved']){const x=fixture(),t=adaptStudioInput(x,opts(x));mutate(t);assert.throws(()=>validateStudioTask(t));}
});

import {isStudioShotValidationCurrent} from '../scripts/validate-output.mjs';
test('nonempty shot bindings require all documents and old validation expires on edit',async()=>{
 const f=authoredDesign();
 assert.equal((await validateStudioShotDesign(f.task,{shotId:'shot.001',currentInput:f.source,bindings:[]})).valid,false);
 const result=await validateStudioShotDesign(f.task,{shotId:'shot.001',currentInput:f.source,bindings:f.bindings});
 assert.equal(isStudioShotValidationCurrent(f.task,result,{currentInput:f.source}),true);
 const next=traceShotEdit(f.task,{shotId:'shot.001',expectedRevision:1,design:{...f.task.shots[0].design,version:2,purpose:'[FIXTURE] revised'},currentInput:f.source});
 assert.equal(isStudioShotValidationCurrent(next,result,{currentInput:f.source}),false);
});
test('actual two-role Studio export allows a shot using only one scene character',async()=>{
 const source=JSON.parse(fs.readFileSync(new URL('./fixtures/studio-director-input-multi.json',import.meta.url)));
 assert.equal(source.cast.length,2);assert.notEqual(source.cast[0].role.id,source.cast[1].role.id);
 const task=adaptStudioInput(source,opts(source)),f=authoredDesign();
 const edited=traceShotEdit(task,{shotId:'shot.001',expectedRevision:0,design:f.task.shots[0].design,currentInput:source});
 f.bindings[0].studioInstanceId=source.cast[1].instance.id;
 const result=await validateStudioShotDesign(edited,{shotId:'shot.001',currentInput:source,bindings:f.bindings});
 assert.equal(result.valid,true,JSON.stringify(result.errors));assert.equal(result.sourceBindings.length,1);assert.equal(result.sourceBindings[0].studioInstanceId,source.cast[1].instance.id);
});
