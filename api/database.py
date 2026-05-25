"""
Elitez FMCG Portal — Google Sheets database layer.

Exposes atomic helpers used by scraper.py and kol_radar.py, plus a
Vercel-compatible HTTP handler for direct sheet access.

Required env var:
    GOOGLE_SERVICE_ACCOUNT_JSON  — minified Service Account JSON string
"""

import hashlib
import json
import os
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

import gspread
from oauth2client.service_account import ServiceAccountCredentials

SPREADSHEET_NAME = "Elitez FMCG Portal DB"
SCOPE = [
    "https://spreadsheets.google.com/feeds",
    "https://www.googleapis.com/auth/drive",
]


# ---------------------------------------------------------------------------
# Connection helpers
# ---------------------------------------------------------------------------

def _get_client() -> gspread.Client:
    raw = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON")
    if not raw:
        raise EnvironmentError("GOOGLE_SERVICE_ACCOUNT_JSON is not set")
    creds_dict = json.loads(raw)
    creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, SCOPE)
    return gspread.authorize(creds)


def _get_worksheet(sheet_name: str) -> gspread.Worksheet:
    client = _get_client()
    spreadsheet = client.open(SPREADSHEET_NAME)
    return spreadsheet.worksheet(sheet_name)


# ---------------------------------------------------------------------------
# Public execution functions
# ---------------------------------------------------------------------------

def read_sheet(sheet_name: str) -> list[dict]:
    """Return all rows from *sheet_name* as a list of dicts keyed by header."""
    ws = _get_worksheet(sheet_name)
    return ws.get_all_records()


def insert_row(sheet_name: str, row_data: list) -> None:
    """Append *row_data* as a new row in *sheet_name*."""
    ws = _get_worksheet(sheet_name)
    ws.append_row(row_data, value_input_option="USER_ENTERED")


def update_status(sheet_name: str, row_index: int, status_col: int, new_status: str) -> None:
    """Overwrite a single cell to mutate a record's status field.

    Args:
        row_index:  1-based row number in the sheet (including header row).
        status_col: 1-based column number of the status field.
        new_status: replacement value.
    """
    ws = _get_worksheet(sheet_name)
    ws.update_cell(row_index, status_col, new_status)


def compute_url_hash(url: str) -> str:
    """Return a 16-char SHA-256 prefix used as a deduplication key."""
    return hashlib.sha256(url.encode()).hexdigest()[:16]


# ---------------------------------------------------------------------------
# Vercel HTTP handler — GET /api/database  POST /api/database
# ---------------------------------------------------------------------------

def _cors_headers(h: BaseHTTPRequestHandler) -> None:
    h.send_header("Access-Control-Allow-Origin", "*")
    h.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
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
        params = parse_qs(urlparse(self.path).query)
        sheet = params.get("sheet", ["Launches"])[0]
        try:
            records = read_sheet(sheet)
            _json_response(self, 200, {"data": records})
        except Exception as exc:
            _json_response(self, 500, {"error": str(exc)})

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length))
        sheet = body.get("sheet", "Launches")
        row = body.get("row", [])
        try:
            insert_row(sheet, row)
            _json_response(self, 201, {"success": True})
        except Exception as exc:
            _json_response(self, 500, {"error": str(exc)})

    def do_PATCH(self):
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length))
        sheet = body.get("sheet", "Launches")
        row_index = body.get("row_index")
        status_col = body.get("status_col", 6)
        new_status = body.get("status", "")
        try:
            update_status(sheet, row_index, status_col, new_status)
            _json_response(self, 200, {"success": True})
        except Exception as exc:
            _json_response(self, 500, {"error": str(exc)})
