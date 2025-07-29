# 🎵 Audio Sessions Archive

Un archivo interactivo de sesiones de audio que presenta diferentes géneros musicales con un reproductor global mejorado y una zona privada protegida.

## ✨ Características

### 🎧 Reproductor Global Mejorado
- **Controles avanzados**: Play/Pause, control de volumen, búsqueda temporal
- **Indicadores visuales**: Barra de progreso con buffer, estados de carga
- **Atajos de teclado**: Espacio (play/pause), flechas (navegación/volumen)
- **Manejo robusto de errores**: Reintentos automáticos, mensajes informativos
- **Persistencia de estado**: Guarda la sesión actual en localStorage
- **Responsive**: Optimizado para móviles y tablets

### 🔐 Sistema de Autenticación Seguro
- **API REST**: Autenticación basada en tokens de sesión
- **Contraseñas hasheadas**: No más texto plano en el código
- **Protección CSRF**: Tokens de seguridad para formularios
- **Rate limiting**: Protección contra ataques de fuerza bruta

### 🎨 Interfaz Mejorada
- **Accesibilidad**: Soporte para lectores de pantalla, navegación por teclado
- **Estados visuales**: Loading, error, success con animaciones fluidas
- **Responsive design**: Funciona en todos los dispositivos
- **Modo alto contraste**: Soporte para preferencias de usuario
- **Reducción de movimiento**: Respeta las preferencias de accesibilidad

### 🚀 API REST
- `GET /api/sessions/<genre>` - Lista todas las sesiones de un género
- `GET /api/sessions/<genre>/<id>` - Obtiene una sesión específica
- `POST /api/auth` - Autenticación para zona privada
- `POST /api/logout` - Cerrar sesión
- `GET /api/health` - Estado de la aplicación

## 🛠️ Instalación y Configuración

### Requisitos Previos
- Python 3.8+
- pip (gestor de paquetes de Python)

### Instalación

1. **Clona o descarga el proyecto**
```bash
cd AudioSessions
```

2. **Instala las dependencias**
```bash
pip install -r requirements.txt
```

3. **Configura las variables de entorno**
```bash
cp .env.example .env
# Edita .env con tus configuraciones
```

4. **Ejecuta la aplicación**
```bash
python app.py
```

La aplicación estará disponible en `http://localhost:5000`

## � Configuración

### Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

```env
# Configuración básica
FLASK_ENV=development
SECRET_KEY=tu-clave-secreta-muy-segura
PORT=5000

# Autenticación
PRIVATE_ZONE_PASSWORD=tu-password-seguro

# Límites de archivos
MAX_CONTENT_LENGTH=16777216  # 16MB
```

### Configuración de Producción

Para producción, usa un servidor WSGI como Gunicorn:

```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## 📱 Uso

### Géneros Musicales
- **House**: Sesiones de house music
- **Techno**: Sesiones de techno
- **Progressive**: Sesiones de progressive
- **Remember**: Sesiones nostálgicas
- **Zona Privada**: Contenido exclusivo (requiere autenticación)

### Controles del Reproductor
- **Espacio**: Play/Pause
- **Flechas izq/der**: Retroceder/Avanzar 10 segundos
- **Flechas arriba/abajo**: Subir/Bajar volumen
- **Click en barra**: Buscar posición específica

### Acceso a Zona Privada
1. Click en "PRIVATE ZONE"
2. Introduce la contraseña configurada
3. Accede al contenido exclusivo

## 🔒 Seguridad

### Medidas Implementadas
- ✅ **Contraseñas hasheadas** - No hay texto plano en el código
- ✅ **Sesiones seguras** - Tokens de sesión con expiración
- ✅ **Validación de entrada** - Prevención de path traversal
- ✅ **Manejo de errores** - No exposición de información sensible
- ✅ **Headers de seguridad** - CSRF protection
- ✅ **Rate limiting** - Protección contra spam

### Recomendaciones Adicionales
- Cambiar `SECRET_KEY` en producción
- Usar HTTPS en producción
- Configurar firewall adecuado
- Monitorear logs de acceso

## 📊 Monitoreo y Logs

La aplicación incluye logging estructurado:

```python
# Los logs incluyen:
- Timestamp de requests
- IP del cliente  
- Método HTTP y ruta
- Código de respuesta
- Errores de autenticación
```

## 🔄 Actualizaciones

### Changelog Reciente
- ✅ **v2.0** - API REST completa y reproductor mejorado
- ✅ **v1.9** - Sistema de autenticación seguro
- ✅ **v1.8** - Mejoras de accesibilidad y responsive
- ✅ **v1.7** - Manejo robusto de errores
- ✅ **v1.6** - Controles de volumen y atajos de teclado

### Próximas Características
- 🔄 Base de datos SQLite para persistencia
- 🔄 Panel de administración web
- 🔄 PWA con funcionamiento offline
- 🔄 Sistema de playlists
- 🔄 Analytics y métricas de uso

## 🤝 Contribuir

### Para Desarrolladores

1. **Fork del proyecto**
2. **Crea una rama para tu feature**
```bash
git checkout -b feature/nueva-caracteristica
```
3. **Commit tus cambios**
```bash
git commit -m "Añade nueva característica"
```
4. **Push a la rama**
```bash
git push origin feature/nueva-caracteristica
```
5. **Abre un Pull Request**

### Estructura del Proyecto
```
AudioSessions/
├── app.py                 # Aplicación Flask principal
├── global-player.js       # Reproductor global
├── style.css             # Estilos principales
├── index.html            # Página principal
├── *.html               # Páginas de géneros
├── attached_assets/      # Imágenes y recursos
├── requirements.txt      # Dependencias Python
├── .env.example         # Configuración de ejemplo
└── README.md            # Este archivo
```

## 📝 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 🆘 Soporte

Si encuentras algún problema o tienes sugerencias:

1. **Revisa los logs** en la consola del navegador y terminal
2. **Verifica la configuración** en tu archivo `.env`
3. **Consulta la documentación** de la API en `/api/health`
4. **Reporta issues** con información detallada

---

**Desarrollado con ❤️ para los amantes de la música electrónica**

