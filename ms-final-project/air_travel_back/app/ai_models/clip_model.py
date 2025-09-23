"""
CLIP model wrapper for scene recognition using FAISS.
"""
import os
import json
import math
import torch
import clip
import faiss
import numpy as np
from typing import Optional, Dict, List
from PIL import Image
from collections import defaultdict
from app.core.config import settings

class CLIPModel:
    """CLIP model wrapper for scene recognition."""
    
    def __init__(self):
        self.device = "cuda" if (hasattr(torch, "cuda") and torch.cuda.is_available()) else "cpu"
        
        try:
            self.model, self.preprocess = clip.load("ViT-B/32", device=self.device)
            self.faiss_index = faiss.read_index(settings.FAISS_INDEX_PATH) if os.path.exists(settings.FAISS_INDEX_PATH) else None
            self.meta_data = json.load(open(settings.META_DATA_PATH, "r", encoding="utf-8")) if os.path.exists(settings.META_DATA_PATH) else []
        except Exception as e:
            self.model = self.preprocess = None
            self.faiss_index, self.meta_data = None, []
            print(f"[CLIP/FAISS disabled] {e}")
    
    def _haversine(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate haversine distance between two GPS coordinates."""
        R = 6371000.0
        toR = math.radians
        dlat = toR(lat2 - lat1)
        dlon = toR(lon2 - lon1)
        a = math.sin(dlat/2)**2 + math.cos(toR(lat1))*math.cos(toR(lat2))*math.sin(dlon/2)**2
        return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    def search(self, image: Image.Image, lat: Optional[float] = None, lon: Optional[float] = None) -> Optional[Dict[str, str]]:
        """Search for similar scenes using CLIP and FAISS."""
        if self.model is None or self.faiss_index is None or not self.meta_data:
            return None

        # 유니크 라벨이 2개 미만이면 확정하지 않음
        if len({m["label"] for m in self.meta_data}) < 2:
            return None

        with torch.no_grad():
            x = self.preprocess(image).unsqueeze(0).to(self.device)
            v = self.model.encode_image(x)
            v = v / v.norm(dim=-1, keepdim=True)
        q = v.detach().cpu().numpy().astype("float32")

        # GPS 후보 제한(있으면)
        cand_idx = list(range(len(self.meta_data)))
        has_gps = (lat is not None and lon is not None)
        if has_gps:
            c800 = [i for i, m in enumerate(self.meta_data)
                    if m.get("lat") is not None and self._haversine(lat, lon, m["lat"], m["lon"]) <= 800]
            c1500 = [i for i, m in enumerate(self.meta_data)
                     if m.get("lat") is not None and self._haversine(lat, lon, m["lat"], m["lon"]) <= 1500]
            cand_idx = c800 or c1500 or cand_idx

        k = min(10, self.faiss_index.ntotal)
        if k == 0: 
            return None
        
        D, I = self.faiss_index.search(q, k)
        if I.size == 0: 
            return None

        pairs = [(float(D[0][j]), int(I[0][j]))
                 for j in range(len(I[0]))
                 if (not cand_idx) or (int(I[0][j]) in cand_idx)]
        if not pairs: 
            return None

        # 라벨별 표 모으기 (top-5)
        votes = defaultdict(list)
        for s, idx in pairs[:5]:
            votes[self.meta_data[idx]["label"]].append(s)

        # 디버깅 로그 추가
        print(f"CLIP Debug: Top 5 pairs = {[(s, self.meta_data[idx]['label']) for s, idx in pairs[:5]]}")
        print(f"CLIP Debug: Votes = {dict(votes)}")

        # 게이트: 최소 점수/표/마진 (더 관대하게 조정)
        min_score  = 0.25 if not has_gps else 0.20  # 임계값 낮춤
        min_votes  = 1    if not has_gps else 1     # 투표수 요구사항 낮춤
        min_margin = 0.02                            # 마진 요구사항 낮춤

        print(f"CLIP Debug: Thresholds - min_score={min_score}, min_votes={min_votes}, min_margin={min_margin}")

        best_label, best_scores = max(votes.items(), key=lambda kv: max(kv[1]))
        best_score = max(best_scores)
        second_score = None
        if len(votes) > 1:
            second_score = max(max(s) for lab, s in votes.items() if lab != best_label)

        print(f"CLIP Debug: best_label={best_label}, best_score={best_score}, second_score={second_score}")

        if best_label.lower() in {"none", "기타", "unknown"}: 
            print("CLIP Debug: Rejected - label is none/기타/unknown")
            return None
        if best_score < min_score: 
            print(f"CLIP Debug: Rejected - best_score {best_score} < min_score {min_score}")
            return None
        if len(best_scores) < min_votes: 
            print(f"CLIP Debug: Rejected - votes {len(best_scores)} < min_votes {min_votes}")
            return None
        if second_score is not None and (best_score - second_score) < min_margin: 
            print(f"CLIP Debug: Rejected - margin {best_score - second_score} < min_margin {min_margin}")
            return None

        # 통과 → 해당 라벨 설명 반환
        for s, idx in pairs:
            if self.meta_data[idx]["label"] == best_label:
                m = self.meta_data[idx]
                return {"label": m["label"], "description": m.get("desc", m["label"])}
        return None
