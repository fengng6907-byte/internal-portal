"""
Supabase utility module — imported by api/index.py.
Not a standalone serverless function.
"""

from __future__ import annotations

import hashlib
import os

from dotenv import load_dotenv
from supabase import Client, create_client

# load_dotenv() is a no-op on Vercel (env vars are already in os.environ).
# It reads .env.local when running locally with uvicorn, which is useful for
# local development without having to export vars manually.
load_dotenv()

_SUPABASE_URL = os.environ.get("SUPABASE_URL")
_SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY")


def _get_client() -> Client:
    if not _SUPABASE_URL or not _SUPABASE_KEY:
        raise EnvironmentError(
            "SUPABASE_URL and SUPABASE_ANON_KEY must be set. "
            "Add them in Vercel → Settings → Environment Variables."
        )
    return create_client(_SUPABASE_URL, _SUPABASE_KEY)


def read_launches() -> list[dict]:
    res = _get_client().table("launches").select("*").order("last_action_date", desc=True).execute()
    return res.data or []


def read_kol_intel() -> list[dict]:
    res = _get_client().table("kol_intel").select("*").order("captured_date", desc=True).execute()
    return res.data or []


def get_kol_by_id(kol_id: str) -> dict | None:
    res = _get_client().table("kol_intel").select("*").eq("id", kol_id).execute()
    return res.data[0] if res.data else None


def insert_launch(row: dict) -> dict:
    res = _get_client().table("launches").insert(row).execute()
    return res.data[0] if res.data else {}


def upsert_launch(row: dict) -> dict:
    """Insert or skip a launch row; deduplicates on id (primary key)."""
    res = _get_client().table("launches").upsert(row, ignore_duplicates=True).execute()
    return res.data[0] if res.data else {}


def compute_url_hash(url: str) -> str:
    """Return a 16-char SHA-256 prefix used as a deduplication key / row id."""
    return hashlib.sha256(url.encode()).hexdigest()[:16]
