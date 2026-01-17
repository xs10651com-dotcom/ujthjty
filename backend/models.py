from datetime import datetime
from backend import db

class LifeRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    mood = db.Column(db.String(20))  # 心情标签
    weather = db.Column(db.String(20))  # 天气
    location = db.Column(db.String(100))  # 地点
    record_date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    tags = db.Column(db.String(500))  # 标签，用逗号分隔
    media_files = db.relationship('MediaFile', backref='record', lazy=True, cascade='all, delete-orphan')

class MediaFile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(20))  # image, video, audio
    record_id = db.Column(db.Integer, db.ForeignKey('life_record.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class DailyCheckin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, unique=True, nullable=False)
    sleep_hours = db.Column(db.Float)
    exercise_minutes = db.Column(db.Integer)
    water_intake = db.Column(db.Integer)  # ml
    mood_score = db.Column(db.Integer)  # 1-10
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
