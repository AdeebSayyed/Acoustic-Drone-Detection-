import os, sys
import numpy as np
import librosa
import joblib

BASE = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE, "backend", "drone_detector_v2.pkl")

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
y_audio, sr_used = librosa.load(AUDIO_PATH, sr=22050)

# Evaluate full length directly
feat = extract_features_from_audio(y_audio, sr_used)
conf = float(clf.predict_proba(feat.reshape(1, -1))[0][1])
print(f"Full audio confidence: {conf*100:.2f}%")

# Sliding window with smaller hop
window_samples = int(1.0 * sr_used) # Try 1 second windows
for start in range(0, len(y_audio) - window_samples + 1, int(0.5 * sr_used)):
    chunk = y_audio[start : start + window_samples]
    feat = extract_features_from_audio(chunk, sr_used)
    conf = float(clf.predict_proba(feat.reshape(1, -1))[0][1])
    print(f"1s window at {start/sr_used:.1f}s - confidence: {conf*100:.2f}%")
