import re
import json
import datetime
from typing import List, Dict, Any, Optional, Tuple
from app.config import settings

# URLs regex
URL_REGEX = re.compile(r'https?://[^\s<>"]+|www\.[^\s<>"]+')

# Irrelevant chatter patterns
IRRELEVANT_PATTERNS = [
    r'^(hi|hello|hey|good\s+morning|good\s+night|gm|gn|ok|okay|k|thanks|thank\s+you|ty|cool|yes|no|yup|nope|lol|lmao|haha|bro|dude)[!\.\?\s]*$',
    r'^anyone\s+(done|free|there|knows\?|playing)',
    r'^what\s+(about|did|is\s+happening)',
    r'^(congrats|happy\s+birthday|hbd)',
    r'^<Media omitted>$',
    r'image omitted',
    r'voice message',
    r'deleted message'
]

# Task keywords
TASK_KEYWORDS = [
    "assignment", "submit", "submission", "homework", "project", "lab", "report",
    "presentation", "register", "registration", "fill the form", "fill form", "quiz", "test",
    "exam", "examination", "midterm", "endsem", "assessment", "task", "worksheet", "upload", "complete",
    "hackathon", "workshop", "bootcamp", "exam fee", "semester fee", "tuition fee", "fee"
]

ANNOUNCEMENT_KEYWORDS = [
    "class moved", "class postponed", "class cancelled", "held online", "offline class",
    "room changed", "holiday", "no class", "timetable", "schedule change", "notice",
    "attention", "everyone note", "workshop", "seminar", "guest lecture", "important announcement",
    "symposium", "conference", "webinar"
]

def normalize_title(title: str) -> str:
    """Normalize title for duplicate detection."""
    clean = re.sub(r'[^a-zA-Z0-9\s]', '', title.lower())
    clean = re.sub(r'\b(the|a|an|please|guys|everyone|reminder|dont\s+forget|urgent)\b', '', clean)
    return " ".join(clean.split())

