from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="bmi_", env_file=".env", extra="ignore")

    supabase_url: str = ""
    supabase_service_role_key: str = ""
    environment: str = "development"
    lastfm_api_key: str = ""


settings = Settings()
