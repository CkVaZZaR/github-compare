from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    github_api_url: str = "https://api.github.com"
    github_oauth_url: str = "https://github.com/login/oauth"
    cache_ttl: int = 3600

    # OAuth App: https://github.com/settings/developers
    github_client_id: str = ""
    github_client_secret: str = ""
    # Ключ шифрования cookie сессии; пустой — случайный при старте
    session_secret: str = ""
    session_ttl: int = 30 * 24 * 3600
    # True в проде за HTTPS
    cookie_secure: bool = False

    @property
    def oauth_enabled(self) -> bool:
        return bool(self.github_client_id and self.github_client_secret)


settings = Settings()
