from pathlib import Path
import base64
import re
import json
from datetime import datetime

from flask import Flask, jsonify, request
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from statsmodels.tsa.arima.model import ARIMA


BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "sample_expense_data.csv"
MODEL_PATH = BASE_DIR / "models" / "expense_category_model.joblib"

app = Flask(__name__)
CORS(app)
model = None


# ── Category keywords for bill scanning ──────────────────────────────────────
CATEGORY_KEYWORDS = {
    "Food": ["restaurant", "cafe", "coffee", "pizza", "burger", "grocery", "supermarket",
             "food", "meal", "lunch", "dinner", "breakfast", "bakery", "diner", "eat",
             "dominos", "mcdonalds", "subway", "kfc", "starbucks", "walmart grocery",
             "whole foods", "trader joe", "safeway", "kroger"],
    "Transport": ["uber", "lyft", "taxi", "cab", "fuel", "gas station", "petrol",
                  "parking", "toll", "bus", "train", "metro", "airline", "flight",
                  "car rental", "auto", "vehicle", "transport", "travel"],
    "Utilities": ["electric", "electricity", "water", "gas bill", "internet", "broadband",
                  "phone bill", "mobile", "utility", "power", "energy", "telecom",
                  "at&t", "verizon", "comcast", "spectrum"],
    "Housing": ["rent", "mortgage", "lease", "property", "apartment", "housing",
                "maintenance", "repair", "home depot", "ikea", "furniture"],
    "Healthcare": ["hospital", "clinic", "doctor", "pharmacy", "medicine", "dental",
                   "health", "medical", "prescription", "lab", "test", "insurance",
                   "cvs", "walgreens", "rite aid"],
    "Entertainment": ["netflix", "spotify", "hulu", "disney", "amazon prime", "cinema",
                      "movie", "concert", "ticket", "game", "steam", "playstation",
                      "xbox", "subscription", "streaming"],
    "Education": ["tuition", "course", "school", "college", "university", "book",
                  "udemy", "coursera", "certification", "workshop", "training"],
    "Shopping": ["amazon", "ebay", "walmart", "target", "mall", "store", "shop",
                 "clothing", "apparel", "shoes", "electronics", "best buy", "apple store"],
    "Income": ["salary", "payroll", "deposit", "transfer in", "refund", "cashback",
               "bonus", "dividend", "interest earned"],
}


def guess_category_from_text(text):
    """Rule-based category guesser from bill text."""
    text_lower = text.lower()
    scores = {}
    for cat, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        if score > 0:
            scores[cat] = score
    if scores:
        return max(scores, key=scores.get)
    return "Other"


def extract_amount_from_text(text):
    """Extract the largest dollar amount from bill text (likely the total)."""
    # Match patterns like $12.50, 12.50, USD 12.50, Total: 12.50
    patterns = [
        r'total[:\s]+\$?\s*(\d{1,6}(?:\.\d{2})?)',
        r'amount[:\s]+\$?\s*(\d{1,6}(?:\.\d{2})?)',
        r'grand total[:\s]+\$?\s*(\d{1,6}(?:\.\d{2})?)',
        r'\$\s*(\d{1,6}(?:\.\d{2})?)',
        r'(\d{1,6}\.\d{2})',
    ]
    candidates = []
    for pattern in patterns:
        matches = re.findall(pattern, text.lower())
        for m in matches:
            try:
                val = float(m)
                if 0.01 <= val <= 99999:
                    candidates.append(val)
            except ValueError:
                pass
    if not candidates:
        return None
    # Return the largest amount found (most likely the total)
    return round(max(candidates), 2)


def extract_date_from_text(text):
    """Extract a date from bill text."""
    date_patterns = [
        r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
        r'(\d{4}[/-]\d{1,2}[/-]\d{1,2})',
        r'(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}',
        r'\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}',
    ]
    for pattern in date_patterns:
        match = re.search(pattern, text.lower())
        if match:
            raw = match.group(0)
            # Try to parse and normalize
            for fmt in ('%m/%d/%Y', '%d/%m/%Y', '%Y-%m-%d', '%m-%d-%Y',
                        '%d-%m-%Y', '%B %d, %Y', '%b %d, %Y', '%d %B %Y', '%d %b %Y'):
                try:
                    return datetime.strptime(raw.strip(), fmt).strftime('%Y-%m-%d')
                except ValueError:
                    pass
            return raw.strip()
    return datetime.today().strftime('%Y-%m-%d')


def extract_merchant_from_text(text):
    """Try to extract merchant/reason from first non-empty lines."""
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    # First meaningful line is usually the merchant name
    for line in lines[:5]:
        if len(line) > 2 and not re.match(r'^[\d\s\$\.\-\/]+$', line):
            return line[:60]
    return "Bill Payment"


# ── Model training ────────────────────────────────────────────────────────────

def train_model():
    df = pd.read_csv(DATA_PATH)
    df = df.dropna(subset=["text", "category"])
    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1)),
        ("clf", LogisticRegression(max_iter=2000)),
    ])
    pipeline.fit(df["text"], df["category"])
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)
    return pipeline, len(df)


def load_or_train_model():
    if MODEL_PATH.exists():
        return joblib.load(MODEL_PATH), None
    return train_model()


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "expense-categorizer"})


