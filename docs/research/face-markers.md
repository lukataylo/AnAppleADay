# Face markers on-device — research (2026)

## Bottom line
Geometry (landmarks, blink, head pose, blendshapes) is real, real-time, and defensible. The emotion label is scientifically contested and must be framed as a heuristic, never a measurement or diagnosis. Some non-emotion markers (rPPG heart rate, blink-based fatigue, facial asymmetry) are more credible than emotion classification.

## Models
- MediaPipe Face Landmarker. 478 landmarks plus 52 blendshapes plus transform matrix. Bundle ~3.7 MB float16. Runs WASM and WebGL in browser, real-time ~30 FPS. No emotion label. https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker
- face-api.js. 7 expressions, 68 landmarks; tiny (190 KB detector, 310 KB expression). TF.js WebGL. Effectively unmaintained. https://github.com/justadudewhohacks/face-api.js
- HSEmotion. 7/8 emotions plus valence-arousal. MobileNet 14 MB to EfficientNet-B2 30 MB, ONNX. Real phone timings 16-191 ms. https://github.com/av-savchenko/hsemotion-onnx
- ONNX emotion-ferplus. 8 emotions, 19 MB int8, runs in ONNX Runtime Web.
- Apple ARKit ARFaceAnchor. 52 blendshapes, gaze, blink, on-device. Needs TrueDepth.
- py-feat (FACS Action Units, research/desktop only), EmoNet (valence/arousal, non-commercial licence).

## How good
In-the-wild 7-8 class emotion accuracy realistically ~55-65%. Cross-dataset collapse and demographic bias are well documented. Barrett et al. 2019, "Emotional Expressions Reconsidered," shows facial configuration to emotion is not reliable or specific across contexts, people, and cultures. https://pmc.ncbi.nlm.nih.gov/articles/PMC6640856/ . EU AI Act Art. 5 bans emotion inference in work and education. ICO calls emotion AI immature and says none has satisfied data-protection law.

## Health markers beyond emotion
- rPPG heart rate from video. Clean data ~1-4 bpm MAE; degrades badly with motion and darker skin (up to 27 bpm walking). Only pulse and respiration rate are FDA-cleared (NuraLogix Anura). https://github.com/ubicomplab/rPPG-Toolbox
- Blink and fatigue. Eye Aspect Ratio (EAR), threshold ~0.2; blink duration is a better fatigue marker; PERCLOS is the validated drowsiness metric.
- Facial asymmetry (stroke/palsy). FAST.AI prospective study: stroke sensitivity 0.99, specificity 0.90. Validated, not cleared.
- Pallor, scleral jaundice, gaze: weaker or dataset-bound.

## Recommendation for our PWA
MediaPipe Face Landmarker as the base. Compute interpretable geometric signals: blink rate via EAR, smile intensity from blendshapes, head pose, facial asymmetry. Surface valence/arousal and geometric trends against the user's baseline, not emotion verdicts. Process on-device and say so. Never claim to detect depression or emotional state.
