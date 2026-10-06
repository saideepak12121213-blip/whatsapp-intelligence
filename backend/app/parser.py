import re
import hashlib
import datetime
import logging
from typing import List, Dict, Optional, Tuple
from dateutil import parser as date_parser

logger = logging.getLogger("classflow.parser")

# Regex patterns for various WhatsApp export formats
# Supported formats:
# 1. Bracketed iOS: [DD/MM/YYYY, HH:MM:SS] Sender: Message or [M/D/YY, H:MM:SS AM] Sender: Message
# 2. Android Standard: DD/MM/YYYY, HH:MM - Sender: Message or M/D/YY, H:MM AM - Sender: Message
# Separators supported: '/', '.', '-'
PATTERNS = [
    # Format 1: [12/10/2026, 14:30:15] Sender: Message or [3/7/26, 3:05 PM] Sender: Message (iOS bracketed with sender)
    re.compile(r"^\[(\d{1,4}[/\.\-]\d{1,2}[/\.\-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[a-zA-Z\.]+)?)\]\s*(.*?):\s*(.*)$", re.DOTALL),
    # Format 2: 12/10/2026, 14:30 - Sender: Message or 3/7/26, 3:05 PM - Sender: Message (Android standard with sender)
    re.compile(r"^(\d{1,4}[/\.\-]\d{1,2}[/\.\-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[a-zA-Z\.]*)?)\s*[-–]\s*(.*?):\s*(.*)$", re.DOTALL),
    # Format 3: System messages or messages without colon after sender:
    re.compile(r"^\[(\d{1,4}[/\.\-]\d{1,2}[/\.\-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[a-zA-Z\.]+)?)\]\s*(.*)$", re.DOTALL),
    re.compile(r"^(\d{1,4}[/\.\-]\d{1,2}[/\.\-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[a-zA-Z\.]*)?)\s*[-–]\s*(.*)$", re.DOTALL),
]

SYSTEM_MESSAGE_INDICATORS = [
    "Messages and calls are end-to-end encrypted",
    "created group",
    "created community",
    "added you",
    "added",
    "changed the subject",
    "changed this group's icon",
    "is now a community admin",
    "is now an admin",
    "left",
    "removed",
    "changed their phone number",
    "security code changed",
    "waiting for this message",
    "This message was deleted",
    "Welcome to the community",
]

def sanitize_line(line: str) -> str:
    """Strip zero-width and invisible formatting characters commonly found in WhatsApp exports."""
    return line.replace('\u200e', '').replace('\u202f', ' ').replace('\ufeff', '').replace('\xa0', ' ')

def compute_file_hash(content_bytes: bytes) -> str:
    """Calculate SHA256 of the raw file content."""
    return hashlib.sha256(content_bytes).hexdigest()

def compute_message_hash(timestamp_str: str, sender: str, text: str) -> str:
    """
    Deterministic message hash: sha256(timestamp + sender + message_text).
    Allows reliable deduplication across repeated incremental uploads.
    """
    normalized_text = text.strip()
    data = f"{timestamp_str.strip()}|{sender.strip()}|{normalized_text}".encode('utf-8')
    return hashlib.sha256(data).hexdigest()

def parse_date_string(date_part: str, time_part: str) -> Tuple[datetime.datetime, str]:
    """
    Parse date and time parts into a valid Python datetime object with strict validation.
    Correctly supports:
    - 12-hour AM/PM format (converting 12 AM -> 00, 12 PM -> 12, 1 PM -> 13, etc.)
    - 24-hour format (validating hour in 0..23, 24:00 -> 00:00)
    - Single-digit hours (e.g. 3:05 PM, 9:00, 9:15 AM)
    - International date separators ('/', '.', '-')
    - Day-first vs Month-first international variations
    """
    clean_date = date_part.strip()
    clean_time = time_part.strip()
    combined = f"{clean_date} {clean_time}"

    try:
        # 1. Parse time component with explicit regex
        # Supports: "09:00", "9:05", "14:30", "11:00:12", "3:05 PM", "12:00 AM", "12:30 pm", "1:15 p.m."
        time_match = re.match(r'^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([a-zA-Z\.]*)?$', clean_time)
        if not time_match:
            # Fallback to dateutil
            norm_time = re.sub(r'([ap])\.[m]\.?', r'\1m', combined, flags=re.IGNORECASE)
            dt = date_parser.parse(norm_time, dayfirst=True)
            return dt, combined

        raw_hour = int(time_match.group(1))
        minute = int(time_match.group(2))
        second = int(time_match.group(3)) if time_match.group(3) else 0
        meridiem = time_match.group(4).strip().lower().replace('.', '') if time_match.group(4) else ''

        # Convert and validate hours
        if meridiem in ('am', 'pm'):
            # 12-hour clock standard: hours 1..12
            if raw_hour == 12:
                hour = 0 if meridiem == 'am' else 12
            elif meridiem == 'pm':
                hour = raw_hour + 12 if 1 <= raw_hour <= 11 else raw_hour
            else: # am
                hour = raw_hour if 1 <= raw_hour <= 11 else 0
        else:
            # 24-hour clock format
            hour = raw_hour
            if hour == 24 and minute == 0 and second == 0:
                hour = 0

        # Strict validation before Python datetime construction
        if not (0 <= hour <= 23):
            logger.warning(f"Hour out of range ({hour}) in time '{clean_time}'. Clamping to 0..23.")
            hour = max(0, min(23, hour))

        if not (0 <= minute <= 59):
            logger.warning(f"Minute out of range ({minute}) in time '{clean_time}'. Clamping to 0..59.")
            minute = max(0, min(59, minute))

        if not (0 <= second <= 59):
            second = 0

        # 2. Parse date component
        # Supports separators: '/', '.', '-'
        d_parts = re.split(r'[/\.\-]', clean_date)
        if len(d_parts) == 3:
            p1, p2, p3 = int(d_parts[0]), int(d_parts[1]), int(d_parts[2])
            # Determine year
            if len(d_parts[2]) == 4:
                year = p3
                # Determine day vs month
                if p1 > 12:
                    day, month = p1, p2
                elif p2 > 12:
                    month, day = p1, p2
                else:
                    # Default international day-first format (DD/MM/YYYY)
                    day, month = p1, p2
            elif len(d_parts[0]) == 4:
                # ISO YYYY-MM-DD
                year, month, day = p1, p2, p3
            else:
                # 2-digit year (e.g. 26 -> 2026)
                year = 2000 + p3 if p3 < 100 else p3
                if p1 > 12:
                    day, month = p1, p2
                elif p2 > 12:
                    month, day = p1, p2
                else:
                    day, month = p1, p2

            # Validate month and day
            month = max(1, min(12, month))
            day = max(1, min(31, day))

            try:
                dt = datetime.datetime(year, month, day, hour, minute, second)
                return dt, combined
            except ValueError:
                # If specific month day is out of range (e.g. Feb 30), fallback safely
                pass

        # 3. Fallback to dateutil if custom parsing encountered calendar exception
        norm_time = re.sub(r'([ap])\.[m]\.?', r'\1m', combined, flags=re.IGNORECASE)
        dt = date_parser.parse(norm_time, dayfirst=True)
        return dt, combined

    except Exception as e:
        logger.warning(f"Failed to parse timestamp '{combined}': {e}. Using current UTC time as fallback.")
        now = datetime.datetime.utcnow()
        return now, combined

