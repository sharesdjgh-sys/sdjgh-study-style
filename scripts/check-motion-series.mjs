import {chromium,expect} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
const active=process.argv.includes('--active-five');
const revision=active||process.argv.includes('--revision-five');
const root=active?'ref/goods-motion-active-five':revision?'ref/goods-motion-revision-five':'ref/goods-motion-series',base='http://127.0.0.1:3000/preview/goods-motion/series/';
const manifest=JSON.parse(await readFile(`${root}/manifest.json`,'utf8'));
const selection=JSON.parse(await readFile('docs/goods-motion-preview-selection.json','utf8'));
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
const results=[];
try{
 // Independent pages keep each card at normal speed while checking three full loops.
 const selectedIds=process.argv.find(arg=>arg.startsWith('--ids='))?.slice(6).split(',');
 const queue=manifest.cards.filter(card=>!selectedIds||selectedIds.includes(card.id));
 await Promise.all(Array.from({length:3},async()=>{
  while(queue.length){const card=queue.shift();if(card.status!=='generated-for-review')throw Error(`${card.id} unavailable`);
   const page=await browser.newPage({viewport:{width:390,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
   try{
    await page.goto(base+'index.html');const article=page.locator('#'+card.id),v=article.locator('video');
    await article.locator('[data-action="replay"]').click();
    const revisedBase=active&&selection.toriResult&&card.id==='tori'?'/toriresult/':active?'/active5/':'/revision5/';
    if(revision&&!((await v.evaluate(v=>v.currentSrc)).includes(revisedBase)))throw Error('Revision not selected');
    await expect.poll(()=>article.getAttribute('data-loops'),{timeout:55000}).toBe('3');
    await v.evaluate(v=>v.pause());
    await article.locator('[data-action="join"]').click();
    await expect.poll(()=>v.evaluate(v=>v.currentTime)).toBeGreaterThanOrEqual(6);
    await article.locator('[data-action="boundary"]').click();
    await expect.poll(()=>v.evaluate(v=>v.currentTime),{timeout:6000}).toBeLessThan(2);
    await v.evaluate(v=>v.pause());
    await article.locator('select').selectOption('0.5');if(await v.evaluate(v=>v.playbackRate)!==.5)throw Error('Speed');
    const range=await page.request.get(await v.evaluate(v=>v.currentSrc),{headers:{Range:'bytes=0-1023'}});if(range.status()!==206||(await range.body()).length!==1024)throw Error('Range');
    if(revision){
      await article.locator('[data-action="compare"]').click();
      await expect.poll(()=>v.evaluate(v=>v.currentTime),{timeout:20000}).toBeGreaterThan(.2);
      if(!((await v.evaluate(v=>v.currentSrc)).includes(revisedBase==='/toriresult/'?'/active5/videos/':'/series/videos/')))throw Error('Previous video unavailable');
      await article.locator('[data-action="compare"]').click();
      await expect.poll(()=>v.evaluate(v=>v.currentTime),{timeout:20000}).toBeGreaterThan(.2);
      if(!((await v.evaluate(v=>v.currentSrc)).includes(revisedBase)))throw Error('Revision return failed');
      await v.evaluate(v=>v.pause());
    }
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);if(overflow)throw Error('Mobile overflow');
    await article.locator('summary').click();await article.locator('textarea').fill('검토 메모 저장 확인');await page.reload();
    await expect(article.locator('textarea')).toHaveValue('검토 메모 저장 확인');
    if(errors.length)throw Error(errors.join(';'));
    results.push({id:card.id,loops:3,normalSpeed:true,join:true,boundary:true,range:206,mobileOverflow:false,notePersistence:true,pageErrors:errors});console.log(JSON.stringify(results.at(-1)));
   }finally{await page.close();}
  }
 }));
 const page=await browser.newPage({viewport:{width:1440,height:1100}});await page.goto(base+'index.html');
 await expect(page.locator('video')).toHaveCount(16);
 await page.locator('#lumi [data-action="replay"]').click();await page.locator('#moa [data-action="replay"]').click();
 await expect.poll(()=>page.locator('#lumi video').evaluate(v=>v.paused)).toBe(true);await page.locator('#moa video').evaluate(v=>v.pause());
 const downloadEvent=page.waitForEvent('download');await page.locator(revision?'#leaf .download':'#moa .download').click();const download=await downloadEvent;if(await download.failure())throw Error('Download');
 await page.screenshot({path:'.artifacts/motion-series-desktop.png'});
 await page.setViewportSize({width:390,height:950});await page.goto(base+'index.html');await page.screenshot({path:'.artifacts/motion-series-mobile.png'});
 const records=await Promise.all(manifest.cards.filter(c=>c.id!=='lumi').flatMap(c=>['outbound','return'].map(async phase=>JSON.parse(await readFile(`${root}/records/${c.id}-${phase}.json`,'utf8')))));
 if(records.length!==(revision?10:30)||records.some(r=>r.status!=='completed'||r.requests!==1))throw Error('Generation record audit');
 await writeFile(`${root}/review/browser.json`,JSON.stringify({cards:results,download:'passed',oneActiveVideo:'passed',requests:records.length,retries:0,previousVersionComparison:revision?'passed':'not-run'},null,2));
}finally{await browser.close();}
