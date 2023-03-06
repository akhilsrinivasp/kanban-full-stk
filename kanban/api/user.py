from werkzeug.security import generate_password_hash, check_password_hash
from flask import Blueprint, jsonify, request
from kanban.model import User
from kanban import db
from flask_jwt_extended import get_jwt_identity, jwt_required
from kanban.model import User, user_schema

user = Blueprint('user', __name__, url_prefix='/user')

@user.route('/', methods=['POST'])
@jwt_required()
def getUser():
    user_id = get_jwt_identity()
    user = User.query.filter_by(id=user_id).first()
    if not user:
        return 'User does not exist'
    
    response=jsonify({ "message": "User found successfully", "user": user_schema.dump(user) })
    

@user.route('/change_password', methods=['GET'])
@jwt_required()
def change_password():
    if request.method == 'GET' and request.is_json:
        user_id = get_jwt_identity()
        user = User.query.filter_by(id=user_id).first()
        if not user:
            return 'User does not exist'
        
        password, updated_password = request.json.get('password', None), request.json.get('updated_password', None)
        if not check_password_hash(user.password, password):
            return 'Incorrect password'
        
        password, updated_password = generate_password_hash(password), generate_password_hash(updated_password)
        
        user.password = updated_password
        db.session.commit()
        response=jsonify({ "message": "Password updated successfully" })
        response.status_code = 200
        return response
        