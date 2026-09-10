from typing import Dict, List, Optional

# Threshold per §44: <60 needs improvement
THRESHOLD = 60

def generate_feedback(nlp_metrics: Optional[Dict], cv_metrics: Optional[Dict], content_score: Optional[int], delivery_score: Optional[int]) -> Dict:
    """
    Generate strengths, improvements, recommendations based on actual scores.
    No psychological conclusions, only observable behavioral guidance per §36, §44.
    """
    strengths = []
    improvements = []
    recommendations = []

    if nlp_metrics:
        rel = nlp_metrics.get("relevance", 0)
        cov = nlp_metrics.get("concept_coverage", 0)
        comp = nlp_metrics.get("completeness", 0)
        clarity = nlp_metrics.get("clarity", 0)
        grammar = nlp_metrics.get("grammar", 0)
        fluency = nlp_metrics.get("fluency", 0)

        if rel < THRESHOLD:
            improvements.append("Relevance")
            recommendations.append("Focus directly on what the question asks and avoid unrelated information.")
        else:
            strengths.append("Good relevance")

        if cov < THRESHOLD:
            improvements.append("Concept coverage")
            missing = nlp_metrics.get("missing_concepts", [])
            if missing:
                recommendations.append(f"Include the important concepts expected for this question: {', '.join(missing[:3])}.")
            else:
                recommendations.append("Include the important concepts expected for this question.")
        else:
            strengths.append("Strong concept coverage")

        if comp < THRESHOLD:
            improvements.append("Completeness")
            recommendations.append("Expand your answer to cover key points with brief explanations and examples.")

        if clarity < THRESHOLD:
            improvements.append("Clarity")
            recommendations.append("Organize your answer with clearer sentence structure and fewer repetitions.")

        if fluency < THRESHOLD:
            improvements.append("Fluency")
            recommendations.append("Practice answering aloud with shorter pauses and fewer filler words (um, uh, like).")

        if grammar >= 80:
            strengths.append("Good grammar")
        elif grammar < THRESHOLD:
            improvements.append("Grammar")
            recommendations.append("Review basic sentence structure, but note conversational speech naturally contains fragments.")

    if cv_metrics:
        face = cv_metrics.get("face_presence", 100)
        eye = cv_metrics.get("eye_contact", 0)
        mov = cv_metrics.get("movement_indicator", 70)

        if face < THRESHOLD:
            improvements.append("Face presence")
            recommendations.append("Ensure your face is well-lit and centered in the camera for non-verbal analysis.")
        elif face >= 85:
            strengths.append("Consistent face presence")

        if eye is not None:
            if eye < THRESHOLD:
                improvements.append("Eye contact")
                recommendations.append("Try to maintain more consistent attention toward the camera.")
            elif eye >= 75:
                strengths.append("Good eye-contact consistency")

        if mov is not None:
            if mov < 50:
                improvements.append("Movement stability")
                recommendations.append("Try to minimize excessive head/face movement where comfortable.")
            elif mov >= 75:
                strengths.append("Stable delivery")

    if delivery_score is not None:
        if delivery_score >= 75:
            strengths.append("Strong delivery")
        elif delivery_score < THRESHOLD:
            improvements.append("Delivery")

    if content_score is not None:
        if content_score >= 75:
            strengths.append("Strong content")
        elif content_score < THRESHOLD:
            # already covered via sub-metrics
            pass

    # Deduplicate and limit
    strengths = list(dict.fromkeys(strengths))[:4]
    improvements = list(dict.fromkeys(improvements))[:4]
    recommendations = list(dict.fromkeys(recommendations))[:5]

    if not strengths:
        strengths = ["Answer completed"]
    if not improvements:
        improvements = ["Keep practicing to maintain performance"]
        recommendations = ["Continue mock interviews to build consistency."] if not recommendations else recommendations

    return {
        "strengths": strengths,
        "improvements": improvements,
        "recommendations": recommendations
    }

def aggregate_feedback(answers: list) -> Dict:
    """
    Aggregate strengths/improvements across all answers for final dashboard.
    """
    all_strengths = []
    all_improvements = []
    all_recs = []
    for ans in answers:
        fb = ans.get("feedback") or {}
        all_strengths.extend(fb.get("strengths", []))
        all_improvements.extend(fb.get("improvements", []))
        all_recs.extend(fb.get("recommendations", []))
    # Count frequency
    from collections import Counter
    # Most common strengths
    strengths = [k for k,_ in Counter(all_strengths).most_common(3)] if all_strengths else ["Completed interview"]
    improvements = [k for k,_ in Counter(all_improvements).most_common(3)] if all_improvements else ["Maintain consistency"]
    recs = list(dict.fromkeys(all_recs))[:5]
    return {"strengths": strengths, "improvements": improvements, "recommendations": recs}
