"""
Supabase utility module — imported by api/index.py.
Not a standalone serverless function.
"""

from __future__ import annotations

import hashlib
import os

from supabase import Client, create_client


def _get_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_ANON_KEY")
    if not url or not key:
        raise EnvironmentError("SUPABASE_URL and SUPABASE_ANON_KEY must be set")
    return create_client(url, key)


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
