from kanban import ma
from kanban.database import db
from sqlalchemy.sql import func

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, autoincrement=True, primary_key=True)
    username = db.Column(db.String(255))
    email = db.Column(db.String(255), unique=True)
    password = db.Column(db.String(255))
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    
    
class List(db.Model):
    __tablename__ = 'lists'
    id = db.Column(db.Integer, autoincrement=True, primary_key=True)
    name = db.Column(db.String(255))
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=func.now())
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    cards = db.relationship('Card', backref='list', lazy=True)
    
class Card(db.Model):
    __tablename__ = 'cards'
    id = db.Column(db.Integer, autoincrement=True, primary_key=True)
    name = db.Column(db.String(255))
    description = db.Column(db.String(255))
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=func.now())
    deadline = db.Column(db.DateTime(timezone=True), nullable=True)
    status = db.Column(db.String(255), nullable=True) # Completed/Not completed
    list_id = db.Column(db.Integer, db.ForeignKey('lists.id'), nullable=False)
        
class UserSchema(ma.Schema):
    class Meta:
        fields = ('id', 'username', 'email', 'created_at')

class ListSchema(ma.Schema):
    class Meta:
        fields = ('id', 'name', 'created_at', 'updated_at', 'user_id')

class CardSchema(ma.Schema):
    class Meta:
        fields = ('id', 'name', 'description', 'created_at', 'updated_at', 'deadline', 'status', 'list_id')
        
user_schema = UserSchema()
users_schema = UserSchema(many=True)
list_schema = ListSchema()
lists_schema = ListSchema(many=True)
card_schema = CardSchema()
cards_schema = CardSchema(many=True)

 