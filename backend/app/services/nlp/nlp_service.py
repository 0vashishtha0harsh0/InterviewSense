import re
import logging
from typing import List, Dict, Tuple, Optional

logger = logging.getLogger(__name__)

FILLER_WORDS = ["um", "uh", "like", "you know", "actually", "basically", "so", "well", "kind of", "sort of"]
EXPLANATION_MARKERS = ["because", "since", "therefore", "example", "for example", "such as", "means", "defined as", "is when", "refers to"]

# Configurable weights per §41 (content only for M5). Sum should be 1.0
WEIGHTS = {
    "relevance": 0.25,
    "concept_coverage": 0.25,
    "completeness": 0.20,
    "clarity": 0.15,
    "grammar": 0.05,
    "fluency": 0.10,
}

def normalize_text(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").lower().strip())

def tokenize(s: str) -> List[str]:
    return re.findall(r"\b\w+\b", normalize_text(s))

def compute_relevance(question: str, transcript: str) -> int:
    """
    TF-IDF cosine similarity 0-100. Falls back to word overlap if sklearn fails or very short.
    """
    if not transcript or not transcript.strip():
        return 0
    if not question or not question.strip():
        return 50
    # Stopwords for overlap fallback
    STOP = {"what","is","in","the","a","an","and","or","of","to","for","on","with","as","by","at","from","it","this","that","are","was","be","been","has","have","had","will","would","can","could","should","do","does","did","not","but","if","then","so","very"}
    q_tokens = set(tokenize(question)) - STOP
    t_tokens = set(tokenize(transcript)) - STOP
    if len(q_tokens) < 3 or len(t_tokens) < 5:
        # simple overlap, filtered
        if not q_tokens: return 0
        overlap = len(q_tokens & t_tokens) / len(q_tokens)
        return int(max(0, min(100, overlap * 100)))
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity
        vec = TfidfVectorizer(stop_words="english", ngram_range=(1,2))
        tfidf = vec.fit_transform([question, transcript])
        sim = cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0]
        # Scale: cosine 0-1 -> 0-100, but TF-IDF on short texts gives low values, so stretch
        # Use linear stretch: score = sim*100, but boost if sim>0.2
        score = sim * 100
        # If concept overlap is high but TF-IDF low (paraphrasing), blend with overlap
        overlap = len(q_tokens & t_tokens) / len(q_tokens) * 100
        # Blend: 70% TF-IDF, 30% overlap for robustness
        blended = 0.7 * score + 0.3 * overlap
        return int(max(0, min(100, round(blended))))
    except Exception as e:
        logger.warning(f"TF-IDF failed fallback to overlap: {e}")
        overlap = len(q_tokens & t_tokens) / max(1, len(q_tokens)) * 100
        return int(overlap)

def compute_concept_coverage(expected_concepts: List[str], keywords: List[str], transcript: str) -> Tuple[int, List[str], List[str]]:
    """
    Check which expected_concepts appear (substring or token overlap) in transcript.
    Also checks keywords as fallback.
    Returns (score 0-100, covered, missing)
    """
    if not expected_concepts and not keywords:
        return 50, [], []
    norm_trans = normalize_text(transcript)
    all_concepts = expected_concepts or []
    covered = []
    missing = []
    for concept in all_concepts:
        norm_concept = normalize_text(concept)
        # Direct substring
        if norm_concept and norm_concept in norm_trans:
            covered.append(concept)
            continue
        # Token overlap: if >=60% tokens of concept appear
        c_tokens = tokenize(concept)
        if not c_tokens:
            continue
        t_tokens = set(tokenize(transcript))
        hit = sum(1 for tok in c_tokens if tok in t_tokens)
        if hit / len(c_tokens) >= 0.6:
            covered.append(concept)
        else:
            missing.append(concept)
    total = len(all_concepts)
    if total == 0:
        # Use keywords fallback
        total = len(keywords)
        for kw in keywords:
            if normalize_text(kw) in norm_trans:
                covered.append(kw)
            else:
                missing.append(kw)
        if total == 0:
            return 50, [], []
    score = int(round(len(covered) / total * 100)) if total else 50
    return score, covered, missing

def compute_completeness(concept_score: int, transcript: str, expected_concepts: List[str]) -> int:
    """
    Lightweight: 0.5*concept + 0.3*length + 0.2*explanation presence.
    Length score: ideal 50-150 words => 80, too short <20 => low, long >250 => 70.
    """
    words = tokenize(transcript)
    n = len(words)
    if n == 0:
        return 0
    # Length score
    if n < 10:
        length_score = 20 + n * 3  # 20-50
    elif n < 50:
        length_score = 50 + (n - 10) * 0.75  # 50-80
    elif n < 150:
        length_score = 80 + (n - 50) * 0.1  # 80-90
    elif n < 250:
        length_score = 90 - (n - 150) * 0.1  # 90-80
    else:
        length_score = 75
    length_score = max(0, min(100, length_score))

    # Explanation marker presence
    norm = normalize_text(transcript)
    has_explanation = any(m in norm for m in EXPLANATION_MARKERS)
    expl_score = 75 if has_explanation else 45
    if n > 30 and has_explanation:
        expl_score = 85

    score = 0.5 * concept_score + 0.3 * length_score + 0.2 * expl_score
    return int(max(0, min(100, round(score))))

