import re
import uuid


def slugify(text: str) -> str:
    """Generate a URL-friendly slug from text (supports Hebrew)."""
    text = text.strip()
    text = re.sub(r"\s+", "-", text)
    # Keep word chars, Hebrew range, and hyphens
    text = re.sub(r"[^\w\u0590-\u05FF-]", "", text)
    text = text.strip("-").lower()
    return text or f"item-{uuid.uuid4().hex[:8]}"
