# heavy_tasks.py
from db import (
    SessionLocal,
    get_overall_rankings,
    compute_rankings_by_type,
)
from activity import seconds_since_last_active
import time
import threading

_LOCK = threading.Lock()
_last_run = 0
MIN_GAP_SECONDS = 1800  # 30 minutes

def can_run_heavy():
    global _last_run
    now = time.time()

    if seconds_since_last_active() < 60:
        return False

    with _LOCK:
        if now - _last_run < MIN_GAP_SECONDS:
            return False
        _last_run = now

    return True


def run_heavy_tasks(force=False):
    if not force and not can_run_heavy():
        return {"status": "skipped", "reason": "Not safe or cooldown active"}

    db = SessionLocal()
    try:
        print("🧠 Running heavy tasks")

        overall = get_overall_rankings(db)
        singles = compute_rankings_by_type(db, "singles")
        doubles = compute_rankings_by_type(db, "doubles")

        return {
            "status": "ok",
            "computed": {
                "overall": len(overall),
                "singles": len(singles),
                "doubles": len(doubles)
            }
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}
    finally:
        db.close()
