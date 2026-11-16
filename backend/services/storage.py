"""Safe storage of uploaded resumes."""
from __future__ import annotations

import uuid
from pathlib import Path

from config import settings

ALLOWED = {".pdf": b"%PDF", ".docx": b"PK\x03\x04"}


class UploadError(ValueError):
    pass


def validate_upload(filename: str | None, data: bytes) -> str:
    """Validate extension, size and magic bytes. Returns the normalised extension."""
    if not filename:
        raise UploadError("No file name was provided.")
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED:
        raise UploadError("Unsupported file type. Please upload a PDF or DOCX resume.")
    if not data:
        raise UploadError("The uploaded file is empty.")
    max_bytes = int(settings.max_upload_mb * 1024 * 1024)
    if len(data) > max_bytes:
        raise UploadError(f"File is too large. The maximum size is {settings.max_upload_mb:g} MB.")
    if not data.startswith(ALLOWED[ext]):
        raise UploadError(f"The file content does not look like a valid {ext[1:].upper()} document.")
    return ext


def store_upload(user_id: int, ext: str, data: bytes) -> Path:
    """Store under a random name (never the user-supplied name) inside the user's folder."""
    folder = settings.upload_dir / str(int(user_id))
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / f"{uuid.uuid4().hex}{ext}"
    path.write_bytes(data)
    return path
