from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from pydantic import ValidationError

from app.db.database import get_db
from app.db.models import User
from app.core.config import settings
from app.crud import user as crud_user

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/v1/auth/login")

def get_user_from_token(db: Session, token: str) -> User | None:
    """Decodes JWT token and retrieves user from DB by ID."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str: str | None = payload.get("sub")
        if user_id_str is None:
            return None
        
        user_id = int(user_id_str)

    except (JWTError, ValueError):
        # Catches decoding errors or int conversion errors
        return None
    
    user = crud_user.get_user(db, user_id=user_id)
    return user

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    user = get_user_from_token(db, token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
