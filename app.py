from flask import Flask, send_from_directory, request, jsonify, session
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_compress import Compress
from werkzeug.security import check_password_hash, generate_password_hash
from dotenv import load_dotenv
from functools import wraps
import os
import json
from datetime import datetime
import secrets

# Cargar variables de entorno
load_dotenv()

app = Flask(__name__, static_folder='.')

# ============================================
# CONFIGURACIÓN DE SEGURIDAD
# ============================================
class Config:
    # Secret Key segura
    SECRET_KEY = os.environ.get('SECRET_KEY')
    if not SECRET_KEY:
        SECRET_KEY = secrets.token_hex(32)
        print("⚠️  WARNING: Using random SECRET_KEY. Set SECRET_KEY in .env for production!")

    # Contraseña de zona privada
    PRIVATE_ZONE_PASSWORD = os.environ.get('PRIVATE_ZONE_PASSWORD', 'Julio25')
    PRIVATE_ZONE_PASSWORD_HASH = generate_password_hash(PRIVATE_ZONE_PASSWORD)

    # Configuración de archivos
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))
    ALLOWED_AUDIO_EXTENSIONS = set(os.environ.get('ALLOWED_AUDIO_EXTENSIONS', 'mp3,wav,ogg,flac').split(','))

    # Session permanente
    PERMANENT_SESSION_LIFETIME = 86400  # 24 horas
    SESSION_COOKIE_SECURE = os.environ.get('FLASK_ENV') == 'production'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'

    # CORS Origins
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')

app.config.from_object(Config)

# ============================================
# MIDDLEWARE Y EXTENSIONES
# ============================================

