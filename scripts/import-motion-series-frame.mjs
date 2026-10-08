import {readFile,mkdir,copyFile} from 'node:fs/promises';import sharp from 'sharp';
const [id,source]=process.argv.slice(2);const plan=JSON.parse(await readFile('docs/goods-motion-series-production.json','utf8'));
if(!plan.cards.some(c=>c.id===id)||!source)throw Error('Use known character id and source image');
const root=process.argv.includes('--revision-five')?'ref/goods-motion-revision-five':'ref/goods-motion-series';for(const dir of ['frames','inputs'])await mkdir(`${root}/${dir}`,{recursive:true});
await copyFile(source,`${root}/frames/${id}.png`);
await sharp(source).resize(720,1080,{fit:'fill'}).extend({top:100,bottom:100,left:0,right:0,extendWith:'mirror'}).png().toFile(`${root}/inputs/${id}-start.png`);
console.log(`${id}: frame imported`);
