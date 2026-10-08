document.querySelectorAll('.card').forEach(card => {
  const video = card.querySelector('video');
  if (!video) return;
  const status = card.querySelector('.status');
  const loop = card.querySelector('.loop');
  let previous = 0;
  let count = 0;
  let manualSeek = false;
  const revisedSource = video.getAttribute('src');
  const revisedPoster = video.getAttribute('poster');
  let comparing = false;
  const ready = () => {
    if (video.readyState >= 1) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        video.removeEventListener('loadedmetadata', loaded);
        video.removeEventListener('error', failed);
      };
      const loaded = () => { cleanup(); resolve(); };
      const failed = () => { cleanup(); reject(new Error('Video load failed')); };
      video.addEventListener('loadedmetadata', loaded);
      video.addEventListener('error', failed);
      video.load();
    });
  };
  card.querySelectorAll('[data-action]').forEach(button => {
    button.onclick = async () => {
      try {
        const action = button.dataset.action;
        if (action === 'compare') {
          video.pause();
          comparing = !comparing;
          video.src = comparing ? button.dataset.original : revisedSource;
          video.poster = comparing ? button.dataset.poster : revisedPoster;
          button.textContent = comparing ? '수정 영상으로 돌아가기' : '이전 영상 비교';
          count = 0;
          previous = 0;
          card.dataset.loops = '0';
          video.load();
        }
        await ready();
        if (action === 'boundary') video.loop = loop.checked = true;
        const time = action === 'boundary' ? video.duration - 2 : action === 'join' ? Number(card.dataset.join) - 2 : 0;
        manualSeek = true;
        previous = time;
        video.currentTime = time;
        await video.play();
        manualSeek = false;
      } catch {
        manualSeek = false;
        status.textContent = '영상 재생에 실패했습니다. 새로고침 후 다시 시도해 주세요.';
      }
    };
  });
  video.addEventListener('play', () => {
    document.querySelectorAll('video').forEach(other => {
      if (other !== video) other.pause();
    });
  });
  loop.onchange = () => { video.loop = loop.checked; };
  card.querySelector('select').onchange = event => {
    video.playbackRate = Number(event.target.value);
  };
  video.addEventListener('timeupdate', () => {
    if (!manualSeek && video.loop && previous > video.duration - 1 && video.currentTime < 1) count++;
    previous = video.currentTime;
    status.textContent = (comparing ? '이전 영상 · ' : '') + video.currentTime.toFixed(1) + ' / ' + video.duration.toFixed(1) + '초 · 반복 연결 ' + count + '회';
    card.dataset.loops = String(count);
  });
  const note = card.querySelector('textarea');
  const key = 'motion-series-review-' + card.id;
  try { note.value = localStorage.getItem(key) || ''; } catch {}
  note.oninput = () => {
    try { localStorage.setItem(key, note.value); } catch {}
  };
});
