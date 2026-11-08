// Records only text exposed by the authenticated Studio UI. No HTTP, cookies,
// localStorage, application state, approval, or document mutation is used.
import * as fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
export function createExportDriver(tab, root) {
  const heading = name => tab.playwright.getByRole('heading', {name, exact:true});
  async function waitHeading(name) {
    const start=Date.now();
    while(!await heading(name).isVisible()) {
      try { await heading(name).waitFor({state:'visible',timeoutMs:1500}); }
      catch { await tab.getAXState({emit:false}); }
      if(Date.now()-start>30000)throw Error(`Target heading not confirmed: ${name}`);
    }
  }
  async function directory() {
    const s=tab.playwright.getByText('文档目录与新建',{exact:true});
    if(!await s.evaluate(el=>el.closest('details')?.open??true))await s.click();
  }
  async function scripts() {
    if(await tab.playwright.getByRole('button',{name:'回到剧本',exact:true}).isVisible()) {
      await tab.playwright.getByRole('button',{name:'回到剧本',exact:true}).click();
    } else if(!await heading('故事与剧本').isVisible()) {
      await tab.playwright.getByRole('button',{name:'故事与剧本',exact:true}).click();
    }
    await waitHeading('故事与剧本');
  }
  async function exportProject(project) {
    await scripts();
    const select=tab.playwright.getByRole('combobox',{name:'切换当前作品',exact:true});
    if(await select.evaluate(el=>el.value)!==project.id) {
      await select.selectOption(project.id);
      const start=Date.now();
      for(;;) {
        const title=await tab.playwright.getByRole('heading',{level:2}).allTextContents();
        if(title.some(t=>t.startsWith(project.topic_id+' ')))break;
        await tab.getAXState({emit:false});
        if(Date.now()-start>30000)throw Error('Project selection not confirmed: '+project.title);
      }
    }
    await directory();
    const docs=await tab.playwright.getByRole('button',{name:'编辑',exact:true}).evaluateAll(es=>es.map(el=>({
      id:el.getAttribute('data-id'),title:el.parentElement.querySelector('strong')?.textContent,
      meta:el.parentElement.querySelector('p')?.textContent
    })));
    if(!docs.length)throw Error('Document inventory is not confirmed');
    const dir=root+'/'+project.id;
    await fs.mkdir(dir,{recursive:true});
    let saved;
    try{saved=JSON.parse(await fs.readFile(dir+'/index.json','utf8'));}catch{}
    const record={project,source:'Studio authenticated UI DOM',currentRevision:null,
      inventoryReadAt:new Date().toISOString(),expectedDocumentIds:docs.map(d=>d.id),
      documents:saved?.documents??[],complete:false};
    const started=Date.now();
    for(const doc of docs) {
      if(record.documents.some(d=>d.id===doc.id))continue;
      await directory();
      if(!await heading(doc.title).isVisible()) {
        await tab.playwright.locator('button[data-action="select-document"][data-id="'+doc.id+'"]').click();
        await waitHeading(doc.title);
      }
      const body=await tab.playwright.getByLabel('内容正文',{exact:true}).evaluate(el=>el.value);
      const sourceURL=await tab.url();
      await fs.writeFile(dir+'/'+doc.id+'.md',body,'utf8');
      await tab.playwright.getByRole('button',{name:'前往审阅',exact:true}).click();
      await waitHeading('Agent 协作审阅');
      const proposals=await tab.playwright.locator('.proposal-body').evaluateAll(es=>es.map(el=>({
        body:el.textContent,context:el.parentElement.innerText,
        ids:Array.from(el.parentElement.querySelectorAll('button[data-id]')).map(b=>({action:b.getAttribute('data-action'),id:b.getAttribute('data-id')}))
      })));
      record.documents.push({...doc,path:dir+'/'+doc.id+'.md',sha256:createHash('sha256').update(body,'utf8').digest('hex'),
        length:body.length,readAt:new Date().toISOString(),sourceURL,proposals});
      record.complete=docs.every(d=>record.documents.some(s=>s.id===d.id));
      await fs.writeFile(dir+'/index.json',JSON.stringify(record,null,2)+'\n','utf8');
      await tab.playwright.getByRole('button',{name:'回到剧本',exact:true}).click();
      await waitHeading(doc.title);
      if(Date.now()-started>35000&&!record.complete)return {project:project.topic_id,documents:record.documents.length,expected:docs.length,complete:false};
    }
    record.complete=docs.every(d=>record.documents.some(s=>s.id===d.id));
    await fs.writeFile(dir+'/index.json',JSON.stringify(record,null,2)+'\n','utf8');
    return {project:project.topic_id,documents:record.documents.length,expected:docs.length,complete:record.complete};
  }
  return {exportProject};
}
