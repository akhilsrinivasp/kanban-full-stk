from flask import Blueprint, jsonify, request
from kanban.model import List, Card, card_schema, cards_schema
from kanban import db
from flask_jwt_extended import get_jwt_identity, jwt_required
import datetime

card = Blueprint('card', __name__, url_prefix='/api/v1/card')

# Create a new card
@card.route('/create', methods=['POST'])
@jwt_required()
def createCard():
    if request.method == 'POST' and request.is_json:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        exists = Card.query.filter_by(list_id = data['list_id'], name=data['name']).first()
        if exists:
            return jsonify(message="Card already exists"), 400
        
        # convert datetime to 2023-01-12T08:41:37 format
        deadline_converted = datetime.datetime.strptime(data['deadline'], '%Y-%m-%dT%H:%M')
        
        new_card = Card(name=data['name'], description=data['description'], deadline=deadline_converted, list_id=data['list_id'], status = "Not Completed")
        db.session.add(new_card)
        db.session.commit()
        return card_schema.jsonify(new_card)
    return jsonify(message="Something went wrong"), 400
    

@card.route('/update/<id>', methods=['PUT'])
@jwt_required()
def updateCard(id):
    if request.method == 'PUT' and request.is_json:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        card = Card.query.filter_by(id=id).first()
        if not card:
            return jsonify(message="Card not found"), 404
        
        deadline_converted = datetime.datetime.strptime(data['deadline'], '%Y-%m-%dT%H:%M')
        card.name = data['name']
        card.description = data['description']
        card.deadline = deadline_converted
        
        db.session.commit()
        return card_schema.jsonify(card)
    
# Move Card to another list 
@card.route('/move/<id>', methods=['PUT'])
@jwt_required()
def moveCard(id):
    if request.method == 'PUT' and request.is_json:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        old_list = data["old_list"]
        new_list = data["new_list"]
        
        # check if both lists exist
        old_list = List.query.filter_by(id=old_list, user_id=user_id).first()
        new_list = List.query.filter_by(id=new_list, user_id=user_id).first()
        
        if not old_list or not new_list:
            return jsonify(message="List not found"), 404
        
        card = Card.query.filter_by(id=id).first()
        if not card:
            return jsonify(message="Card not found"), 404
        
        card.list_id = new_list.id
        
        db.session.commit()
        return card_schema.jsonify(card)
    
# Delete Card
@card.route('/delete/<id>', methods=['DELETE'])
@jwt_required()
def deleteCard(id):
    if request.method == 'DELETE':
        user_id = get_jwt_identity()
        card = Card.query.filter_by(id=id).first()
        if not card:
            return jsonify(message="Card not found"), 404
        
        db.session.delete(card)
        db.session.commit()
        return card_schema.jsonify(card)
    
#mark card as completed
@card.route('/complete/<id>', methods=['PUT'])
@jwt_required()
def completeCard(id):
    if request.method == 'PUT':
        user_id = get_jwt_identity()
        card = Card.query.filter_by(id=id).first()
        if not card:
            return jsonify(message="Card not found"), 404
        
        card.status = "Completed"
        db.session.commit()
        return card_schema.jsonify(card)
    
#mark card as not completed
@card.route('/notcomplete/<id>', methods=['PUT'])
@jwt_required()
def notCompleteCard(id):
    if request.method == 'PUT':
        user_id = get_jwt_identity()
        card = Card.query.filter_by(id=id).first()
        if not card:
            return jsonify(message="Card not found"), 404
        
        card.status = "Not Completed"
        db.session.commit()
        return card_schema.jsonify(card)

#get all cards under a list_id
@card.route('/list/<id>', methods=['GET'])
@jwt_required()
def getCards(id):
    if request.method == 'GET':
        user_id = get_jwt_identity()
        cards = Card.query.filter_by(list_id=id).all()
        if not cards:
            return jsonify(message="No cards found"), 404
        
        return cards_schema.jsonify(cards)
