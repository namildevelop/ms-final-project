"""
Detection service that combines YOLO and CLIP models.
"""
from typing import List, Dict, Any, Optional
from PIL import Image
from app.ai_models import CLIPModel, normalize_label
# from app.ai_models import YOLOModel  # 주석처리 (서울 데이터셋으로 재훈련 필요)

class DetectionService:
    """Service for object detection and scene recognition."""
    
    def __init__(self):
        # self.yolo_model = YOLOModel()  # 주석처리 (서울 데이터셋으로 재훈련 필요)
        self.clip_model = CLIPModel()
    
    def detect_objects_and_scenes(self, image: Image.Image, lat: Optional[float] = None, lon: Optional[float] = None) -> List[Dict[str, Any]]:
        """Detect objects using YOLO and scenes using CLIP."""
        detections = []
        
        # YOLO object detection - 주석처리 (서울 데이터셋으로 재훈련 필요)
        # yolo_dets = self.yolo_model.predict(image)
        # for i, obj in enumerate(yolo_dets):
        #     raw_label = obj["label"]
        #     ko_label, aliases = normalize_label(raw_label)
        #     
        #     detections.append({
        #         "id": f"yolo_{i}",
        #         "label": ko_label,
        #         "description": obj.get("description") or ko_label,
        #         "bbox": obj["bbox"],
        #         "type": "object"
        #     })
        
        # CLIP scene recognition
        scene_det = self.clip_model.search(image, lat, lon)
        if scene_det is not None:
            raw_label = scene_det["label"]
            ko_label, aliases = normalize_label(raw_label)
            
            detections.append({
                "id": "scene",
                "label": ko_label,
                "description": scene_det.get("description") or ko_label,
                "bbox": [0.0, 0.0, 1.0, 1.0],
                "type": "scene"
            })
        
        return detections

