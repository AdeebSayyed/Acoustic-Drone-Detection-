import os, sys
import numpy as np
import librosa
import joblib

BASE = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE, "backend", "drone_detector_v2.pkl")

print(f"Loading model from {MODEL_PATH}")
clf = joblib.load(MODEL_PATH)

def extract_features_from_audio(y, sr=22050):
    mfcc      = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=40)
    centroid  = librosa.feature.spectral_centroid(y=y, sr=sr)
    rolloff   = librosa.feature.spectral_rolloff(y=y, sr=sr)
    bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)
    zcr       = librosa.feature.zero_crossing_rate(y)
    rms       = librosa.feature.rms(y=y)
    return np.hstack([
        np.mean(mfcc, axis=1),
        np.std(mfcc, axis=1),
        np.mean(centroid),
        np.mean(rolloff),
        np.mean(bandwidth),
        np.mean(zcr),
        np.mean(rms),
    ])

AUDIO_PATH = os.path.join(BASE, "backend", "preview.mp3")
print(f"Loading audio from {AUDIO_PATH}")
y_audio, sr_used = librosa.load(AUDIO_PATH, sr=22050)
duration = len(y_audio) / sr_used
print(f"Duration: {duration:.2f} seconds")

WINDOW_SEC = 3.0
HOP_SEC    = 1.0
window_samples = int(WINDOW_SEC * sr_used)
hop_samples    = int(HOP_SEC * sr_used)

chunks = []
for start in range(0, len(y_audio) - window_samples + 1, hop_samples):
    chunk = y_audio[start : start + window_samples]
    chunks.append((start / sr_used, chunk))

if len(chunks) == 0:
    chunks = [(0.0, y_audio)]

print(f"Extracted {len(chunks)} chunks.")

for idx, (timestamp, chunk) in enumerate(chunks):
    feat = extract_features_from_audio(chunk, sr_used)
    conf = float(clf.predict_proba(feat.reshape(1, -1))[0][1])
    print(f"Chunk {idx} (time: {timestamp:.1f}s) - confidence: {conf*100:.2f}%")
