from fastapi import APIRouter

from app.api.v1.endpoints import users, trips, notifications

api_router = APIRouter()
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(trips.router, prefix="/trips", tags=["trips"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])