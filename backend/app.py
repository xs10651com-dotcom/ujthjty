from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, date
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)
app.config.from_object('config.Config')

db = SQLAlchemy(app)

from models import LifeRecord, MediaFile, DailyCheckin

# 初始化数据库
@app.before_first_request
def create_tables():
    db.create_all()

# 辅助函数：检查文件类型
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# 生活记录API
@app.route('/api/records', methods=['POST'])
def create_record():
    try:
        data = request.form
        media_files = request.files.getlist('media')
        
        record = LifeRecord(
            title=data.get('title'),
            content=data.get('content'),
            mood=data.get('mood'),
            weather=data.get('weather'),
            location=data.get('location'),
            record_date=datetime.strptime(data.get('record_date'), '%Y-%m-%d').date(),
            tags=data.get('tags')
        )
        
        db.session.add(record)
        db.session.flush()  # 获取record.id
        
        # 保存媒体文件
        for file in media_files:
            if file and allowed_file(file.filename):
                filename = secure_filename(f"{record.id}_{file.filename}")
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)
                
                media = MediaFile(
                    filename=filename,
                    file_type=file.content_type.split('/')[0],
                    record_id=record.id
                )
                db.session.add(media)
        
        db.session.commit()
        return jsonify({'message': '记录创建成功', 'id': record.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@app.route('/api/records', methods=['GET'])
def get_records():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', '')
    
    query = LifeRecord.query
    
    if search:
        query = query.filter(
            LifeRecord.title.contains(search) | 
            LifeRecord.content.contains(search) |
            LifeRecord.tags.contains(search)
        )
    
    records = query.order_by(LifeRecord.record_date.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'records': [{
            'id': r.id,
            'title': r.title,
            'content': r.content[:100] + '...' if len(r.content) > 100 else r.content,
            'mood': r.mood,
            'weather': r.weather,
            'location': r.location,
            'record_date': r.record_date.isoformat(),
            'tags': r.tags.split(',') if r.tags else [],
            'created_at': r.created_at.isoformat(),
            'media_count': len(r.media_files)
        } for r in records.items],
        'total': records.total,
        'page': records.page,
        'pages': records.pages
    })

@app.route('/api/records/<int:id>', methods=['GET'])
def get_record(id):
    record = LifeRecord.query.get_or_404(id)
    return jsonify({
        'record': {
            'id': record.id,
            'title': record.title,
            'content': record.content,
            'mood': record.mood,
            'weather': record.weather,
            'location': record.location,
            'record_date': record.record_date.isoformat(),
            'tags': record.tags.split(',') if record.tags else [],
            'created_at': record.created_at.isoformat(),
            'media_files': [{
                'id': m.id,
                'filename': m.filename,
                'file_type': m.file_type
            } for m in record.media_files]
        }
    })

# 每日打卡API
@app.route('/api/checkins', methods=['POST'])
def create_checkin():
    try:
        data = request.get_json()
        checkin_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        
        # 检查是否已存在当天的打卡
        existing = DailyCheckin.query.filter_by(date=checkin_date).first()
        if existing:
            return jsonify({'error': '当天已打卡'}), 400
        
        checkin = DailyCheckin(
            date=checkin_date,
            sleep_hours=data.get('sleep_hours'),
            exercise_minutes=data.get('exercise_minutes'),
            water_intake=data.get('water_intake'),
            mood_score=data.get('mood_score'),
            notes=data.get('notes')
        )
        
        db.session.add(checkin)
        db.session.commit()
        return jsonify({'message': '打卡成功', 'id': checkin.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@app.route('/api/stats/monthly', methods=['GET'])
def get_monthly_stats():
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    
    records = db.session.query(
        db.func.date(LifeRecord.record_date).label('date'),
        db.func.count(LifeRecord.id).label('count')
    ).filter(
        db.extract('year', LifeRecord.record_date) == year,
        db.extract('month', LifeRecord.record_date) == month
    ).group_by(db.func.date(LifeRecord.record_date)).all()
    
    return jsonify({
        'stats': [{'date': str(r.date), 'count': r.count} for r in records]
    })

# 标签分析
@app.route('/api/tags/analysis', methods=['GET'])
def get_tag_analysis():
    tags_count = {}
    records = LifeRecord.query.filter(LifeRecord.tags.isnot(None)).all()
    
    for record in records:
        if record.tags:
            for tag in record.tags.split(','):
                tag = tag.strip()
                tags_count[tag] = tags_count.get(tag, 0) + 1
    
    return jsonify({
        'tags': [{'name': tag, 'count': count} for tag, count in sorted(
            tags_count.items(), key=lambda x: x[1], reverse=True
        )]
    })

if __name__ == '__main__':
    # 创建上传目录
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    app.run(debug=True, host='0.0.0.0', port=5000)
