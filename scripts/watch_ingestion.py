# pyright: reportMissingTypeStubs=false, reportMissingImports=false
from typing import Any
import os
import time
from pathlib import Path
from threading import Event, Thread

from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer


WATCH_DIR = Path(__file__).resolve().parents[1] / "data" / "documents"
DEBOUNCE_SECONDS = 2.0


class DebouncedIngestor:
    def __init__(self, namespace: str | None = None):
        self.namespace = namespace or os.getenv("INDEX_NAMESPACE", "insurance-act")
        self._event = Event()
        self._worker = Thread(target=self._run, daemon=True)
        self._last_trigger = 0.0
        self._worker.start()

    def trigger(self):
        self._last_trigger = time.time()
        self._event.set()

    def _run(self):
        while True:
            self._event.wait()
            # debounce window
            while time.time() - self._last_trigger < DEBOUNCE_SECONDS:
                time.sleep(0.2)
            self._event.clear()
            try:
                from ingestion.cli import ingest

                patterns = [
                    str(WATCH_DIR / "**" / "*.pdf"),
                    str(WATCH_DIR / "**" / "*.txt"),
                    str(WATCH_DIR / "**" / "*.md"),
                ]
                created, upserted = ingest(patterns=patterns, namespace=self.namespace)
                print(f"[watch] Ingestion complete: created={created} upserted={upserted} namespace='{self.namespace}'")
            except Exception as e:
                print(f"[watch] Ingestion failed: {e}")


class DocsEventHandler(FileSystemEventHandler):
    def __init__(self, ingestor: DebouncedIngestor):
        super().__init__()
        self.ingestor = ingestor

    def on_any_event(self, event: Any) -> None:
        if getattr(event, "is_directory", False):
            return
        # Only react to supported extensions
        src = getattr(event, "src_path", "")
        try:
            p = Path(src)
        except Exception:
            return
        if p.suffix.lower() in {".pdf", ".txt", ".md"}:
            ev_type = getattr(event, "event_type", "change")
            print(f"[watch] Change detected: {ev_type} {p}")
            self.ingestor.trigger()


def main() -> None:
    WATCH_DIR.mkdir(parents=True, exist_ok=True)
    namespace = os.getenv("INDEX_NAMESPACE", "insurance-act")
    print(f"[watch] Watching '{WATCH_DIR}' for changes (namespace='{namespace}') ...")

    ingestor = DebouncedIngestor(namespace=namespace)
    handler = DocsEventHandler(ingestor)
    observer = Observer()
    observer.schedule(handler, str(WATCH_DIR), recursive=True)
    observer.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()


if __name__ == "__main__":
    main()
