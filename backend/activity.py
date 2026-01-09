# activity.py
import time
import threading

_LAST_ACTIVE = time.time()
_LOCK = threading.Lock()

def mark_active():
    global _LAST_ACTIVE
    with _LOCK:
        _LAST_ACTIVE = time.time()

def seconds_since_last_active():
    with _LOCK:
        return time.time() - _LAST_ACTIVE

def get_last_active_timestamp():
    with _LOCK:
        return _LAST_ACTIVE
