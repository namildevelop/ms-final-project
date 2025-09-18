from fastapi import APIRouter

from app.api.v1.endpoints import users, trips, notifications, google_maps

api_router = APIRouter()
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(trips.router, prefix="/trips", tags=["trips"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(google_maps.router, prefix="/google-maps", tags=["google-maps"])