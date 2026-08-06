from enum import Enum

class ComponentType(str, Enum):
    APPLICATION = "application"
    SERVICE = "service"
    DATABASE = "database"
    QUEUE = "queue"
    CACHE = "cache"
    GATEWAY = "gateway"
    LOAD_BALANCER = "load_balancer"
    STORAGE = "storage"
    EXTERNAL = "external"

class Priority(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
