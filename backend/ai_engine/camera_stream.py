"""
Live Camera Stream — OpenCV + AI Inspection
Supports webcam index or RTSP URL (CCTV).
"""

import cv2
import threading
import time
import numpy as np
from ai_engine.detector import detector


class CameraStream:

    def __init__(self, source=0, inspect_every: int = 15):
        self.source        = source
        self.inspect_every = inspect_every
        self.cap           = None
        self.frame         = None
        self.running       = False
        self.frame_count   = 0
        self.fps           = 0.0
        self.last_result   = None
        self._lock         = threading.Lock()
        self._thread       = None

    def start(self):
        if self.running:
            return
        self.cap = cv2.VideoCapture(self.source)
        if not self.cap.isOpened():
            raise RuntimeError(f"Cannot open: {self.source}")
        self.running = True
        self._thread = threading.Thread(target=self._loop, daemon=True)
        self._thread.start()
        print(f"[Camera] Started — source={self.source}")

    def stop(self):
        self.running = False
        if self._thread:
            self._thread.join(timeout=3)
        if self.cap:
            self.cap.release()
        print("[Camera] Stopped.")

    def get_jpeg_frame(self) -> bytes | None:
        with self._lock:
            if self.frame is None:
                return None
            frame = self._draw_overlay(self.frame.copy())
        _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        return buf.tobytes()

    # ── Internal ────────────────────────────────────────────

    def _loop(self):
        t0 = time.time()
        while self.running:
            ok, frame = self.cap.read()
            if not ok:
                time.sleep(0.05)
                continue
            self.frame_count += 1
            elapsed  = time.time() - t0
            self.fps = round(self.frame_count / elapsed, 1)

            if self.frame_count % self.inspect_every == 0:
                result = detector.inspect_frame(frame)
                self.last_result = result
                if not result["passed"]:
                    self._log_defect(result)

            with self._lock:
                self.frame = frame

    def _draw_overlay(self, frame: np.ndarray) -> np.ndarray:
        h, w = frame.shape[:2]
        cv2.putText(frame, f"FPS:{self.fps}", (10, 25),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 136), 2)
        cv2.putText(frame, f"Frame:{self.frame_count}", (10, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 212, 255), 2)

        if self.last_result and self.last_result["defects"]:
            for d in self.last_result["defects"]:
                b = d["bbox"]
                color = (90, 60, 255) if d["severity"] in ("High", "Critical") else (0, 200, 255)
                cv2.rectangle(frame,
                              (int(b["x1"]), int(b["y1"])),
                              (int(b["x2"]), int(b["y2"])), color, 2)
                cv2.putText(frame, f"{d['type']} {d['confidence']:.2f}",
                            (int(b["x1"]), int(b["y1"]) - 6),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 1)

        status = "PASS" if (not self.last_result or self.last_result["passed"]) else "DEFECT"
        color  = (0, 200, 80) if status == "PASS" else (0, 60, 255)
        cv2.rectangle(frame, (w - 120, 8), (w - 8, 36), color, -1)
        cv2.putText(frame, status, (w - 112, 28),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        return frame

    def _log_defect(self, result: dict):
        try:
            from database.db import get_db
            db = get_db()
            db.live_defects.insert_one({
                "frame":     self.frame_count,
                "defects":   result["defects"],
                "timestamp": time.time(),
                "source":    str(self.source),
            })
            from utils.alerts import send_defect_alert
            send_defect_alert(result["defects"])
        except Exception as e:
            print(f"[Camera] Log error: {e}")


def generate_mjpeg(stream: CameraStream):
    """Flask streaming generator for MJPEG."""
    while True:
        frame = stream.get_jpeg_frame()
        if frame:
            yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n"
                   + frame + b"\r\n")
        time.sleep(0.033)
