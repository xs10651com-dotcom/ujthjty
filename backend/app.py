from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_migrate import Migrate
from .models import db, LifeRecord, DailyCheckin
from .config import config
import os

def create_app(config_name=None):
    """应用工厂函数"""
    # Railway 自动设置 NODE_ENV 和 RAILWAY_ENVIRONMENT
    if config_name is None:
        if os.environ.get('RAILWAY_ENVIRONMENT') == 'production' or \
           os.environ.get('NODE_ENV') == 'production':
            config_name = 'production'
        else:
            config_name = 'development'
    
    app = Flask(__name__, static_folder='../frontend', static_url_path='')
    app.config.from_object(config[config_name])
    
    # 初始化配置
    config[config_name].init_app(app)
    
    # 初始化扩展
    CORS(app, resources={r"/*": {"origins": app.config['CORS_ORIGINS']}})
    db.init_app(app)
    Migrate(app, db)
    
    # 创建数据库表（如果不存在）
    with app.app_context():
        db.create_all()
    
    # 注册API路由
    from .api.routes import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')
    
    # 静态文件路由 - 服务前端文件
    @app.route('/')
    def serve_frontend():
        return send_from_directory(app.static_folder, 'index.html')
    
    @app.route('/<path:path>')
    def serve_static(path):
        if path.startswith('api/'):
            return jsonify({'error': 'Not found'}), 404
        return send_from_directory(app.static_folder, path)
    
    # 基础路由
    @app.route('/health')
    def health_check():
        try:
            # 测试数据库连接
            db.session.execute('SELECT 1')
            return jsonify({
                'status': 'healthy',
                'database': 'connected',
                'timestamp': datetime.utcnow().isoformat()
            })
        except Exception as e:
            return jsonify({
                'status': 'unhealthy',
                'database': 'disconnected',
                'error': str(e)
            }), 500
    
    @app.route('/api/info')
    def api_info():
        return jsonify({
            'app': app.config['APP_NAME'],
            'version': '1.0.0',
            'environment': config_name,
            'database': 'PostgreSQL' if 'postgresql' in app.config['SQLALCHEMY_DATABASE_URI'] else 'SQLite',
            'endpoints': {
                'records': '/api/records',
                'checkins': '/api/checkins',
                'stats': '/api/stats'
            }
        })
    
    # 错误处理
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500
    
    return app

# Railway 需要监听正确的端口
if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=app.config['DEBUG'])
