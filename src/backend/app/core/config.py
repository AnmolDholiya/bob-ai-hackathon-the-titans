from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    app_name: str = "Port Congestion Backend"
    app_env: str = "development"
    app_port: int = 8000

    # Database
    database_url: str = "sqlite+aiosqlite:///./port_congestion.db"

    # CORS — comma-separated list of allowed origins
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

<<<<<<< HEAD
=======
    # Gemini Integration (read strictly from backend env)
    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"

>>>>>>> 3b90e15 (feat: complete PortMind production integration — AI 72h operational schedule, XGBoost+LightGBM ensemble, CSV ingestion, i18n & command center)
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


settings = Settings()
