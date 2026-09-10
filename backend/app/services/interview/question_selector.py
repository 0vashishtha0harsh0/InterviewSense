import random
from typing import List, Dict

async def select_questions(
    db,
    interview_type: str,
    domain: str,
    role: str,
    difficulty: str,
    question_count: int,
    exclude_ids: List[str] = None
) -> List[Dict]:
    """
    Select questions based on filters, randomized, no duplicates, respect difficulty.
    Supports flexible domain matching: if domain is General, match all.
    """
    exclude_ids = exclude_ids or []
    # Build filter
    query: Dict = {}
    # Interview type exact match if not empty
    if interview_type and interview_type.lower() != "all":
        query["interview_type"] = interview_type
    # Domain: if domain is General or empty, don't filter domain strictly — allow all
    # Otherwise filter by domain
    if domain and domain.lower() not in ["general", "all", ""]:
        query["domain"] = domain
    # Difficulty: if provided, try to respect but fallback if insufficient
    # We'll attempt to filter by difficulty first
    difficulty_query = {**query}
    if difficulty and difficulty.lower() not in ["all", ""]:
        difficulty_query["difficulty"] = difficulty.lower()

    from bson import ObjectId
    exclude_oids = []
    for eid in exclude_ids:
        try:
            exclude_oids.append(ObjectId(eid))
        except:
            pass
    if exclude_oids:
        difficulty_query["_id"] = {"$nin": exclude_oids}
        query["_id"] = {"$nin": exclude_oids}

    # Try difficulty-specific
    candidates = await db.questions.find(difficulty_query).to_list(length=200)
    # If insufficient, fallback to any difficulty within same type/domain
    if len(candidates) < question_count:
        fallback_query = {**query}
        if exclude_oids:
            fallback_query["_id"] = {"$nin": exclude_oids}
        # Exclude already candidates ids
        candidate_ids = {str(c["_id"]) for c in candidates}
        extra = await db.questions.find(fallback_query).to_list(length=200)
        for doc in extra:
            if str(doc["_id"]) not in candidate_ids:
                candidates.append(doc)
            if len(candidates) >= question_count * 2:
                break

    # Deduplicate by _id
    seen = set()
    uniq = []
    for c in candidates:
        sid = str(c["_id"])
        if sid not in seen:
            seen.add(sid)
            uniq.append(c)
    candidates = uniq

    if len(candidates) < question_count:
        # Not enough questions at all
        return []

    # Randomize
    random.shuffle(candidates)
    selected = candidates[:question_count]
    # Convert _id to string for serialization
    for s in selected:
        s["_id"] = str(s["_id"])
    return selected

def adaptive_next_difficulty(prev_score: int, current_difficulty: str) -> str:
    """
    Lightweight adaptive rule per §15:
    >=80 harder, 60-79 same, <60 easier/fundamental
    """
    order = ["easy", "medium", "hard"]
    if current_difficulty not in order:
        current_difficulty = "medium"
    idx = order.index(current_difficulty)
    if prev_score >= 80 and idx < len(order)-1:
        return order[idx+1]
    if prev_score < 60 and idx > 0:
        return order[idx-1]
    return current_difficulty
