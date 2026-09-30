# 공부결 — 나다운 공부의 시작

`plan.md`를 바탕으로 만든 고등학생용 공부 스타일 웹앱입니다. Next.js App Router, React, TypeScript, Vercel, Neon PostgreSQL을 사용합니다. 로그인 없이 검사·결과·공부법 활동을 이용할 수 있습니다.

## 실행

Node.js 24 LTS를 권장합니다. Windows PowerShell에서 npm 실행 정책 오류가 나면 `npm` 대신 `npm.cmd`를 사용하세요.

```powershell
npm.cmd ci
npm.cmd run dev
```

http://127.0.0.1:3000 에서 확인합니다. DB와 카카오 키가 없어도 검사·저장·결과·공부법·링크 복사가 동작합니다. 이때 이용 통계는 저장하지 않으며 카카오 공유는 링크 복사를 안내합니다.

## 구현한 기능

- 16문항, 문항별 이전/다음, 미응답 확인, 24시간 이어하기
- 16유형 계산, 근소한 점수 차이 표시, 동점 시 대표 활동 직접 선택
- 완료 후 4.4초 응답 분석 연출: 16개 유형 → 공부 방식 4개 → 집중 환경 2개 → 최종 유형 1개, 자동 결과 공개
- 질문 방향별 전환 모션, 유형 카드 등장, 모션 감소 설정 지원
- 유형별 공부 장면 공감 버튼, 공부 습관·막히는 지점·시험 전날 팁·유형 선정 이유
- 개인 결과와 공개 유형 소개 분리, 스타일 도감 필터
- 과제별 공부법 예시, 활동 선택·시작·시도 후 평가, 7일 기기 저장
- 링크 복사와 수동 복사 대안, 카카오톡 공유 연동
- 한국어 Open Graph 이미지, QR PNG 내려받기
- 학교 활용·학습 근거·저장 안내, 기기 기록 삭제 확인 팝업
- Neon 최소 통계 API, 중복 제거, 원본 보관 기간 종료 후 집계·삭제
- 자체 호스팅 Pretendard, Solar SVG 아이콘, 모바일·키보드·모션 감소 지원

## Vercel + Neon 연결

완료 화면은 기존 점수 계산을 시각화한 연출입니다. 외부 AI API를 호출하거나 생성형 AI가 답변을 분석하지 않습니다. 유형별 설명은 `src/lib/type-stories.ts`에서 관리하며, 개인 결과에서는 실제 응답 합계와 동점 선택 여부를 함께 표시합니다. 공감 버튼은 해당 화면에서만 유지되고 검사 점수에 영향을 주지 않습니다.

1. `.env.example`을 `.env.local`로 복사하고 Neon의 연결 문자열을 `DATABASE_URL`에 입력합니다. 비밀 값은 Git에 올리지 마세요.
2. `npm.cmd run db:migrate`를 실행합니다. `db/001_analytics.sql`의 테이블과 `db/002_retention.sql`의 집계 함수를 생성합니다. Neon SQL Editor에서 두 파일을 순서대로 실행해도 됩니다.
3. Vercel에 저장소를 연결하고 프레임워크는 Next.js, Node 버전은 24를 선택합니다.
4. Vercel 환경변수에 `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`(운영 HTTPS 주소), `CRON_SECRET`(무작위 긴 문자열), `NEXT_PUBLIC_CONTACT_EMAIL`(공개 문의 주소)을 설정합니다.
5. 카카오 공유를 사용하려면 `NEXT_PUBLIC_KAKAO_JS_KEY`를 추가하고 카카오 Developers에서 JavaScript SDK 도메인과 제품 링크 도메인에 운영 주소를 등록합니다. 개발/미리보기 도메인을 사용할 때도 해당 설정을 확인합니다.
6. 환경변수 설정 후 배포합니다. 공개 변수는 빌드 시 적용되므로 바꾸면 재배포하세요.
7. 운영 도메인에서 QR과 공유 미리보기를 확인한 뒤 포스터에 사용합니다. 이미지 URL은 카카오 서버에서 로그인 없이 접근할 수 있어야 합니다.

