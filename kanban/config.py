from dotenv import load_dotenv
from datetime import timedelta
import os
basedir = os.path.abspath(os.path.dirname(__file__))

load_dotenv()

SECRET_KEY = os.getenv('SECRET_KEY')
COMMON_DB=os.getenv('COMMON_DB') 
SECURITY_PASSWORD_SALT=os.getenv('SECURITY_PASSWORD_SALT')

class Config():
    DEBUG = False
    SQLITE_DB_DIR = None
    SQLALCHEMY_DATABASE_URI = None
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    WTF_CSRF_ENABLED = False
    # SECURITY_TOKEN_AUTHENTICATION_HEADER = "Authentication-Token"

class LocalDevelopmentConfig(Config):
    SQLALCHEMY_DATABASE_URI = COMMON_DB
    DEBUG = True
    SECRET_KEY = SECRET_KEY
    
class ProductionConfig(Config):
    SQLALCHEMY_DATABASE_URI = COMMON_DB
    DEBUG = False
    SECRET_KEY = SECRET_KEY
    WTF_CSRF_ENABLED = True
