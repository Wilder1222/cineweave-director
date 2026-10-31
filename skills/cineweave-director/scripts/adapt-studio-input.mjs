#!/usr/bin/env node
/** Read-only Studio → Director authoring intake. Never calls a model, writes Studio,
 * authenticates a transport, or declares that generated media exists. */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseJsonStrict } from './parse-json.mjs';

const hash = text => createHash('sha256').update(text,'utf8').digest('hex');
const copy = x => parseJsonStrict(JSON.stringify(x));
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const requireValue = (ok,code) => { if(!ok) throw Object.assign(new Error(code),{code}); };
const hex = x => typeof x === 'string' && /^[a-f0-9]{64}$/.test(x);
const positive = x => Number.isSafeInteger(x) && x > 0;
const id = x => typeof x === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,159}$/.test(x);
const object = x => x && typeof x === 'object' && !Array.isArray(x);
const pin = x => {requireValue(object(x)&&id(x.id)&&positive(x.version)&&hex(x.sha256),'INVALID_SOURCE_PIN');return {id:x.id,version:x.version,sha256:x.sha256};};
const barePin = x => ({id:x.id,version:x.version,sha256:x.sha256});
function unique(rows,key,code){requireValue(Array.isArray(rows),'ARRAY_REQUIRED');const map=new Map();for(const r of rows){const k=key(r);requireValue(!map.has(k),code);map.set(k,r);}return map;}

