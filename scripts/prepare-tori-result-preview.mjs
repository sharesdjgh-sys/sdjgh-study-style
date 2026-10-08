import {readFile,writeFile,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';
const root='ref/goods-motion-tori-result';
const run=(args)=>execFileSync('ffmpeg',args,{windowsHide:true,stdio:'pipe',maxBuffer:16*1024*1024});
const render=JSON.parse(await readFile(`${root}/review/render.json`,'utf8'));
const source=JSON.parse(await readFile('ref/goods-motion-active-five/manifest.json','utf8')).cards.find(c=>c.id==='tori');
const video=`${root}/videos/tori.mp4`;
run(['-v','error','-i',video,'-f','null','-']);
for(const [suffix,time] of [['start',0],['end',render.duration-.08]]){const buf=run(['-v','error','-ss',String(time),'-i',video,'-frames:v','1','-f','image2pipe','-vcodec','png','-']);await sharp(buf).webp({quality:94}).toFile(`${root}/posters/tori-${suffix}.webp`);}
run(['-y','-v','error','-i',video,'-vf','fps=2,scale=180:270,tile=5x6:padding=4:margin=4','-frames:v','1','-update','1',`${root}/review/tori-contact.jpg`]);
const composites=[];
for(const time of [0,7.9,8.05,render.duration-.08]){const input=run(['-v','error','-ss',String(time),'-i',video,'-vf','scale=300:450','-frames:v','1','-f','image2pipe','-vcodec','png','-']);composites.push({input,left:composites.length*300,top:0});}
await sharp({create:{width:1200,height:450,channels:3,background:'#fff'}}).composite(composites).jpeg({quality:93}).toFile(`${root}/review/tori-loop.jpg`);
const card={...source,title:'작은 조정으로 다시 켜진 별빛',focus:'돋보기로 조정한 뒤 시계의 별 표시등이 켜지는 결과',qa:'조정 후 6초대에 점등, 12.5초까지 결과 유지, 마지막에 서서히 소등해 루프 연결',bytes:(await stat(video)).size,postproduction:render.method};
await writeFile(`${root}/manifest.json`,JSON.stringify({status:'generated-for-review',method:render.method,cards:[card]},null,2));
const selection=JSON.parse(await readFile('docs/goods-motion-preview-selection.json','utf8'));selection.toriResult=true;
await writeFile('docs/goods-motion-preview-selection.json',JSON.stringify(selection,null,2)+'\n');
const notes=JSON.parse(await readFile('docs/goods-motion-series-visual-notes.json','utf8'));notes.tori={issue:false,note:'결과 추가 · 나사를 조정하면 시계 앞면의 별 표시등이 켜집니다. 별빛을 몇 초간 유지한 뒤 천천히 잦아들며 반복됩니다.'};
await writeFile('docs/goods-motion-series-visual-notes.json',JSON.stringify(notes,null,2)+'\n');
await writeFile('docs/goods-motion-tori-result.json',JSON.stringify({...render,tracking:undefined,preview:'/preview/goods-motion/active5/index.html#tori',otherFour:'unchanged'},null,2));
console.log('Tori result rendered, decoded and selected; other four unchanged');
