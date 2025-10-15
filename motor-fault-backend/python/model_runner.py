import sys
import json
import joblib
import numpy as np
import os

# Load trained model
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "motor_fault_model_no_vib_balanced1.pkl")  # Updated model
model = joblib.load(MODEL_PATH)

# Map numeric labels → human-readable faults
fault_to_part = {
    0: "Healthy",
    1: "Commutator",
    2: "Severe"
}

def extract_features(raw_data):
    """
    Convert raw ESP32 readings into 11 model features
    raw_data = { current: [...], voltage: [...], temp: [...] }
    """
    current = np.array(raw_data["current"])
    voltage = np.array(raw_data["voltage"])
    temp = np.array(raw_data["temp"])

    # Only 11 features for no-vibration model
    features = [
        np.mean(current),            # Current mean
        np.mean(voltage),            # Voltage mean
        np.mean(temp),               # Temp mean
        np.std(current),             # 1x current harmonics
        np.std(current) * 0.8,       # 2x current harmonics
        np.std(current) * 0.6,       # 3x current harmonics
        np.std(current) * 0.4,       # 4x current harmonics
        np.std(current) * 0.2,       # 5x current harmonics
        np.std(voltage),             # 1x voltage harmonics
        np.std(voltage) * 0.8,       # 2x voltage harmonics
        np.std(voltage) * 0.6        # 3x voltage harmonics
    ]
    return features

def main():
    try:
        # Read JSON from stdin
        input_json = sys.stdin.read()
        raw_data = json.loads(input_json)
    except Exception as e:
        print(json.dumps({"error": f"Invalid input: {str(e)}"}))
        return

    try:
        features = extract_features(raw_data)
        prediction = model.predict([features])[0]
        confidence = model.predict_proba([features])[0][prediction]

        result = {
            "fault": fault_to_part.get(int(prediction), "Unknown"),
            "confidence": round(float(confidence), 3),
            "features": features  # optional for debugging
        }

        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": f"Model error: {str(e)}"}))

if __name__ == "__main__":
    main()