def compute_clarity(transcript: str) -> int:
    """
    Measurable linguistic indicators: filler ratio, repetition, sentence structure.
    """
    if not transcript or not transcript.strip():
        return 0
    words = tokenize(transcript)
    n = len(words)
    if n == 0:
        return 0
    # Filler ratio
    filler_count = 0
    low = normalize_text(transcript)
    for fw in FILLER_WORDS:
        # Count phrase occurrences
        filler_count += low.count(fw)
    filler_ratio = filler_count / max(1, n)
    filler_score = max(0, 100 - filler_ratio * 400)  # each 1% filler reduces 4 points
    # Repetition: proportion of duplicate words (unique vs total)
    uniq_ratio = len(set(words)) / max(1, n)
    repetition_score = uniq_ratio * 100  # more unique => clearer
    # Sentence structure: avg words per sentence, ideal 12-20
    sentences = [s for s in re.split(r"[.!?]+", transcript) if s.strip()]
    avg_len = n / max(1, len(sentences))
    if 12 <= avg_len <= 20:
        struct_score = 90
    elif 8 <= avg_len <= 25:
        struct_score = 75
    elif avg_len < 5:
        struct_score = 50
    else:
        struct_score = 60
    # Blend
    score = 0.4 * filler_score + 0.3 * repetition_score + 0.3 * struct_score
    return int(max(0, min(100, round(score))))

def compute_grammar(transcript: str) -> int:
    """
    Lightweight: don't heavily penalize conversational speech.
    Baseline 75, adjust slightly based on signals.
    """
    if not transcript or not transcript.strip():
        return 0
    words = tokenize(transcript)
    n = len(words)
    if n < 5:
        return 60
    # If nltk available, could check but keep simple
    # Penalize very long sentences without punctuation or excessive filler
    sentences = [s for s in re.split(r"[.!?]+", transcript) if s.strip()]
    # Count punctuation density
    punct = transcript.count(".") + transcript.count(",") + transcript.count("?")
    punct_ratio = punct / max(1, n)
    # Ideal punct ~0.08-0.12
    if 0.05 <= punct_ratio <= 0.15:
        base = 85
    elif punct_ratio < 0.02:
        base = 70
    else:
        base = 75
    # Slightly reduce if many fillers
    low = normalize_text(transcript)
    filler = sum(low.count(fw) for fw in FILLER_WORDS)
    if filler > n * 0.08:
        base -= 10
    return int(max(0, min(100, base)))

def compute_fluency(transcript: str, duration: Optional[float]) -> int:
    """
    WPM + filler count. Ideal WPM 110-160 for interview speech.
    """
    if not transcript or not transcript.strip():
        return 0
    words = tokenize(transcript)
    n = len(words)
    # Filler penalty
    low = normalize_text(transcript)
    filler = sum(low.count(fw) for fw in FILLER_WORDS)
    filler_ratio = filler / max(1, n)
    filler_score = max(0, 100 - filler_ratio * 500)
    if duration and duration > 0:
        wpm = n / (duration / 60)
        if 110 <= wpm <= 160:
            wpm_score = 90
        elif 90 <= wpm <= 180:
            wpm_score = 75
        elif wpm < 60:
            wpm_score = 40
        elif wpm > 200:
            wpm_score = 50
        else:
            wpm_score = 65
        score = 0.5 * filler_score + 0.5 * wpm_score
    else:
        # No duration: estimate via words (assume ~130 wpm)
        estimated_duration = n / 130 * 60
        # Still use filler primarily
        score = 0.7 * filler_score + 0.3 * 70
    return int(max(0, min(100, round(score))))

def evaluate_answer(question_text: str, expected_concepts: List[str], keywords: List[str], transcript: str, duration: Optional[float] = None) -> Dict:
    """
    Main entry. Returns dict per §28 output.
    """
    # Handle empty transcript
    if not transcript or not transcript.strip():
        return {
            "relevance": 0,
            "concept_coverage": 0,
            "completeness": 0,
            "clarity": 0,
            "grammar": 0,
            "fluency": 0,
            "content_score": 0,
            "covered_concepts": [],
            "missing_concepts": expected_concepts or keywords or [],
            "coverage_score": 0,
        }

    relevance = compute_relevance(question_text, transcript)
    concept_score, covered, missing = compute_concept_coverage(expected_concepts, keywords, transcript)
    completeness = compute_completeness(concept_score, transcript, expected_concepts)
    clarity = compute_clarity(transcript)
    grammar = compute_grammar(transcript)
    fluency = compute_fluency(transcript, duration)

    # Content score weighted
    content_score = (
        WEIGHTS["relevance"] * relevance +
        WEIGHTS["concept_coverage"] * concept_score +
        WEIGHTS["completeness"] * completeness +
        WEIGHTS["clarity"] * clarity +
        WEIGHTS["grammar"] * grammar +
        WEIGHTS["fluency"] * fluency
    )
    content_score = int(max(0, min(100, round(content_score))))

    return {
        "relevance": relevance,
        "concept_coverage": concept_score,
        "completeness": completeness,
        "clarity": clarity,
        "grammar": grammar,
        "fluency": fluency,
        "content_score": content_score,
        "covered_concepts": covered,
        "missing_concepts": missing,
        "coverage_score": concept_score,
    }
