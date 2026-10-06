Generated using the built-in image_gen tool. Prompts and source image paths are recorded in generated-assets.json. Final web assets are in public/skills. Original character art remains unchanged.

The three `unlock-{1,2,3}.mp4` clips animate those existing heart and lock images locally; they are not generated video-model outputs. Run `node scripts/render-skill-unlock-videos.mjs` to reproduce the silent 640×640, 30 fps, 6-second H.264 clips and posters. Hearts fill the corresponding sockets before the shackle opens. Timing and output metadata are recorded in `unlock-videos.json`.

Run `node scripts/build-skill-preview.mjs` to embed the original study-method icons, skill illustrations, and all three videos in `ref/skillbook-preview.html`. The standalone preview follows the app's confirmation → video → card flow without accessing an account.
