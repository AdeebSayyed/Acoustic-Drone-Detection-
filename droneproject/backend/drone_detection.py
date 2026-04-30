import os
import numpy as np
import librosa
import librosa.display
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, ConfusionMatrixDisplay, recall_score
import joblib
import warnings
warnings.filterwarnings('ignore')

# ── YOUR LOCAL PATH ──────────────────────────────────────────
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.join(PROJECT_DIR, "Binary_Drone_Audio")
DRONE_PATH   = os.path.join(BASE, "yes_drone")
UNKNOWN_PATH = os.path.join(BASE, "unknown")
# ─────────────────────────────────────────────────────────────

def extract_features(file_path):
    try:
        y, sr = librosa.load(file_path, duration=3.0, sr=22050)
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
    except Exception as e:
        print(f"  Skipped {os.path.basename(file_path)}: {e}")
        return None

# ── LOAD SAVED FEATURES (skip extraction if already done) ────
X_path = os.path.join(PROJECT_DIR, "X_features.npy")
y_path = os.path.join(PROJECT_DIR, "y_labels.npy")

if os.path.exists(X_path):
    # ✅ Features already saved — skip extraction (saves 15 mins)
    print("Loading saved features...")
    X = np.load(X_path)
    y = np.load(y_path)
    print(f"Loaded {len(X)} samples")

else:
    # ⏳ First time — extract features from audio files
    X, y = [], []
    drone_files   = [f for f in os.listdir(DRONE_PATH)
                     if f.endswith(('.wav','.mp3','.ogg','.flac'))]
    unknown_files = [f for f in os.listdir(UNKNOWN_PATH)
                     if f.endswith(('.wav','.mp3','.ogg','.flac'))]

    print(f"Found {len(drone_files)} drone files")
    print(f"Found {len(unknown_files)} unknown files")
    print("\nExtracting features... (10-15 minutes)")

    for i, f in enumerate(drone_files):
        feat = extract_features(os.path.join(DRONE_PATH, f))
        if feat is not None:
            X.append(feat)
            y.append(1)
        if (i+1) % 50 == 0:
            print(f"  Drone: {i+1}/{len(drone_files)} done")

    for i, f in enumerate(unknown_files):
        feat = extract_features(os.path.join(UNKNOWN_PATH, f))
        if feat is not None:
            X.append(feat)
            y.append(0)
        if (i+1) % 50 == 0:
            print(f"  Unknown: {i+1}/{len(unknown_files)} done")

    X = np.array(X)
    y = np.array(y)
    np.save(X_path, X)
    np.save(y_path, y)
    print(f"Features saved! Total: {len(X)} samples")

# ── TRAIN IMPROVED MODEL ──────────────────────────────────────
print(f"\nDrone samples: {sum(y==1)} | No Drone: {sum(y==0)}")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.25, random_state=42, stratify=y
)

print("Training improved Random Forest...")
clf = RandomForestClassifier(
    n_estimators=300,
    class_weight={0: 1, 1: 5},  # penalise missing a drone 5x more
    random_state=42,
    n_jobs=-1
)
clf.fit(X_train, y_train)

# ── LOWER THRESHOLD TO CATCH MORE DRONES ─────────────────────
y_proba = clf.predict_proba(X_test)[:, 1]
threshold = 0.250
y_pred = (y_proba >= threshold).astype(int)

print("\n======= IMPROVED RESULTS =======")
print(classification_report(y_test, y_pred,
      target_names=['No Drone', 'Drone']))

# ── COMPARE THRESHOLDS ───────────────────────────────────────
print("Threshold | Drone Recall | False Alarms")
print("-" * 42)
for t in [0.5, 0.4, 0.35, 0.3, 0.25, 0.2]:
    pred = (y_proba >= t).astype(int)
    recall = recall_score(y_test, pred)
    cm_t = confusion_matrix(y_test, pred)
    false_alarms = cm_t[0][1]
    print(f"   {t:.2f}   |    {recall*100:.1f}%      |    {false_alarms}")

# ── CONFUSION MATRIX ─────────────────────────────────────────
cm = confusion_matrix(y_test, y_pred)
disp = ConfusionMatrixDisplay(cm, display_labels=['No Drone', 'Drone'])
disp.plot(cmap='Blues')
plt.title('Improved Drone Detector — Confusion Matrix')
plt.tight_layout()
plt.savefig(os.path.join(PROJECT_DIR, "confusion_matrix_v2.png"))
plt.show()

# ── SAVE MODEL ───────────────────────────────────────────────
joblib.dump(clf, os.path.join(PROJECT_DIR, "drone_detector_v2.pkl"))
accuracy = clf.score(X_test, y_test) * 100
print(f"\nModel saved -> {os.path.join(PROJECT_DIR, 'drone_detector_v2.pkl')}")
print(f"Accuracy: {accuracy:.1f}%")