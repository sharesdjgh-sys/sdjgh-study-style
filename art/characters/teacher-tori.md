# 토리 선생님

히어로의 ‘토리 선생님’ 안내 문구 왼쪽에서 공부캐 찾기를 안내하는 작은 곰 선생님. 데스크톱 112px, 모바일 76px 크기로 표시합니다. 기존 8초 초대 영상의 단색 배경을 로컬에서 제거해 192px·16fps 투명 Animated WebP로 무한 반복합니다. 별도 배경이나 재생·멈춤 버튼은 없습니다. 동작 줄이기 설정에서는 picture의 정적 포스터를 사용합니다. 기존 랜덤 실루엣 카드는 유지합니다. 16가지 결과 캐릭터와 별도의 안내자이며, 유형이나 도감 수집 대상에 포함하지 않습니다.

- 안내 문구 옆 애니메이션: `public/characters/motion/teacher-tori-guide-transparent.webp`
- 포스터: `public/characters/motion/teacher-tori-guide-transparent-poster.webp`
- 투명화 재현: `python scripts/prepare-teacher-guide.py` (FFmpeg, OpenCV, Pillow, NumPy 필요). 모서리와 연결된 단색 배경을 제거하고 가장자리를 부드럽게 처리합니다. 기존 256px MP4는 가공용으로 보관합니다.
- 기존 `teacher-tori-part-2-8s-v1.mp4`에서 FFmpeg로 256×256, H.264 CRF 23, 오디오 제거, faststart 변환. 추가 생성 API 호출 없음.

- 제작: 2026-10-02, 내장 ImageGen, 투명 배경
- 서비스 이미지: `public/characters/teacher-tori.webp` (768 × 768, 알파 보존)
- 최종 프롬프트: [teacher-tori.prompt.txt](teacher-tori.prompt.txt)
- 후처리: Sharp 크기 조절과 WebP 변환(quality 88)만 적용
- 첫 결과를 보유한 방문자는 기존 내 캐릭터 카드를 봅니다.
