from pydantic import BaseModel, Field
from typing import List, Optional

class QuestionCreate(BaseModel):
    question_text: str = Field(..., min_length=10)
    interview_type: str = Field(..., description="HR, Technical, Behavioral, Domain-specific")
    domain: str = Field(..., description="AI/ML, Computer Science, etc")
    role: str = Field(default="General")
    difficulty: str = Field(default="medium", description="easy, medium, hard")
    expected_concepts: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)
    follow_up_questions: List[str] = Field(default_factory=list)

class QuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    interview_type: Optional[str] = None
    domain: Optional[str] = None
    role: Optional[str] = None
    difficulty: Optional[str] = None
    expected_concepts: Optional[List[str]] = None
    keywords: Optional[List[str]] = None
    follow_up_questions: Optional[List[str]] = None

class QuestionResponse(BaseModel):
    id: str = Field(alias="_id")
    question_text: str
    interview_type: str
    domain: str
    role: str
    difficulty: str
    expected_concepts: List[str] = []
    keywords: List[str] = []
    follow_up_questions: List[str] = []
    created_at: Optional[str] = None

    class Config:
        populate_by_name = True
