const fs=require('node:fs');
const path=require('node:path');
const {Resvg}=require('@resvg/resvg-js');
const root=path.resolve(__dirname,'..');
let count=0;
for(const dir of ['visual','maps','boards']) {
  if(!fs.existsSync(path.join(root,dir)))continue;
  for(const file of fs.readdirSync(path.join(root,dir)).filter(n=>n.endsWith('.svg'))) {
    const p=path.join(root,dir,file);
    const target=p.slice(0,-4)+'.png';
    if(fs.existsSync(target)&&fs.statSync(target).mtimeMs>=fs.statSync(p).mtimeMs)continue;
    const svg=fs.readFileSync(p,'utf8');
    const png=new Resvg(svg,{font:{loadSystemFonts:false,fontFiles:['C:/Windows/Fonts/msyh.ttc','C:/Windows/Fonts/segoeui.ttf'],defaultFontFamily:'Microsoft YaHei'},fitTo:{mode:'width',value:1200}}).render().asPng();
    fs.writeFileSync(target,png);count++;
  }
}
console.log(JSON.stringify({rendered:count,scope:'vector_design_only',mediaVerified:false}));
