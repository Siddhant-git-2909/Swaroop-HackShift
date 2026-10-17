import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_env: str = os.getenv("APP_ENV", "local")
    demo_mode: bool = os.getenv("DEMO_MODE", "true").lower() == "true"
    demo_otp: str = os.getenv("DEMO_OTP", "123456")
    demo_staff_password: str = os.getenv("DEMO_STAFF_PASSWORD", "change-me-demo")
    mongodb_uri: str = os.getenv("MONGODB_URI", "")
    mongodb_database: str = os.getenv("MONGODB_DATABASE", "swaroop")
    public_base_url: str = os.getenv("PUBLIC_BASE_URL", "http://localhost:5173")
    jwt_secret: str = os.getenv("JWT_SECRET", "swaroop-hackshift-demo-secret-key-2025")
    jwt_ttl_minutes: int = int(os.getenv("JWT_TTL_MINUTES", "120"))
    ai_mode: str = os.getenv("AI_MODE", "live")
    sarvam_api_key: str = os.getenv("SARVAM_API_KEY", "")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    storage_backend: str = os.getenv("STORAGE_BACKEND", "local")
    upload_dir: str = os.getenv("UPLOAD_DIR", "server/uploads")

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
