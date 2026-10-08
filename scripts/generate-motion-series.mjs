import {loadEnvFile} from 'node:process';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const active=process.argv.includes('--active-five');
const revision=active||process.argv.includes('--revision-five');
const revisionIds=['leaf','tori','block','joy','pace'];
const root=active?'ref/goods-motion-active-five':revision?'ref/goods-motion-revision-five':'ref/goods-motion-series';
const plan=JSON.parse(await readFile('docs/goods-motion-series-production.json','utf8'));
const scenes=JSON.parse(await readFile(active?'scripts/motion-series-active-five-scenes.json':revision?'scripts/motion-series-revision-five-scenes.json':'scripts/motion-series-scenes.json','utf8'));
const requested=process.argv.find(a=>a.startsWith('--ids='))?.slice(6).split(',');
if(requested?.some(id=>!plan.cards.some(c=>c.id===id)))throw Error('Unknown character');
if(revision&&requested?.some(id=>!revisionIds.includes(id)))throw Error('Character outside five-card revision');
const cards=plan.cards.filter(c=>(!revision||revisionIds.includes(c.id))&&(!requested||requested.includes(c.id)));
const generate=process.argv.includes('--generate');
for(const dir of ['records','raw','inputs','prompts'])await mkdir(`${root}/${dir}`,{recursive:true});
if(generate)loadEnvFile('.env.local');
const key=generate?process.env.GEMINI_API_KEY?.trim():undefined;
if(generate&&!key)throw Error('Missing Gemini key');
const sanitize=s=>String(s??'').split(key||'__NO_KEY__').join('[REDACTED]').replace(/AIza[\w-]+/g,'[REDACTED]');
const run=(cmd,args)=>execFileSync(cmd,args,{windowsHide:true,stdio:'pipe',maxBuffer:16*1024*1024});
const probe=file=>JSON.parse(run('ffprobe',['-v','error','-show_entries','format=duration:stream=width,height,codec_type','-of','json',file]));
async function exists(p){try{await access(p);return true;}catch(e){if(e.code==='ENOENT')return false;throw e;}}
const common='One continuous locked-camera shot, silent video, no captions, text, cuts, dissolves, camera zoom or reversed footage. Preserve the exact soft tactile 3D character identity, face proportions, costume, fur, lighting and rigid props. Visible purposeful character movement, not a frozen portrait. Keep all main action in the central 84 percent of portrait height. Eyes follow the actual object at its actual height; never look at the ceiling when the object is below the face. Match anatomy and prop count in every frame. Slow down smoothly near the end, without a snap or freeze extension.';
async function request(card,phase,first,last){
 const id=`${card.id}-${phase}`,seconds=phase==='outbound'?8:7,scene=scenes[card.id];
 const prompt=`[# Sources <FIRST_FRAME>@Image1${last?' <LAST_FRAME>@Image2':''}]\nCreate exactly ${seconds} seconds. ${common}\nCharacter: ${scene.identity}.\n${scene[phase]}\n${last?'Use Image1 as the literal first frame and Image2 as the exact final frame. The final second should gently settle into Image2 with open eyes and matching lighting and prop positions.':'Use Image1 as the literal first frame. Complete the described action by second 7, then settle in the admiring end pose for the last second, ready for a continuation. Keep the camera and background absolutely fixed.'}`;
 await writeFile(`${root}/prompts/${id}.txt`,prompt);
 const recordPath=`${root}/records/${id}.json`,videoPath=`${root}/raw/${id}.mp4`;
 if(await exists(recordPath)){
  const record=JSON.parse(await readFile(recordPath,'utf8'));
  if(record.status==='completed'&&await exists(videoPath))return videoPath;
  throw Error(`${id}: prior attempt exists; no automatic paid retry`);
 }
 if(await exists(videoPath))throw Error(`${id}: unrecorded video exists`);
 if(!generate)return null;
 const images=await Promise.all([first,...(last?[last]:[])].map(async p=>({type:'image',data:(await readFile(p)).toString('base64'),mime_type:'image/png'})));
 const record={id,character:card.id,phase,model:'gemini-omni-1.1-flash',requestedSeconds:seconds,requests:1,status:'started',startedAt:new Date().toISOString()};
 // Exclusive records prevent automatic paid retries within each version.
 await writeFile(recordPath,JSON.stringify(record,null,2),{flag:'wx'});
 console.log(JSON.stringify({id,status:'request-started',requests:1}));
 try{
  const response=await fetch('https://generativelanguage.googleapis.com/v1beta/interactions',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({model:record.model,input:[...images,{type:'text',text:prompt}],response_format:{type:'video',resolution:'720p',aspect_ratio:'9:16'},background:false,store:false,stream:false}),signal:AbortSignal.timeout(600000)});
  const data=await response.json();record.httpStatus=response.status;if(!response.ok)throw Error(sanitize(data.error?.message??`HTTP ${response.status}`));
  const video=(data.steps??[]).filter(s=>s.type==='model_output').flatMap(s=>s.content??[]).find(c=>c.type==='video');let bytes;
  if(video?.data)bytes=Buffer.from(video.data,'base64');
  else if(video?.uri){const url=new URL(video.uri);if(url.protocol!=='https:'||url.hostname!=='generativelanguage.googleapis.com')throw Error('Unexpected download host');const download=await fetch(url,{headers:{'x-goog-api-key':key},redirect:'error',signal:AbortSignal.timeout(60000)});if(!download.ok)throw Error(`Download ${download.status}`);bytes=Buffer.from(await download.arrayBuffer());}
  else throw Error('No video returned');
  await writeFile(videoPath,bytes,{flag:'wx'});
  const metadata=probe(videoPath);const stream=metadata.streams.find(s=>s.codec_type==='video');if(stream.width!==720||stream.height!==1280)throw Error('Unexpected video dimensions');
  Object.assign(record,{status:'completed',finishedAt:new Date().toISOString(),bytes:bytes.length,actualSeconds:Number(metadata.format.duration),usage:data.usage});
  console.log(JSON.stringify({id,status:record.status,seconds:record.actualSeconds}));return videoPath;
 }catch(e){record.status='failed-or-unknown';record.message=sanitize(e.message);throw Error(`${id}: ${record.message}`);}
 finally{await writeFile(recordPath,JSON.stringify(record,null,2));}
}
async function make(card){
 const first=`${root}/inputs/${card.id}-start.png`;await access(first);
 const out=await request(card,'outbound',first);
 if(!out){console.log(`${card.id}: ready, paid requests 0`);return;}
 const turn=`${root}/inputs/${card.id}-turn.png`,actualFirst=`${root}/inputs/${card.id}-loop-start.png`;
 // Container duration can exceed the last decodable frame (e.g. 8.042667s).
 // Reverse the final second to extract the actual last frame, rather than seeking past it.
 run('ffmpeg',['-y','-v','error','-ss','0','-i',out,'-frames:v','1','-update','1',actualFirst]);
 run('ffmpeg',['-y','-v','error','-sseof','-1','-i',out,'-vf','reverse','-frames:v','1','-update','1',turn]);
 await request(card,'return',turn,actualFirst);
 console.log(JSON.stringify({id:card.id,status:'two-segments-completed'}));
}
let cursor=0;
await Promise.all(Array.from({length:Math.min(3,cards.length)},async()=>{while(cursor<cards.length){const card=cards[cursor++];try{await make(card);}catch(e){console.error(sanitize(e.message));process.exitCode=1;}}}));
