import os
from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)

# Настройка на базата данни
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///parkings.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Дефиниране на модела Parking
class Parking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    opening_hours = db.Column(db.String(200), nullable=True)

    # Връзка с ParkingZone
    zones = db.relationship('ParkingZone', back_populates='parking')

class ParkingZone(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    parking_id = db.Column(db.Integer, db.ForeignKey('parking.id'), nullable=False)
    zone_name = db.Column(db.String(100), nullable=False)
    opening_hours = db.Column(db.String(200), nullable=False)
    days = db.Column(db.String(200), nullable=False)

    parking = db.relationship('Parking', back_populates='zones')

# Създаване на таблиците
with app.app_context():
    db.create_all()

@app.route('/')
def index():
    return render_template('index.html')

# API маршрут за извличане на паркинги
@app.route('/api/parkings', methods=['GET'])
def get_parkings():
    parkings = Parking.query.all()
    return jsonify([{
        'id': parking.id,
        'name': parking.name,
        'latitude': parking.latitude,
        'longitude': parking.longitude,
        'opening_hours': parking.opening_hours
    } for parking in parkings])

# API маршрут за добавяне на нов паркинг
@app.route('/api/parkings', methods=['POST'])
def add_parking():
    data = request.get_json()
    new_parking = Parking(
        name=data['name'],
        latitude=data['latitude'],
        longitude=data['longitude'],
        opening_hours=data.get('opening_hours')
    )
    db.session.add(new_parking)
    db.session.commit()
    return jsonify({'message': 'Parking added!'}), 201

# API маршрут за извличане на зоните за паркиране
@app.route('/api/parking-zones', methods=['GET'])
def get_parking_zones():
    zones = ParkingZone.query.all()
    return jsonify([{
        'id': zone.id,
        'parking_id': zone.parking_id,
        'zone_name': zone.zone_name,
        'opening_hours': zone.opening_hours,
        'days': zone.days,
    } for zone in zones])

# API маршрут за добавяне на нова зона за паркиране
@app.route('/api/parking-zones', methods=['POST'])
def add_parking_zone():
    data = request.get_json()
    new_zone = ParkingZone(
        parking_id=data['parking_id'],
        zone_name=data['zone_name'],
        opening_hours=data['opening_hours'],
        days=data['days']
    )
    db.session.add(new_zone)
    db.session.commit()
    return jsonify({'message': 'Parking zone added!'}), 201

if __name__ == '__main__':
    # Вземи порта от променливата среда PORT или използвай 5000 по подразбиране
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
