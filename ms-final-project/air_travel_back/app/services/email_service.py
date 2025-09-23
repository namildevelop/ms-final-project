from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from app.core.config import settings
from typing import List

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

async def send_verification_email(recipients: List[str], code: str):
    html = f"""
    <html>
        <body>
            <p>안녕하세요,</p>
            <p>Air Travel 회원가입을 완료하려면 아래 인증 코드를 입력해주세요.</p>
            <h2>{code}</h2>
            <p>감사합니다.</p>
        </body>
    </html>
    """

    message = MessageSchema(
        subject="Air Travel 회원가입 인증 코드",
        recipients=recipients,
        body=html,
        subtype="html"
    )

    fm = FastMail(conf)
    await fm.send_message(message)
