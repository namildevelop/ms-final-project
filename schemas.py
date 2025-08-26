from pydantic import BaseModel, EmailStr
from datetime import date

class SignUp(BaseModel):
    # username 입력 없이 이메일=아이디 통합
    name: str
    email: EmailStr
    student_id: str | None = None
    password: str
    password_confirm: str
    mbti: str | None = None
    address: str | None = None
    gender: str | None = None
    birthdate: date | None = None
    phone: str | None = None
    nickname: str | None = None

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

# 구글 로그인 이후 ‘추가입력’ 화면에서 사용하는 스키마
class ProfileComplete(BaseModel):
    address: str | None = None
    phone: str | None = None
    gender: str | None = None
    mbti: str | None = None
    birthdate: date | None = None
