"""Local video matting: remove only the border-connected flat backdrop."""
import json
import subprocess
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

source = Path('public/characters/motion/teacher-tori-guide-8s-v1.mp4')
output = Path('public/characters/motion')
work = Path('.artifacts/teacher-guide-alpha')
work.mkdir(parents=True, exist_ok=True)
raw = subprocess.check_output([
    'ffmpeg', '-v', 'error', '-i', str(source), '-vf', 'fps=24,scale=256:256',
    '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'
], creationflags=subprocess.CREATE_NO_WINDOW)
frames = np.frombuffer(raw, dtype=np.uint8).reshape(-1, 256, 256, 3)
images = []
for rgb in frames:
    border = np.concatenate((rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]))
    background = np.median(border, axis=0)
    distance = np.linalg.norm(rgb.astype(np.float32) - background, axis=2)
    candidate = (distance < 12).astype(np.uint8)
    _, labels = cv2.connectedComponents(candidate, connectivity=8)
    edge_labels = np.unique(np.concatenate((labels[0], labels[-1], labels[:, 0], labels[:, -1])))
    edge_labels = edge_labels[edge_labels != 0]
    backdrop = np.isin(labels, edge_labels)
    alpha = cv2.GaussianBlur((~backdrop).astype(np.float32), (3, 3), 0.5)
    # Undo some backdrop contamination on antialiased edge pixels.
    clean = (rgb.astype(np.float32) - background * (1 - alpha[..., None])) / np.maximum(alpha[..., None], 0.01)
    rgba = np.dstack((np.clip(clean, 0, 255).astype(np.uint8), np.round(alpha * 255).astype(np.uint8)))
    images.append(Image.fromarray(rgba))
encoded = [images[round(i * 24 / 16)].resize((192, 192), Image.Resampling.LANCZOS) for i in range(128)]
durations = [round((i + 1) * 1000 / 16) - round(i * 1000 / 16) for i in range(len(encoded))]
encoded[0].save(output / 'teacher-tori-guide-transparent.webp', save_all=True, append_images=encoded[1:],
    duration=durations, loop=0, quality=80, method=3, minimize_size=False, kmin=8, kmax=16)
images[0].save(output / 'teacher-tori-guide-transparent-poster.webp', quality=92)
sheet = Image.new('RGB', (256 * 4, 256 * 2), '#f8f8ef')
for i in range(8):
    sheet.paste(images[i * 24], ((i % 4) * 256, (i // 4) * 256), images[i * 24])
sheet.save(work / 'contact.png')
with Image.open(output / 'teacher-tori-guide-transparent.webp') as animation:
    stored_frames = animation.n_frames
report = {'source': str(source), 'inputFrames': len(encoded), 'frames': stored_frames, 'width': 192, 'height': 192, 'durationMs': sum(durations),
    'loop': 0, 'alpha': True, 'bytes': (output / 'teacher-tori-guide-transparent.webp').stat().st_size,
    'processing': 'Border-connected flat background removal, antialiased alpha; local processing, no generation API.'}
Path('art/characters/motion/teacher/transparent-guide.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report))
