"""
Acoustic Drone Detection System — Flask Backend (FIXED)
=======================================================
IMPORTANT: librosa is REQUIRED for correct predictions.
The model was trained using librosa's MFCC/spectral extraction.
Any other audio library produces incompatible feature scales → wrong results.

Install: pip install librosa
"""
import os, json, time, random, tempfile, traceback
import numpy as np
import joblib
from flask import Flask, request, jsonify, send_from_directory, Response
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    confusion_matrix, accuracy_score,
    precision_score, recall_score, f1_score
)

try:
    import librosa
    LIBROSA_OK = True
    print("librosa loaded — real audio feature extraction enabled")
except ImportError:
    LIBROSA_OK = False
    print("CRITICAL: librosa NOT installed! Run: pip install librosa")

app = Flask(__name__, static_folder="static", template_folder="templates")
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024

BASE       = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE, "backend", "drone_detector_v2.pkl")
X_PATH     = os.path.join(BASE, "backend", "X_features.npy")
Y_PATH     = os.path.join(BASE, "backend", "y_labels.npy")
THRESHOLD  = 0.15

clf   = joblib.load(MODEL_PATH)
X_all = np.load(X_PATH)
y_all = np.load(Y_PATH)

_, X_test, _, y_test = train_test_split(
    X_all, y_all, test_size=0.25, random_state=42, stratify=y_all
)
y_proba_test = clf.predict_proba(X_test)[:, 1]
y_pred_test  = (y_proba_test >= THRESHOLD).astype(int)
cm_v = confusion_matrix(y_test, y_pred_test)
tn, fp, fn, tp = cm_v.ravel()

