import {mkdir,readFile,writeFile,copyFile,readdir} from 'node:fs/promises';

const root='ref/goods-motion-series';
try {
 if((await readdir(`${root}/records`)).length)throw Error('Video production has started. Do not overwrite generated assets with the planning preview; use build-motion-series-preview.mjs.');
}catch(error){if(error.code!=='ENOENT')throw error;}
const original=JSON.parse(await readFile('docs/goods-motion-cards-plan.json','utf8'));
// Forward-moving return choreography: no reversed footage or frozen portraits.
const treatments=[
 ['moa','모아','종이 정원문을 열어 발견하기','문고리를 가볍게 짚고 종이문을 펼친 뒤, 눈을 뜬 채 몸을 기울여 안의 작은 정원을 살핀다.','문에서 고개를 빼고 앞발로 종이문을 천천히 접은 뒤 원래 자세로 돌아온다.','모아의 두 눈을 뜬 표정 유지. 문 안쪽이 시선 목표이며 문은 책에 붙어 있다.'],
 ['root','루트','두 길의 합류를 안내하기','지도 위 두 길을 가리키고 합류 지점을 짚는다. 해당 숲길의 표지등이 차례로 켜지자 고개를 돌려 동료에게 보여 준다.','지도 쪽으로 돌아보며 손을 제자리로 가져온다. 안내등이 순서대로 잦아들어 원래 밝기로 돌아온다.','지도·배경 표지등 대응. 손가락·뿔 형태 유지. 동료는 배경에서 작게 반응한다.'],
 ['pico','피코','색 천을 겹쳐 새로운 무늬 만들기','레일에 걸린 반투명 천 한 장을 앞발로 옆으로 밀어 겹친다. 몸을 옆으로 기울여 새 색 그림자를 감상한다.','천을 레일을 따라 원래 위치로 돌려 놓는다. 그림자가 원래 색으로 분리되며 몸과 시선도 돌아온다.','카멜레온 몸색은 고정. 천 두 장과 레일 유지. 천을 만지는 앞발은 하나.'],
 ['sori','소리','세 그림의 이야기를 차례로 깨우기','그림책 세 칸을 앞발로 차례대로 따라가며 고개를 끄덕인다. 그림들이 순서대로 색과 빛을 되찾고 작은 나무가 흔들린다.','마지막 그림을 감상한 뒤 앞발과 시선을 첫 칸으로 돌린다. 책 속 빛은 차례로 원래의 잔잔한 색으로 돌아온다.','사막여우의 큰 귀 유지. 새 문자 생성과 과장된 입동작 금지. 책을 따라 시선 이동.'],
 ['melo','멜로','코코아의 질문이 고래가 되는 순간','귀를 쫑긋하고 고개를 갸웃한다. 김이 물음표에서 작은 고래로 변하면 고개와 눈이 잔 위 고래를 따라 움직인다.','고래가 보통 김으로 풀리는 것을 바라본 뒤 고개를 자연스럽게 제자리로 돌린다.','앞발 두 개와 잔은 고정. 고래는 얼굴 옆 잔 위에만 머문다. 시선은 고래 높이에 일치.'],
 ['talk','토크','말할 차례를 건네고 귀 기울이기','자기 마이크 표시등을 전환하고 상체와 고개를 게스트에게 돌린다. 게스트의 반응을 보며 작게 고개를 끄덕인다.','게스트의 답이 끝나면 자기 쪽 표시등을 다시 켜고 진행 자세로 돌아온다.','마이크 두 개와 출연자 두 명의 위치 고정. 음성이나 글자 없이 차례가 보이게 한다.'],
 ['leaf','리프','궁금한 씨앗 바람개비를 살펴보기','몸을 앞으로 기울이며 고개를 갸웃한다. 작은 손잡이를 돌리는 상인 앞에서 씨앗 날개가 펴지고 돌아가면 볏을 세우며 반응한다.','상인이 손잡이를 놓자 회전이 잦아들고 기구의 접이식 날개가 닫힌다. 리프는 몸과 볏을 원래 자세로 돌린다.','왕관앵무 날개를 사람 손으로 바꾸지 않는다. 기구의 회전축과 부품 수 고정.'],
 ['tori','토리','톱니를 맞추고 작동을 확인하기','작은 톱니를 홈에 끼우고 손을 떼어 작동을 지켜본다. 톱니들이 맞물려 돌아가며 달 장식이 올라온다.','작동이 멎고 달 장식이 내려오면 시험용 톱니를 같은 앞발로 조심히 꺼내 처음의 점검 자세로 돌아온다.','비버 토리 유지. 톱니가 완전히 멈춘 다음 잡는다. 톱니 수·축·앞발 형태 유지.'],
 ['mong','몽','레버 하나로 화분 띄워 보기','앞발로 레버를 전환하고 화분이 낮게 떠오르자 몸을 가까이 기울여 아래를 살펴본다. 호기심 어린 눈으로 잎을 바라본다.','레버를 원위치로 돌리고 화분이 받침에 내려앉는 것을 지켜본 뒤 앞발과 시선을 돌린다.','화분 하나와 잎 모양 유지. 화분은 얼굴 아래. 고글을 만지는 추가 손동작 금지.'],
 ['block','블록','함께 작은 다리를 시험하기','블록이 왼쪽 지지대를 받치는 동안 토리가 연결판을 끼운다. 블록이 구슬 하나를 굴리면 다리를 건너 반대쪽 받침에 멈춘다.','토리가 구슬을 집어 원래 출발 홈에 놓는다. 구슬이 멈춘 뒤 연결판을 다시 들고 둘이 점검 시작 자세로 돌아온다.','두 캐릭터 네 앞발의 담당 동작 분리. 구슬과 연결판을 동시에 잡지 않는다. 한 개의 구슬 유지.'],
 ['joy','조이','친구와 구름 반죽 모양 바꾸기','몽이 작은 귀 모양 반죽 두 개를 둥근 반죽에 붙인다. 조이가 접시를 살짝 돌려 토끼 모양을 보고 함께 웃는다.','조이가 반죽을 부드럽게 눌러 둥글게 정리하고 몽이 귀 조각을 원래 접시 가장자리로 떼어 놓는다. 접시와 손이 돌아온다.','수달 조이·라쿤 몽 구분. 반죽은 손으로 바뀌며 순간 변형하지 않는다. 손 겹침 금지.'],
 ['pace','페이스','한 칸을 밟고 숨 고르기','짧은 다리로 바로 앞 돌 한 칸에 발을 올리고 체중을 옮긴다. 돌이 따뜻하게 빛나자 가슴을 펴고 만족스럽게 숨을 고른다.','고개를 돌려 출발 돌을 확인하고 작게 몸을 돌려 한 걸음 돌아온다. 조명이 원래 밝기로 잦아들고 처음 방향을 향한다.','펭귄 다리·지느러미 유지. 이동은 가까운 두 돌 사이만. 뒤로 재생하는 걷기 금지.'],
 ['bani','바니','바람 따라 꽃 곁에 다녀오기','리본이 흔들리는 쪽으로 귀와 고개를 돌린 뒤 가까운 꽃 쪽으로 작게 한 번 뛴다. 꽃을 내려다보며 바람을 느낀다.','꽃에서 고개를 들고 몸을 돌려 출발 지점으로 작게 뛰어 돌아온다. 두 귀와 리본이 편안히 가라앉는다.','두 귀·착지 위치 유지. 화면 밖 이동과 큰 점프 금지. 두 번의 착지 확인.'],
 ['luka','루카','친구에게 자리를 내어 주기','루카가 쉼터 문 옆에서 가까이 선 페이스에게 몸을 돌리고 옆으로 한 걸음 비켜 길을 안내한다. 둘이 눈을 맞추고 미소 짓는다.','페이스는 입구의 제자리에서 고개로 화답한다. 루카가 다시 원래 위치로 돌아서며 안내한 앞발을 내린다.','허스키 루카와 펭귄 페이스 두 명만. 동료를 도착시킨 뒤 순간 되돌리는 연출 금지.'],
 ['skip','스킵','작은 두 박자로 다시 시작하기','발로 두 박자를 밟고 몸을 좌우로 흔든다. 가까운 동료 두 명이 각자 한 번 호응하고 낮은 축제등이 차례로 빛난다.','작은 옆걸음으로 원래 발 위치에 돌아와 앞발을 내리고 숨을 고른다. 동료와 불빛도 처음의 편안한 상태로 돌아온다.','스킵의 원래 종·체형 유지. 군무나 카메라 이동 없이 주인공의 분명한 리듬을 살린다.'],
];
for(const dir of ['posters','prompts'])await mkdir(`${root}/${dir}`,{recursive:true});
const cards=[];
for(const [id,name,focus,outbound,returnAction,qa] of treatments){
 const source=original.cards.find(c=>c.name===name);
 if(!source)throw Error(`Missing plan: ${name}`);
 await copyFile(`art/goods/${source.reference}.webp`,`${root}/posters/${id}-start.webp`);
 const card={id,name,code:source.code,title:source.title,focus,reference:`art/goods/${source.reference}.webp`,status:'awaiting-video-authorization',duration:15,segments:[{id:'outbound',seconds:8,action:outbound},{id:'return',seconds:7,action:returnAction}],qa,sourceScene:source.scene};
 cards.push(card);
 await writeFile(`${root}/prompts/${id}.json`,JSON.stringify(card,null,2));
}
const plan={status:'prepared-not-generated',approvedLumi:'ref/goods-motion-lumi-15s-gaze-v2/videos/lumi.mp4',count:15,videoRequests:30,delivery:'Google Gemini API',format:{seconds:15,segments:[8,7],width:720,height:1080,silent:true},referencePolicy:'Shown images are previously approved static goods artwork, not newly generated videos or final keyframes. Create and review matching start and midpoint keyframes before video generation.',qualityGate:["캐릭터 고유의 행동을 보여 준다.","시선을 대상의 높이와 위치에 맞춘다.","손·발·귀·소품의 수와 형태를 유지한다.","0.25초 간격으로 형태와 시선을 검토한다.","중간과 끝의 연결을 정상 속도로 세 번 확인한다."],retryPolicy:'No automatic paid retries; track every attempted request. Preserve accepted Lumi.',cards};
await writeFile('docs/goods-motion-series-production.json',JSON.stringify(plan,null,2));
await writeFile(`${root}/manifest.json`,JSON.stringify(plan,null,2));
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
await writeFile(`${root}/index.html`,`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>스페셜 카드 · 나머지 15종</title><style>*{box-sizing:border-box}body{margin:0;background:#f5f0e5;color:#35453d;font:15px/1.8 system-ui,sans-serif}main{max-width:1200px;margin:auto;padding:36px 20px}h1{line-height:1.35;font-size:clamp(27px,4vw,40px);letter-spacing:-.04em}mark{background:linear-gradient(transparent 60%,#ead68c 60%);color:inherit}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}article{background:#fffdf7;border:1px solid #ded1bd;border-radius:20px;padding:18px;margin:16px 0}img{width:100%;aspect-ratio:2/3;object-fit:contain;border-radius:12px}h2{margin-bottom:5px;font-size:23px}.tag,small{font-size:12px;color:#85735e}.beat{padding:10px 12px;background:#f4efdf;border-radius:10px}a{color:#785687}.notice{padding:16px;background:#eae1f0;border-radius:12px}summary{cursor:pointer;font-weight:700}</style><main><p>STUDYCREW · SPECIAL MOTION SERIES</p><h1>각자의 성격이 살아 있는<br><mark>나머지 열다섯 순간</mark></h1><p><a href="/gaze15/index.html">승인된 루미 영상 보기 →</a></p><p class="notice">영상 제작 대기 · 아래 이미지는 기존 승인된 굿즈 참고 원화입니다. 새 영상이 아닙니다.<br>15종 × 8초 동작 + 7초 복귀 = 추가 영상 생성 30회. 루미의 시선·소품·연결 검토 기준을 공통 적용합니다.</p><div class="grid">${cards.map(c=>`<article id="${c.id}"><img src="posters/${c.id}-start.webp" alt="${c.name} 참고 원화" loading="lazy"><span class="tag">${c.name} · 15초 · 영상 제작 대기</span><h2>${esc(c.focus)}</h2><p>${esc(c.title)}</p><p class="beat"><b>앞 8초</b><br>${esc(c.segments[0].action)}</p><p class="beat"><b>뒤 7초</b><br>${esc(c.segments[1].action)}</p><details><summary>캐릭터별 검토 기준</summary><p>${esc(c.qa)}</p></details></article>`).join('')}</div></main></html>`);
console.log(JSON.stringify({cards:cards.length,paidRequests:0,preparedVideoRequests:30}));
