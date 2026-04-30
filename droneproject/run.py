#!/usr/bin/env python3
"""
Acoustic Drone Detection System
================================
Quick-start script. Run this file to launch the server.

Requirements:
  pip install flask scikit-learn joblib numpy librosa
  (librosa is optional — without it the system uses pre-extracted features)

Usage:
  python run.py
  Then open: http://localhost:5050
"""
import os, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))
from app import app, METRICS

print("\n" + "="*56)
print("  [DRONE] ACOUSTIC DRONE DETECTION SYSTEM")
print("  " + "-"*45)
print(f"  Model accuracy   : {METRICS['accuracy']}%")
print(f"  Drone recall     : {METRICS['recall']}%")
print(f"  Precision        : {METRICS['precision']}%")
print(f"  F1 Score         : {METRICS['f1']}%")
print(f"  Total samples    : {METRICS['total_samples']:,}")
print(f"  Feature dims     : {METRICS['n_features']}")
print("  " + "-"*45)
print("  Open browser: http://localhost:5050")
print("  Press CTRL+C to stop")
print("="*56 + "\n")

app.run(debug=False, host="0.0.0.0", port=5050, threaded=True)
