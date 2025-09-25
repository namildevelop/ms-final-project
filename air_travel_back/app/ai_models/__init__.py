"""
AI Models package initialization.
"""
from .clip_model import CLIPModel
from .label_mapping import normalize_label

__all__ = ['YOLOModel', 'CLIPModel', 'normalize_label']
