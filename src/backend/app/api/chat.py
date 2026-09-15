"""PortMind Chatbot API — POST /api/chat"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.chat import ChatMessage, ChatRequest, ChatResponse
from app.services import chat as svc

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse, summary="PortMind domain-scoped chatbot")
async def chat_endpoint(req: ChatRequest, db: AsyncSession = Depends(get_db)):
    """
    Answers questions strictly regarding PortMind, vessel tracking, delay predictions,
    berths, cranes, 72h operational plans, and CSV imports.
    """
    msgs = list(req.messages or [])
    if not msgs and req.message:
        for h in (req.history or []):
            role = h.get("role", "user")
            content = h.get("content", "")
            msgs.append(ChatMessage(role=role, content=content))
        msgs.append(ChatMessage(role="user", content=req.message))

    return await svc.process_chat(db, messages=msgs, vessel_id=req.vessel_id)
