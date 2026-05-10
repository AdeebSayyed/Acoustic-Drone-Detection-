import os
import sys
import numpy as np
import joblib
import librosa
import warnings

# Suppress librosa/sklearn warnings for clean terminal output
warnings.filterwarnings("ignore")

try:
    import sounddevice as sd
except ImportError:
    print("CRITICAL: 'sounddevice' module not found!")
    print("Please install it by running: pip install sounddevice")
    sys.exit(1)

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "backend", "drone_detector_v2.pkl")

print(f"Loading model from {MODEL_PATH}...")
try:
    clf = joblib.load(MODEL_PATH)
except Exception as e:
    print(f"Failed to load model: {e}")
    sys.exit(1)

THRESHOLD = 0.15
SR = 22050
DURATION = 3.0  # seconds per window
CHUNK_SIZE = int(SR * DURATION)

def extract_features(y, sr):
    """Same feature extraction pipeline used during training and in app.py"""
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

print("\n" + "="*50)
print("  ACOUSTIC DRONE DETECTION - REAL-TIME MONITOR  ")
print("="*50)
print("Listening to the default microphone...")
print("Play a drone sound near your microphone to test.")
print("Press Ctrl+C to stop.\n")

audio_buffer = np.zeros(0, dtype=np.float32)

def audio_callback(indata, frames, time_info, status):
    global audio_buffer
    if status:
        pass # Ignore buffer underflow/overflow warnings to keep terminal clean
    
    # Flatten and append new audio to buffer
    mono_data = indata[:, 0]
    audio_buffer = np.append(audio_buffer, mono_data)
    
    # Process only when we have enough data (3 seconds)
    if len(audio_buffer) >= CHUNK_SIZE:
        chunk = audio_buffer[:CHUNK_SIZE]
        
        # Keep the last 1.5 seconds for overlap (sliding window effect)
        overlap_size = int(SR * 1.5)
        audio_buffer = audio_buffer[-overlap_size:]
        
        try:
            feat = extract_features(chunk, SR)
            if not np.any(np.isnan(feat)) and not np.any(np.isinf(feat)):
                conf = float(clf.predict_proba(feat.reshape(1, -1))[0][1])
                is_drone = conf >= THRESHOLD
                
                # Visual bar
                bar_length = 20
                filled_len = int(bar_length * conf)
                bar = '█' * filled_len + '-' * (bar_length - filled_len)
                
                # Colors
                RED = '\033[91m'
                GREEN = '\033[92m'
                RESET = '\033[0m'
                
                if is_drone:
                    print(f"[{RED}DRONE DETECTED{RESET}] Confidence: {conf*100:5.1f}% |{RED}{bar}{RESET}|", flush=True)
                else:
                    print(f"[{GREEN}SAFE{RESET}]           Confidence: {conf*100:5.1f}% |{GREEN}{bar}{RESET}|", flush=True)
        except Exception as e:
            pass

try:
    # Use default input device, 1 channel (mono)
    with sd.InputStream(samplerate=SR, channels=1, callback=audio_callback):
        sd.sleep(int(1000 * 60 * 60 * 24)) # Run indefinitely until Ctrl+C
except KeyboardInterrupt:
    print("\nStopped.")
except Exception as e:
    print(f"\nError initializing microphone: {e}")
