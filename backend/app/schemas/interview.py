from pydantic import BaseModel, Field
from typing import List, Optional

class InterviewCreate(BaseModel):
    interview_type: str = Field(..., description="HR, Technical, Behavioral, Domain-specific")
    domain: str = Field(..., description="AI/ML, Computer Science, etc")
    role: str = Field(default="General")
    difficulty: str = Field(default="medium")
    question_count: int = Field(default=10, ge=5, le=15)

class InterviewResponse(BaseModel):
    session_id: str = Field(alias="_id")
    interview_type: str
    domain: str
    role: str
    difficulty: str
    question_count: int
    questions: List[dict]
    current_question: int = 0
    status: str
    started_at: Optional[str] = None

    class Config:
        populate_by_name = True