def parse_relative_deadline(text: str, ref_dt: datetime.datetime) -> Tuple[Optional[datetime.datetime], Optional[str], str]:
    """
    Parse relative date strings anchored strictly to ref_dt (chat message timestamp).
    Returns (normalized_datetime, original_text, confidence)
    """
    text_lower = text.lower()
    days_of_week = {
        "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
        "friday": 4, "saturday": 5, "sunday": 6
    }

    def safe_replace_time(base_dt: datetime.datetime, h: int, m: int) -> datetime.datetime:
        try:
            valid_h = max(0, min(23, h))
            valid_m = max(0, min(59, m))
            return base_dt.replace(hour=valid_h, minute=valid_m, second=0, microsecond=0)
        except Exception:
            return base_dt

    # Extract time component (e.g., "5 pm", "5:30 pm", "14:30", "midnight", "noon")
    target_hour = 17 # Default to 5 PM for end-of-day academic deadlines
    target_minute = 0
    # Match valid 12-hour format: 1..12 with am/pm
    time_match = re.search(r'\b(1[0-2]|0?[1-9])(?:[:\.](\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)', text_lower)
    time_24_match = re.search(r'\b([01]?[0-9]|2[0-3])[:\.](\d{2})\b', text_lower)
    time_explicit = False

    if time_match:
        time_explicit = True
        raw_h = int(time_match.group(1))
        m = int(time_match.group(2)) if time_match.group(2) else 0
        meridiem = time_match.group(3).replace('.', '').lower()
        if meridiem == 'pm':
            h = 12 if raw_h == 12 else raw_h + 12
        else: # am
            h = 0 if raw_h == 12 else raw_h
        target_hour = max(0, min(23, h))
        target_minute = max(0, min(59, m))
    elif time_24_match:
        time_explicit = True
        target_hour = max(0, min(23, int(time_24_match.group(1))))
        target_minute = max(0, min(59, int(time_24_match.group(2))))
    elif "tonight" in text_lower or "end of day" in text_lower or "eod" in text_lower:
        target_hour = 23
        target_minute = 59
    elif "morning" in text_lower:
        target_hour = 9
        target_minute = 0
    elif "noon" in text_lower:
        target_hour = 12
        target_minute = 0

    deadline_dt: Optional[datetime.datetime] = None
    original_text: Optional[str] = None
    confidence = "HIGH"

    # 1. First check explicit day of week (e.g. "by Friday", "this Saturday", "due Friday")
    found_day = False
    for day_name, target_weekday in days_of_week.items():
        if re.search(rf'\b(by|this|next|on|due)?\s*{day_name}\b', text_lower):
            current_weekday = ref_dt.weekday()
            days_ahead = (target_weekday - current_weekday) % 7
            if days_ahead == 0 and "next" in text_lower:
                days_ahead = 7
            elif days_ahead == 0 and not ("today" in text_lower):
                days_ahead = 7  # Next week's occurrence
            base_target = ref_dt + datetime.timedelta(days=days_ahead)
            deadline_dt = safe_replace_time(base_target, target_hour, target_minute)
            matched_time_str = time_match.group(0) if time_match else (time_24_match.group(0) if time_24_match else "")
            original_text = f"{day_name.capitalize()}" + (f" {matched_time_str}" if matched_time_str else "")
            found_day = True
            break

    # 2. Check explicit calendar dates like "15th Oct", "October 10", "15/10/2026"
    if not found_day:
        date_match = re.search(r'(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*', text_lower)
        if date_match:
            day_num = int(date_match.group(1))
            month_str = date_match.group(2)
            month_map = {"jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6, "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12}
            month_num = month_map.get(month_str[:3], ref_dt.month)
            year = ref_dt.year
            try:
                deadline_dt = datetime.datetime(year, month_num, day_num, target_hour, target_minute)
                matched_time_str = time_match.group(0) if time_match else (time_24_match.group(0) if time_24_match else "")
                original_text = date_match.group(0) + (f" {matched_time_str}" if matched_time_str else "")
                found_day = True
            except Exception:
                pass

    # 3. Check relative days: "day after tomorrow", "tomorrow", "today", "tonight"
    if not found_day:
        matched_time_str = time_match.group(0) if time_match else (time_24_match.group(0) if time_24_match else "")
        if "day after tomorrow" in text_lower:
            deadline_dt = safe_replace_time(ref_dt + datetime.timedelta(days=2), target_hour, target_minute)
            original_text = "day after tomorrow" + (f" at {matched_time_str}" if matched_time_str else "")
        elif "tomorrow" in text_lower:
            deadline_dt = safe_replace_time(ref_dt + datetime.timedelta(days=1), target_hour, target_minute)
            original_text = "tomorrow" + (f" {matched_time_str}" if matched_time_str else "")
        elif "today" in text_lower or "tonight" in text_lower:
            deadline_dt = safe_replace_time(ref_dt, target_hour, target_minute)
            original_text = "today" + (f" {matched_time_str}" if matched_time_str else "")

    if deadline_dt is None and (time_match or time_24_match):
        # Only time was specified, assume same day or tomorrow
        deadline_dt = safe_replace_time(ref_dt, target_hour, target_minute)
        if deadline_dt < ref_dt:
            deadline_dt += datetime.timedelta(days=1)
        original_text = time_match.group(0) if time_match else time_24_match.group(0)
        confidence = "MEDIUM"

    if deadline_dt is None:
        confidence = "LOW"
        original_text = "Unknown"

    return deadline_dt, original_text, confidence

def determine_priority(text: str, deadline: Optional[datetime.datetime], ref_dt: datetime.datetime) -> str:
    text_lower = text.lower()
    if any(k in text_lower for k in ["urgent", "immediately", "critical", "exam in 30", "asap", "mandatory", "strict"]):
        return "CRITICAL"
    if deadline:
        diff_hours = (deadline - ref_dt).total_seconds() / 3600
        if 0 <= diff_hours <= 24:
            return "HIGH"
        elif 0 <= diff_hours <= 72:
            return "HIGH"
        else:
            return "MEDIUM"
    if any(k in text_lower for k in ["assignment", "submission", "quiz", "test", "exam", "due", "fee"]):
        return "HIGH"
    if any(k in text_lower for k in ["optional", "resource", "extra credit", "reference"]):
        return "LOW"
    return "MEDIUM"