class ParsedMessage:
    def __init__(self, timestamp: datetime.datetime, timestamp_text: str, sender: str, text: str, is_system: bool = False):
        self.timestamp = timestamp
        self.timestamp_text = timestamp_text
        self.sender = sender
        self.text = text
        self.is_system = is_system
        self.message_hash = compute_message_hash(timestamp_text, sender, text)

    def to_dict(self):
        return {
            "timestamp": self.timestamp,
            "timestamp_text": self.timestamp_text,
            "sender": self.sender,
            "text": self.text,
            "is_system": self.is_system,
            "message_hash": self.message_hash
        }

def parse_whatsapp_chat(text_content: str) -> List[ParsedMessage]:
    """
    Parse complete WhatsApp chat export text into a structured list of ParsedMessage objects.
    Preserves original text, supports multiline messages, emojis, URLs, and skips or flags system messages.
    Does not crash on malformed lines; logs warnings and continues parsing valid messages.
    """
    lines = text_content.splitlines()
    parsed_messages: List[ParsedMessage] = []
    current_msg: Optional[ParsedMessage] = None

    for line_idx, raw_line in enumerate(lines):
        try:
            cleaned_line = sanitize_line(raw_line)
            if not cleaned_line.strip():
                # If there's an ongoing multiline message, keep the empty line
                if current_msg:
                    current_msg.text += "\n"
                continue

            matched = False

            # Pattern 0 & 1: header with sender colon
            for pat in PATTERNS[:2]:
                m = pat.match(cleaned_line)
                if m:
                    # Save previous message
                    if current_msg:
                        current_msg.message_hash = compute_message_hash(
                            current_msg.timestamp_text, current_msg.sender, current_msg.text
                        )
                        parsed_messages.append(current_msg)

                    date_part, time_part, sender_part, body_part = m.groups()
                    dt, full_time_str = parse_date_string(date_part, time_part)
                    sender = sender_part.strip()
                    body = body_part.strip()

                    is_sys = any(ind in body or ind in sender for ind in SYSTEM_MESSAGE_INDICATORS)
                    current_msg = ParsedMessage(
                        timestamp=dt,
                        timestamp_text=full_time_str,
                        sender=sender,
                        text=body,
                        is_system=is_sys
                    )
                    matched = True
                    break

            if matched:
                continue

            # Pattern 2 & 3: system messages without sender colon
            for pat in PATTERNS[2:]:
                m = pat.match(cleaned_line)
                if m:
                    if current_msg:
                        current_msg.message_hash = compute_message_hash(
                            current_msg.timestamp_text, current_msg.sender, current_msg.text
                        )
                        parsed_messages.append(current_msg)

                    date_part, time_part, system_text = m.groups()
                    dt, full_time_str = parse_date_string(date_part, time_part)
                    current_msg = ParsedMessage(
                        timestamp=dt,
                        timestamp_text=full_time_str,
                        sender="System",
                        text=system_text.strip(),
                        is_system=True
                    )
                    matched = True
                    break

            if matched:
                continue

            # If it doesn't match any new message pattern, it's a multiline continuation!
            if current_msg:
                current_msg.text += "\n" + raw_line

        except Exception as line_err:
            logger.warning(f"Error parsing line {line_idx+1}: {line_err}. Continuing with remaining lines.")
            if current_msg:
                current_msg.text += "\n" + raw_line

    # Don't forget to push the last message
    if current_msg:
        current_msg.message_hash = compute_message_hash(
            current_msg.timestamp_text, current_msg.sender, current_msg.text
        )
        parsed_messages.append(current_msg)

    return parsed_messages
