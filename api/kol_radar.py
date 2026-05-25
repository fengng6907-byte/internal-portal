"""
Elitez FMCG Portal — KOL Unboxing Radar.

GET  /api/kol_radar          → returns the full KOL signal dataset as JSON.
POST /api/kol_radar  {kol_id} → converts a KOL signal into a Launches lead.

The mock dataset mirrors high-signal Singapore creators identified via
#prhaulsg, #mediakitsg, and #sgfoodie.  Replace with live social API
integration (e.g. Apify Instagram scraper) when ready.

Launches row schema when converting:
  [timestamp, title, url, url_hash, pub_date, status, source, brand_hint]
"""

import json
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler

from database import compute_url_hash, insert_row

# ---------------------------------------------------------------------------
# Mock KOL dataset — high-signal Singapore creator activity
# ---------------------------------------------------------------------------

KOL_DATASET: list[dict] = [
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

_KOL_INDEX: dict[str, dict] = {k["id"]: k for k in KOL_DATASET}


# ---------------------------------------------------------------------------
# Conversion logic
# ---------------------------------------------------------------------------

def convert_kol_to_lead(kol_id: str) -> dict:
    """Persist a KOL signal as a lead row in the Launches worksheet."""
    kol = _KOL_INDEX.get(kol_id)
    if not kol:
        raise ValueError(f"KOL ID '{kol_id}' not found in dataset")

    title = f"[KOL Signal] {kol['handle']} — {kol['recent_post'][:100]}"
    url_hash = compute_url_hash(kol["post_url"])

    row = [
        datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
        title,
        kol["post_url"],
        url_hash,
        kol["detected_at"],
        "KOL Lead",
        f"{kol['platform']} / {kol['handle']}",
        kol["brand_hint"],
    ]
    insert_row("Launches", row)
    return {"success": True, "kol_id": kol_id, "handle": kol["handle"]}


# ---------------------------------------------------------------------------
# Vercel HTTP handler — GET /api/kol_radar   POST /api/kol_radar
# ---------------------------------------------------------------------------

def _cors_headers(h: BaseHTTPRequestHandler) -> None:
    h.send_header("Access-Control-Allow-Origin", "*")
    h.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    h.send_header("Access-Control-Allow-Headers", "Content-Type")


def _json_response(h: BaseHTTPRequestHandler, code: int, payload: dict) -> None:
    body = json.dumps(payload).encode()
    h.send_response(code)
    h.send_header("Content-Type", "application/json")
    _cors_headers(h)
    h.end_headers()
    h.wfile.write(body)


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        _cors_headers(self)
        self.end_headers()

    def do_GET(self):
        _json_response(self, 200, {"data": KOL_DATASET})

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length))
        kol_id = body.get("kol_id", "")
        try:
            result = convert_kol_to_lead(kol_id)
            _json_response(self, 201, result)
        except Exception as exc:
            _json_response(self, 500, {"error": str(exc)})
