"""Add a tracked, practical clock indicator to Tori's existing 15-second action."""
from pathlib import Path
import json
import subprocess
import cv2
import numpy as np

ROOT = Path('ref/goods-motion-tori-result')
SOURCE = Path('ref/goods-motion-active-five/videos/tori.mp4')
for folder in ('videos', 'review', 'posters'):
    (ROOT / folder).mkdir(parents=True, exist_ok=True)
cap = cv2.VideoCapture(str(SOURCE))
fps = cap.get(cv2.CAP_PROP_FPS)
width, height = int(cap.get(3)), int(cap.get(4))
cap.set(cv2.CAP_PROP_POS_MSEC, 6500)
ok, reference = cap.read()
assert ok
# Track the existing engraved star on the clock front; do not add a floating object.
cx, cy = 493, 839
half = 22
template = cv2.cvtColor(reference[cy-half:cy+half+1, cx-half:cx+half+1], cv2.COLOR_BGR2GRAY)
cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
proc = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{width}x{height}', '-r', str(fps), '-i', '-', '-an', '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(ROOT/'videos/tori.mp4')], stdin=subprocess.PIPE, creationflags=subprocess.CREATE_NO_WINDOW)
yy, xx = np.mgrid[:height, :width].astype(np.float32)
tracking = []
frame_index = 0

def smooth(value):
    value = np.clip(value, 0, 1)
    return value * value * (3 - 2 * value)

try:
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        t = frame_index / fps
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        search_x, search_y = cx-half-25, cy-half-22
        search = gray[search_y:cy+half+23, search_x:cx+half+26]
        response = cv2.matchTemplate(search, template, cv2.TM_CCOEFF_NORMED)
        _, confidence, _, point = cv2.minMaxLoc(response)
        x, y = search_x+point[0]+half, search_y+point[1]+half
        if confidence < .65:
            raise RuntimeError(f'Star tracking uncertain at {t:.3f}s: {confidence:.3f}')
        tracking.append({'time':round(t,3),'x':x,'y':y,'confidence':round(confidence,4)})
        # Work completes at ~6s; a short ignition grows into a steady visible result.
        power = float(smooth((t-5.65)/.85) * (1-smooth((t-12.5)/1.55)))
        if power > 0:
            glow = np.zeros((height,width), np.float32)
            core = np.zeros_like(glow)
            hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
            gold = ((hsv[:,:,0]>10)&(hsv[:,:,0]<42)&(hsv[:,:,1]>55)&(hsv[:,:,2]>115)).astype(np.float32)
            for dx, dy, scale, delay in [(0,0,1,0),(-91,-6,.48,.35),(74,-6,.48,.65)]:
                sx, sy = x+dx, y+dy
                local = power * float(smooth((t-5.65-delay)/.85)) * scale
                radius = 17 if dx==0 else 11
                mask = (((xx-sx)**2+(yy-sy)**2)<radius**2).astype(np.float32)*gold
                # Existing metal engraving becomes emissive, with soft reflected light.
                core += cv2.GaussianBlur(mask,(0,0),.65)*local
                glow += np.exp(-(((xx-sx)/34)**2+((yy-sy)/24)**2)/2)*local*.52
                glow += np.exp(-(((xx-sx)/65)**2+((yy-sy)/39)**2)/2)*local*.16
            bgr = frame.astype(np.float32)/255
            light = np.clip(core[:,:,None]*np.array([.48,.91,1.0],np.float32)+glow[:,:,None]*np.array([.09,.48,1.0],np.float32),0,1)
            result = np.clip((1-(1-bgr)*(1-light))*255,0,255).astype(np.uint8)
        else:
            result = frame
        proc.stdin.write(result.tobytes())
        if frame_index in (0,144,192,240,312,358):
            cv2.imwrite(str(ROOT/'review'/f'tori-result-{frame_index:03}.png'),result)
        frame_index += 1
finally:
    cap.release()
    proc.stdin.close()
    code = proc.wait()
if code:
    raise RuntimeError(f'ffmpeg failed: {code}')
record={'source':str(SOURCE),'output':str(ROOT/'videos/tori.mp4'),'method':'Tracked local emission and reflected-light compositing on existing clock star engraving; original character animation preserved','frames':frame_index,'fps':fps,'duration':frame_index/fps,'minimumTrackingConfidence':min(p['confidence'] for p in tracking),'lightOnset':5.65,'steadyResult':[6.5,12.5],'fadeComplete':14.05,'additionalPaidRequests':0,'tracking':tracking}
(ROOT/'review'/'render.json').write_text(json.dumps(record,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in record.items() if k!='tracking'},ensure_ascii=False))
