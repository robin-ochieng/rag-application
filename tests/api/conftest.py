import os
import sys
import time
import socket
import subprocess
from contextlib import closing
import pytest
import requests

BASE = os.getenv("API_URL", "http://127.0.0.1:8000")


def _port_open(host: str, port: int) -> bool:
    with closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as sock:
        sock.settimeout(0.5)
        return sock.connect_ex((host, port)) == 0


def _wait_healthy(timeout: float = 15.0) -> bool:
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            r = requests.get(f"{BASE}/healthz", timeout=1.5)
            if r.ok and r.json().get("ok"):
                return True
        except Exception:
            pass
        time.sleep(0.3)
    return False


@pytest.fixture(scope="session", autouse=True)
def backend_server():
    host = "127.0.0.1"
    port = 8000
    started = False
    proc = None

    if not _port_open(host, port):
        # Start uvicorn in a subprocess using the current interpreter
        env = os.environ.copy()
        env["TEST_MODE"] = "1"
        cmd = [sys.executable, "-m", "uvicorn", "app_fastapi:app", "--host", host, "--port", str(port)]
        proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT, env=env)
        started = True

    ok = _wait_healthy()
    if not ok:
        # If we started a process, terminate it before failing
        if proc is not None:
            proc.terminate()
        pytest.fail("Backend /healthz not reachable")

    yield

    if started and proc is not None and proc.poll() is None:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except Exception:
            proc.kill()
