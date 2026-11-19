"""
Train and evaluate CyberShield's Scikit-learn TF-IDF + LogisticRegression model.

Usage with your own labelled CSV dataset (columns: 'text', 'label' where 1=scam, 0=ham):
    python backend/services/train_model.py --dataset path/to/labelled_sms_scams.csv

Note:
- Always evaluate on a held-out test split and inspect precision/recall/F1-score
  rather than relying on synthetic accuracy.
"""

import argparse
import csv
import os
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

OUTPUT_MODEL_PATH = os.path.join(os.path.dirname(__file__), "scam_tfidf_logreg.joblib")


def load_csv_dataset(csv_path: str) -> tuple[list[str], list[int]]:
    texts: list[str] = []
    labels: list[int] = []
    with open(csv_path, "r", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            text = (row.get("text") or "").strip()
            raw_label = (row.get("label") or "").strip().lower()
            if not text:
                continue
            label = 1 if raw_label in ("1", "scam", "spam", "fraud", "phishing") else 0
            texts.append(text)
            labels.append(label)
    return texts, labels


def train_and_evaluate(dataset_path: str) -> None:
    texts, labels = load_csv_dataset(dataset_path)
    if len(texts) < 20:
        raise ValueError("Dataset must contain at least 20 labelled examples for a meaningful split.")

    x_train, x_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.2, random_state=42, stratify=labels
    )

    pipeline = Pipeline(
        [
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), lowercase=True, max_features=10000, sublinear_tf=True)),
            ("clf", LogisticRegression(max_iter=1000, class_weight="balanced")),
        ]
    )

    pipeline.fit(x_train, y_train)
    predictions = pipeline.predict(x_test)

    print("=== Evaluation on Held-Out Test Split ===")
    print(classification_report(y_test, predictions, target_names=["Benign (0)", "Scam (1)"]))
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, predictions))

    joblib.dump(pipeline, OUTPUT_MODEL_PATH)
    print(f"Saved trained model pipeline to: {OUTPUT_MODEL_PATH}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train CyberShield TF-IDF Scam Classifier")
    parser.add_argument("--dataset", required=True, help="Path to CSV with 'text' and 'label' columns")
    args = parser.parse_args()
    train_and_evaluate(args.dataset)