@app.route("/train", methods=["POST"])
def retrain():
    global model
    try:
        model, row_count = train_model()
        return jsonify({
            "message": "Model trained successfully.",
            "trained_rows": row_count,
            "model_path": str(MODEL_PATH),
        })
    except Exception as exc:
        return jsonify({"message": "Model training failed.", "error": str(exc)}), 500


@app.route("/predict", methods=["POST"])
def predict():
    global model
    payload = request.get_json(silent=True) or {}
    text = payload.get("text")

    if not text or not isinstance(text, str):
        return jsonify({"message": "text is required and must be a string."}), 400

    if model is None:
        model, _ = load_or_train_model()

    predicted = model.predict([text])[0]
    probabilities = None

    if hasattr(model, "predict_proba"):
        proba = model.predict_proba([text])[0]
        classes = model.named_steps["clf"].classes_
        score_map = {classes[idx]: float(round(prob, 4)) for idx, prob in enumerate(proba)}
        confidence = float(max(proba))
        probabilities = score_map
    else:
        confidence = None

    return jsonify({
        "text": text,
        "predictedCategory": predicted,
        "confidence": confidence,
        "scores": probabilities,
    })


@app.route("/scan-bill", methods=["POST"])
def scan_bill():
    """
    Scan a bill image and extract expense details.
    Accepts: multipart/form-data with 'image' file OR JSON with 'imageBase64'.
    Returns: date, amount, category, description extracted from the bill.
    """
    extracted_text = ""

    # Try to get image from multipart form
    if 'image' in request.files:
        file = request.files['image']
        image_bytes = file.read()

        # Try pytesseract OCR if available
        try:
            import pytesseract
            from PIL import Image
            import io
            img = Image.open(io.BytesIO(image_bytes))
            extracted_text = pytesseract.image_to_string(img)
        except ImportError:
            # OCR not available — use filename + basic heuristics
            extracted_text = file.filename or ""
        except Exception as e:
            extracted_text = file.filename or ""

    elif request.is_json:
        payload = request.get_json(silent=True) or {}
        # Accept raw text for testing
        extracted_text = payload.get("text", "") or payload.get("imageBase64", "")
        # If base64, try to decode and OCR
        if payload.get("imageBase64") and not payload.get("text"):
            try:
                import pytesseract
                from PIL import Image
                import io
                img_data = base64.b64decode(payload["imageBase64"])
                img = Image.open(io.BytesIO(img_data))
                extracted_text = pytesseract.image_to_string(img)
            except Exception:
                extracted_text = ""

    if not extracted_text.strip():
        # Return a demo result so the UI still works without OCR
        return jsonify({
            "success": True,
            "demo": True,
            "message": "OCR not available — showing demo extraction. Install pytesseract for real scanning.",
            "extracted": {
                "date": datetime.today().strftime('%Y-%m-%d'),
                "amount": 0,
                "category": "Other",
                "description": "Scanned Bill",
                "rawText": "",
            }
        })

    # Extract fields from text
    amount = extract_amount_from_text(extracted_text)
    date = extract_date_from_text(extracted_text)
    category = guess_category_from_text(extracted_text)
    description = extract_merchant_from_text(extracted_text)

    # Also try ML model for category if available
    global model
    if model is None:
        try:
            model, _ = load_or_train_model()
        except Exception:
            pass

    if model is not None and extracted_text.strip():
        try:
            ml_category = model.predict([extracted_text[:500]])[0]
            # Use ML category if rule-based returned "Other"
            if category == "Other":
                category = ml_category
        except Exception:
            pass

    return jsonify({
        "success": True,
        "demo": False,
        "extracted": {
            "date": date,
            "amount": amount,
            "category": category,
            "description": description,
            "rawText": extracted_text[:300],
        }
    })


@app.route("/forecast/expenses", methods=["POST"])
def forecast_expenses():
    payload = request.get_json(silent=True) or {}
    series = payload.get("monthlyExpenses")
    months = payload.get("months")

    if not isinstance(series, list) or len(series) < 2:
        return jsonify({"message": "monthlyExpenses must be an array with at least 2 values."}), 400

    try:
        expense_values = [float(value) for value in series]
    except (TypeError, ValueError):
        return jsonify({"message": "monthlyExpenses must contain numeric values only."}), 400

    if any(value < 0 for value in expense_values):
        return jsonify({"message": "monthlyExpenses cannot contain negative values."}), 400

    if not months or not isinstance(months, list) or len(months) != len(expense_values):
        months = [f"M{i + 1}" for i in range(len(expense_values))]

    method_used = "arima"
    try:
        if len(expense_values) < 4:
            raise ValueError("Not enough data points for stable ARIMA fit.")
        model_fit = ARIMA(np.array(expense_values, dtype=float), order=(1, 1, 1)).fit()
        forecast = model_fit.forecast(steps=1)
        next_value = float(forecast[0])
    except Exception:
        method_used = "moving_average_fallback"
        window = expense_values[-3:] if len(expense_values) >= 3 else expense_values
        next_value = float(sum(window) / len(window))

    next_value = max(round(next_value, 2), 0.0)

    return jsonify({
        "method": method_used,
        "history": [{"month": month, "expense": round(value, 2)} for month, value in zip(months, expense_values)],
        "nextMonthPrediction": next_value,
    })


if __name__ == "__main__":
    model, _ = load_or_train_model()
    app.run(host="0.0.0.0", port=8000, debug=True)
