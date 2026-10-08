import {execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile,copyFile,access} from 'node:fs/promises';
import sharp from 'sharp';
const active=process.argv.includes('--active-five');
const revision=active||process.argv.includes('--revision-five');
const root=active?'ref/goods-motion-active-five':revision?'ref/goods-motion-revision-five':'ref/goods-motion-series';
const plan=JSON.parse(await readFile('docs/goods-motion-series-production.json','utf8'));
const run=(cmd,args)=>execFileSync(cmd,args,{windowsHide:true,stdio:'pipe',maxBuffer:32*1024*1024});
const probe=file=>JSON.parse(run('ffprobe',['-v','error','-show_entries','format=duration,size:stream=width,height,codec_type,codec_name','-of','json',file]));
for(const dir of ['videos','posters','review'])await mkdir(`${root}/${dir}`,{recursive:true});
const lumi={id:'lumi',name:'루미',title:'내가 이어 찾은 첫 번째 별자리',focus:'별을 띄우고 바라본 뒤 제자리로',qa:'승인된 시선 수정본 유지',accepted:true};
const cards=[];
const revisionScenes=revision?JSON.parse(await readFile(active?'scripts/motion-series-active-five-scenes.json':'scripts/motion-series-revision-five-scenes.json','utf8')):{};
for(const original of (revision?plan.cards.filter(c=>Object.hasOwn(revisionScenes,c.id)):[lumi,...plan.cards])){
 const scene=revisionScenes[original.id];
 const card=revision?{...original,focus:scene.focus,qa:scene.qa,reference:`${root}/frames/${original.id}.png`,sourceScene:scene.identity,segments:[{id:'outbound',seconds:8,action:scene.outbound},{id:'return',seconds:7,action:scene.return}]}:original;
 const id=card.id,video=`${root}/videos/${id}.mp4`;
 if(id==='lumi')await copyFile('ref/goods-motion-lumi-15s-gaze-v2/videos/lumi.mp4',video);
 else{
  const records=await Promise.all(['outbound','return'].map(async phase=>{try{return JSON.parse(await readFile(`${root}/records/${id}-${phase}.json`,'utf8'));}catch{return {status:'missing'};}}));
  if(records.some(r=>r.status!=='completed')){console.log(`${id}: pending`);cards.push({...card,status:'pending'});continue;}
  let exists=false;try{await access(video);exists=true;}catch{}
  if(!exists)run('ffmpeg',['-y','-v','error','-i',`${root}/raw/${id}-outbound.mp4`,'-i',`${root}/raw/${id}-return.mp4`,'-filter_complex','[0:v]crop=720:1080:0:100,setsar=1,fps=24,setpts=PTS-STARTPTS[a];[1:v]crop=720:1080:0:100,setsar=1,fps=24,setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1:a=0[v]','-map','[v]','-an','-c:v','libx264','-crf','19','-preset','medium','-pix_fmt','yuv420p','-movflags','+faststart',video]);
 }
 const meta=probe(video),duration=Number(meta.format.duration),v=meta.streams.find(s=>s.codec_type==='video');
 if(v.width!==720||v.height!==1080||Math.abs(duration-15)>.2||meta.streams.some(s=>s.codec_type==='audio'))throw Error(`${id}: unexpected output`);
 run('ffmpeg',['-v','error','-i',video,'-f','null','-']);
 const cachedReview=await Promise.all(['posters/'+id+'-start.webp','posters/'+id+'-end.webp','review/'+id+'-contact.jpg','review/'+id+'-loop.jpg'].map(file=>access(`${root}/${file}`).then(()=>true,()=>false)));
 if(cachedReview.every(Boolean)&&!process.argv.includes('--refresh-review')){
  cards.push({...card,status:'generated-for-review',duration,join:8,width:720,height:1080,bytes:Number(meta.format.size)});
  console.log(JSON.stringify({id,duration,decode:'passed',review:'existing'}));
  continue;
 }
 for(const [suffix,time] of [['start',0],['end',duration-.08]]){
  const buf=run('ffmpeg',['-v','error','-ss',String(time),'-i',video,'-frames:v','1','-f','image2pipe','-vcodec','png','-']);
  await sharp(buf).webp({quality:94}).toFile(`${root}/posters/${id}-${suffix}.webp`);
 }
 run('ffmpeg',['-y','-v','error','-i',video,'-vf','fps=2,scale=180:270,tile=5x6:padding=4:margin=4','-frames:v','1','-update','1',`${root}/review/${id}-contact.jpg`]);
 const composites=[];
 for(const time of [0,7.9,8.05,duration-.08]){
  const input=run('ffmpeg',['-v','error','-ss',String(time),'-i',video,'-vf','scale=300:450','-frames:v','1','-f','image2pipe','-vcodec','png','-']);
  composites.push({input,left:composites.length*300,top:0});
 }
 await sharp({create:{width:1200,height:450,channels:3,background:'#fff'}}).composite(composites).jpeg({quality:93}).toFile(`${root}/review/${id}-loop.jpg`);
 cards.push({...card,status:'generated-for-review',duration,join:8,width:720,height:1080,bytes:Number(meta.format.size)});
 console.log(JSON.stringify({id,duration,decode:'passed'}));
}
await writeFile(`${root}/manifest.json`,JSON.stringify({status:cards.every(c=>c.status==='generated-for-review')?'generated-for-review':'in-progress',method:'8s action + 7s return, direct concatenation without reverse, crossfade or time stretching; accepted Lumi copied unchanged.',cards},null,2));
