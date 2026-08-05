from enum import Enum


class SourceType(str, Enum):
    MONITORING = "monitoring"
    SECURITY = "security"
    DEVOPS = "devops"
    CLOUD = "cloud"


class AuthMethod(str, Enum):
    API_KEY = "api_key"
    OAUTH2 = "oauth2"
    BASIC = "basic"
    BEARER_TOKEN = "bearer_token"


class IngestionMode(str, Enum):
    POLL = "poll"
    WEBHOOK = "webhook"