export function validateStudioInput(value,{projectId}={}) {
 const input=copy(value);
 requireValue(input.schema==='cineweave.director-input/v1','UNSUPPORTED_STUDIO_INPUT');
 requireValue(id(projectId)&&input.project_id===projectId,'PROJECT_SCOPE_MISMATCH');
 requireValue(input.generation_status==='NOT_EXECUTED','GENERATION_CLAIM_REJECTED');
 requireValue(object(input.handoff)&&id(input.handoff.id)&&hex(input.handoff.sha256),'INVALID_HANDOFF_PIN');
 pin(input.scene);
 const p=input.provenance;
 requireValue(p?.schema==='cineweave.director-provenance/v1','PROVENANCE_REQUIRED');
 requireValue(p.source_status==='version_matched','SOURCE_STALE');
 requireValue(typeof p.manifest_json==='string'&&Buffer.byteLength(p.manifest_json)<=1500000,'MANIFEST_REQUIRED');
 requireValue(hash(p.manifest_json)===input.handoff.sha256,'MANIFEST_SHA256_MISMATCH');
 const manifest=parseJsonStrict(p.manifest_json),production=manifest.production;
 requireValue(manifest.format==='cineweave-production-handoff'&&production?.schema==='cineweave.casting-handoff/v1','UNSUPPORTED_HANDOFF');
 requireValue(manifest.project?.id===projectId&&production.project_id===projectId,'PROJECT_SCOPE_MISMATCH');
 requireValue(typeof manifest.script?.body==='string'&&hash(manifest.script.body)===manifest.script.sha256,'SCRIPT_SHA256_MISMATCH');
 const scenes=unique(production.scenes,x=>x.scene.id,'DUPLICATE_SCENE');
 const selected=scenes.get(input.scene.id);
 requireValue(selected&&same(selected,{scene:input.scene,title:input.title,cast:input.cast}),'SCENE_EXPORT_MISMATCH');
 const frozen=unique(production.sources,x=>pin(x).id,'DUPLICATE_SOURCE');
 const evidence=unique(p.story_sources,x=>pin(x).id,'DUPLICATE_SOURCE');
 requireValue(frozen.size===evidence.size,'SOURCE_SET_MISMATCH');
 for(const [key,ref] of frozen){const s=evidence.get(key);requireValue(s&&s.project_id===projectId,'PROJECT_SCOPE_MISMATCH');requireValue(same(barePin(s),barePin(ref)),'SOURCE_VERSION_MISMATCH');requireValue(hash(JSON.stringify(s.content))===s.sha256,'SOURCE_SHA256_MISMATCH');}
 const scene=evidence.get(input.scene.id);requireValue(scene?.kind==='scene'&&same(barePin(scene),barePin(input.scene)),'SCENE_SOURCE_MISSING');
 const identities=unique(p.identity_sources,x=>x.character_id+':'+x.identity_revision,'DUPLICATE_IDENTITY');
 const looks=unique(p.look_sources,x=>x.id+':'+x.revision,'DUPLICATE_LOOK');
 const books=unique(p.lookbook_sources,x=>x.id+':'+x.revision,'DUPLICATE_LOOKBOOK');
 const media=unique(input.media,x=>x.asset_id,'DUPLICATE_MEDIA');
 requireValue(input.media_live_verified===true,'MEDIA_EXPORT_UNVERIFIED');
 for(const m of media.values())requireValue(hex(m.asset_id)&&m.sha256===m.asset_id&&positive(m.bytes)&&m.verification==='authenticated-original-sha256','MEDIA_SHA256_INVALID');
 const instances=new Set();
 for(const c of input.cast){
  for(const field of ['instance','role','casting','appearance']){const ref=pin(c[field]),s=evidence.get(ref.id);requireValue(s&&same(barePin(s),ref)&&s.kind===(field==='role'?'character':field),'CAST_SOURCE_MISMATCH');}
  requireValue(evidence.get(c.instance.id).content.fields.character_id===c.role.id,'INSTANCE_ROLE_MISMATCH');
  requireValue(!instances.has(c.instance.id),'DUPLICATE_CAST_INSTANCE');instances.add(c.instance.id);
  requireValue(id(c.actor?.id)&&positive(c.actor.identity_revision)&&hex(c.actor.profile_version),'ACTOR_IDENTITY_INVALID');
  const spec=evidence.get(c.casting.id).content.spec,appearance=evidence.get(c.appearance.id).content.spec;
  requireValue(spec.ip_id===c.actor.id&&spec.identity_revision===c.actor.identity_revision&&spec.character_id===c.role.id&&spec.profile_version===c.actor.profile_version,'CAST_IDENTITY_MISMATCH');
  requireValue([c.instance.id,input.scene.id].includes(appearance.target_id),'APPEARANCE_TARGET_MISMATCH');
  const appearancePins=evidence.get(c.appearance.id).content.sources;requireValue(appearancePins.some(x=>x.kind==='item'&&x.item_id===c.casting.id&&x.version===c.casting.version&&x.sha256===c.casting.sha256),'APPEARANCE_CAST_PIN_MISMATCH');
  requireValue(appearance.casting_id===c.casting.id&&appearance.ip_id===c.actor.id&&appearance.identity_revision===c.actor.identity_revision,'APPEARANCE_IDENTITY_MISMATCH');
  requireValue(id(c.look?.id)&&positive(c.look.revision)&&hex(c.look.sha256)&&hash(JSON.stringify(c.look.snapshot))===c.look.sha256,'LOOK_SHA256_MISMATCH');
  requireValue(appearance.look_id===c.look.id&&appearance.look_revision===c.look.revision&&appearance.lookbook_id===c.lookbook.id&&appearance.lookbook_revision===c.lookbook.revision,'LOOK_VERSION_MISMATCH');
  const l=looks.get(c.look.id+':'+c.look.revision);requireValue(l&&l.lookbook_id===c.lookbook.id&&hash(l.json)===c.look.sha256&&same(parseJsonStrict(l.json),c.look.snapshot),'LOOK_SOURCE_MISMATCH');
  const b=books.get(c.lookbook.id+':'+c.lookbook.revision);requireValue(b&&hex(c.lookbook.sha256)&&hash(b.json)===c.lookbook.sha256,'LOOKBOOK_SHA256_MISMATCH');
  const book=parseJsonStrict(b.json);requireValue(book.character_id===c.actor.id&&book.identity_revision===c.actor.identity_revision,'LOOKBOOK_IDENTITY_MISMATCH');
  requireValue(object(c.identity)&&hex(c.identity.face_asset_id),'IDENTITY_REQUIRED');
  const identity=identities.get(c.actor.id+':'+c.actor.identity_revision);requireValue(identity,'IDENTITY_SOURCE_MISSING');
  const expectedIdentity={face_asset_id:identity.face_asset_id,body_asset_id:identity.body_asset_id,constraints:identity.constraints,confirmed_by:identity.confirmed_by,confirmed_at:identity.confirmed_at};
  requireValue(same(c.identity,expectedIdentity),'IDENTITY_SOURCE_MISMATCH');
  requireValue(hex(identity.confirmation_digest)&&hash(JSON.stringify({characterId:c.actor.id,expected:c.actor.identity_revision-1,face:identity.face_asset_id,body:identity.body_asset_id,constraints:identity.constraints}))===identity.confirmation_digest,'IDENTITY_CONFIRMATION_MISMATCH');
  for(const asset of [c.identity.face_asset_id,c.identity.body_asset_id,...c.look.snapshot.items.map(x=>x.asset_id)].filter(Boolean))requireValue(media.has(asset),'MEDIA_SOURCE_MISSING');
 }
 requireValue(same([...instances].sort(),[...(scene.content.spec.cast??[])].sort()),'SCENE_CAST_MISMATCH');
 for(const asset of [...production.assets,...manifest.assets.map(x=>x.frame_asset_id)])requireValue(media.has(asset),'MEDIA_SOURCE_MISSING');
 // Integrity is not authenticity. Only the caller's authenticated retrieval can
 // establish source authority; JSON booleans cannot do so.
 return {input,manifest,scene:scene.content,sourceFingerprint:hash(JSON.stringify({projectId,handoff:input.handoff,scene:input.scene,cast:input.cast,canon_revision:production.canon_revision})),sourceAuthorityVerified:false,mediaBytesVerifiedByConsumer:false};
}

