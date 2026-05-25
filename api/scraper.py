"""
Elitez FMCG Portal — Singapore trade publication RSS scraper.

Triggered via POST /api/scraper.  Fetches configured RSS feeds, filters
for FMCG-relevant entries using keyword matching, and inserts new records
into the 'Launches' worksheet — skipping duplicates by URL hash.

Sheet row schema (Launches):
  [timestamp, title, url, url_hash, pub_date, status, source, brand_hint]
"""

import json
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler

import feedparser

from database import compute_url_hash, insert_row, read_sheet

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

FMCG_KEYWORDS = [
    "launch", "exclusive flavor", "exclusive flavour",
    "FairPrice", "NTUC", "Cold Storage", "Sheng Siong", "Giant",
    "new product", "new SKU", "limited edition", "product launch",
    "Singapore FMCG", "FMCG Singapore",
]

RSS_FEEDS = [
    "https://www.campaignbriefasia.com/feed/",
    "https://marketing-interactive.com/feed/",
    "https://www.retailnews.asia/feed/",
]


# ---------------------------------------------------------------------------
# Scraper logic
# ---------------------------------------------------------------------------

def _is_fmcg_relevant(title: str, summary: str) -> bool:
    text = (title + " " + summary).lower()
    return any(kw.lower() in text for kw in FMCG_KEYWORDS)


def _existing_hashes() -> set[str]:
    try:
        records = read_sheet("Launches")
        return {r.get("url_hash", "") for r in records if r.get("url_hash")}
    except Exception:
        return set()


def run_scrape() -> dict:
    """Iterate all RSS feeds and persist new FMCG signals to Launches."""
    known_hashes = _existing_hashes()
    inserted = 0
    skipped = 0

    for feed_url in RSS_FEEDS:
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
                title,
                url,
                url_hash,
                pub_date,
                "New",
                "Scraper",
                "",  # brand_hint left blank — filled manually after review
            ]
            try:
                insert_row("Launches", row)
                known_hashes.add(url_hash)
                inserted += 1
            except Exception:
                pass

    return {"inserted": inserted, "skipped": skipped}


# ---------------------------------------------------------------------------
# Vercel HTTP handler — POST /api/scraper
# ---------------------------------------------------------------------------

def _cors_headers(h: BaseHTTPRequestHandler) -> None:
    h.send_header("Access-Control-Allow-Origin", "*")
    h.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
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

    def do_POST(self):
        try:
            result = run_scrape()
            _json_response(self, 200, result)
        except Exception as exc:
            _json_response(self, 500, {"error": str(exc)})
