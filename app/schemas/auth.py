from pydantic import BaseModel, EmailStr, Field
from datetime import date

class SignUp(BaseModel):
    email: EmailStr
    password: str
    password_confirm: str
    nickname: str = Field(..., min_length=1, max_length=50, description="닉네임 (1-50자)")
    phone: str | None = None
    gender: str | None = None
    birth_date: date | None = None
    address: str | None = None
    mbti: str | None = None
    profile_image_url: str | None = None

class Login(BaseModel):
    email: EmailStr
    password: str

class EmailOnly(BaseModel):
    email: EmailStr

class VerifyToken(BaseModel):
    token: str

class VerifyCode(BaseModel):
    email: EmailStr
    code: str

class ResetPassword(BaseModel):
    token: str
    new_password: str
    new_password_confirm: str

# 구글 로그인 이후 '추가입력' 화면에서 사용하는 스키마
class ProfileComplete(BaseModel):
    address: str | None = None
    phone: str | None = None
    gender: str | None = None
    mbti: str | None = None
    birth_date: date | None = None
    profile_image_url: str | None = None



