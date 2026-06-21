# Voice biomarkers on-device — research (2026)

## Summary
Defensible local stack: capture audio, extract eGeMAPS acoustic features with openSMILE (compiles to iOS/Android, tiny footprint), run a small CoreML/TFLite classifier, and use Whisper-tiny for transcript metrics. Do feature extraction and transcription for real. Treat any clinical verdict as a trend or heuristic and never claim clinical validity. In a pure browser PWA, use Web Audio plus Meyda for the acoustic features.

## Feature extractors
- openSMILE. C++, runs on Linux, Windows, macOS, Android, iOS. eGeMAPS set: F0, jitter, shimmer, HNR, loudness, alpha ratio, Hammarberg index, spectral slope, formants, MFCCs. Source-available, free for research; commercial use needs a licence. https://github.com/audeering/opensmile
- Praat / Parselmouth. Gold-standard acoustics, Python, server-side. https://github.com/YannickJadoul/Parselmouth ; scripts: https://github.com/drfeinberg/PraatScripts
- Meyda. JS audio feature extraction for in-browser use (MFCCs, RMS, spectral features). Good fit for the PWA.

## Neural models
- audeering/wav2vec2-large-robust-12-ft-emotion-msp-dim. Outputs arousal, dominance, valence; ~150-165M params, borderline for phones. https://huggingface.co/audeering/wav2vec2-large-robust-12-ft-emotion-msp-dim
- speechbrain emotion-recognition-wav2vec2-IEMOCAP. ~93M params, ~207 MB quantized. https://huggingface.co/speechbrain/emotion-recognition-wav2vec2-IEMOCAP
- Whisper tiny (39M, ~40 MB int8) and base (74M). On-device via whisper.cpp. Transcript gives speech rate, pauses, filler words. https://github.com/openai/whisper/discussions/506
- Kintsugi open-sourced its FDA-cleared voice-biomarker models in Feb 2026. https://huggingface.co/KintsugiHealth ; https://www.kintsugihealth.com/blog/open-source

## Escalation APIs (break local-first)
- audEERING devAIce has an offline SDK (best "API that runs locally"). https://www.audeering.com/products/devaice/
- Sonde Health (mental/respiratory). https://www.sondehealth.com/
- Ellipsis Health, Canary Speech (cloud).

## Evidence
Depression on DAIC-WOZ: wav2vec2 transfer F1 ~0.79; eGeMAPS audio-only F1 ~0.80. Curated clinical data; real-world FaceTime audio will be worse. https://www.nature.com/articles/s41598-024-60278-1

## Recommendation for our PWA
Web Audio capture, Meyda for the acoustic feature set, optional Whisper-tiny browser build for transcript metrics, a tiny classifier or heuristic over the features producing a trend against the user's own baseline. Show the longitudinal feature trend as the honest, compelling demo. Frame the clinical layer as experimental, never a score.
