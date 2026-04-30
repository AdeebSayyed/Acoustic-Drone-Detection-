# 🚁 Acoustic Drone Detection System — Web UI

A full-stack web application for acoustic drone detection using a Random Forest ML model.

## Features
- **Real-time prediction pipeline** — upload audio and watch each step happen live
- **Process sidebar** — shows: Audio Received → Load → Feature Extraction → Model → Prediction → Evaluation → Coordinates
- **Geolocation output** — predicted drone coordinates with Google Maps link
- **3-page layout**: Home (Detection), Metrics, About
- **Live confusion matrix**, threshold analysis, and classification report
- **Waveform visualizer** for uploaded audio

## Project Structure
```
drone_ui/
├── app.py              ← Flask backend (REST API + SSE streaming)
├── run.py              ← Quick-start launcher
├── backend/
│   ├── drone_detector_v2.pkl   ← Trained RF model
│   ├── X_features.npy          ← Feature matrix
│   └── y_labels.npy            ← Labels
├── templates/
│   ├── index.html      ← Home + Detection page
│   ├── metrics.html    ← Model evaluation page
│   └── about.html      ← About / Why this system page
└── static/
    ├── css/style.css   ← Design system
    └── img/confusion_matrix.png
```

## Setup

### 1. Install dependencies
```bash
pip install flask scikit-learn joblib numpy librosa
```
> **Note:** `librosa` is optional. Without it, the system uses pre-extracted features from the dataset for prediction (feature values come from a matching sample in `X_features.npy`). For full audio-to-prediction, install librosa.

### 2. Launch
```bash
python run.py
```

### 3. Open browser
```
http://localhost:5050
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Home page (detection interface) |
| `/metrics.html` | GET | Model metrics page |
| `/about.html` | GET | About page |
| `/api/metrics` | GET | JSON — model performance metrics |
| `/api/predict` | POST | SSE stream — real-time prediction pipeline |

### `/api/predict` — POST
Upload `multipart/form-data` with key `audio`. Returns a **Server-Sent Events** stream:

```
event: step
data: {"id": 1, "label": "Audio Received", "detail": "...", "status": "done"}

event: result
data: {
  "is_drone": true,
  "confidence": 87.3,
  "label": "DRONE DETECTED",
  "coordinates": {
    "lat": 28.6139, "lon": 77.209,
    "zone": "New Delhi, India",
    "maps_url": "https://www.google.com/maps?q=28.6139,77.209",
    "altitude_m": 120, "accuracy_m": 35
  }
}
```

## Model Details

| Property | Value |
|----------|-------|
| Algorithm | RandomForestClassifier |
| Estimators | 300 trees |
| Class weight | {No Drone: 1, Drone: 5} |
| Decision threshold | 0.15 (15%) |
| Feature dimensions | 85 |
| Training samples | 11,704 |
| Accuracy | 97.4% |
| Drone recall | 97% |
| Precision | 83% |
| F1 Score | 90% |

## Prediction Threshold Note

The model uses a **15% threshold** (instead of 50%) to maximize drone recall.
This means: if there's ≥15% chance of a drone, it triggers an alert.
This trades some precision for near-zero missed detections — appropriate for security use.
