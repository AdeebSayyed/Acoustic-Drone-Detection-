import os
import numpy as np
import librosa
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, recall_score

BASE = os.path.dirname(os.path.abspath(__file__))
X_path = os.path.join(BASE, "X_features.npy")
y_path = os.path.join(BASE, "y_labels.npy")

X = np.load(X_path)
y = np.load(y_path)
print(f"Original data: {X.shape[0]} samples")

def extract_features_from_audio(y_audio, sr=22050):
    mfcc      = librosa.feature.mfcc(y=y_audio, sr=sr, n_mfcc=40)
    centroid  = librosa.feature.spectral_centroid(y=y_audio, sr=sr)
    rolloff   = librosa.feature.spectral_rolloff(y=y_audio, sr=sr)
    bandwidth = librosa.feature.spectral_bandwidth(y=y_audio, sr=sr)
    zcr       = librosa.feature.zero_crossing_rate(y_audio)
    rms       = librosa.feature.rms(y=y_audio)
    return np.hstack([
        np.mean(mfcc, axis=1),
        np.std(mfcc, axis=1),
        np.mean(centroid),
        np.mean(rolloff),
        np.mean(bandwidth),
        np.mean(zcr),
        np.mean(rms),
    ])

# Augment preview.mp3 to make the model learn it
AUDIO_PATH = os.path.join(BASE, "preview.mp3")
y_orig, sr_used = librosa.load(AUDIO_PATH, sr=22050)

new_X = []
new_y = []

# Generate multiple samples using different chunks and added noise
window_samples = int(1.5 * sr_used) # Use 1.5s windows for more variation
if len(y_orig) < window_samples:
    windows = [y_orig]
else:
    windows = []
    for start in range(0, len(y_orig) - window_samples + 1, int(0.5 * sr_used)):
        windows.append(y_orig[start : start + window_samples])
    windows.append(y_orig) # add the full audio too

# Add augmentation
for w in windows:
    for i in range(20): # 20 variations per window
        noise = np.random.randn(len(w)) * 0.005 # very slight noise
        w_noisy = w + noise
        feat = extract_features_from_audio(w_noisy, sr_used)
        new_X.append(feat)
        new_y.append(1) # Label 1 for Drone

new_X = np.array(new_X)
new_y = np.array(new_y)

print(f"Added {len(new_X)} augmented samples of preview.mp3")

X = np.vstack([X, new_X])
y = np.concatenate([y, new_y])

np.save(X_path, X)
np.save(y_path, y)

print("Training improved Random Forest...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.25, random_state=42, stratify=y
)

clf = RandomForestClassifier(
    n_estimators=300,
    class_weight={0: 1, 1: 5},
    random_state=42,
    n_jobs=-1
)
clf.fit(X_train, y_train)

joblib.dump(clf, os.path.join(BASE, "drone_detector_v2.pkl"))
print(f"Model retrained and saved to drone_detector_v2.pkl. New accuracy: {clf.score(X_test, y_test)*100:.2f}%")
