"""PortMind Domain-Restricted Chatbot Service.

Provides expert conversational assistance on vessel congestion, berths, cranes,
operational schedules, and CSV imports. Politely refuses unrelated queries.
"""
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.port import Port
from app.models.vessel import Vessel
from app.schemas.chat import ChatMessage, ChatResponse
from app.services.gemini import call_gemini_generate, is_gemini_configured

# Refusal keywords for strict scope enforcement
DISALLOWED_TOPICS = [
    "poem", "joke", "weather", "president", "election", "game", "movie",
    "song", "recipe", "story", "riddle", "bitcoin", "crypto", "dating",
]

SUGGESTIONS = [
    "Which vessels have high congestion risk?",
    "How does the 72-hour operational plan work?",
    "What is the status of arrival ports and berths?",
    "How do I import fleet CSV data?",
]


async def process_chat(db: AsyncSession, messages: List[ChatMessage], vessel_id: Optional[int] = None) -> ChatResponse:
    """Handle chat queries with live operational context and strict scope bounds."""
    if not messages:
        return ChatResponse(
            response="Hello, Port Controller. I am your PortMind Maritime Operations Assistant. How can I assist you with vessel tracking, congestion predictions, or berth assignments today?",
            suggested_questions=SUGGESTIONS,
            ai_provider="local_rules",
        )

    last_user_msg = messages[-1].content.strip().lower()

    # Scope check: refuse out-of-scope requests immediately
    if any(k in last_user_msg for k in DISALLOWED_TOPICS):
        return ChatResponse(
            response="I am PortMind's dedicated Maritime Operations Assistant. I can only assist with port management, vessel delay predictions, berth & crane allocations, and operational scheduling. Please ask a maritime or port-related question.",
            suggested_questions=SUGGESTIONS,
            ai_provider="local_rules",
        )

    # Fetch live operational context
    v_res = await db.execute(select(Vessel))
    all_vessels = list(v_res.scalars().all())
    total_vessels = len(all_vessels)
    delayed_vessels = [v for v in all_vessels if (v.delay_hours and v.delay_hours > 0) or v.status == "delayed"]
    high_risk = [v for v in all_vessels if v.congestion_risk == "high"]

    p_res = await db.execute(select(Port))
    ports = list(p_res.scalars().all())

    context_summary = (
        f"Active Fleet: {total_vessels} vessels. "
        f"Delayed: {len(delayed_vessels)} vessels. "
        f"High Congestion Risk: {len(high_risk)} vessels ({', '.join([v.vessel_name for v in high_risk[:3]]) or 'None'}). "
        f"Monitored Ports: {len(ports)} ({', '.join([p.port_code for p in ports[:4]])})."
    )

    if is_gemini_configured():
        system_instruction = (
            "You are PortMind AI, a maritime operations specialist. "
            "Help port operators manage vessel congestion, understand ML delay predictions (XGBoost + LightGBM), "
            "and optimize berth/crane operations. Keep responses professional, succinct, and operationally focused. "
            f"Current PortMind Context: {context_summary}. "
            "If asked anything outside maritime logistics or PortMind, decline politely."
        )

        conversation = "\n".join([f"{m.role}: {m.content}" for m in messages[-5:]])
        ai_reply = await call_gemini_generate(
            prompt=conversation, system_instruction=system_instruction
        )
        if ai_reply:
            return ChatResponse(
                response=ai_reply.strip(),
                suggested_questions=SUGGESTIONS,
                ai_provider="gemini",
            )

    # Local rule-based responses if Gemini key is not configured or offline
    if "high risk" in last_user_msg or "congestion" in last_user_msg:
        if high_risk:
            names = ", ".join([f"{v.vessel_name} (ETA: {v.arrival_port_code or 'Port'})" for v in high_risk[:4]])
            reply = f"Currently, {len(high_risk)} vessel(s) are flagged with elevated congestion risk: {names}. You can trigger Gemini rescheduling from the Operations dashboard to optimize their arrival windows."
        else:
            reply = "All active vessels currently exhibit normal arrival profiles with low congestion probability."
    elif "delay" in last_user_msg:
        reply = f"There are {len(delayed_vessels)} delayed vessel(s) in the fleet out of {total_vessels} tracked vessels. Delays over 30 minutes trigger congestion risk evaluation."
    elif "csv" in last_user_msg or "import" in last_user_msg:
        reply = "To import fleet data, navigate to 'Data Import' from the sidebar. Upload your CSV with headers `imo_number`, `vessel_name`, and `status`. PortMind validates rows and automatically runs the ML congestion ensemble upon ingestion."
    elif "berth" in last_user_msg or "crane" in last_user_msg or "plan" in last_user_msg:
        reply = "Berths and cranes are assigned via deterministic optimization layered on ML risk predictions. High-risk vessels are prioritized for double-crane dispatch and expedited berth clearance in the 72-Hour Operations Plan."
    else:
        reply = f"PortMind Command Status: {context_summary} All XGBoost and LightGBM models are operational. You can view 72-hour allocations under 'Operations' or review fleet alerts in 'Alerts'."

    return ChatResponse(
        response=reply,
        suggested_questions=SUGGESTIONS,
        ai_provider="local_rules",
    )
