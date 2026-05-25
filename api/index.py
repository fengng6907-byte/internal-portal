"""
Elitez FMCG Portal — FastAPI application.

Single entry-point for all API routes.  Deployed as one Vercel Python
serverless function; routed via the `rewrites` rule in vercel.json.

Local development:
    uvicorn api.index:app --reload --port 5328
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any

import feedparser
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import compute_url_hash, insert_row, read_sheet

app = FastAPI(docs_url="/api/docs", openapi_url="/api/openapi.json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# KOL mock dataset — high-signal Singapore creator activity
# ---------------------------------------------------------------------------

_KOL_DATA: list[dict[str, Any]] = [
    {
        "id": "kol_001",
        "handle": "@sgfoodiequeenie",
        "platform": "Instagram",
        "follower_count": 87400,
        "tags": ["#prhaulsg", "#sgfoodie", "#sgfood"],
        "recent_post": (
            "Unboxing this mystery PR haul from a major FMCG brand 👀 "
            "Something new at FairPrice soon!"
        ),
        "signal_score": 92,
        "brand_hint": "FairPrice / Unknown FMCG",
        "detected_at": "2026-05-24T14:32:00Z",
        "post_url": "https://instagram.com/p/elitez-mock-kol001",
        "status": "New",
    },
    {
        "id": "kol_002",
        "handle": "@mediakitsg_trev",
        "platform": "TikTok",
        "follower_count": 124000,
        "tags": ["#mediakitsg", "#sgfoodie", "#newlaunch"],
        "recent_post": (
            "Got the most insane media kit from a snack brand launching next "
            "month in SG 🔥 #mediakitsg"
        ),
        "signal_score": 88,
        "brand_hint": "Snack category — Cold Storage likely distribution",
        "detected_at": "2026-05-24T10:15:00Z",
        "post_url": "https://tiktok.com/@elitez-mock-kol002",
        "status": "New",
    },
    {
        "id": "kol_003",
        "handle": "@unboxwithpriya",
        "platform": "Instagram",
        "follower_count": 52100,
        "tags": ["#prhaulsg", "#sgbeauty", "#sgfoodie"],
        "recent_post": (
            "PR haul from 3 brands this week — the FMCG one smells incredible, "
            "limited edition collab incoming 👁"
        ),
        "signal_score": 76,
        "brand_hint": "Beauty x FMCG crossover — limited SKU",
        "detected_at": "2026-05-23T20:45:00Z",
        "post_url": "https://instagram.com/p/elitez-mock-kol003",
        "status": "New",
    },
    {
        "id": "kol_004",
        "handle": "@nasilemakking_sg",
        "platform": "YouTube",
        "follower_count": 203000,
        "tags": ["#sgfoodie", "#unboxing", "#singaporefood"],
        "recent_post": (
            "Full unboxing: New imported ramen line set to hit Sheng Siong "
            "shelves Q3 2026 — is it worth it?"
        ),
        "signal_score": 95,
        "brand_hint": "Japanese ramen import — Sheng Siong",
        "detected_at": "2026-05-25T08:00:00Z",
        "post_url": "https://youtube.com/watch?v=elitez-mock-kol004",
        "status": "New",
    },
    {
        "id": "kol_005",
        "handle": "@chillaxwithchels",
        "platform": "TikTok",
        "follower_count": 39800,
        "tags": ["#prhaulsg", "#mediakitsg"],
        "recent_post": (
            "Okay the new beverage PR I got is WILD — this is going to be huge "
            "at NTUC. No more details yet 🤫"
        ),
        "signal_score": 83,
        "brand_hint": "Beverage category — NTUC FairPrice",
        "detected_at": "2026-05-25T06:30:00Z",
        "post_url": "https://tiktok.com/@elitez-mock-kol005",
        "status": "New",
    },
]

_KOL_INDEX: dict[str, dict[str, Any]] = {k["id"]: k for k in _KOL_DATA}

# ---------------------------------------------------------------------------
# RSS scraper config
# ---------------------------------------------------------------------------

_FMCG_KEYWORDS = [
    "launch", "exclusive flavor", "exclusive flavour",
    "FairPrice", "NTUC", "Cold Storage", "Sheng Siong", "Giant",
    "new product", "new SKU", "limited edition", "product launch",
    "Singapore FMCG", "FMCG Singapore",
]

_RSS_FEEDS = [
    "https://www.campaignbriefasia.com/feed/",
    "https://marketing-interactive.com/feed/",
    "https://www.retailnews.asia/feed/",
]

# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------


class ConvertRequest(BaseModel):
    kol_id: str


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/api/launches")
async def get_launches() -> dict:
    """Return all records from the Launches worksheet."""
    try:
        data = await asyncio.to_thread(read_sheet, "Launches")
        return {"data": data}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/kol-signals")
async def get_kol_signals() -> dict:
    """Return the full KOL signal dataset."""
    return {"data": _KOL_DATA}


@app.post("/api/scraper")
async def trigger_scraper() -> dict:
    """Fetch configured RSS feeds and persist new FMCG signals to Launches."""
    try:
        result = await asyncio.to_thread(_run_scrape)
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/convert", status_code=201)
async def convert_to_lead(req: ConvertRequest) -> dict:
    """Convert a KOL signal into a Launches lead row in Google Sheets."""
    kol = _KOL_INDEX.get(req.kol_id)
    if not kol:
        raise HTTPException(status_code=404, detail=f"KOL ID '{req.kol_id}' not found")
    try:
        title = f"[KOL Signal] {kol['handle']} — {kol['recent_post'][:100]}"
        row = [
            datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
            title,
            kol["post_url"],
            compute_url_hash(kol["post_url"]),
            kol["detected_at"],
            "KOL Lead",
            f"{kol['platform']} / {kol['handle']}",
            kol["brand_hint"],
        ]
        await asyncio.to_thread(insert_row, "Launches", row)
        return {"success": True, "kol_id": req.kol_id, "handle": kol["handle"]}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ---------------------------------------------------------------------------
# Internal scraper logic (sync — called via asyncio.to_thread)
# ---------------------------------------------------------------------------


def _is_fmcg_relevant(title: str, summary: str) -> bool:
    text = (title + " " + summary).lower()
    return any(kw.lower() in text for kw in _FMCG_KEYWORDS)


def _run_scrape() -> dict:
    try:
        records = read_sheet("Launches")
        known_hashes: set[str] = {r.get("url_hash", "") for r in records if r.get("url_hash")}
    except Exception:
        known_hashes = set()

    inserted = 0
    skipped = 0

    for feed_url in _RSS_FEEDS:
        try:
            feed = feedparser.parse(feed_url)
        except Exception:
            continue

        for entry in feed.entries:
            title = getattr(entry, "title", "")
            url = getattr(entry, "link", "")
            summary = getattr(entry, "summary", "")
            pub_date = getattr(entry, "published", "")

            if not _is_fmcg_relevant(title, summary):
                skipped += 1
                continue

            url_hash = compute_url_hash(url)
            if url_hash in known_hashes:
                skipped += 1
                continue

            row = [
                datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
                title, url, url_hash, pub_date,
                "New", "Scraper", "",
            ]
            try:
                insert_row("Launches", row)
                known_hashes.add(url_hash)
                inserted += 1
            except Exception:
                pass

    return {"inserted": inserted, "skipped": skipped}
