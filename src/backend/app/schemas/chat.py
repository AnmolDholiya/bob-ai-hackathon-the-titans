"""Pydantic schemas for PortMind Chatbot."""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = "user"
    content: str


class ChatRequest(BaseModel):
    messages: Optional[List[ChatMessage]] = None
    message: Optional[str] = None
    history: Optional[List[Dict[str, Any]]] = None
    vessel_id: Optional[int] = None
    context_page: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    reply: Optional[str] = None
    suggested_questions: List[str] = Field(default_factory=list)
    ai_provider: str = "gemini"  # gemini | local_rules

    def model_post_init(self, __context: Any) -> None:
        if not self.reply:
            self.reply = self.response
