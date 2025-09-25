"""
Label mapping and normalization utilities.
"""
from typing import Tuple, List

# 라벨 정규화(영→한) + 동의어
LABEL_MAP = {
    "king sejong": {"ko": "세종대왕 동상", "aliases": ["King Sejong Statue ", "세종대왕", "세종대왕 동상"]},
    "Yisunsin": {"ko": "충무공 이순신 장군상", "aliases": ["Statue of Admiral Yi Sun-Shin", "Yisunsin","이순신"]},
    "Gwanghwamun": {"ko": "광화문", "aliases": ["Gwanghwamun", "광화문"]},
    "kyobo": {"ko": "교보생명 본사", "aliases": ["Kyobo Life Building", "교보생명", "교보생명 본사","교보문고"]},
}

def normalize_label(label: str) -> Tuple[str, List[str]]:
    """Normalize label to Korean and return aliases."""
    key = (label or "").lower().strip()
    info = LABEL_MAP.get(key)
    if not info:
        return label, [label]
    ko = info["ko"]
    aliases = [ko, *info["aliases"], label]
    return ko, aliases


