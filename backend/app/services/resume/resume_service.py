import re
import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

# Known tech keywords for lightweight extraction §51
TECH_KEYWORDS = [
    "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust", "php", "ruby", "swift", "kotlin",
    "tensorflow", "pytorch", "keras", "scikit-learn", "numpy", "pandas", "opencv", "mediapipe",
    "machine learning", "deep learning", "ai/ml", "artificial intelligence", "data science", "nlp", "computer vision",
    "react", "angular", "vue", "node", "express", "django", "flask", "fastapi", "spring",
    "sql", "mysql", "mongodb", "postgresql", "redis", "docker", "kubernetes", "aws", "azure", "gcp",
    "git", "linux", "rest", "api", "microservices", "agile", "scrum"
]

def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        from PyPDF2 import PdfReader
        import io
        reader = PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text += t + "\n"
        return text
    except Exception as e:
        logger.warning(f"PyPDF2 failed: {e}")
        raise

def extract_text_from_docx(file_bytes: bytes) -> str:
    try:
        from docx import Document
        import io
        doc = Document(io.BytesIO(file_bytes))
        text = "\n".join([p.text for p in doc.paragraphs])
        # Also tables
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    text += "\n" + cell.text
        return text
    except Exception as e:
        logger.warning(f"python-docx failed: {e}")
        raise

def extract_text(file_bytes: bytes, filename: str, content_type: str) -> str:
    fname = (filename or "").lower()
    ctype = (content_type or "").lower()
    if fname.endswith(".pdf") or "pdf" in ctype:
        return extract_text_from_pdf(file_bytes)
    elif fname.endswith(".docx") or "officedocument" in ctype or "msword" in ctype:
        return extract_text_from_docx(file_bytes)
    elif fname.endswith(".doc"):
        raise ValueError("Legacy .doc not supported, please use PDF or DOCX")
    else:
        # Try PDF first, then DOCX
        try:
            return extract_text_from_pdf(file_bytes)
        except:
            return extract_text_from_docx(file_bytes)

def extract_keywords(text: str) -> Dict[str, List[str]]:
    low = text.lower()
    found_tech = []
    for kw in TECH_KEYWORDS:
        # Use word boundary for short kws
        pattern = r"\b" + re.escape(kw) + r"\b"
        if re.search(pattern, low):
            found_tech.append(kw)
    # Also extract simple sections via regex
    skills = re.findall(r"skills\s*[:\-]?\s*([^\n]+)", low, flags=re.I)
    projects = re.findall(r"project[s]?\s*[:\-]?\s*([^\n]+)", low, flags=re.I)
    education = re.findall(r"education\s*[:\-]?\s*([^\n]+)", low, flags=re.I)
    experience = re.findall(r"experience\s*[:\-]?\s*([^\n]+)", low, flags=re.I)
    return {
        "technologies": list(dict.fromkeys(found_tech))[:15],
        "skills_raw": skills[:3],
        "projects_raw": projects[:3],
        "education_raw": education[:3],
        "experience_raw": experience[:3],
        "text_length": len(text),
        "word_count": len(text.split())
    }

def generate_personalized_questions(keywords: Dict, db_questions: List[Dict], count: int = 3) -> List[Dict]:
    """
    Select questions matching resume technologies, plus generate simple personalized Qs if needed.
    Keeps lightweight without LLM.
    """
    techs = [t.lower() for t in keywords.get("technologies", [])]
    if not techs:
        return []
    # Match DB questions by domain/keywords — only Technical for resume personalization
    matched = []
    for q in db_questions:
        if q.get("interview_type") != "Technical":
            continue
        q_techs = [k.lower() for k in q.get("keywords", [])] + [q.get("domain","").lower()]
        # Check overlap with stricter exact word match (avoid "learning" substring matching HR)
        for t in techs:
            if any(t == qt or (len(t) > 3 and t in qt) for qt in q_techs):
                matched.append(q)
                break
    # Deduplicate
    seen = set()
    uniq = []
    for m in matched:
        mid = str(m.get("_id"))
        if mid not in seen:
            seen.add(mid)
            uniq.append(m)
    # If not enough, generate simple personalized questions per §51
    personalized = []
    # Generate up to count personalized
    if len(uniq) < count:
        # Simple templates
        for tech in techs[:3]:
            if len(personalized) + len(uniq) >= count:
                break
            # Capitalize
            tech_cap = tech.title()
            personalized.append({
                "_id": f"personalized_{tech_cap.lower().replace(' ', '_')}",
                "question_text": f"Explain a project you built using {tech_cap} and the challenges you faced.",
                "interview_type": "Technical",
                "domain": tech_cap if tech_cap in ["Python", "TensorFlow", "React"] else "General",
                "role": "General",
                "difficulty": "medium",
                "expected_concepts": [tech, "project", "challenges", "solution"],
                "keywords": [tech.lower(), "project", "challenges"],
                "follow_up_questions": [f"Why did you choose {tech_cap}?"],
                "is_personalized": True
            })
            if len(personalized) + len(uniq) < count and len(techs) > 1:
                personalized.append({
                    "_id": f"personalized_{tech_cap.lower()}_2",
                    "question_text": f"How did you evaluate or test your work with {tech_cap}?",
                    "interview_type": "Technical",
                    "domain": tech_cap,
                    "role": "General",
                    "difficulty": "medium",
                    "expected_concepts": ["evaluation", "testing", "metrics"],
                    "keywords": [tech.lower(), "evaluation"],
                    "follow_up_questions": [],
                    "is_personalized": True
                })
                if len(personalized) + len(uniq) >= count:
                    break
    # Return up to count, prefer matched DB first
    result = uniq[:count]
    if len(result) < count:
        result += personalized[:count - len(result)]
    return result[:count]
