import pyaudio
import numpy as np
import librosa
import joblib
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# ── LOAD MODEL ───────────────────────────────────────────────
MODEL_PATH = r"C:\Users\ADEEB SAYYED\Desktop\Drone Sound-Detector- Ml Project\drone_detector_v2.pkl"
THRESHOLD  = 0.15

clf = joblib.load(MODEL_PATH)
print("Model loaded successfully!")

# ── SETTINGS ─────────────────────────────────────────────────
SAMPLE_RATE   = 22050
CHUNK         = 1024
CLIP_SECONDS  = 3
CLIPS_NEEDED  = int(SAMPLE_RATE * CLIP_SECONDS / CHUNK)

# ── FEATURE EXTRACTION ───────────────────────────────────────
def extract_features(audio):
    y = audio.astype(np.float32)
    mfcc      = librosa.feature.mfcc(y=y, sr=SAMPLE_RATE, n_mfcc=40)
    centroid  = librosa.feature.spectral_centroid(y=y, sr=SAMPLE_RATE)
    rolloff   = librosa.feature.spectral_rolloff(y=y, sr=SAMPLE_RATE)
    bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=SAMPLE_RATE)
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

# ── LOGGING ──────────────────────────────────────────────────
log_file = r"D:\archive\detection_log.txt"

def log_detection(confidence):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(log_file, "a") as f:
        f.write(f"{timestamp} | DRONE DETECTED | Confidence: {confidence:.1%}\n")

# ── START MIC ────────────────────────────────────────────────
p = pyaudio.PyAudio()
stream = p.open(
    format=pyaudio.paInt16,
    channels=1,
    rate=SAMPLE_RATE,
    input=True,
    frames_per_buffer=CHUNK
)

print("\n" + "─"*50)
print("  DRONE DETECTION SYSTEM — ACTIVE")
print(f"  Threshold : {THRESHOLD}")
print(f"  Log file  : {log_file}")
print("─"*50)
print("  Listening... Press Ctrl+C to stop\n")

clip_num = 0
detection_count = 0

try:
    while True:
        # Collect 3 seconds of audio chunks
        frames = []
        for _ in range(CLIPS_NEEDED):
            data = stream.read(CHUNK, exception_on_overflow=False)
            frames.append(np.frombuffer(data, dtype=np.int16))

        # Convert to float32 normalized
        audio = np.concatenate(frames).astype(np.float32) / 32768.0
        clip_num += 1

        # Predict
        features = extract_features(audio).reshape(1, -1)
        confidence = clf.predict_proba(features)[0][1]

        if confidence >= THRESHOLD:
            detection_count += 1
            print("\n" + "="*50)
            print(f"  *** DRONE DETECTED ***")
            print(f"  Confidence : {confidence:.1%}")
            print(f"  Time       : {datetime.now().strftime('%H:%M:%S')}")
            print("="*50 + "\n")
            log_detection(confidence)
        else:
            bar = "█" * int(confidence * 20) + "░" * (20 - int(confidence * 20))
            print(f"  Clip #{clip_num:04d} | Clear [{bar}] {confidence:.1%}", end="\r")

except KeyboardInterrupt:
    print(f"\n\nStopped. Clips: {clip_num} | Detections: {detection_count}")

finally:
    stream.stop_stream()
    stream.close()
    p.terminate()