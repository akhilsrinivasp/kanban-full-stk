from flask import Flask
from kanban.config import LocalDevelopmentConfig
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_cors import CORS
from kanban.database import db
from flask_jwt_extended import JWTManager
    
ma = Marshmallow()
from kanban.api.auth import auth
from kanban.api.user import user
from kanban.api.list import list
from kanban.api.card import card

from kanban.app.dashboard import dashboard

def create_app(config_class=LocalDevelopmentConfig):
    app = Flask(__name__, template_folder='templates', static_folder='static')
    app.config.from_object(config_class)
    db.init_app(app)
    CORS(app)
    JWTManager(app)
    
    app.register_blueprint(auth)
    app.register_blueprint(user)
    app.register_blueprint(list)
    app.register_blueprint(card)
    
    app.register_blueprint(dashboard)
    
    with app.app_context():
        db.create_all()
        
    return app

