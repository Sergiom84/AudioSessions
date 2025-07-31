from flask import Flask, send_from_directory, request, jsonify, session
from werkzeug.security import check_password_hash, generate_password_hash
from functools import wraps
import os
import json
from datetime import datetime

app = Flask(__name__, static_folder='.')
app.secret_key = os.environ.get('SECRET_KEY', 'your-very-secure-secret-key-change-this')

# Configuración
class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    PRIVATE_ZONE_PASSWORD_HASH = generate_password_hash('Julio25')  # Cambia esto en producción
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    ALLOWED_AUDIO_EXTENSIONS = {'mp3', 'wav', 'ogg', 'flac'}

app.config.from_object(Config)

# Base de datos simulada mejorada
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
            'duration': 4722,  # 01:18:42 en segundos
            'created_at': '2024-01-04'
        }
    ],
    'remember': [],
    'private': []
}

# Decorador para autenticación
def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'authenticated' not in session:
            return jsonify({'error': 'Unauthorized', 'code': 401}), 401
        return f(*args, **kwargs)
    return decorated

# Middleware de logging mejorado
@app.after_request
def log_request(response):
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
    print(f"[{timestamp}] {client_ip} - {request.method} {request.path} - {response.status_code}")
    return response

# Manejo de errores mejorado
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

# API Routes
@app.route('/api/auth', methods=['POST'])
def authenticate():
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
            return jsonify({'error': 'Invalid password', 'code': 401}), 401
    except Exception as e:
        return jsonify({'error': 'Authentication failed', 'code': 500}), 500

@app.route('/api/verify-password', methods=['POST'])
def verify_password():
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
    session.pop('authenticated', None)
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@app.route('/api/sessions/<genre>')
def get_sessions(genre):
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
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

# Rutas estáticas
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    # Seguridad: prevenir path traversal
    if '..' in filename or filename.startswith('/'):
        return jsonify({'error': 'Invalid file path', 'code': 400}), 400
    
    try:
        if os.path.exists(filename) and os.path.isfile(filename):
            return send_from_directory('.', filename)
        else:
            # Para SPA routing, devolver index.html para rutas no encontradas
            if not filename.startswith('api/') and not '.' in filename:
                return send_from_directory('.', 'index.html')
            return jsonify({'error': 'File not found', 'code': 404}), 404
    except Exception as e:
        return jsonify({'error': 'Server error', 'code': 500}), 500

if __name__ == '__main__':
    # Configuración de desarrollo
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)