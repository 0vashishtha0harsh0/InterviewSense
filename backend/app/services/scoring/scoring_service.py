from typing import Optional, Dict
import logging

logger = logging.getLogger(__name__)

# Configurable weights per §41 — content vs delivery for overall.
# content derived from NLP already weighted; delivery from CV.
# Overall = content_weight * content + delivery_weight * delivery
# If one is missing, fallback to available.
DEFAULT_WEIGHTS = {
    "content": 0.7,
    "delivery": 0.3,
}

# Alternative granular weights (if we recompute from raw, but we reuse precomputed scores)
# Keep for documentation §41 example
GRANULAR_WEIGHTS = {
    "relevance": 0.20,
    "concept_coverage": 0.20,
    "completeness": 0.15,
    "clarity": 0.10,
    "grammar": 0.05,
    "fluency": 0.10,
    "eye_contact": 0.10,
    "behavior": 0.10,  # movement/blink
}

CATEGORIES = [
    (90, 100, "Excellent"),
    (80, 89, "Very Good"),
    (70, 79, "Good"),
    (60, 69, "Needs Improvement"),
    (0, 59, "Needs Significant Improvement"),
]

def normalize_score(score: Optional[float]) -> Optional[int]:
    if score is None:
        return None
    try:
        s = float(score)
    except:
        return None
    s = max(0, min(100, round(s)))
    return int(s)

def compute_overall(content_score: Optional[int], delivery_score: Optional[int], weights: Dict = None) -> Optional[int]:
    weights = weights or DEFAULT_WEIGHTS
    cw = weights.get("content", 0.7)
    dw = weights.get("delivery", 0.3)
    # Normalize weights sum to 1 if needed
    total = cw + dw
    if total != 0:
        cw, dw = cw/total, dw/total

    if content_score is not None and delivery_score is not None:
        overall = cw * content_score + dw * delivery_score
    elif content_score is not None:
        # No delivery (e.g., camera denied, video unavailable) — use content only but slightly penalize? Per spec: calculate remaining valid metrics, don't fabricate
        # Use content as overall but note delivery unavailable
        overall = content_score
        logger.info(f"Delivery unavailable, overall fallback to content {content_score}")
    elif delivery_score is not None:
        overall = delivery_score
        logger.info(f"Content unavailable, overall fallback to delivery {delivery_score}")
    else:
        return None
    return normalize_score(overall)

def get_category(score: int) -> str:
    for low, high, label in CATEGORIES:
        if low <= score <= high:
            return label
    return "Unknown"

def aggregate_scores(answers: list) -> Dict:
    """
    Aggregate across answers for session final. Returns overall, content, delivery averages.
    """
    if not answers:
        return {"overall": None, "content": None, "delivery": None}
    content_vals = [a.get("content_score") for a in answers if a.get("content_score") is not None]
    delivery_vals = [a.get("delivery_score") for a in answers if a.get("delivery_score") is not None]
    overall_vals = [a.get("overall_score") for a in answers if a.get("overall_score") is not None]

    def avg(vals):
        return round(sum(vals)/len(vals), 1) if vals else None

    return {
        "overall": avg(overall_vals),
        "content": avg(content_vals),
        "delivery": avg(delivery_vals),
    }
