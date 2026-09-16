import os

class Settings:
    PROJECT_NAME: str = "Raku Jakarta"
    API_V1_STR: str = "/api/v1"
    
    # Akan di-load dari env variables nanti
    # DB_USER = os.getenv("DB_USER", "root")
    pass

settings = Settings()
