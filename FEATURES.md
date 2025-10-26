# 🎧 Audio Sessions - Guía de Funcionalidades v2.0

## 📋 Índice
1. [Newsletter](#-newsletter)
2. [Sistema de Favoritos](#-sistema-de-favoritos)
3. [Compartir Sesiones](#-compartir-sesiones)
4. [PWA - App Instalable](#-pwa---app-instalable)
5. [Seguridad Mejorada](#-seguridad-mejorada)

---

## 📧 Newsletter

### Para Usuarios
**Suscribirse:**
1. Ve a la página principal
2. Baja hasta el footer
3. Introduce tu email
4. Click en "Suscribirme"
5. Recibirás un email de bienvenida

**Recibirás un email cuando:**
- Se publique una nueva sesión
- El administrador envíe una notificación

### Para Administradores
**Enviar newsletter de nueva sesión:**

1. Ve a tu Google Apps Script
2. Busca la función `testNotification()`
3. Edita los datos:
```javascript
const testData = {
    action: 'notify',
    title: 'NOMBRE DE LA SESIÓN',
    genre: 'House', // o Techno, Progressive, etc.
    description: 'DESCRIPCIÓN',
    sessionId: 'id-de-la-sesion' // Mismo ID que en player.html
};
```
4. Ejecuta la función (▶️ botón ejecutar)
5. ¡Todos los suscriptores recibirán el email!

**Ver suscriptores:**
- Ejecuta `listSubscribers()` en Apps Script
- O abre tu Google Sheet directamente

---

## ⭐ Sistema de Favoritos

### Uso Básico
1. **Marcar como favorito:**
   - Click en el botón ♡ en cualquier sesión
   - Se pondrá rojo (♥) cuando esté marcada

2. **Ver favoritos:**
   - El contador aparece en la esquina del botón
   - Todos los favoritos se guardan en tu navegador

3. **Quitar de favoritos:**
   - Click de nuevo en el ♥
   - Vuelve a ♡ gris

### Características
- ✅ Persistencia local (no requiere cuenta)
- ✅ Sincronización instantánea
- ✅ Contador de favoritos
- ✅ Animación heartbeat al marcar
- ✅ Funciona offline

### Para Desarrolladores
```javascript
// Acceder al sistema de favoritos
const favorites = favoritesManager.getFavorites(); // Array de IDs

// Marcar/desmarcar programáticamente
favoritesManager.toggle('session-id');

// Verificar si es favorito
const isFav = favoritesManager.isFavorite('session-id');

// Limpiar todos (con confirmación)
favoritesManager.clearAll();

// Escuchar cambios
window.addEventListener('favoritesChanged', (e) => {
    console.log('Favorito cambiado:', e.detail);
});
```

---

## 📤 Compartir Sesiones

### Móviles (Web Share API)
1. Click en el botón de compartir (🔗)
2. Selecciona la app (WhatsApp, Telegram, etc.)
3. ¡Listo!

### Desktop
1. Click en el botón de compartir
2. Se abre un modal con opciones:
   - **WhatsApp Web**
   - **Telegram Web**
   - **Twitter**
   - **Facebook**
   - **Email**
   - **Copiar enlace**

### Características
- ✅ Detección automática móvil/desktop
- ✅ Link directo a la sesión
- ✅ Tracking de compartidos (analytics)
- ✅ Copy to clipboard con feedback visual
- ✅ Títulos y descripciones optimizadas

### Para Desarrolladores
```javascript
// Compartir una sesión programáticamente
const sessionData = {
    id: 'session-id',
    title: 'Nombre Sesión',
    description: 'Descripción...'
};

await shareManager.share(sessionData);

// Verificar si soporta Web Share API
const supported = shareManager.supportsWebShare;

// Ver estadísticas de compartidos
const shares = JSON.parse(localStorage.getItem('sessionShares'));
```

---

## 📱 PWA - App Instalable

### Instalar en Android
1. Abre la web en Chrome
2. Verás un banner "Añadir a pantalla de inicio"
3. O ve a ⋮ → "Instalar app"
4. ¡Listo! Ahora tienes la app en tu móvil

### Instalar en iOS
1. Abre la web en Safari
2. Click en el botón de compartir
3. "Añadir a pantalla de inicio"
4. ¡Listo!

### Instalar en Desktop
1. Abre la web en Chrome/Edge
2. Verás un icono de instalación en la barra de direcciones
3. Click → "Instalar"
4. Se abre como una app independiente

### Características PWA
- ✅ **Funciona offline** - Caché inteligente de páginas y assets
- ✅ **Instalable** - Como app nativa
- ✅ **Icono en launcher** - Con tu logo
- ✅ **Pantalla completa** - Sin barra del navegador
- ✅ **Shortcuts** - Acceso rápido a House, Techno, Private
- ✅ **Rápida** - Carga instantánea desde caché

### Service Worker
El Service Worker cachea automáticamente:
- Todas las páginas HTML
- CSS y JavaScript
- Imágenes de carátulas (bajo demanda)

**Limpiar caché:**
```javascript
// Desde consola del navegador
navigator.serviceWorker.getRegistration().then(reg => {
    reg.unregister();
});
caches.keys().then(names => {
    names.forEach(name => caches.delete(name));
});
```

---

## 🔒 Seguridad Mejorada

### Configuración con Variables de Entorno

1. **Crea archivo `.env`** (copia desde `.env.example`):
```bash
cp .env.example .env
```

2. **Genera una SECRET_KEY segura:**
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

3. **Edita `.env`:**
```env
SECRET_KEY=tu-clave-generada-aqui
PRIVATE_ZONE_PASSWORD=tu-password
CORS_ORIGINS=https://sergiom84.github.io
```

### Seguridad Implementada

#### ✅ Rate Limiting
- **Endpoint `/api/auth`:** Máximo 5 intentos por minuto
- **General:** 200 peticiones/día, 50/hora
- Protección contra brute force

#### ✅ CORS Configurado
- Solo permite peticiones desde tu dominio
- Headers personalizados permitidos
- Métodos restringidos (GET, POST, OPTIONS)

#### ✅ Security Headers
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

#### ✅ Session Security
- Cookies HttpOnly
- Secure en producción
- SameSite=Lax
- Expiración de 24 horas

#### ✅ Input Validation
- Path traversal protection
- Password hashing con Werkzeug
- JSON validation
- File size limits

### Logs de Seguridad
El servidor loguea automáticamente:
- ✅ Intentos fallidos de autenticación con IP
- ✅ Todas las peticiones (excepto assets)
- ✅ Errores del servidor
- ✅ Rate limit violations

Ver logs en consola:
```
[2025-10-26 14:30:15] 192.168.1.1 - POST /api/auth - 401
⚠️  Failed auth attempt from 192.168.1.1
```

---

## 🚀 Instalación para Desarrollo

### Requisitos
- Python 3.8+
- pip

### Pasos
```bash
# 1. Clonar repositorio
git clone https://github.com/Sergiom84/AudioSessions.git
cd AudioSessions

# 2. Crear entorno virtual
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 5. Ejecutar servidor
python app.py
```

### Producción con Gunicorn
```bash
gunicorn app:app --bind 0.0.0.0:5000 --workers 4
```

---

## 📊 Analytics Local

Todos los datos se guardan en **localStorage**:

```javascript
// Ver reproducciones por sesión
localStorage.getItem('sessionListens')

// Ver descargas por sesión
localStorage.getItem('sessionDownloads')

// Ver favoritos
localStorage.getItem('audioSessions_favorites')

// Ver compartidos
localStorage.getItem('sessionShares')
```

### Exportar datos
```javascript
// Desde consola del navegador
const data = {
    listens: JSON.parse(localStorage.getItem('sessionListens') || '{}'),
    downloads: JSON.parse(localStorage.getItem('sessionDownloads') || '{}'),
    favorites: JSON.parse(localStorage.getItem('audioSessions_favorites') || '[]'),
    shares: JSON.parse(localStorage.getItem('sessionShares') || '{}')
};

console.log(JSON.stringify(data, null, 2));
// Copiar y pegar en un archivo .json
```

---

## 🆘 Troubleshooting

### Newsletter no funciona
1. Verifica que la URL de Google Script esté en `index.html` línea 430
2. Revisa que el script esté desplegado como "Web App"
3. Comprueba que los permisos estén aceptados
4. Revisa el log de Apps Script

### PWA no se instala
1. Verifica que estés en HTTPS o localhost
2. Comprueba que `manifest.json` sea accesible
3. Revisa que el Service Worker esté registrado (DevTools → Application)
4. Clear cache y recarga

### Favoritos no se guardan
1. Verifica que localStorage esté habilitado
2. No estés en modo incógnito
3. Tienes espacio suficiente (cuota de 5-10MB)

### Service Worker no actualiza
```javascript
// Forzar actualización
navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(reg => reg.update());
});
```

---

## 📝 Changelog

### v2.0.0 (2025-10-26)
- ✅ Sistema de Newsletter con Google Sheets
- ✅ Sistema de Favoritos con localStorage
- ✅ Sistema de Compartir con Web Share API
- ✅ PWA completa con Service Worker
- ✅ Seguridad mejorada (rate limiting, CORS, headers)
- ✅ Compresión de respuestas
- ✅ Headers de seguridad
- ✅ Documentación completa

### v1.0.0
- Reproductor global
- Zona privada con autenticación
- Sistema de géneros musicales
- Analytics básico

---

## 🤝 Contribuir

1. Fork del repositorio
2. Crea una branch (`git checkout -b feature/amazing-feature`)
3. Commit cambios (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

---

## 📄 Licencia

MIT License - Ver `LICENSE` file

---

## 👨‍💻 Autor

**Sergio M** - [@Sergiom84](https://github.com/Sergiom84)

---

¿Preguntas? [Abre un issue](https://github.com/Sergiom84/AudioSessions/issues)
