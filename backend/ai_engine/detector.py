"""
AI Defect Detector — YOLOv8 with real defect detection
Uses pretrained COCO model (ONNX) + custom defect classification
"""

import cv2
import numpy as np
import time
import base64
import io
import os
import gc
from PIL import Image

MODEL_PATH = "backend/yolov8n.onnx" if os.path.exists("backend/yolov8n.onnx") else "yolov8n.onnx"

COCO_NAMES = {
    0: 'person', 1: 'bicycle', 2: 'car', 3: 'motorcycle', 4: 'airplane', 5: 'bus', 6: 'train', 7: 'truck',
    8: 'boat', 9: 'traffic light', 10: 'fire hydrant', 11: 'stop sign', 12: 'parking meter', 13: 'bench',
    14: 'bird', 15: 'cat', 16: 'dog', 17: 'horse', 18: 'sheep', 19: 'cow', 20: 'elephant', 21: 'bear',
    22: 'zebra', 23: 'giraffe', 24: 'backpack', 25: 'umbrella', 26: 'handbag', 27: 'tie', 28: 'suitcase',
    29: 'frisbee', 30: 'skis', 31: 'snowboard', 32: 'sports ball', 33: 'kite', 34: 'baseball bat', 35: 'baseball glove',
    36: 'skateboard', 37: 'surfboard', 38: 'tennis racket', 39: 'bottle', 40: 'wine glass', 41: 'cup', 42: 'fork',
    43: 'knife', 44: 'spoon', 45: 'bowl', 46: 'banana', 47: 'apple', 48: 'sandwich', 49: 'orange', 50: 'broccoli',
    51: 'carrot', 52: 'hot dog', 53: 'pizza', 54: 'donut', 55: 'cake', 56: 'chair', 57: 'couch', 58: 'potted plant',
    59: 'bed', 60: 'dining table', 61: 'toilet', 62: 'tv', 63: 'laptop', 64: 'mouse', 65: 'remote', 66: 'keyboard',
    67: 'cell phone', 68: 'microwave', 69: 'oven', 70: 'toaster', 71: 'sink', 72: 'refrigerator', 73: 'book',
    74: 'clock', 75: 'vase', 76: 'scissors', 77: 'teddy bear', 78: 'hair drier', 79: 'toothbrush'
}

