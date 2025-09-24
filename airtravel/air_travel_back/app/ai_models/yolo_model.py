"""
YOLO model wrapper for object detection.
"""
import os
import numpy as np
from typing import List, Dict, Any
from PIL import Image
from ultralytics import YOLO
from app.core.config import settings

class YOLOModel:
    """YOLO model wrapper class."""
    
    def __init__(self):
        # YOLO 모델 파일이 없으면 기본 모델 사용
        if not settings.YOLO_MODEL_PATH or not os.path.exists(settings.YOLO_MODEL_PATH):
            print(f"YOLO 모델 파일을 찾을 수 없습니다: {settings.YOLO_MODEL_PATH}")
            print("기본 YOLOv8n 모델을 사용합니다.")
            self.model = YOLO('yolov8n.pt')  # 기본 모델 다운로드
        else:
            self.model = YOLO(settings.YOLO_MODEL_PATH)
        
        self.device = settings.YOLO_DEVICE
    
    def predict(self, image: Image.Image) -> List[Dict[str, Any]]:
        """Run YOLO prediction on image."""
        arr = np.array(image)  # PIL → numpy
        results = self.model.predict(
            arr, imgsz=640, conf=0.35, iou=0.5, device=self.device, verbose=False
        )
        
        dets: List[Dict[str, Any]] = []
        if not results:
            return dets

        r = results[0]
        h, w = r.orig_shape
        boxes = r.boxes.xyxy.cpu().numpy()   # [x1,y1,x2,y2]
        clses = r.boxes.cls.cpu().numpy()
        confs = r.boxes.conf.cpu().numpy()

        for (x1, y1, x2, y2), cls, p in zip(boxes, clses, confs):
            label = self.model.names[int(cls)]  # data.yaml의 names
            dets.append({
                "label": label,
                "description": f"{label} (확률 {p:.2f})",
                "bbox": [float(x1/w), float(y1/h), float((x2-x1)/w), float((y2-y1)/h)],  # 0~1 정규화
            })
        return dets

