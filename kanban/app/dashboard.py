from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify

dashboard = Blueprint('dashboard', __name__, template_folder='templates', static_folder='static')

@dashboard.route('/')
def index():
    return render_template('index.html')