from fastapi import APIRouter, Depends, HTTPException, status
import requests
from typing import List, Optional
import logging

from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

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

@router.get("/place-details-by-name")
def get_place_details_by_name(query: str):
    if not settings.GOOGLE_MAPS_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google Maps API key is not configured."
        )

    # 1. Find Place ID from text query
    find_place_url = f"https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input={query}&inputtype=textquery&fields=place_id,name&key={settings.GOOGLE_MAPS_API_KEY}&language=ko"
    place_id = None
    place_name_from_google = query # Fallback to original query
    try:
        response = requests.get(find_place_url, timeout=10)
        response.raise_for_status()
        find_data = response.json()
        if find_data.get("status") == "OK" and find_data.get("candidates"):
            place_id = find_data["candidates"][0]["place_id"]
            place_name_from_google = find_data["candidates"][0].get("name", query)
        else:
            fallback_url = f"https://maps.googleapis.com/maps/api/place/textsearch/json?query={query}&key={settings.GOOGLE_MAPS_API_KEY}&language=ko"
            response = requests.get(fallback_url, timeout=10)
            response.raise_for_status()
            search_data = response.json()
            if search_data.get("status") == "OK" and search_data.get("results"):
                place_id = search_data["results"][0]["place_id"]
                place_name_from_google = search_data["results"][0].get("name", query)

    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to connect to Google Maps API (Find Place): {e}"
        )
    
    if not place_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Could not find a place matching '{query}'."
        )

    # 2. Get Place Details using the Place ID
    details_url = f"https://maps.googleapis.com/maps/api/place/details/json?place_id={place_id}&fields=name,formatted_address,international_phone_number,opening_hours,website,photos&key={settings.GOOGLE_MAPS_API_KEY}&language=ko"
    
    try:
        response = requests.get(details_url, timeout=10)
        response.raise_for_status()
        details_data = response.json()

        if details_data.get("status") != "OK":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Google Maps API Error (Place Details): {details_data.get('error_message', details_data.get('status'))}"
            )
        
        result = details_data.get("result", {})
        
        photo_url = None
        if result.get("photos"):
            photo_reference = result["photos"][0]["photo_reference"]
            photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photo_reference}&key={settings.GOOGLE_MAPS_API_KEY}"
        else:
            # FALLBACK LOGIC: If no photo in details, try a text search
            logger.info(f"No photo found in Place Details for '{query}'. Falling back to Text Search for a photo.")
            search_url = f"https://maps.googleapis.com/maps/api/place/textsearch/json?query={query}&key={settings.GOOGLE_MAPS_API_KEY}&language=ko"
            search_response = requests.get(search_url, timeout=10)
            search_response.raise_for_status()
            search_data = search_response.json()
            if search_data.get("status") == "OK" and search_data.get("results"):
                first_result = search_data["results"][0]
                if first_result.get("photos"):
                    photo_reference = first_result["photos"][0]["photo_reference"]
                    photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photo_reference}&key={settings.GOOGLE_MAPS_API_KEY}"
                    logger.info(f"Found fallback photo for '{query}' from Text Search.")

        return {
            "name": result.get("name"),
            "photo_url": photo_url,
            "address": result.get("formatted_address"),
            "opening_hours": result.get("opening_hours", {}).get("weekday_text"),
            "phone_number": result.get("international_phone_number"),
            "website": result.get("website"),
        }

    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to connect to Google Maps API (Place Details): {e}"
        )