def is_irrelevant(text: str) -> bool:
    clean = text.strip()
    if len(clean) < 3:
        return True
    for pat in IRRELEVANT_PATTERNS:
        if re.search(pat, clean, re.IGNORECASE):
            return True
    return False

def extract_urls(text: str) -> List[str]:
    return URL_REGEX.findall(text)

def extract_location(text: str) -> Optional[str]:
    """Extract location mentions such as Room 402, Lab 3, Auditorium, Online."""
    m = re.search(r'\b(?:in|at)\s+([A-Za-z0-9\s\-]+?(?:Room\s+\d+|Audi(?:torium)?\s*\d*|Lab\s*\d+|Hall\s*\d+|Campus|Seminar\s+Hall|Online|Zoom|Meet))\b', text, re.IGNORECASE)
    if m:
        return m.group(1).strip()
    if "online" in text.lower() or "zoom" in text.lower() or "google meet" in text.lower():
        return "Online / Virtual"
    return None

def extract_time_string(text: str) -> Optional[str]:
    """Extract explicit time string if present."""
    m = re.search(r'\b(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.))\b', text, re.IGNORECASE)
    return m.group(1).upper() if m else None

def extract_submission_instructions(text: str) -> Optional[str]:
    """Extract submission instructions if present."""
    lines = text.splitlines()
    for line in lines:
        l_lower = line.lower()
        if any(k in l_lower for k in ["submit", "submission", "portal", "lms", "late submission", "upload", "send to"]):
            return line.strip()
    return None

class ExtractedItem:
    def __init__(
        self,
        item_type: str,  # TASK, ANNOUNCEMENT, LINK
        title: str,
        description: str,
        category: str,
        priority: str,
        deadline: Optional[datetime.datetime] = None,
        deadline_original: Optional[str] = None,
        deadline_confidence: str = "HIGH",
        confidence: float = 0.95,
        source_message_id: Optional[int] = None,
        source_sender: Optional[str] = None,
        source_timestamp: Optional[str] = None,
        source_text: Optional[str] = None,
        url: Optional[str] = None,
        start_date: Optional[datetime.datetime] = None,
        end_date: Optional[datetime.datetime] = None,
        time: Optional[str] = None,
        location: Optional[str] = None,
        registration_link: Optional[str] = None,
        submission_instructions: Optional[str] = None,
        is_deadline_update: bool = False
    ):
        self.item_type = item_type
        self.title = title
        self.description = description
        self.category = category
        self.priority = priority
        self.deadline = deadline
        self.deadline_original = deadline_original
        self.deadline_confidence = deadline_confidence
        self.confidence = confidence
        self.source_message_id = source_message_id
        self.source_sender = source_sender
        self.source_timestamp = source_timestamp
        self.source_text = source_text
        self.url = url
        self.start_date = start_date
        self.end_date = end_date
        self.time = time
        self.location = location
        self.registration_link = registration_link
        self.submission_instructions = submission_instructions
        self.is_deadline_update = is_deadline_update

    def to_dict(self):
        return {
            "type": self.item_type,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "priority": self.priority,
            "deadline": self.deadline.isoformat() if self.deadline else None,
            "deadline_original": self.deadline_original,
            "deadline_confidence": self.deadline_confidence,
            "confidence": self.confidence,
            "source_message_id": self.source_message_id,
            "source_sender": self.source_sender,
            "source_timestamp": self.source_timestamp,
            "source_text": self.source_text,
            "url": self.url,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "time": self.time,
            "location": self.location,
            "registration_link": self.registration_link,
            "submission_instructions": self.submission_instructions,
            "is_deadline_update": self.is_deadline_update
        }

