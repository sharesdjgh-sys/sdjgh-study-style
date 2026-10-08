import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile,access} from 'node:fs/promises';
const run=promisify(execFile),root=process.argv.includes('--active-five')?'ref/goods-motion-active-five':process.argv.includes('--revision-five')?'ref/goods-motion-revision-five':'ref/goods-motion-series';
const manifest=JSON.parse(await readFile('docs/goods-motion-series-production.json','utf8'));
const queue=[];
for(const c of manifest.cards){try{await access(`${root}/review/${c.id}-loop.jpg`);try{await access(`${root}/review/${c.id}-quarter.jpg`);}catch{queue.push(c);}}catch{}}
await Promise.all(Array.from({length:3},async()=>{while(queue.length){const c=queue.shift();await run('ffmpeg',['-y','-v','error','-threads','2','-i',`${root}/videos/${c.id}.mp4`,'-vf','fps=4,scale=150:225,tile=10x6:padding=3:margin=3','-frames:v','1','-update','1',`${root}/review/${c.id}-quarter.jpg`],{windowsHide:true});console.log(c.id);}}));
