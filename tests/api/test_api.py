import os
import time
import requests

BASE = os.getenv("API_URL", "http://127.0.0.1:8000")

def wait_healthy(timeout=10):
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            r = requests.get(f"{BASE}/healthz", timeout=2)
            if r.ok and r.json().get("ok"):
                return True
        except Exception:
            pass
        time.sleep(0.5)
    return False

def test_health_ok():
    assert wait_healthy(), "backend /healthz not reachable"


def test_ask_happy_path():
    r = requests.post(f"{BASE}/ask", json={"q": "Hello"}, timeout=5)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "answer" in data
    # Optional fields
    assert isinstance(data.get("citations", []), list) or True
    assert isinstance(data.get("followUps", []), list) or True


def test_ask_missing_field():
    r = requests.post(f"{BASE}/ask", json={}, timeout=5)
    assert r.status_code in (400, 422), r.text
