"""Push notification service using the Expo Push API."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List

import httpx

from config import settings

logger = logging.getLogger(__name__)


async def send_push_notification(
    token: str,
    title: str,
    body: str,
    data: Optional[Dict[str, Any]] = None,
    sound: str = "default",
    badge: Optional[int] = None,
) -> Dict[str, Any]:
    """Send a single push notification via the Expo Push API.

    Args:
        token: Expo push token (ExponentPushToken[...]).
        title: Notification title.
        body: Notification body text.
        data: Optional extra data payload sent to the client.
        sound: Notification sound ('default' or None for silent).
        badge: Optional badge count for iOS.

    Returns:
        The Expo API response dict for this message.

    Raises:
        httpx.HTTPStatusError: If the Expo API returns a non-2xx status.
    """
    payload: Dict[str, Any] = {
        "to": token,
        "title": title,
        "body": body,
        "sound": sound,
    }
    if data:
        payload["data"] = data
    if badge is not None:
        payload["badge"] = badge

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            settings.EXPO_PUSH_URL,
            json=payload,
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
        )
        response.raise_for_status()
        result = response.json()
        logger.info("Push notification sent to %s: %s", token[:30], result)
        return result


async def send_bulk_push_notifications(
    tokens: List[str],
    title: str,
    body: str,
    data: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    """Send the same notification to multiple Expo push tokens.

    Expo allows up to 100 messages per batch request.

    Args:
        tokens: List of Expo push tokens.
        title: Notification title.
        body: Notification body.
        data: Optional data payload.

    Returns:
        List of Expo API response dicts.
    """
    messages = [
        {"to": token, "title": title, "body": body, "sound": "default", "data": data or {}}
        for token in tokens
    ]

    results: List[Dict[str, Any]] = []
    # Send in batches of 100
    for i in range(0, len(messages), 100):
        batch = messages[i : i + 100]
        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                response = await client.post(
                    settings.EXPO_PUSH_URL,
                    json=batch,
                    headers={
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                    },
                )
                response.raise_for_status()
                results.extend(response.json().get("data", []))
            except httpx.HTTPError as exc:
                logger.error("Bulk push failed for batch %d: %s", i // 100, exc)

    return results


def schedule_task_reminder(task_due_date: datetime, task_title: str) -> Optional[datetime]:
    """Calculate the ideal reminder time for a task.

    Sends a reminder 1 hour before the due date, or immediately if due within an hour.

    Args:
        task_due_date: The task's due datetime (UTC).
        task_title: Title for logging purposes.

    Returns:
        The datetime when the reminder should fire, or None if the task is already past.
    """
    now = datetime.now(timezone.utc)
    if task_due_date.tzinfo is None:
        task_due_date = task_due_date.replace(tzinfo=timezone.utc)

    if task_due_date <= now:
        logger.debug("Task '%s' is already past due — no reminder scheduled.", task_title)
        return None

    reminder_time = task_due_date - timedelta(hours=1)
    if reminder_time <= now:
        # Less than 1 hour to go — remind now
        reminder_time = now + timedelta(minutes=1)

    return reminder_time


def schedule_focus_reminder(
    session_duration_minutes: int,
    session_start: datetime,
) -> Optional[datetime]:
    """Calculate the end-of-session notification time for a focus session.

    Args:
        session_duration_minutes: Planned session length in minutes.
        session_start: When the session started (UTC).

    Returns:
        The datetime when the end-of-session notification should fire.
    """
    if session_start.tzinfo is None:
        session_start = session_start.replace(tzinfo=timezone.utc)

    return session_start + timedelta(minutes=session_duration_minutes)


async def notify_task_due_soon(
    token: str,
    task_title: str,
    due_in_minutes: int,
) -> None:
    """Send a task due-soon push notification.

    Args:
        token: User's Expo push token.
        task_title: Title of the task.
        due_in_minutes: How many minutes until the task is due.
    """
    if due_in_minutes <= 0:
        body = f'"{task_title}" is overdue!'
    elif due_in_minutes < 60:
        body = f'"{task_title}" is due in {due_in_minutes} minutes.'
    else:
        hours = due_in_minutes // 60
        body = f'"{task_title}" is due in {hours} hour{"s" if hours > 1 else ""}.'

    await send_push_notification(
        token=token,
        title="Task Reminder",
        body=body,
        data={"type": "task_reminder", "task_title": task_title},
    )


async def notify_focus_session_complete(token: str, session_title: Optional[str] = None) -> None:
    """Send an end-of-focus-session notification.

    Args:
        token: User's Expo push token.
        session_title: Optional title of what they were working on.
    """
    body = "Great work! Take a short break."
    if session_title:
        body = f'Session "{session_title}" complete. Take a well-earned break!'

    await send_push_notification(
        token=token,
        title="Focus Session Complete",
        body=body,
        data={"type": "focus_complete"},
        sound="default",
    )
