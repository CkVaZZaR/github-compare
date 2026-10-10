from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    github_token: str = ""
    github_api_url: str = "https://api.github.com"
    cache_ttl: int = 3600


settings = Settings()
