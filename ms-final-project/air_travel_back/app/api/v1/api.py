from fastapi import APIRouter

from app.api.v1.endpoints import users, trips, notifications, google_maps, auth, translation, ai_analysis

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(trips.router, prefix="/trips", tags=["trips"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(google_maps.router, prefix="/google-maps", tags=["google-maps"])
api_router.include_router(translation.router, prefix="/translation", tags=["translation"])
api_router.include_router(ai_analysis.router, prefix="/ai-analysis", tags=["ai-analysis"])