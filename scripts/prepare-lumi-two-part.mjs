import {execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
const gazeRevision=process.argv.includes('--gaze-revision');
const root=gazeRevision?'ref/goods-motion-lumi-15s-gaze-v2':'ref/goods-motion-lumi-15s';
const run=(cmd,args)=>execFileSync(cmd,args,{windowsHide:true,stdio:'pipe',maxBuffer:16*1024*1024});
const probe=file=>JSON.parse(run('ffprobe',['-v','error','-show_entries','format=duration,size:stream=width,height,codec_type,codec_name','-of','json',file]));
for(const dir of ['videos','posters','review'])await mkdir(`${root}/${dir}`,{recursive:true});
const segments=[];
for(const id of ['outbound','return']){
 const record=JSON.parse(await readFile(`${root}/records/lumi-${id}.json`,'utf8'));
 if(record.status!=='completed')throw Error(`${id}: generation is not completed`);
 const metadata=probe(`${root}/raw/lumi-${id}.mp4`);
 const stream=metadata.streams.find(s=>s.codec_type==='video');
 if(stream.width!==720||stream.height!==1280)throw Error('Unexpected source dimensions');
 segments.push({id,requested:record.requestedSeconds,actual:Number(metadata.format.duration)});
}
const video=`${root}/videos/lumi.mp4`;
run('ffmpeg',['-y','-v','error','-i',`${root}/raw/lumi-outbound.mp4`,'-i',`${root}/raw/lumi-return.mp4`,'-filter_complex','[0:v]crop=720:1080:0:100,setsar=1,fps=24,setpts=PTS-STARTPTS[a];[1:v]crop=720:1080:0:100,setsar=1,fps=24,setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1:a=0[v]','-map','[v]','-an','-c:v','libx264','-crf','19','-preset','medium','-pix_fmt','yuv420p','-movflags','+faststart',video]);
run('ffmpeg',['-v','error','-i',video,'-f','null','-']);
const metadata=probe(video),duration=Number(metadata.format.duration),join=segments[0].actual;
for(const [id,time] of [['start',0],['end',duration-.06]]){
 const file=`${root}/review/lumi-${id}.png`;
 run('ffmpeg',['-y','-v','error','-ss',String(time),'-i',video,'-frames:v','1','-update','1',file]);
 await sharp(file).webp({quality:94}).toFile(`${root}/posters/lumi-${id}.webp`);
}
run('ffmpeg',['-y','-v','error','-i',video,'-vf','fps=2,scale=216:324,tile=5x6:padding=4:margin=4','-frames:v','1','-update','1',`${root}/review/lumi-contact.jpg`]);
const manifest={status:'awaiting-visual-review',duration,join,segments,width:720,height:1080,audio:false,bytes:Number(metadata.format.size),method:'Two generated segments concatenated; no reverse, crossfade, freeze extension or time stretching.'};
await writeFile(`${root}/manifest.json`,JSON.stringify(manifest,null,2));
const actualMatch=Math.abs(duration-15)<.1;
await writeFile(`${root}/index.html`,`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>루미 · 새로운 동작과 복귀</title><style>*{box-sizing:border-box}body{margin:0;background:#f6f1e7;color:#35443e;font:15px/1.7 system-ui,sans-serif}main{max-width:1080px;margin:auto;padding:36px 20px}h1{font-size:clamp(26px,4vw,38px);letter-spacing:-.04em;line-height:1.4}mark{color:inherit;background:linear-gradient(transparent 60%,#e9d58b 60% 94%,transparent 94%)}.layout{display:grid;grid-template-columns:minmax(260px,400px) 1fr;gap:30px;background:#fffdf8;border:1px solid #ddd0bc;padding:24px;border-radius:22px}video{display:block;width:100%;aspect-ratio:2/3;border-radius:14px;background:#242332}button,select{padding:9px 12px;border:1px solid #d4c4ba;background:#faf4ff;color:#68497b;border-radius:10px;font:inherit;cursor:pointer}.controls{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.small,small{font-size:12px;color:#786e60}a{color:#79538b}li{margin:10px 0}.status{background:#f3ebd5;border-radius:10px;padding:12px}details img{width:100%}textarea{width:100%;min-height:100px;font:inherit;border:1px solid #d4c4ba;border-radius:10px;padding:12px}button:focus-visible,select:focus-visible,input:focus-visible,a:focus-visible{outline:3px solid #a184b2;outline-offset:3px}@media(max-width:700px){.layout{grid-template-columns:1fr;padding:16px}main{padding:22px 14px}.screen{max-width:400px;margin:auto;width:100%}}</style><main><p class="small">STUDYCREW · LUMI MOTION STUDY</p><h1>별을 잇고, 다시 시작하는<br><mark>루미의 작은 발견</mark></h1><p>새로 생성한 두 구간을 이어 붙인 ${duration.toFixed(1)}초 시범작입니다. 이전 영상과 움직임을 비교해 보세요.</p><div class="layout"><div class="screen"><video id="video" controls playsinline muted loop preload="metadata" poster="posters/lumi-start.webp" src="videos/lumi.mp4"></video><div class="controls"><button id="replay">처음부터 재생</button><label><input id="loop" type="checkbox" checked> 반복 재생</label></div><div class="controls"><button id="join">중간 연결 보기</button><button id="boundary">끝→처음 보기</button><label>속도 <select id="speed"><option value="1">1배속</option><option value="0.5">0.5배속</option></select></label></div><p id="playback" class="small" aria-live="polite">반복 재생 켜짐</p></div><div><label>비교할 영상 <select id="version"><option value="new">새 동작·복귀 · ${duration.toFixed(1)}초</option><option value="v1">최초 동작 시범작 · 10초</option><option value="v2">움직임을 줄인 루프 · 10초</option></select></label><h2>내가 이은 첫 번째 별자리</h2><ol><li>자를 움직여 별지도 위의 별 잇기</li><li>떠오르는 별자리를 고개와 시선으로 따라가기</li><li>별자리가 가라앉고 시작 자세로 돌아오기</li></ol><p class="status" id="qa">${actualMatch?'실제 길이 15초 확인 · 시각 검토 중':'요청한 15초와 실제 생성 길이가 다릅니다. 실제 길이로 표시합니다.'}</p><p class="small">중간 연결은 ${join.toFixed(1)}초 지점입니다. 두 구간을 정상 속도로 연결했으며, 역재생이나 장면 겹치기는 사용하지 않았습니다.</p><p><a id="download" href="videos/lumi.mp4" download="StudyCrew-lumi-two-part.mp4">현재 영상 다운로드</a> · <a href="/v2/index.html">세 캐릭터 프리뷰</a></p><details><summary>새 영상의 0.5초 간격 장면</summary><a href="review/lumi-contact.jpg" target="_blank" rel="noopener"><img src="review/lumi-contact.jpg" loading="lazy" alt="시간순으로 나열한 루미 영상 장면"></a></details><p><label for="note">검토 메모</label></p><textarea id="note" placeholder="움직임, 자의 형태, 중간 연결과 반복 연결을 확인해 주세요."></textarea><small>메모는 이 브라우저에 저장됩니다.</small></div></div></main><script>const v=document.getElementById('video'),loop=document.getElementById('loop'),version=document.getElementById('version'),status=document.getElementById('playback');let count=0,previous=0;const paths={new:'videos/lumi.mp4',v1:'/v1/videos/lumi.mp4',v2:'/v2/videos/lumi.mp4'};const ready=async()=>{if(v.readyState<1)await new Promise(r=>v.addEventListener('loadedmetadata',r,{once:true}));};async function playAt(t){await ready();v.currentTime=t;await v.play();}document.getElementById('replay').onclick=()=>playAt(0);document.getElementById('join').onclick=()=>playAt(Math.max(0,${join}-2));document.getElementById('boundary').onclick=async()=>{await ready();loop.checked=v.loop=true;playAt(Math.max(0,v.duration-2));};loop.onchange=()=>{v.loop=loop.checked;status.textContent=loop.checked?'반복 재생 켜짐':'반복 재생 꺼짐';};document.getElementById('speed').onchange=e=>{v.playbackRate=Number(e.target.value);};version.onchange=()=>{v.pause();v.src=paths[version.value];v.poster=version.value==='new'?'posters/lumi-start.webp':'/'+version.value+'/posters/lumi-start.webp';v.load();count=0;previous=0;document.getElementById('join').disabled=version.value!=='new';document.getElementById('download').href=v.src;status.textContent='재생 버튼을 눌러 확인하세요.';};v.addEventListener('timeupdate',()=>{if(previous>v.duration-2&&v.currentTime<2){count++;status.textContent='반복 연결 '+count+'회';}previous=v.currentTime;});const note=document.getElementById('note');try{note.value=localStorage.getItem('lumi-two-part-review')||'';}catch{}note.oninput=()=>{try{localStorage.setItem('lumi-two-part-review',note.value);}catch{}};</script></html>`);
if(gazeRevision){
 let html=await readFile(`${root}/index.html`,'utf8');
 html=html.replace('새 동작·복귀 ·','시선 수정본 ·')
  .replace('<option value="v1">','<option value="lumi15">이전 15초 · 시선 비교</option><option value="v1">')
  .replace("v1:'/v1/videos/lumi.mp4'","lumi15:'/lumi15/videos/lumi.mp4',v1:'/v1/videos/lumi.mp4'")
  .replace('떠오르는 별자리를 고개와 시선으로 따라가기','턱을 낮추고 얼굴 아래의 별자리를 눈으로 따라가기')
  .replaceAll('lumi-two-part-review','lumi-gaze-v2-review')
  .replace('STUDYCREW · LUMI MOTION STUDY','STUDYCREW · LUMI GAZE REVISION');
 await writeFile(`${root}/index.html`,html);
}
console.log(JSON.stringify(manifest));