export function adaptStudioInput(value,{projectId,taskId,shotIds=[]}={}) {
 const v=validateStudioInput(value,{projectId});
 requireValue(id(taskId),'TASK_ID_REQUIRED');requireValue(Array.isArray(shotIds)&&shotIds.length<=200&&shotIds.every(id)&&new Set(shotIds).size===shotIds.length,'INVALID_SHOT_IDS');
 const refs={project_id:projectId,handoff:copy(v.input.handoff),scene:copy(v.input.scene),cast:copy(v.input.cast)};
 return {schema:'cineweave.studio-shot-task/v1',taskId,revision:1,projectId,sourceFingerprint:v.sourceFingerprint,sourceRefs:refs,
  sceneContent:v.scene,sourceInput:v.input,route:'shot_direction',nextRoutes:['character','scene','shot_direction','storyboard_rhythm'],
  targetContracts:['character_binding','cineweave_codex_shot_spec','cineweave_codex_storyboard_sequence'],
  authoringRequired:['characterSpecRef','appearanceStateRef','performanceState','actionArc','observablePerformance','blocking','camera','composition','continuity','soundIntent'],
  shots:shotIds.map(shotId=>({shotId,revision:0,sourceFingerprint:v.sourceFingerprint,design:null,designSha256:null,history:[]})),
  status:'authoring_required',generationStatus:'NOT_EXECUTED',productionReady:false,sourceAuthorityVerified:false,
  freshness:'snapshot_only',mediaBytesVerifiedByConsumer:false};
}

export function checkTaskFreshness(task,currentInput) {
 const old=validateStudioInput(task.sourceInput,{projectId:task.projectId});
 requireValue(task.sourceFingerprint===old.sourceFingerprint,'TASK_SOURCE_TAMPERED');
 requireValue(same(task.sourceRefs,{project_id:task.projectId,handoff:old.input.handoff,scene:old.input.scene,cast:old.input.cast}),'TASK_SOURCE_TAMPERED');
 const current=validateStudioInput(currentInput,{projectId:task.projectId});
 return {valid:old.sourceFingerprint===current.sourceFingerprint,status:old.sourceFingerprint===current.sourceFingerprint?'version_matched':'needs_review',sourceAuthorityVerified:false};
}