def classify_academic_category(text_lower: str) -> Tuple[str, str]:
    """
    Classifies text into structured categories:
    HACKATHON, WORKSHOP, EVENT, EXAM, EXAM_FEE, SEMESTER_FEE, REGISTRATION, ASSIGNMENT, ANNOUNCEMENT
    Returns (category, title_suggestion)
    """
    if "hackathon" in text_lower or "codeathon" in text_lower or "ideathon" in text_lower:
        return "HACKATHON", "Hackathon Competition"
    if "workshop" in text_lower or "bootcamp" in text_lower:
        return "WORKSHOP", "Technical Workshop"
    if "exam fee" in text_lower or "examination fee" in text_lower or "revaluation fee" in text_lower:
        return "EXAM_FEE", "Semester Exam Fee Deadline"
    if "semester fee" in text_lower or "tuition fee" in text_lower or "college fee" in text_lower or "hostel fee" in text_lower:
        return "SEMESTER_FEE", "Semester Fee Payment"
    if "quiz" in text_lower:
        return "EXAM", "Class Quiz"
    if "exam" in text_lower or "examination" in text_lower or "midterm" in text_lower or "end sem" in text_lower or "viva" in text_lower:
        return "EXAM", "Course Examination"
    if "register" in text_lower or "registration" in text_lower or "fill form" in text_lower or "google form" in text_lower:
        return "REGISTRATION", "Registration Deadline"
    if "seminar" in text_lower or "webinar" in text_lower or "symposium" in text_lower or "guest lecture" in text_lower or "fest" in text_lower:
        return "EVENT", "Academic Event / Seminar"
    if "python" in text_lower:
        return "ASSIGNMENT", "Python Assignment"
    if "ml" in text_lower or "machine learning" in text_lower:
        return "ASSIGNMENT", "Machine Learning Assignment"
    if "project" in text_lower:
        return "ASSIGNMENT", "Project Submission"
    if "lab" in text_lower:
        return "ASSIGNMENT", "Lab Report Submission"
    if "assignment" in text_lower or "homework" in text_lower or "submission" in text_lower or "submit" in text_lower:
        return "ASSIGNMENT", "Class Assignment"
    return "ANNOUNCEMENT", "Class Announcement"