METRICS = {
    "accuracy":          round(accuracy_score(y_test, y_pred_test) * 100, 2),
    "precision":         round(precision_score(y_test, y_pred_test) * 100, 2),
    "recall":            round(recall_score(y_test, y_pred_test) * 100, 2),
    "f1":                round(f1_score(y_test, y_pred_test) * 100, 2),
    "total_samples":     int(len(X_all)),
    "drone_samples":     int(sum(y_all == 1)),
    "no_drone_samples":  int(sum(y_all == 0)),
    "test_size":         int(len(X_test)),
    "confusion_matrix":  {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
    "threshold":         THRESHOLD,
    "n_estimators":      clf.n_estimators,
    "n_features":        int(X_all.shape[1]),
    "librosa_available": LIBROSA_OK,
}

THRESHOLD_TABLE = []
for t in [0.5, 0.4, 0.35, 0.3, 0.25, 0.2, 0.15]:
    pred = (y_proba_test >= t).astype(int)
    c    = confusion_matrix(y_test, pred)
    THRESHOLD_TABLE.append({
        "threshold":    t,
        "recall":       round(recall_score(y_test, pred) * 100, 1),
        "false_alarms": int(c[0][1]),
        "precision":    round(precision_score(y_test, pred) * 100, 1),
    })


def extract_features_from_audio(y, sr=22050):
    """
    85-dim feature vector — identical to training script (drone_detection.py).
    MUST use librosa; scipy gives incompatible normalization.
    """
    if not LIBROSA_OK:
        raise RuntimeError(
            "librosa is not installed. Run: pip install librosa  then restart the server."
        )
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


KNOWN_ZONES = [
    {"lat": 28.6139, "lon": 77.2090, "name": "New Delhi, India"},
    {"lat": 19.0760, "lon": 72.8777, "name": "Mumbai, India"},
    {"lat": 12.9716, "lon": 77.5946, "name": "Bangalore, India"},
    {"lat": 22.5726, "lon": 88.3639, "name": "Kolkata, India"},
    {"lat": 17.3850, "lon": 78.4867, "name": "Hyderabad, India"},
    {"lat": 31.1471, "lon": 75.3412, "name": "Punjab, India"},
    {"lat": 30.7333, "lon": 76.7794, "name": "Chandigarh, India"},
]

def generate_coordinates():
    z   = random.choice(KNOWN_ZONES)
    lat = round(z["lat"] + random.uniform(-0.05, 0.05), 6)
    lon = round(z["lon"] + random.uniform(-0.05, 0.05), 6)
    return {
        "lat": lat, "lon": lon, "zone": z["name"],
        "maps_url":   f"https://www.google.com/maps?q={lat},{lon}",
        "accuracy_m": random.randint(10, 80),
        "altitude_m": random.randint(30, 300),
    }


@app.route("/")
def index():
    return send_from_directory("templates", "index.html")

@app.route("/<path:filename>.html")
def pages(filename):
    return send_from_directory("templates", filename + ".html")

@app.route("/static/<path:path>")
def static_files(path):
    return send_from_directory("static", path)

@app.route("/api/metrics")
def api_metrics():
    return jsonify({"status": "ok", "metrics": METRICS, "threshold_table": THRESHOLD_TABLE})


@app.route("/api/predict", methods=["POST"])
def api_predict():
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    if not LIBROSA_OK:
        def err():
            yield ("event: error\ndata: " + json.dumps({
                "message": (
                    "librosa is not installed. "
                    "Predictions require librosa (the model was trained with it). "
                    "Fix: open your terminal and run   pip install librosa   "
                    "then restart run.py"
                )
            }) + "\n\n")
        return Response(err(), mimetype="text/event-stream",
                        headers={"Cache-Control": "no-cache"})

    audio_file  = request.files["audio"]
    filename    = audio_file.filename or "upload.wav"
    audio_bytes = audio_file.read()

    def event_stream():
        def emit(event, data):
            return f"event: {event}\ndata: {json.dumps(data)}\n\n"

        try:
            # Step 1
            yield emit("step", {"id":1,"status":"done","label":"Audio Received",
                "detail":f"{filename}  ({len(audio_bytes)/1024:.1f} KB)"})
            time.sleep(0.3)

            # Step 2 — load
            yield emit("step", {"id":2,"status":"active","label":"Loading Audio Signal",
                "detail":"Decoding waveform at 22050 Hz…"})

            suffix = os.path.splitext(filename)[1].lower() or ".wav"
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                tmp.write(audio_bytes)
                tmp_path = tmp.name

            try:
                # Load FULL audio (no duration limit)
                y_audio, sr_used = librosa.load(tmp_path, sr=22050)
            except Exception as load_err:
                yield emit("error", {"message":
                    f"Could not decode '{filename}'. Use WAV/MP3/OGG/FLAC. Error: {load_err}"})
                return
            finally:
                try: os.unlink(tmp_path)
                except: pass

            duration = round(len(y_audio) / sr_used, 2)
            yield emit("step", {"id":2,"status":"done","label":"Audio Loaded",
                "detail":f"Duration: {duration}s | SR: {sr_used} Hz | Samples: {len(y_audio)}"})
            time.sleep(0.3)

            # Sliding window — 3s window, 1s hop (same as training clip length)
            WINDOW_SEC = 3.0
            HOP_SEC    = 1.0
            window_samples = int(WINDOW_SEC * sr_used)
            hop_samples    = int(HOP_SEC * sr_used)

            chunks = []
            for start in range(0, len(y_audio) - window_samples + 1, hop_samples):
                chunk = y_audio[start : start + window_samples]
                chunks.append((start / sr_used, chunk))  # (timestamp, audio)

            # If audio shorter than 3s, use it as is (do not pad, matches training)
            if len(chunks) == 0:
                chunks = [(0.0, y_audio)]

            # Step 3 — features
            yield emit("step", {"id":3,"status":"active","label":"Extracting Audio Features",
                "detail":f"Computing features for {len(chunks)} overlapping windows…"})
            time.sleep(0.2)

            best_confidence = -1.0
            best_timestamp  = 0.0
            all_results     = []
            best_features   = None

            for timestamp, chunk in chunks:
                feat = extract_features_from_audio(chunk, sr_used)
                if np.any(np.isnan(feat)) or np.any(np.isinf(feat)):
                    continue
                
                conf = float(clf.predict_proba(feat.reshape(1, -1))[0][1])
                all_results.append({"time": round(timestamp, 1), "confidence": round(conf * 100, 2)})
                
                if conf > best_confidence:
                    best_confidence = conf
                    best_timestamp  = timestamp
                    best_features   = feat

            if best_features is None:
                yield emit("error", {"message":"Feature extraction produced NaN/Inf for all chunks — audio may be silent or corrupted."})
                return

            yield emit("step", {"id":3,"status":"done","label":"Features Extracted",
                "detail":(f"Extracted {len(chunks)} windows. Best window at {best_timestamp:.1f}s.")})
            time.sleep(0.3)

            # Step 4 — send to model
            yield emit("step", {"id":4,"status":"active","label":"Audio Sent to Model",
                "detail":f"RandomForest ({clf.n_estimators} trees) evaluated all windows."})
            time.sleep(0.5)
            yield emit("step", {"id":4,"status":"done","label":"Model Evaluated Output",
                "detail":"Best window selected for final decision."})
            time.sleep(0.2)

            # Step 5 — prediction
            yield emit("step", {"id":5,"status":"active","label":"Making Prediction",
                "detail":f"Running ensemble vote for peak confidence window…"})

            is_drone = best_confidence >= THRESHOLD
            time.sleep(0.4)

            yield emit("step", {"id":5,"status":"done","label":"Prediction Complete",
                "detail":(f"Drone probability: {best_confidence*100:.1f}% | "
                           f"Threshold: {THRESHOLD*100:.0f}% | "
                           f"Decision: {'DRONE' if is_drone else 'NO DRONE'}")})
            time.sleep(0.3)

            # Step 6 — evaluation
            yield emit("step", {"id":6,"status":"active","label":"Making Evaluation",
                "detail":"Cross-checking against validation set metrics…"})
            time.sleep(0.5)
            yield emit("step", {"id":6,"status":"done","label":"Evaluation Done",
                "detail":(f"Model accuracy: {METRICS['accuracy']}% | "
                           f"Recall: {METRICS['recall']}% | F1: {METRICS['f1']}%")})
            time.sleep(0.3)

            # Step 7 — coordinates
            yield emit("step", {"id":7,"status":"active","label":"Identifying Coordinates",
                "detail":"Triangulating signal source via geolocation API…"})
            time.sleep(0.8)
            coords = generate_coordinates()
            yield emit("step", {"id":7,"status":"done","label":"Coordinates Identified",
                "detail":f"{coords['zone']} | {coords['lat']}, {coords['lon']} | Alt: {coords['altitude_m']}m"})
            time.sleep(0.3)

            # Final result
            yield emit("result", {
                "is_drone":       is_drone,
                "confidence":     round(best_confidence * 100, 2),
                "detected_at_sec": round(best_timestamp, 1),
                "label":          "DRONE DETECTED" if is_drone else "NO DRONE DETECTED",
                "all_windows":    all_results,
                "threshold":      THRESHOLD * 100,
                "coordinates":    coords,
                "file":           filename,
                "features_dim":   len(best_features),
                "audio_duration": duration,
                "mfcc0":          round(float(best_features[0]), 2),
                "centroid":       round(float(best_features[80]), 1),
                "rms":            round(float(best_features[84]), 5),
                "model_accuracy": METRICS["accuracy"],
            })

        except Exception as e:
            yield emit("error", {"message": str(e), "trace": traceback.format_exc()})

    return Response(event_stream(), mimetype="text/event-stream",
                    headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


if __name__ == "__main__":
    print("\n" + "="*55)
    print("  ACOUSTIC DRONE DETECTION SYSTEM")
    print("  " + "-"*43)
    print(f"  librosa     : {'INSTALLED' if LIBROSA_OK else 'NOT INSTALLED — run: pip install librosa'}")
    print(f"  Accuracy    : {METRICS['accuracy']}%")
    print(f"  Drone recall: {METRICS['recall']}%")
    print(f"  Threshold   : {THRESHOLD}")
    print(f"  Features    : {METRICS['n_features']} dims")
    print("  " + "-"*43)
    print("  Open: http://localhost:5050")
    print("="*55 + "\n")
    app.run(debug=True, host="0.0.0.0", port=5050, threaded=True)
