import sys
import json
import mysql.connector
import pandas as pd
from sentence_transformers import SentenceTransformer, util

# -------- SQL Connection --------
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Sri@9750',
    'database': 'motor_fault_db'
}


conn = mysql.connector.connect(**db_config)
cursor = conn.cursor(dictionary=True)

# -------- Load motor fault data --------
cursor.execute("SELECT id, input, fault, timestamp FROM motor_data")
rows = cursor.fetchall()
df = pd.DataFrame(rows)

# -------- Prepare text for NLP --------
df['text'] = df['fault'] + " | " + df['input'].astype(str)

# -------- Load sentence transformer --------
nlp_model = SentenceTransformer('all-MiniLM-L6-v2')
embeddings = nlp_model.encode(df['text'].tolist(), convert_to_tensor=True)

# -------- Function to answer questions --------
def answer_question(question):
    query_emb = nlp_model.encode(question, convert_to_tensor=True)
    similarities = util.cos_sim(query_emb, embeddings)

    best_idx = int(similarities.argmax())
    best_entry = df.iloc[best_idx]

    similarity_score = float(similarities[0, best_idx])

    # ✅ Parse sensor readings (since they are stored as JSON text)
    try:
        readings = json.loads(best_entry['input'])
        avg_temp = sum(readings.get("temp", [])) / len(readings.get("temp", [])) if readings.get("temp") else None
        avg_current = sum(readings.get("current", [])) / len(readings.get("current", [])) if readings.get("current") else None
        avg_voltage = sum(readings.get("voltage", [])) / len(readings.get("voltage", [])) if readings.get("voltage") else None
    except Exception:
        avg_temp, avg_current, avg_voltage = None, None, None

    # ✅ Build natural sentence with summarized values
    response_sentence = (
        f"The system identified this situation as most similar to a **{best_entry['fault']} fault**. "
        f"It was observed on {best_entry['timestamp']}. "
    )
    if avg_temp and avg_current and avg_voltage:
        response_sentence += (
            f"The average readings were approximately {avg_temp:.1f}°C temperature, "
            f"{avg_current:.2f}A current, and {avg_voltage:.2f}V voltage. "
        )
    response_sentence += f"(Confidence: {similarity_score:.2f})"

    return {
        "fault": best_entry['fault'],
        "timestamp": str(best_entry['timestamp']),
        "similarity_score": similarity_score,
        "response": response_sentence
    }

# -------- Main: read from stdin --------
if __name__ == "__main__":
    try:
        input_json = sys.stdin.read()
        data = json.loads(input_json)
        question = data.get("question", "")
        if not question:
            print(json.dumps({"error": "No question provided"}))
            sys.exit(0)
        
        response = answer_question(question)
        print(json.dumps(response, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"error": str(e)}))