export function traceShotEdit(task,{shotId,expectedRevision,design,currentInput}={}) {
 validateStudioTask(task);requireValue(checkTaskFreshness(task,currentInput).valid,'SOURCE_STALE');
 const next=copy(task),shot=next.shots.find(s=>s.shotId===shotId);
 requireValue(shot&&shot.revision===expectedRevision,'SHOT_VERSION_CONFLICT');
 requireValue(object(design)&&design.kind==='cineweave_codex_shot_spec'&&id(design.shotSpecId)&&positive(design.version),'SHOT_SPEC_REQUIRED');
 requireValue(shot.revision===0||design.shotSpecId===shot.design.shotSpecId,'SHOT_IDENTITY_CHANGE');
 requireValue(shot.revision===0||design.version>shot.design.version,'SHOT_VERSION_CONFLICT');
 shot.history.push({revision:shot.revision,sourceFingerprint:shot.sourceFingerprint,designSha256:shot.designSha256,design:shot.design});
 shot.revision++;shot.design=copy(design);shot.designSha256=hash(JSON.stringify(design));next.revision++;
 // Recording a design is not schema, artistic or media approval. The repository
 // validator must check character_binding/shot_spec before a production handoff.
 next.status='design_requires_validation';next.productionReady=false;return next;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try {const [file,projectId,taskId,...shotIds]=process.argv.slice(2);requireValue(file&&projectId&&taskId,'USAGE: adapt-studio-input.mjs input.json projectId taskId [shotId...]');process.stdout.write(JSON.stringify(adaptStudioInput(parseJsonStrict(readFileSync(file,'utf8')),{projectId,taskId,shotIds}),null,2)+'\n');}
 catch(e){console.error(e.message);process.exitCode=1;}
}

export function validateStudioTask(task) {
 requireValue(task?.schema==='cineweave.studio-shot-task/v1'&&positive(task.revision)&&id(task.taskId),'INVALID_TASK');
 const source=validateStudioInput(task.sourceInput,{projectId:task.projectId});
 requireValue(task.sourceFingerprint===source.sourceFingerprint&&same(task.sceneContent,source.scene),'TASK_SOURCE_TAMPERED');
 requireValue(checkTaskFreshness(task,task.sourceInput).valid,'TASK_SOURCE_TAMPERED');
 requireValue(task.productionReady===false&&task.generationStatus==='NOT_EXECUTED'&&task.sourceAuthorityVerified===false&&task.mediaBytesVerifiedByConsumer===false,'UNSUPPORTED_APPROVAL_CLAIM');
 requireValue(task.freshness==='snapshot_only'&&task.route==='shot_direction'&&same(task.nextRoutes,['character','scene','shot_direction','storyboard_rhythm'])&&same(task.targetContracts,['character_binding','cineweave_codex_shot_spec','cineweave_codex_storyboard_sequence']),'INVALID_TASK_ROUTE_OR_FRESHNESS');
 requireValue(['authoring_required','design_requires_validation'].includes(task.status),'INVALID_TASK_STATUS');
 const shots=unique(task.shots,x=>x.shotId,'DUPLICATE_SHOT');
 for(const s of shots.values()){
  requireValue(id(s.shotId)&&Number.isSafeInteger(s.revision)&&s.revision>=0&&s.sourceFingerprint===source.sourceFingerprint,'INVALID_SHOT_TRACE');
  requireValue(Array.isArray(s.history)&&s.history.length===s.revision,'INVALID_SHOT_HISTORY');
  for(let i=0;i<s.history.length;i++){const h=s.history[i];requireValue(h.revision===i&&h.sourceFingerprint===source.sourceFingerprint,'INVALID_SHOT_HISTORY');requireValue(i===0?h.design===null&&h.designSha256===null:hash(JSON.stringify(h.design))===h.designSha256,'SHOT_HISTORY_SHA256_MISMATCH');}
  requireValue(s.revision===0?s.design===null&&s.designSha256===null:object(s.design)&&hash(JSON.stringify(s.design))===s.designSha256,'SHOT_DESIGN_SHA256_MISMATCH');
 }
 return {valid:true,sourceAuthorityVerified:false,productionReady:false};
}
