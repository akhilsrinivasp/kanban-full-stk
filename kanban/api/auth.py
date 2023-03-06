from werkzeug.security import generate_password_hash, check_password_hash
from flask import Blueprint, jsonify, request
from kanban.model import User
from kanban import db
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity

auth = Blueprint('auth', __name__)

@auth.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST' and request.is_json:
        username = request.json.get('username', None)
        email = request.json.get('email', None)
        password = request.json.get('password', None)
        password = generate_password_hash(password)
        
        user = User.query.filter_by(email=email).first()
        if user:
            return 'User already exists'
        
        user = User(username=username, email=email, password=password)
        db.session.add(user)
        db.session.commit()

        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
         
        return jsonify(access_token=access_token, refresh_token=refresh_token), 200

@auth.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST' and request.is_json:
        username = request.json.get('username', None)
        password = request.json.get('password', None)
        
        user = User.query.filter_by(username=username).first()
        if not user or not check_password_hash(user.password, password):
            return 'User does not exist'
        
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
         
        return jsonify(access_token=access_token, refresh_token=refresh_token), 200
    
@auth.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity)
    return jsonify(access_token=access_token)
    
@auth.route("/active", methods=["POST"])
@jwt_required()
def active():
    user = get_jwt_identity()
    if user: 
        return jsonify(user=user), 200
    return jsonify(user=None), 401