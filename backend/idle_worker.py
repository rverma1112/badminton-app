# idle_worker.py
import time
import threading
from activity import seconds_since_last_active
from heavy_tasks import run_heavy_tasks

IDLE_THRESHOLD_SECONDS = 300  # 5 minutes idle


def idle_worker_loop():
    while True:
        time.sleep(60)

        # Only decide WHEN to trigger heavy work
        if seconds_since_last_active() >= IDLE_THRESHOLD_SECONDS:
            result = run_heavy_tasks(force=False)

            if result["status"] == "ok":
                print("✅ Idle worker: heavy tasks completed")
            elif result["status"] == "skipped":
                print("⏭️ Idle worker: skipped (cooldown / not safe)")
            else:
                print("🔥 Idle worker error:", result)


def start_idle_worker():
    t = threading.Thread(target=idle_worker_loop, daemon=True)
    t.start()