`vercel.json`은 매일 UTC 18시(한국 시각 다음 날 03시)에 보관 기간 정리를 실행합니다. 요청에는 Vercel이 `CRON_SECRET`을 Bearer 토큰으로 전달합니다. 만료된 검사와 이벤트는 하나의 트랜잭션에서 익명 집계로 전환되고 삭제됩니다. 일일 실행으로 삭제까지 최대 약 하루가 더 걸릴 수 있습니다. 다른 호스팅을 사용하면 동일 엔드포인트를 인증해서 매일 호출하도록 예약하세요.

공개 전에는 운영 연락처·호스팅 로그 보관·서비스 제공 지역과 실제 처리 방침을 확인해야 합니다. API의 메모리 요청 제한은 프로세스 단위 보호입니다. 외부 공개 시 Vercel Firewall 등에서 전체 트래픽 한도와 비용 알림을 설정하세요. 실제 외부 계정 생성·Neon 연결·Vercel 배포는 로컬 구현과 별도입니다.

## 이용 통계

`POST /api/events`는 허용 목록에 있는 이벤트만 받습니다. 이름·학교·학년·문항 응답·점수·결과 유형·IP를 앱 통계 테이블에 저장하지 않습니다. 임시 검사 ID는 중복 제거와 7일 내 후속 평가 연결에 사용하며, 다음 검사에 재사용하지 않습니다. 별도의 영구 사용자 식별자는 없습니다.

- `start`, `question`(번호 1~16), `complete`
- `share`(copy/kakao), `mission_select`, `mission_start`
- `feedback`(helpful/mixed/not-yet): 같은 검사의 마지막 평가로 갱신

완료 이후의 공유·활동 이벤트만 기록합니다. DB가 없으면 204로 무시합니다. 통계 실패는 UI를 차단하지 않으며, 후속 행동에서 시작·완료 이벤트를 재시도할 수 있습니다. 영구 전송 큐는 두지 않으므로 네트워크 장애나 차단에 따른 누락이 가능합니다.

`db/report.sql`을 Neon SQL Editor에서 실행해 확인합니다. `study_daily`는 시작일 기준 7일 관찰이 끝난 코호트 집계입니다. `share_any`는 채널 중복을 제거한 공유 시도 검사 건수이고, `last_question`은 미완료 검사의 마지막 도달 문항입니다. `helpful`과 `mixed`를 더하면 실제 시도했다고 응답한 건수입니다. 비교할 분모는 같은 기간·버전·유입 조건의 시작 또는 완료 건수입니다.

완료 300건은 고유 학생 300명과 다릅니다. 공유 클릭은 실제 전송 완료를 뜻하지 않습니다. ‘해봤어요’ 응답이 없다는 이유로 미시도로 단정하지 않습니다. 원본은 약 7~8일, 일별 집계는 90일 기준으로 관리합니다. 호스팅 제공자의 접속 로그는 별도 정책을 따릅니다.

## 16명 캐릭터와 앞·뒷면 카드

ImageGen으로 제작한 투명 배경 캐릭터 16장을 `public/characters/`에 저장했습니다. 홈과 도감에서는 미공개 캐릭터를 번호·실루엣으로만 보여줍니다. 검사를 완료하면 이 기기에 저장된 자신의 캐릭터 한 명만 공개되고, 카드를 누르면 소개가 있는 뒷면으로 뒤집힙니다. 터치·키보드와 동작 줄이기 설정을 지원하고, 숨긴 면은 포커스 대상에서 제외합니다. 분석 중에는 마지막에 선택된 캐릭터만 공개합니다.