def heuristic_extract_items(messages: List[Any]) -> List[ExtractedItem]:
    """
    Deterministic NLP & Heuristic Information Extractor.
    Extracts structured academic information: Hackathons, Workshops, Events, Exams,
    Fees, Registrations, Assignments, Deadlines, Locations, Links, and Announcements.
    """
    extracted_items: List[ExtractedItem] = []
    n = len(messages)
    i = 0

    while i < n:
        msg = messages[i]
        ref_dt = msg.timestamp
        ref_time_str = msg.timestamp_text

        # Combine conversational fragments within 5 minutes
        combined_text = msg.text
        source_msg_id = getattr(msg, 'message_id', None)
        lead_sender = msg.sender

        peek = i + 1
        while peek < n:
            next_msg = messages[peek]
            time_diff_min = abs((next_msg.timestamp - msg.timestamp).total_seconds()) / 60.0
            if time_diff_min <= 5.0 and len(next_msg.text.split()) <= 15:
                combined_text += "\n" + next_msg.text
                peek += 1
            else:
                break

        # Extract URLs
        urls = extract_urls(combined_text)
        reg_link = urls[0] if urls else None

        for u in urls:
            extracted_items.append(ExtractedItem(
                item_type="LINK",
                title="Class Resource Link",
                description=f"Extracted link: {u}",
                category="RESOURCE",
                priority="MEDIUM",
                source_message_id=source_msg_id,
                source_sender=lead_sender,
                source_timestamp=ref_time_str,
                source_text=combined_text[:300],
                url=u
            ))

        # Check for deadline update (e.g., "Python assignment deadline changed to Saturday")
        is_deadline_update = bool(re.search(
            r'(deadline|due date|submission)\s+(extended|changed|moved|postponed|updated)\s+to',
            combined_text, re.IGNORECASE
        ))

        # Check for task / event keywords
        has_task_keyword = any(kw in combined_text.lower() for kw in TASK_KEYWORDS)
        has_action_phrase = any(phrase in combined_text.lower() for phrase in [
            "need to", "have to", "must", "submit", "complete", "due", "register", "upload", "submission", "by ", "pay"
        ])

        if (has_task_keyword and has_action_phrase) or is_deadline_update:
            text_lower = combined_text.lower()
            category, title_suggestion = classify_academic_category(text_lower)

            # Refine title
            title = title_suggestion
            if "python" in text_lower:
                title = "Python Assignment"
            elif "ml" in text_lower or "machine learning" in text_lower:
                title = "Machine Learning Assignment"
            elif "workshop" in text_lower and "ai" in text_lower:
                title = "AI Workshop Registration"
            elif "hackathon" in text_lower:
                words = [w for w in combined_text.split() if w.lower() not in ["guys", "everyone", "please", "kindly", "dont", "forget"]]
                title = "Hackathon: " + " ".join(words[:4]).strip(".,;:!") if words else "Hackathon Competition"
            elif is_deadline_update:
                if "python" in text_lower:
                    title = "Python Assignment"
                else:
                    title = title_suggestion

            dl, dl_orig, dl_conf = parse_relative_deadline(combined_text, ref_dt)
            prio = determine_priority(combined_text, dl, ref_dt)
            location = extract_location(combined_text)
            time_str = extract_time_string(combined_text)
            sub_inst = extract_submission_instructions(combined_text)

            extracted_items.append(ExtractedItem(
                item_type="TASK",
                title=title,
                description=combined_text.strip(),
                category=category,
                priority=prio,
                deadline=dl,
                deadline_original=dl_orig,
                deadline_confidence=dl_conf,
                confidence=0.96 if dl else 0.88,
                source_message_id=source_msg_id,
                source_sender=lead_sender,
                source_timestamp=ref_time_str,
                source_text=combined_text[:400],
                time=time_str,
                location=location,
                registration_link=reg_link,
                submission_instructions=sub_inst,
                is_deadline_update=is_deadline_update
            ))

        # Check for announcements
        has_announcement = any(kw in combined_text.lower() for kw in ANNOUNCEMENT_KEYWORDS)
        if has_announcement and not is_deadline_update:
            text_lower = combined_text.lower()
            title = "Class Announcement"
            cat = "ANNOUNCEMENT"
            if "moved" in text_lower or "postponed" in text_lower or "online" in text_lower:
                title = "Schedule Update: Class Moved"
            elif "exam" in text_lower or "quiz" in text_lower:
                title = "Exam Schedule Notice"
                cat = "EXAM"
            elif "holiday" in text_lower or "no class" in text_lower:
                title = "Holiday / No Class Notice"
            elif "workshop" in text_lower:
                title = "Workshop Announcement"
                cat = "WORKSHOP"

            prio = "HIGH" if any(w in text_lower for w in ["moved", "today", "tomorrow", "urgent", "mandatory"]) else "MEDIUM"
            loc = extract_location(combined_text)
            tim = extract_time_string(combined_text)

            extracted_items.append(ExtractedItem(
                item_type="ANNOUNCEMENT",
                title=title,
                description=combined_text.strip(),
                category=cat,
                priority=prio,
                confidence=0.95,
                source_message_id=source_msg_id,
                source_sender=lead_sender,
                source_timestamp=ref_time_str,
                source_text=combined_text[:400],
                location=loc,
                time=tim,
                registration_link=reg_link
            ))

        if peek > i + 1:
            i = peek
        else:
            i += 1

    return extracted_items

