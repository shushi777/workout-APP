"""
Configuration Management for Workout Video Editor
Supports multiple storage backends (Local, S3, Cloudflare R2)
"""

import os
from dotenv import load_dotenv
from urllib.parse import urlparse

# Load environment variables from .env file
# override=False ensures Railway environment variables take precedence over .env file
load_dotenv(override=False)


class Config:
    """Base configuration class"""

    # Flask Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'

    # Server Configuration
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 5000))

    # File Upload Configuration
    MAX_CONTENT_LENGTH = 500 * 1024 * 1024  # 500MB max file size
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    OUTPUT_FOLDER = os.getenv('OUTPUT_FOLDER', 'output')
    ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv'}

    # Database Configuration
    # Support Railway's DATABASE_URL or individual variables
    DATABASE_URL = os.getenv('DATABASE_URL')

    if DATABASE_URL:
        # Parse Railway's DATABASE_URL (format: postgresql://user:password@host:port/database)
        parsed = urlparse(DATABASE_URL)
        DB_CONFIG = {
            'host': parsed.hostname,
            'port': parsed.port,
            'database': parsed.path[1:],  # Remove leading '/'
            'user': parsed.username,
            'password': parsed.password
        }
    else:
        # Use individual variables (local development)
        DB_CONFIG = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': int(os.getenv('DB_PORT', 5432)),
            'database': os.getenv('DB_NAME', 'workout_db'),
            'user': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', '1990')
        }

    # Video Processing Configuration
    SCENE_DETECTION_THRESHOLD = float(os.getenv('SCENE_DETECTION_THRESHOLD', 27.0))
    MIN_SCENE_LENGTH = float(os.getenv('MIN_SCENE_LENGTH', 0.6))

    # FFmpeg Configuration
    FFMPEG_PATH = os.getenv('FFMPEG_PATH', 'ffmpeg')  # Use system ffmpeg or specify path
    THUMBNAIL_WIDTH = int(os.getenv('THUMBNAIL_WIDTH', 320))
    THUMBNAIL_HEIGHT = int(os.getenv('THUMBNAIL_HEIGHT', 180))
    VIDEO_CODEC = os.getenv('VIDEO_CODEC', 'libx264')  # H.264 codec
    VIDEO_PRESET = os.getenv('VIDEO_PRESET', 'medium')  # Encoding speed/quality tradeoff
    VIDEO_CRF = int(os.getenv('VIDEO_CRF', 23))  # Constant Rate Factor (lower = better quality)

    # Storage Configuration
    STORAGE_BACKEND = os.getenv('STORAGE_BACKEND', 'local')  # 'local', 's3', or 'r2'

    # Local Storage Configuration
    LOCAL_STORAGE_PATH = os.getenv('LOCAL_STORAGE_PATH', 'output')

    # AWS S3 Configuration
    S3_BUCKET_NAME = os.getenv('S3_BUCKET_NAME', '')
    S3_REGION = os.getenv('S3_REGION', 'us-east-1')
    S3_ACCESS_KEY = os.getenv('S3_ACCESS_KEY', '')
    S3_SECRET_KEY = os.getenv('S3_SECRET_KEY', '')
    S3_ENDPOINT_URL = os.getenv('S3_ENDPOINT_URL', None)  # For S3-compatible services

    # Cloudflare R2 Configuration (S3-compatible)
    R2_ACCOUNT_ID = os.getenv('R2_ACCOUNT_ID', '')
    R2_BUCKET_NAME = os.getenv('R2_BUCKET_NAME', '')
    R2_ACCESS_KEY = os.getenv('R2_ACCESS_KEY', '')
    R2_SECRET_KEY = os.getenv('R2_SECRET_KEY', '')
    R2_PUBLIC_URL = os.getenv('R2_PUBLIC_URL', '')  # Public URL for serving videos

    @classmethod
    def get_storage_config(cls):
        """Get storage configuration based on backend"""
        if cls.STORAGE_BACKEND == 'local':
            return {
                'type': 'local',
                'path': cls.LOCAL_STORAGE_PATH
            }
        elif cls.STORAGE_BACKEND == 's3':
            return {
                'type': 's3',
                'bucket': cls.S3_BUCKET_NAME,
                'region': cls.S3_REGION,
                'access_key': cls.S3_ACCESS_KEY,
                'secret_key': cls.S3_SECRET_KEY,
                'endpoint_url': cls.S3_ENDPOINT_URL
            }
        elif cls.STORAGE_BACKEND == 'r2':
            return {
                'type': 'r2',
                'account_id': cls.R2_ACCOUNT_ID,
                'bucket': cls.R2_BUCKET_NAME,
                'access_key': cls.R2_ACCESS_KEY,
                'secret_key': cls.R2_SECRET_KEY,
                'public_url': cls.R2_PUBLIC_URL
            }
        else:
            raise ValueError(f"Unsupported storage backend: {cls.STORAGE_BACKEND}")

    @classmethod
    def validate(cls):
        """Validate configuration based on storage backend"""
        errors = []

        # Database validation
        if not cls.DB_CONFIG['password']:
            errors.append("DB_PASSWORD is required")

        # Storage backend validation
        if cls.STORAGE_BACKEND == 's3':
            if not cls.S3_BUCKET_NAME:
                errors.append("S3_BUCKET_NAME is required for S3 storage")
            if not cls.S3_ACCESS_KEY or not cls.S3_SECRET_KEY:
                errors.append("S3_ACCESS_KEY and S3_SECRET_KEY are required for S3 storage")

        elif cls.STORAGE_BACKEND == 'r2':
            if not cls.R2_BUCKET_NAME:
                errors.append("R2_BUCKET_NAME is required for R2 storage")
            if not cls.R2_ACCESS_KEY or not cls.R2_SECRET_KEY:
                errors.append("R2_ACCESS_KEY and R2_SECRET_KEY are required for R2 storage")
            if not cls.R2_ACCOUNT_ID:
                errors.append("R2_ACCOUNT_ID is required for R2 storage")

        if errors:
            raise ValueError("Configuration errors:\n" + "\n".join(f"  - {e}" for e in errors))

        return True


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    # Override with production values
    SECRET_KEY = os.getenv('SECRET_KEY')  # Must be set in production

    @classmethod
    def validate(cls):
        """Additional production validation"""
        super().validate()
        if cls.SECRET_KEY == 'dev-secret-key-change-in-production':
            raise ValueError("SECRET_KEY must be set to a secure value in production")


class TestConfig(Config):
    """Testing configuration"""
    TESTING = True
    DB_CONFIG = {
        'host': 'localhost',
        'port': 5432,
        'database': 'workout_db_test',
        'user': 'postgres',
        'password': os.getenv('DB_PASSWORD', '1990')
    }


# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'test': TestConfig,
    'default': DevelopmentConfig
}


def get_config(env=None):
    """Get configuration object based on environment"""
    if env is None:
        env = os.getenv('FLASK_ENV', 'development')
    return config.get(env, config['default'])