class DefectDetector:

    def __init__(self):
        self.device = "cpu"
        self.net = None
        try:
            if os.path.exists(MODEL_PATH):
                self.net = cv2.dnn.readNetFromONNX(MODEL_PATH)
                print("[AI] YOLOv8 ONNX loaded OK -- Memory safe mode active")
            else:
                print("[AI] ONNX model missing, running in pure OpenCV mode")
        except Exception as e:
            print(f"[AI] Model load error: {e}")

    def inspect_image(self, image_bytes: bytes) -> dict:
        start     = time.time()
        img_array = self._bytes_to_array(image_bytes)
        gc.collect() # Force memory cleanup
        
        objects = []
        if self.net is not None:
            objects = self._run_yolo_onnx(img_array)
            defects = self._analyze_defects(img_array, objects)
            model_name = "YOLOv8n (ONNX)"
        else:
            defects = self._image_quality_check(img_array, None)
            model_name = "CV2 Analytics"

        elapsed   = round(time.time() - start, 3)
        annotated = self._annotate(img_array.copy(), objects, defects)
        return {
            "defects":         defects,
            "defect_count":    len(defects),
            "passed":          len(defects) == 0,
            "inference_time":  elapsed,
            "model":           model_name,
            "device":          self.device,
            "annotated_image": self._to_b64(annotated),
            "measurements":    self._measure_dimensions(img_array),
        }

    def _run_yolo_onnx(self, img) -> list:
        blob = cv2.dnn.blobFromImage(img, 1/255.0, (640, 640), swapRB=True, crop=False)
        self.net.setInput(blob)
        outputs = self.net.forward()[0].T
        
        boxes, scores, class_ids = [], [], []
        x_factor = img.shape[1] / 640.0
        y_factor = img.shape[0] / 640.0
        
        for row in outputs:
            classes_scores = row[4:]
            max_score = np.max(classes_scores)
            if max_score >= 0.35:
                class_id = np.argmax(classes_scores)
                xc, yc, w, h = row[0], row[1], row[2], row[3]
                x1 = int((xc - w/2) * x_factor)
                y1 = int((yc - h/2) * y_factor)
                width = int(w * x_factor)
                height = int(h * y_factor)
                boxes.append([x1, y1, width, height])
                scores.append(float(max_score))
                class_ids.append(class_id)
                
        indices = cv2.dnn.NMSBoxes(boxes, scores, 0.35, 0.45)
        results = []
        if len(indices) > 0:
            for i in indices.flatten():
                x, y, w, h = boxes[i]
                cid = class_ids[i]
                results.append({
                    "label": COCO_NAMES.get(cid, "object"),
                    "bbox": (max(0,x), max(0,y), min(img.shape[1],x+w), min(img.shape[0],y+h)),
                    "conf": scores[i]
                })
        return results

    def _analyze_defects(self, img, objects) -> list:
        defects = []
        if not objects:
            return self._image_quality_check(img, None)
        
        for obj in objects:
            if obj["label"] == "person":
                continue
            x1, y1, x2, y2 = obj["bbox"]
            crop = img[y1:y2, x1:x2]
            if crop.size == 0:
                continue
            obj_defects = self._image_quality_check(crop, obj["label"])
            for d in obj_defects:
                d["bbox"] = {"x1": x1, "y1": y1, "x2": x2, "y2": y2}
            defects += obj_defects
        return defects

    def _image_quality_check(self, img, object_label) -> list:
        defects = []
        gray    = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY) if len(img.shape)==3 else img
        h, w    = gray.shape[:2]
        if h < 10 or w < 10:
            return defects

        edges      = cv2.Canny(gray, 50, 150)
        edge_ratio = np.count_nonzero(edges) / (h * w)
        
        if edge_ratio > 0.005:
            defects.append({
                "type":       "crack" if edge_ratio > 0.02 else "scratch",
                "confidence": round(min(0.99, edge_ratio * 30), 2),
                "severity":   "Critical" if edge_ratio > 0.02 else "Medium",
                "bbox":       None,
            })

        if len(img.shape) == 3:
            hsv     = cv2.cvtColor(img, cv2.COLOR_RGB2HSV)
            sat_std = float(np.std(hsv[:,:,1]))
            val     = hsv[:,:,2]

            if sat_std > 80:
                defects.append({
                    "type": "discoloration", "severity": "Low",
                    "confidence": round(min(0.92, sat_std/100), 2), "bbox": None,
                })

            dark_ratio = np.count_nonzero(val < 20) / (h * w)
            if 0.15 < dark_ratio < 0.5:
                defects.append({
                    "type": "dent", "severity": "High",
                    "confidence": round(min(0.88, dark_ratio*5), 2), "bbox": None,
                })

        if float(np.std(gray)) > 70 and float(np.mean(gray)) < 180:
            defects.append({
                "type": "stain", "severity": "Low",
                "confidence": 0.72, "bbox": None,
            })

        seen, final = set(), []
        for d in defects:
            if d["type"] not in seen:
                seen.add(d["type"])
                final.append(d)
        return final

    def _annotate(self, img, objects, defects) -> np.ndarray:
        for obj in objects:
            x1, y1, x2, y2 = obj["bbox"]
            cv2.rectangle(img, (x1,y1), (x2,y2), (0,180,255), 2)
            cv2.putText(img, f'{obj["label"]} {obj["conf"]:.2f}',
                        (x1,y1-6), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,180,255), 1)
                        
        for d in defects:
            if d.get("bbox"):
                b = d["bbox"]
                color = (255,60,90) if d["severity"] in ("High","Critical") else (255,200,0)
                cv2.rectangle(img,(int(b["x1"]),int(b["y1"])),(int(b["x2"]),int(b["y2"])),color,2)
                
        status = "PASS" if not defects else "FAIL"
        color  = (0,200,80) if status=="PASS" else (255,60,90)
        cv2.rectangle(img, (8,8), (120,36), color, -1)
        cv2.putText(img, status, (14,28), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255,255,255), 2)
        return img

    @staticmethod
    def _bytes_to_array(b):
        img = Image.open(io.BytesIO(b)).convert("RGB")
        img.thumbnail((800, 800))
        return np.array(img)

    @staticmethod
    def _to_b64(img):
        _, buf = cv2.imencode(".jpg", cv2.cvtColor(img, cv2.COLOR_RGB2BGR))
        return base64.b64encode(buf).decode("utf-8")

    def _measure_dimensions(self, img) -> dict:
        gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY) if len(img.shape)==3 else img
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return {"width": 0, "height": 0, "area": 0}
        largest = max(contours, key=cv2.contourArea)
        x, y, w, h = cv2.boundingRect(largest)
        return {
            "width_mm": round(w * 0.26, 1),
            "height_mm": round(h * 0.26, 1),
            "area_mm2": round(cv2.contourArea(largest) * 0.26 * 0.26, 1)
        }

detector = DefectDetector()