def call_llm_for_extraction(messages: List[Any]) -> Optional[List[ExtractedItem]]:
    """
    Call external LLM (Gemini / OpenAI) if API key is provided.
    Falls back gracefully to heuristic extractor if unavailable or fails.
    """
    api_key = settings.AI_API_KEY
    if not api_key:
        return None

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")

        chat_repr = []
        for idx, m in enumerate(messages):
            chat_repr.append({
                "index": idx,
                "timestamp": str(m.timestamp_text),
                "sender": m.sender,
                "text": m.text
            })

        system_prompt = f"""
You are an expert AI assistant that extracts structured academic information from WhatsApp class chats.
Categories to identify: HACKATHON, WORKSHOP, EVENT, EXAM, EXAM_FEE, SEMESTER_FEE, REGISTRATION, ASSIGNMENT, ANNOUNCEMENT.
Do NOT hallucinate information that is not in the WhatsApp messages.
If a deadline is unclear, set deadline_original to "Unknown" and deadline_iso to null.

Return ONLY a valid JSON array of objects with the schema:
[
  {{
    "type": "TASK" | "ANNOUNCEMENT" | "LINK",
    "title": "Concise Title",
    "description": "Full actionable description",
    "category": "HACKATHON" | "WORKSHOP" | "EVENT" | "EXAM" | "EXAM_FEE" | "SEMESTER_FEE" | "REGISTRATION" | "ASSIGNMENT" | "ANNOUNCEMENT",
    "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
    "deadline_iso": "YYYY-MM-DDTHH:MM:SS" (or null if none/unclear),
    "deadline_original": "original text e.g. Friday 5 PM or Unknown",
    "time": "e.g. 2:00 PM or null",
    "location": "e.g. Room 402 or Online or null",
    "registration_link": "http://... or null",
    "submission_instructions": "e.g. Submit on portal or null",
    "confidence": 0.0 to 1.0,
    "source_index": index of primary message,
    "url": "http://..." (if LINK, else null),
    "is_deadline_update": true/false
  }}
]
"""
        response = model.generate_content(
            f"{system_prompt}\n\nChat messages:\n{json.dumps(chat_repr)}"
        )
        content = response.text.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
        parsed_json = json.loads(content.strip())

        items = []
        for obj in parsed_json:
            src_idx = obj.get("source_index", 0)
            src_msg = messages[src_idx] if 0 <= src_idx < len(messages) else messages[0]
            dl = None
            if obj.get("deadline_iso"):
                try:
                    dl = datetime.datetime.fromisoformat(obj["deadline_iso"])
                except Exception:
                    pass

            items.append(ExtractedItem(
                item_type=obj.get("type", "TASK"),
                title=obj.get("title", "Class Task"),
                description=obj.get("description", ""),
                category=obj.get("category", "ASSIGNMENT"),
                priority=obj.get("priority", "HIGH"),
                deadline=dl,
                deadline_original=obj.get("deadline_original", "Unknown"),
                deadline_confidence="HIGH" if dl else "LOW",
                time=obj.get("time"),
                location=obj.get("location"),
                registration_link=obj.get("registration_link"),
                submission_instructions=obj.get("submission_instructions"),
                confidence=float(obj.get("confidence", 0.9)),
                source_message_id=getattr(src_msg, 'message_id', None),
                source_sender=src_msg.sender,
                source_timestamp=src_msg.timestamp_text,
                source_text=src_msg.text,
                url=obj.get("url"),
                is_deadline_update=bool(obj.get("is_deadline_update", False))
            ))
        return items
    except Exception as e:
        print(f"External LLM call failed or skipped: {e}. Falling back to internal engine.")
        return None

def extract_information_from_messages(messages: List[Any]) -> List[ExtractedItem]:
    """
    Main extraction pipeline entry point.
    Attempts LLM extraction if API key configured, otherwise runs deterministic heuristic extraction engine.
    """
    if not messages:
        return []

    meaningful_messages = [m for m in messages if not getattr(m, 'is_system', False) and not is_irrelevant(m.text)]
    if not meaningful_messages:
        return []

    llm_results = call_llm_for_extraction(meaningful_messages)
    if llm_results:
        return llm_results

    return heuristic_extract_items(meaningful_messages)
