"""
Google Sheets utility module — imported by api/index.py.
Not a standalone serverless function; contains no HTTP handler.
"""

from __future__ import annotations

import hashlib
import json
import os

import gspread
from oauth2client.service_account import ServiceAccountCredentials

SPREADSHEET_NAME = "Elitez FMCG Portal DB"
_SCOPE = [
    "https://spreadsheets.google.com/feeds",
    "https://www.googleapis.com/auth/drive",
]


def _get_client() -> gspread.Client:
    raw = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON")
    if not raw:
        raise EnvironmentError("GOOGLE_SERVICE_ACCOUNT_JSON is not set")
    creds = ServiceAccountCredentials.from_json_keyfile_dict(json.loads(raw), _SCOPE)
    return gspread.authorize(creds)


def _get_worksheet(sheet_name: str) -> gspread.Worksheet:
    return _get_client().open(SPREADSHEET_NAME).worksheet(sheet_name)


def read_sheet(sheet_name: str) -> list[dict]:
    """Return all rows from *sheet_name* as a list of dicts keyed by header."""
    return _get_worksheet(sheet_name).get_all_records()


def insert_row(sheet_name: str, row_data: list) -> None:
    """Append *row_data* as a new row in *sheet_name*."""
    _get_worksheet(sheet_name).append_row(row_data, value_input_option="USER_ENTERED")


def update_status(sheet_name: str, row_index: int, status_col: int, new_status: str) -> None:
    """Overwrite a single cell to mutate a record's status field."""
    _get_worksheet(sheet_name).update_cell(row_index, status_col, new_status)


def compute_url_hash(url: str) -> str:
    """Return a 16-char SHA-256 prefix used as a deduplication key."""
    return hashlib.sha256(url.encode()).hexdigest()[:16]