`/types/[typeCode]`는 자신의 저장 결과와 일치할 때만 상세 내용을 보여주며, 나머지는 실루엣 안내입니다. `/share/[typeCode]`는 친구가 공유한 캐릭터 한 명의 카드만 보여주고 방문자의 결과나 도감을 변경하지 않습니다. 기존 `?from=share` 유형 링크는 새 공유 페이지로 연결됩니다. 유형 페이지의 메타데이터는 정체를 드러내지 않고, 공유 페이지는 해당 캐릭터의 OG 이미지를 사용하며 검색 색인을 제외합니다. 이는 스포일러를 줄이는 화면 설계이며, 공개 이미지 파일이나 유형 데이터를 인증으로 보호하는 기능은 아닙니다. 기기 기록 삭제·만료 시 도감은 다시 실루엣으로 표시됩니다.

이름·소개·공부 취향은 `src/lib/characters.ts`, 카드 UI는 `src/components/character-card.tsx`에 있습니다. 분석 과정과 공유 미리보기에도 해당 캐릭터가 표시됩니다. 도구와 원본 위치, 개별 프롬프트는 [캐릭터 제작 기록](art/characters/README.md)에 정리했습니다. 기존 코드 기반 학습 도구 그림은 공부법 안내 화면에서 계속 사용합니다.

문항과 활동은 `src/lib/content.ts`, 계산은 `src/lib/scoring.ts`, 저장 검증은 `src/lib/storage.ts`로 나뉩니다. 문항 의미나 채점 규칙을 바꾸면 `VERSION`을 올려 이전 응답을 다른 문항으로 해석하지 않도록 합니다.

## 디자인 기준

[Supanova taste-skill](https://github.com/uxjoseph/supanova-design-skill/blob/main/taste-skill/SKILL.md)과 [soft-skill](https://github.com/uxjoseph/supanova-design-skill/blob/main/soft-skill/SKILL.md)의 한국어 타이포그래피, 비대칭 구성, 카드의 깊이, 반응형 원칙을 적용했습니다. 사용자의 웹앱 요구에 맞춰 단일 HTML 출력 규칙은 Next.js 컴포넌트로 대체했습니다. 실제 자료가 없는 후기·사용자 수·긴급성 문구는 만들지 않았습니다.

크림색 종이·코랄 포인트·잉크색 글자·학습 카드의 시각 언어를 사용합니다. 아이콘은 Solar, 글꼴은 Pretendard를 자체 호스팅합니다. 글꼴 라이선스는 `public/fonts/LICENSE.txt`에 포함했습니다. Solar 아이콘은 CC BY 4.0 라이선스이며 [Solar Icons](https://github.com/480-Design/Solar-Icon-Set)에서 제공됩니다. `node scripts/assets.mjs`로 npm 패키지의 선별 아이콘과 글꼴 파일을 다시 준비할 수 있습니다.

## 검증

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

브라우저 테스트는 서버를 실행한 상태에서 진행합니다.

```powershell
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

이미 설치한 Chrome을 사용할 경우 PowerShell에서 `$env:PLAYWRIGHT_CHANNEL='chrome'`을 설정해 테스트할 수 있습니다. `PLAYWRIGHT_BASE_URL`로 테스트 대상 주소를 바꿀 수 있습니다. 모바일 프로젝트는 iPhone 화면·터치 환경을 Chromium에서 에뮬레이션하므로 실제 iOS Safari 및 카카오 인앱 브라우저 확인은 별도로 필요합니다.

단위 테스트는 채점·기기 저장 검증·통계 입력을 검사합니다. PGlite의 PostgreSQL로 실제 스키마와 집계 함수를 실행해 중복 제거, 원본 삭제, 재실행 안전성과 미완료 문항 집계를 검증합니다. 이것은 실제 Neon 계정 연결 시험을 대체하지 않습니다.

교육 콘텐츠는 자체 제작 초안입니다. 학교 공개 전 학생·교사 파일럿으로 문항 이해도와 활동 실행 가능성을 검토하세요.
