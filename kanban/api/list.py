from flask import Blueprint, jsonify, request
from kanban.model import List, Card, list_schema, lists_schema, cards_schema
from kanban import db
from flask_jwt_extended import get_jwt_identity, jwt_required

list = Blueprint('list', __name__, url_prefix='/api/v1/list')

@list.route('/create', methods=['POST'])
@jwt_required()
def createList():
    if request.method == 'POST' and request.is_json:
        data = request.get_json()
        user_id = get_jwt_identity()
        print("\n\n\n\n")
        print(data)
        exists = List.query.filter_by(user_id=user_id, name=data['name']).first()
        if exists:
            return jsonify(message="List already exists"), 400
        
        new_list = List(name=data['name'], user_id=user_id)
        db.session.add(new_list)
        db.session.commit()
        new_list = List.query.filter_by(user_id=user_id, name=data['name']).first()
        new_list = list_schema.dump(new_list)
        new_list['cards'] = []
    return jsonify(new_list)

# Get all Lists with List data
@list.route('/allLists', methods=['GET'])
@jwt_required()
def allLists():
    if request.method == 'GET':
        user_id = get_jwt_identity()
        
        lists = List.query.filter_by(user_id=user_id).all()
        lists = lists_schema.dump(lists)
        
        for list in lists:
            cards = Card.query.filter_by(list_id=list['id']).all()
            cards = cards_schema.dump(cards)
            list['cards'] = cards
            
        return jsonify(lists)
    
# Update a List Name
@list.route('/update/<id>', methods=['PUT'])
@jwt_required()
def updateList(id):
    if request.method == 'PUT' and request.is_json:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        list = List.query.filter_by(id=id, user_id=user_id).first()
        if not list:
            return jsonify(message="List not found"), 404
        
        list.name = data['name']
        db.session.commit()
        return list_schema.jsonify(list)

# Delete a list 
@list.route('/delete/<id>', methods=['DELETE'])
@jwt_required()
def deleteList(id):
    if request.method == 'DELETE':
        user_id = get_jwt_identity()
        cards = Card.query.filter_by(list_id=id).all()
        list = List.query.filter_by(id=id, user_id=user_id).first()
        if not list:
            return jsonify(message="List not found"), 404
        
        db.session.delete(list)
        for card in cards:
            db.session.delete(card)
        db.session.commit()
        return list_schema.jsonify(list)


