import { execFileSync } from 'node:child_process';
import { readFile, writeFile, stat } from 'node:fs/promises';

// Local editing only; does not call a generation API or alter the originals.
const root = 'ref/goods-motion-pilot-v1';
const run = (cmd, args) => execFileSync(cmd, args, { windowsHide: true, stdio: 'pipe' });
const manifest = JSON.parse(await readFile(`${root}/manifest.json`, 'utf8'));
for (const card of manifest.cards) {
  const file = `videos/${card.id}-loop.mp4`;
  // Start at t=1; blend t=9..10 with t=0..1. The final frame then
  // continues naturally into the initial t=1 frame on repeated playback.
  run('ffmpeg', ['-y', '-v', 'error', '-i', `${root}/${card.video}`,
    '-filter_complex', '[0:v]fps=30,split=2[a][b];[a]trim=start=1:end=10,setpts=PTS-STARTPTS,settb=AVTB,fps=30[body];[b]trim=start=0:end=1,setpts=PTS-STARTPTS,settb=AVTB,fps=30[head];[body][head]xfade=transition=fade:duration=1:offset=8,format=yuv420p[out]',
    '-map', '[out]', '-an', '-c:v', 'libx264', '-crf', '20', '-preset', 'medium', '-movflags', '+faststart', `${root}/${file}`]);
  run('ffmpeg', ['-v','error','-i',`${root}/${file}`,'-f','null','-']);
  const metadata = JSON.parse(run('ffprobe', ['-v','error','-show_entries','format=duration:stream=width,height','-of','json',`${root}/${file}`]));
  if (Math.abs(Number(metadata.format.duration)-9)>.05) throw Error(`${card.id}: unexpected duration`);
  card.loopPreview = { video: file, duration: Number(metadata.format.duration), bytes: (await stat(`${root}/${file}`)).size, method: '1-second circular crossfade; not a regenerated seamless animation' };
  console.log(`${card.id}: ${metadata.format.duration}s loop encoded and decoded`);
}
await writeFile(`${root}/manifest.json`, JSON.stringify(manifest,null,2)+'\n');
let html = await readFile(`${root}/index.html`, 'utf8');
html = html.replace(/<!-- LOOP_PREVIEW_START -->[\s\S]*?<!-- LOOP_PREVIEW_END -->/g,'');
const enhancement = `<!-- LOOP_PREVIEW_START --><script>
document.querySelectorAll('article').forEach(article=>{
 const id=article.id,video=article.querySelector('video'),transport=article.querySelector('.transport');
 const label=document.createElement('label');label.textContent='영상 ';const select=document.createElement('select');select.dataset.version=id;
 [['original','원본 · 10초'],['loop','전환 비교본 · 9초']].forEach(([value,text])=>{const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option);});label.append(select);transport.prepend(label);
 const help=article.querySelector('.loop-help');help.textContent='검토 결과: 원본은 연결이 끊기고, 전환 비교본은 장면을 겹쳐 잔상이 생깁니다. 두 버전 모두 최종 루프 품질에 미달합니다. 시작과 끝의 동작을 맞춘 재제작이 필요합니다.';
 const change=()=>{video.pause();const isLoop=select.value==='loop';video.src='videos/'+id+(isLoop?'-loop':'')+'.mp4';video.loop=isLoop;article.querySelector('[data-loop]').checked=isLoop;video.load();article.querySelector('a[download]').href=video.src;article.querySelector('a[download]').download='StudyCrew-'+id+(isLoop?'-loop-preview':'-pilot-v1')+'.mp4';};
 select.addEventListener('change',change);change();
});
</script><!-- LOOP_PREVIEW_END -->`;
html=html.replace('</body>',enhancement+'</body>');
await writeFile(`${root}/index.html`,html);
