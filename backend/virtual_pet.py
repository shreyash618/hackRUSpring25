import eventlet
eventlet.monkey_patch()

import os
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.pool import NullPool
from flask_cors import CORS
from datetime import date
from flask_socketio import SocketIO, emit

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Enable CORS for frontend-backend communication
socketio = SocketIO(app, cors_allowed_origins="*")  # Enable WebSocket support

# Set up SQLite database
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'tasks.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {'poolclass': NullPool}
db = SQLAlchemy(app)

# Define the Task model
class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    task_name = db.Column(db.String(200), nullable=False)
    task_date = db.Column(db.String(100), nullable=False)
    task_difficulty = db.Column(db.String(200), nullable=False)
    task_completed = db.Column(db.Boolean, default=False, nullable=False)

# Define a User model to store money balance
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    money = db.Column(db.Integer, default=5)  # Start with 5 coins

# Create the database
with app.app_context():
    db.create_all()
    # Ensure at least one user exists to track money
    if User.query.first() is None:
        db.session.add(User(money=5))  # Default starting money
        db.session.commit()

# Get today's tasks
@app.route('/tasks/today', methods=['GET'])
def get_todays_tasks():
    today = date.today().strftime('%Y-%m-%d')  # Get today's date in 'YYYY-MM-DD' format
    tasks = Task.query.filter_by(task_date=today).all()
    return jsonify([
        {
            'id': task.id,
            'task_name': task.task_name,
            'task_date': task.task_date,
            'task_difficulty': task.task_difficulty,
            'task_completed': task.task_completed
        } for task in tasks
    ])

# Get all tasks
@app.route('/tasks', methods=['GET'])
def get_tasks():
    tasks = Task.query.all()
    return jsonify([
        {
            'id': task.id,
            'task_name': task.task_name,
            'task_date': task.task_date,
            'task_difficulty': task.task_difficulty,
            'task_completed': task.task_completed
        } for task in tasks
    ])

# Get the current user's money balance
@app.route('/money', methods=['GET'])
def get_money():
    user = User.query.first()
    return jsonify({'money': user.money})

# Add a new task
@app.route('/add', methods=['POST'])
def add_task():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid JSON data'}), 400

        task_name = data.get('task_name')
        task_date = data.get('task_date')
        task_difficulty = data.get('task_difficulty')

        if not task_name or not task_date or not task_difficulty:
            return jsonify({'error': 'Missing fields'}), 400

        new_task = Task(task_name=task_name, task_date=task_date, task_difficulty=task_difficulty, task_completed=False)
        
        db.session.add(new_task)
        db.session.commit()

        socketio.emit('task_added', {
            'id': new_task.id,
            'task_name': task_name,
            'task_date': task_date,
            'task_difficulty': task_difficulty,
            'task_completed': False
        }, namespace='/', broadcast=True)

        return jsonify({'message': 'Task added successfully!', 'task': {
            'id': new_task.id,
            'task_name': task_name,
            'task_date': task_date,
            'task_difficulty': task_difficulty
        }}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Complete a task and update money balance
@app.route('/tasks/complete', methods=['POST'])
def complete_task():
    data = request.json
    task_id = data.get("task_id")
    completed = data.get("completed")

    task = Task.query.get(task_id)
    user = User.query.first()

    if task:
        task.task_completed = completed
        db.session.commit()

        # Update money if the task is being completed
        if completed:
            money_increase = 5 if task.task_difficulty == "easy" else 15
            user.money += money_increase
            db.session.commit()

            # Emit updated money balance to all clients
            socketio.emit("money_updated", user.money, namespace='/', broadcast=True)

        socketio.emit('task_updated', {
            'id': task.id,
            'task_completed': completed
        }, namespace='/', broadcast=True)

        return jsonify({"message": "Task updated successfully", "new_money": user.money}), 200
    return jsonify({"error": "Task not found"}), 404

# Delete a task
@app.route('/delete/<int:id>', methods=['DELETE'])
def delete_task(id):
    task_to_delete = Task.query.get_or_404(id)
    db.session.delete(task_to_delete)
    db.session.commit()
    return jsonify({'message': 'Task deleted successfully!'})

# Run Flask app
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, debug=True, host="0.0.0.0", port=port)