# CORS - Permitir peticiones desde GitHub Pages
CORS(app, resources={
    r"/api/*": {
        "origins": Config.CORS_ORIGINS,
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Compresión de respuestas
Compress(app)

# Rate Limiting - Protección contra ataques
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    storage_uri=os.environ.get('RATELIMIT_STORAGE_URL', 'memory://'),
    default_limits=os.environ.get('RATELIMIT_DEFAULT', '200 per day;50 per hour').split(';')
)

# ============================================
# BASE DE DATOS SIMULADA
# ============================================
sessions_db = {
    'house': [
        {
            'id': 'first-date-vol-ii',
            'title': 'First Date Vol.II',
            'artist': 'Unknown Artist',
            'description': 'La primera cita que nadie vio venir. Sin aviso, sin Vol. I. Solo música para desnudarse sin palabras',
            'cover': 'attached_assets/First Date Vol. II_1752256054711.png',
            'audio_url': 'https://archive.org/download/first-date-vol.-ii/First%20Date%20Vol.II.mp3',
            'duration': 3600,
            'created_at': '2024-01-01'
        },
        {
            'id': 'nati-nati',
            'title': 'Nati Nati',
            'artist': 'Unknown Artist',
            'description': 'Una oda al groove fino y la emoción en loop. Así suena Nati Nati: femenina, profunda, inolvidable',
            'cover': 'attached_assets/Nati Nati_1752569294098.png',
            'audio_url': 'https://archive.org/download/nati-nati/Nati%20Nati.mp3',
            'duration': 3200,
            'created_at': '2024-01-02'
        },
        {
            'id': 'ros-in-da-house',
            'title': 'Ros In Da House',
            'artist': 'Unknown Artist',
            'description': 'Ritmos profundos y mínimos, texturas orgánicas y matices afro unidos por pulsos melódicos y grooves implacables.',
            'cover': 'attached_assets/ROS.png',
            'audio_url': 'https://dn721404.ca.archive.org/0/items/ros-in-da-house/Ros%20in%20da%20House.flac',
            'duration': 4200,
            'created_at': '2024-01-03'
        }
    ],
    'techno': [],
    'progressive': [
        {
            'id': 'insane',
            'title': 'Insane',
            'artist': 'Unknown Artist',
            'description': 'Imagina a Alicia cayendo, pero esta vez con un bombo hipnótico y pads melódicos. Sigue al conejo.',
            'cover': 'attached_assets/insane.jpg',
            'audio_url': 'https://dn720700.ca.archive.org/0/items/in-sane/InSANE.flac',
            'duration': 4722,
            'created_at': '2024-01-04'
        }
    ],
    'remember': [],
    'private': []
}

# ============================================
# DECORADORES
# ============================================
def requires_auth(f):
    """Decorador para rutas que requieren autenticación"""
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'authenticated' not in session:
            return jsonify({'error': 'Unauthorized', 'code': 401}), 401
        return f(*args, **kwargs)
    return decorated

# ============================================
# LOGGING MIDDLEWARE
# ============================================
@app.after_request
def log_request(response):
    """Log de todas las peticiones"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)

    # No loguear archivos estáticos para reducir ruido
    if not request.path.startswith('/attached_assets/'):
        print(f"[{timestamp}] {client_ip} - {request.method} {request.path} - {response.status_code}")

    # Headers de seguridad
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'

    return response

# ============================================
# MANEJO DE ERRORES
# ============================================
@app.errorhandler(404)
def not_found(error):
    if request.path.startswith('/api/'):
        return jsonify({'error': 'Resource not found', 'code': 404}), 404
    return send_from_directory('.', 'index.html')  # SPA fallback

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error', 'code': 500}), 500

@app.errorhandler(413)
def too_large(error):
    return jsonify({'error': 'File too large', 'code': 413}), 413

@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({
        'error': 'Rate limit exceeded',
        'message': 'Too many requests. Please try again later.',
        'code': 429
    }), 429

# ============================================
# API ROUTES
# ============================================

@app.route('/api/auth', methods=['POST'])
@limiter.limit(os.environ.get('AUTH_RATELIMIT', '5 per minute'))
def authenticate():
    """Autenticación con rate limiting estricto"""
    try:
        data = request.get_json()
        if not data or 'password' not in data:
            return jsonify({'error': 'Password required', 'code': 400}), 400

        password = data['password']
        if check_password_hash(app.config['PRIVATE_ZONE_PASSWORD_HASH'], password):
            session['authenticated'] = True
            session.permanent = True
            return jsonify({'success': True, 'message': 'Authentication successful'})
        else:
            # Log intento fallido
            client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
            print(f"⚠️  Failed auth attempt from {client_ip}")
            return jsonify({'error': 'Invalid password', 'code': 401}), 401
    except Exception as e:
        print(f"❌ Auth error: {e}")
        return jsonify({'error': 'Authentication failed', 'code': 500}), 500

@app.route('/api/verify-password', methods=['POST'])
@limiter.limit(os.environ.get('AUTH_RATELIMIT', '5 per minute'))
def verify_password():
    """Verificar contraseña sin crear sesión"""
    try:
        data = request.get_json()
        if not data or 'password' not in data:
            return jsonify({'access': False, 'error': 'Password required'}), 400

        password = data['password']
        if check_password_hash(app.config['PRIVATE_ZONE_PASSWORD_HASH'], password):
            return jsonify({'access': True})
        else:
            return jsonify({'access': False, 'error': 'Invalid password'})
    except Exception as e:
        return jsonify({'access': False, 'error': 'Verification failed'}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    """Cerrar sesión"""
    session.pop('authenticated', None)
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@app.route('/api/sessions/<genre>')
def get_sessions(genre):
    """Obtener sesiones por género"""
    if genre not in sessions_db:
        return jsonify({'error': 'Genre not found', 'code': 404}), 404

    # Si es zona privada, requiere autenticación
    if genre == 'private' and 'authenticated' not in session:
        return jsonify({'error': 'Authentication required', 'code': 401}), 401

    return jsonify({
        'genre': genre,
        'sessions': sessions_db[genre],
        'count': len(sessions_db[genre])
    })

@app.route('/api/sessions/<genre>/<session_id>')
def get_session(genre, session_id):
    """Obtener sesión específica"""
    if genre not in sessions_db:
        return jsonify({'error': 'Genre not found', 'code': 404}), 404

    if genre == 'private' and 'authenticated' not in session:
        return jsonify({'error': 'Authentication required', 'code': 401}), 401

    sessions = sessions_db[genre]
    session_data = next((s for s in sessions if s['id'] == session_id), None)

    if session_data:
        return jsonify(session_data)
    return jsonify({'error': 'Session not found', 'code': 404}), 404

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '2.0.0',
        'features': {
            'rate_limiting': True,
            'cors': True,
            'compression': True,
            'favorites': True,
            'sharing': True,
            'pwa': True
        }
    })

# ============================================
# RUTAS ESTÁTICAS
# ============================================
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Servir archivos estáticos con seguridad"""
    # Prevenir path traversal
    if '..' in filename or filename.startswith('/'):
        return jsonify({'error': 'Invalid file path', 'code': 400}), 400

    try:
        if os.path.exists(filename) and os.path.isfile(filename):
            return send_from_directory('.', filename)
        else:
            # SPA fallback
            if not filename.startswith('api/') and '.' not in filename:
                return send_from_directory('.', 'index.html')
            return jsonify({'error': 'File not found', 'code': 404}), 404
    except Exception as e:
        print(f"❌ Error serving file: {e}")
        return jsonify({'error': 'Server error', 'code': 500}), 500

# ============================================
# INICIO DE LA APLICACIÓN
# ============================================
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'

    print("=" * 50)
    print("🎧 AudioSessions Server")
    print("=" * 50)
    print(f"Environment: {os.environ.get('FLASK_ENV', 'production')}")
    print(f"Port: {port}")
    print(f"Debug: {debug}")
    print(f"CORS Origins: {Config.CORS_ORIGINS}")
    print(f"Rate Limiting: Enabled")
    print("=" * 50)

    app.run(host='0.0.0.0', port=port, debug=debug)
