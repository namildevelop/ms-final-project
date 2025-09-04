from fastapi import APIRouter, Depends, HTTPException, status
import requests
from typing import List, Optional

from app.core.config import settings

router = APIRouter()

@router.get("/search")
def search_places(query: str):
    if not settings.GOOGLE_MAPS_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google Maps API key is not configured."
        )

    url = f"https://maps.googleapis.com/maps/api/place/textsearch/json?query={query}&key={settings.GOOGLE_MAPS_API_KEY}&language=ko"
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()

        if data.get("status") != "OK":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Google Maps API Error: {data.get('error_message', data.get('status'))}"
            )
        
        results = [
            {
                "place_id": place.get("place_id"),
                "name": place.get("name"),
                "formatted_address": place.get("formatted_address"),
                "geometry": place.get("geometry"),
            }
            for place in data.get("results", [])
        ]

        return results

    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to connect to Google Maps API: {e}"
        )
