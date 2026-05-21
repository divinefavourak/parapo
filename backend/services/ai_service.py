"""AI service: OpenAI GPT-4o-mini integration for PARAPO features."""

import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional

from openai import AsyncOpenAI

from config import settings
from schemas.ai import (
    ChatMessage,
    ExtractedTask,
    ActionItem,
    SummarizeMeetingResponse,
    StudyPlanResponse,
)

logger = logging.getLogger(__name__)

_client: Optional[AsyncOpenAI] = None


def _get_client() -> AsyncOpenAI:
    """Lazily initialise the OpenAI client so import doesn't fail without a key."""
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


MODEL = "gpt-4o-mini"


# ── Internal helper ───────────────────────────────────────────────────────────

async def _chat_completion(
    messages: List[Dict[str, str]],
    temperature: float = 0.7,
    max_tokens: int = 1024,
    response_format: Optional[Dict] = None,
) -> str:
    """Call OpenAI chat completions and return the response content string.

    Args:
        messages: List of role/content dicts.
        temperature: Sampling temperature.
        max_tokens: Maximum output tokens.
        response_format: Optional dict e.g. {"type": "json_object"}.

    Returns:
        The model's response text.
    """
    client = _get_client()
    kwargs: Dict[str, Any] = {
        "model": MODEL,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if response_format:
        kwargs["response_format"] = response_format

    response = await client.chat.completions.create(**kwargs)
    return response.choices[0].message.content or ""


# ── Public service functions ──────────────────────────────────────────────────

async def generate_daily_briefing(
    tasks: List[Dict[str, Any]],
    meetings: List[Dict[str, Any]],
    assignments: List[Dict[str, Any]],
    user_name: str = "Leader",
) -> str:
    """Generate a personalised daily briefing for a student leader.

    Summarises upcoming tasks, meetings, and assignment deadlines into a concise
    motivating briefing paragraph.

    Args:
        tasks: List of task dicts with at least 'title', 'priority', 'due_date'.
        meetings: List of meeting dicts with 'title', 'scheduled_time', 'location'.
        assignments: List of assignment dicts with 'title', 'due_date', 'status'.
        user_name: The user's first name for personalisation.

    Returns:
        A briefing text string (2-4 paragraphs).
    """
    today = datetime.utcnow().strftime("%A, %B %d, %Y")

    context_parts = [f"Today is {today}. User: {user_name}."]

    if tasks:
        task_summaries = [
            f"- {t.get('title')} ({t.get('priority', 'medium')} priority"
            + (f", due {t.get('due_date')}" if t.get("due_date") else "") + ")"
            for t in tasks[:10]
        ]
        context_parts.append("Pending tasks:\n" + "\n".join(task_summaries))

    if meetings:
        meeting_summaries = [
            f"- {m.get('title')} at {m.get('scheduled_time')}"
            + (f" ({m.get('location')})" if m.get("location") else "")
            for m in meetings[:5]
        ]
        context_parts.append("Upcoming meetings:\n" + "\n".join(meeting_summaries))

    if assignments:
        assignment_summaries = [
            f"- {a.get('title')} due {a.get('due_date')} [{a.get('status', 'pending')}]"
            for a in assignments[:5]
        ]
        context_parts.append("Assignments:\n" + "\n".join(assignment_summaries))

    system_prompt = (
        "You are PARAPO AI, a personal assistant for student leaders in Nigerian universities. "
        "Your tone is professional yet encouraging, like a capable chief of staff. "
        "Write a concise daily briefing (2-4 short paragraphs) covering key priorities, "
        "any urgent items, and a motivating closing sentence. Do not use bullet points in the briefing."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": "\n\n".join(context_parts)},
    ]

    return await _chat_completion(messages, temperature=0.7, max_tokens=512)


async def chat_with_ai(
    messages: List[ChatMessage],
    user_context: Optional[Dict[str, Any]] = None,
) -> tuple[str, Optional[Dict[str, int]]]:
    """Multi-turn chat with the PARAPO AI assistant.

    Args:
        messages: Conversation history (role + content).
        user_context: Optional context dict (upcoming tasks, GPA, etc.) injected
                      as a system addendum.

    Returns:
        Tuple of (reply_text, usage_dict).
    """
    system_content = (
        "You are PARAPO AI, a smart productivity assistant for student leaders. "
        "You help with task management, academic planning, leadership advice, focus strategies, "
        "and general student life questions. Be concise, practical, and encouraging. "
        "When asked to create tasks or notes, remind the user they can use the dedicated endpoints."
    )

    if user_context:
        system_content += f"\n\nUser context: {json.dumps(user_context, default=str)}"

    api_messages = [{"role": "system", "content": system_content}]
    for msg in messages:
        api_messages.append({"role": msg.role, "content": msg.content})

    client = _get_client()
    response = await client.chat.completions.create(
        model=MODEL,
        messages=api_messages,
        temperature=0.7,
        max_tokens=800,
    )

    reply = response.choices[0].message.content or ""
    usage = None
    if response.usage:
        usage = {
            "prompt_tokens": response.usage.prompt_tokens,
            "completion_tokens": response.usage.completion_tokens,
            "total_tokens": response.usage.total_tokens,
        }

    return reply, usage


async def summarize_meeting_notes(
    notes: str,
    meeting_title: Optional[str] = None,
) -> SummarizeMeetingResponse:
    """Summarise raw meeting notes into structured output.

    Produces a summary, key decisions, action items (with optional assignees/
    due dates), and next steps.

    Args:
        notes: Raw notes text from the meeting.
        meeting_title: Optional title for better context.

    Returns:
        SummarizeMeetingResponse with structured fields.
    """
    title_context = f' for meeting "{meeting_title}"' if meeting_title else ""
    prompt = (
        f"Summarise the following meeting notes{title_context}. "
        "Return a JSON object with these exact keys:\n"
        "- summary: string (2-3 sentence overview)\n"
        "- key_decisions: array of strings\n"
        "- action_items: array of objects with fields: description (string), "
        "  assigned_to (string or null), due_date (string or null)\n"
        "- next_steps: array of strings\n\n"
        f"NOTES:\n{notes}"
    )

    messages = [
        {"role": "system", "content": "You are a precise meeting summariser. Always respond with valid JSON."},
        {"role": "user", "content": prompt},
    ]

    raw = await _chat_completion(
        messages,
        temperature=0.3,
        max_tokens=1024,
        response_format={"type": "json_object"},
    )

    try:
        data = json.loads(raw)
        action_items = [ActionItem(**item) for item in data.get("action_items", [])]
        return SummarizeMeetingResponse(
            summary=data.get("summary", ""),
            key_decisions=data.get("key_decisions", []),
            action_items=action_items,
            next_steps=data.get("next_steps", []),
        )
    except (json.JSONDecodeError, KeyError) as exc:
        logger.error("Failed to parse AI meeting summary: %s", exc)
        return SummarizeMeetingResponse(
            summary=raw,
            key_decisions=[],
            action_items=[],
            next_steps=[],
        )


async def extract_tasks_from_text(text: str) -> List[ExtractedTask]:
    """Extract actionable tasks from free-form text.

    Useful for converting meeting notes, voice memos, or messages into tasks.

    Args:
        text: The raw text to analyse.

    Returns:
        A list of ExtractedTask objects.
    """
    prompt = (
        "Extract all actionable tasks from the following text. "
        "Return a JSON object with key 'tasks' containing an array. "
        "Each task has: title (string), description (string or null), "
        "priority ('high'|'medium'|'low'), category (string or null), "
        "due_date (ISO date string or null).\n\n"
        f"TEXT:\n{text}"
    )

    messages = [
        {"role": "system", "content": "You are a task extraction assistant. Always respond with valid JSON."},
        {"role": "user", "content": prompt},
    ]

    raw = await _chat_completion(
        messages,
        temperature=0.2,
        max_tokens=1024,
        response_format={"type": "json_object"},
    )

    try:
        data = json.loads(raw)
        return [ExtractedTask(**t) for t in data.get("tasks", [])]
    except (json.JSONDecodeError, KeyError) as exc:
        logger.error("Failed to parse extracted tasks: %s", exc)
        return []


async def analyze_workload(
    tasks: List[Dict[str, Any]],
    sessions: List[Dict[str, Any]],
) -> str:
    """Provide a workload analysis based on current tasks and focus sessions.

    Args:
        tasks: List of task dicts (title, priority, status, due_date).
        sessions: List of recent focus session dicts (mode, duration_minutes, is_completed).

    Returns:
        A natural-language workload analysis string.
    """
    task_summary = json.dumps(tasks[:15], default=str)
    session_summary = json.dumps(sessions[:20], default=str)

    prompt = (
        "Analyse the following student leader's workload data.\n\n"
        f"Tasks (up to 15): {task_summary}\n\n"
        f"Recent focus sessions (up to 20): {session_summary}\n\n"
        "Provide a 2-3 paragraph analysis covering: workload level (light/moderate/heavy), "
        "areas of concern, focus habit quality, and 2-3 concrete recommendations."
    )

    messages = [
        {"role": "system", "content": "You are a productivity coach for student leaders. Be direct and actionable."},
        {"role": "user", "content": prompt},
    ]

    return await _chat_completion(messages, temperature=0.6, max_tokens=600)


async def generate_study_plan(
    courses: List[Dict[str, Any]],
    assignments: List[Dict[str, Any]],
) -> StudyPlanResponse:
    """Generate a personalised study plan based on current courses and assignments.

    Args:
        courses: List of course dicts (code, title, credits, current_grade, status).
        assignments: List of assignment dicts (title, due_date, priority, status, course).

    Returns:
        StudyPlanResponse with recommendations, weekly plan, and priority courses.
    """
    prompt = (
        "Generate a personalised weekly study plan for a student leader.\n\n"
        f"Courses: {json.dumps(courses[:10], default=str)}\n\n"
        f"Upcoming assignments: {json.dumps(assignments[:15], default=str)}\n\n"
        "Return a JSON object with:\n"
        "- recommendations: array of strings (3-5 strategic advice items)\n"
        "- weekly_plan: object mapping day names (Monday-Sunday) to arrays of study activities\n"
        "- priority_courses: array of course codes/titles that need most attention"
    )

    messages = [
        {"role": "system", "content": "You are an academic advisor. Always respond with valid JSON."},
        {"role": "user", "content": prompt},
    ]

    raw = await _chat_completion(
        messages,
        temperature=0.4,
        max_tokens=1200,
        response_format={"type": "json_object"},
    )

    try:
        data = json.loads(raw)
        return StudyPlanResponse(
            recommendations=data.get("recommendations", []),
            weekly_plan=data.get("weekly_plan", {}),
            priority_courses=data.get("priority_courses", []),
        )
    except (json.JSONDecodeError, KeyError) as exc:
        logger.error("Failed to parse study plan: %s", exc)
        return StudyPlanResponse(
            recommendations=["Review your syllabi and prioritise upcoming deadlines."],
            weekly_plan={},
            priority_courses=[],
        )
