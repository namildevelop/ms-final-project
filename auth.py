import os, datetime, secrets, re
from jose import jwt
from passlib.hash import bcrypt

JWT_SECRET = os.getenv("JWT_SECRET", "dev")
JWT_ALG = os.getenv("JWT_ALG", "HS256")

def hash_pw(pw: str) -> str:
    return bcrypt.hash(pw)

def verify_pw(pw: str, hashed: str) -> bool:
    return bcrypt.verify(pw, hashed)

def make_access_token(sub: str, minutes: int = 60):
    payload = {"sub": sub, "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=minutes)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def make_random_token() -> str:
    return secrets.token_urlsafe(32)

# 8자 이상, 대/소문자/숫자/특수문자 포함
_pwd_re = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$")
def password_ok(pw: str) -> bool:
    return bool(_pwd_re.match(pw))
