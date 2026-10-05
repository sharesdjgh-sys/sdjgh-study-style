# StudyCrew 카드팩

- `public/ui-icons/card-pack-v1.webp`: 내장 image_gen으로 제작한 종이 카드팩. 원본 참조는 공부캐 메로이며, 정확한 이미지 프롬프트는 `card-pack-image.prompt.txt`에 보관한다.
- `public/rewards/card-pack-opening-v1.mp4`: 외부 영상 API를 사용하지 않고 Canvas와 FFmpeg로 로컬 렌더링한 3.6초, 720×960, H.264 무음 영상.
- `public/rewards/card-pack-poster-v1.webp`: 영상의 첫 프레임.
- 재생성: `node scripts/render-card-pack-video.mjs` (Chrome, FFmpeg 필요).
- 오프라인 HTML 미리보기: `node scripts/build-gift-preview.mjs` → `ref/StudyCrew-gift-preview.html`. 영상과 이미지가 내장되어 로그인·인터넷 연결 없이 열 수 있다.

연출: 밀봉 카드팩 → 포장 윗부분 분리 → 카드 뒷면 등장 → 포장이 내려가고 카드만 남음. 영상 종료 후 앱에서 실루엣 셔플과 최종 카드 공개를 이어서 실행한다. 프리즘·레어 등급은 없다.

보상은 개봉 연출 전에 서버에서 확정되며, 영상·셔플은 지급 결과를 바꾸지 않는다. 영상 오류·재생 차단·8초 이상 대기는 셔플로 넘어간다. 연출 건너뛰기는 확정 카드를 바로 보여준다. 모션 줄이기 설정에서는 영상을 재생하지 않는다.
