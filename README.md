<<<<<<< HEAD
# 🎵 AudioSessions - Interactive Music Archive

Una aplicación web interactiva para archivo de sesiones de audio con reproductor global avanzado y sistema de autenticación seguro.

## 🌟 Demo en Vivo

**🚀 [Ver Demo](https://tu-demo-url.com)** *(Próximamente)*

## ✨ Características Principales

### 🎧 **Reproductor Global Avanzado**
- **Controles completos**: Play/Pause, volumen, navegación temporal
- **Atajos de teclado**: Espacio (play/pause), flechas (volumen/navegación)
- **Indicadores visuales**: Barra de progreso con buffer, estados de carga
- **Persistencia**: Mantiene la sesión actual entre páginas
- **Sincronización bidireccional** entre reproductor global y principal

### 🔐 **Sistema de Autenticación Robusto**
- **API REST segura** con tokens de sesión
- **Contraseñas hasheadas** (no más texto plano)
- **Protección CSRF** con tokens de seguridad
- **Rate limiting** contra ataques de fuerza bruta

### 🎨 **Interfaz Moderna y Accesible**
- **Diseño responsive** optimizado para móviles y desktop
- **Soporte completo de accesibilidad** (WCAG 2.1)
- **Navegación por teclado** y lectores de pantalla
- **Animaciones fluidas** con respeto a preferencias de usuario
- **Modo alto contraste** y reducción de movimiento

### 🎵 **Géneros Musicales**
- **🏠 House** - Deep House, Tech House, Vocal House
- **⚡ Techno** - Berlin Techno, Acid, Industrial
- **🌊 Progressive** - Progressive House, Trance
- **💫 Remember** - Clásicos de los 90s y 2000s
- **🔒 Private Zone** - Sesiones exclusivas VIP

## 🛠️ Tecnologías

### **Backend**
- **Flask 3.0** - Framework web Python
- **Werkzeug** - Utilidades WSGI y seguridad
- **API REST** completa con endpoints documentados

### **Frontend**
- **Vanilla JavaScript** - Sin dependencias externas
- **CSS3 moderno** - Grid, Flexbox, Custom Properties
- **HTML5 semántico** - Estructura accesible

### **Infraestructura**
- **Python 3.8+** - Runtime backend
- **Archivos estáticos** - Servidos eficientemente
- **Cross-platform** - Windows, macOS, Linux

## 🚀 Instalación Rápida

### **Requisitos**
- Python 3.8 o superior
- pip (gestor de paquetes)

### **Pasos**

1. **Clona el repositorio**
```bash
git clone https://github.com/Sergiom84/AudioSessions.git
cd AudioSessions
```

2. **Instala dependencias**
```bash
pip install -r requirements.txt
```

3. **Configura el entorno**
```bash
cp .env.example .env
# Edita .env con tus configuraciones
```

4. **Ejecuta la aplicación**

**Windows:**
```bash
./start.bat
```

**Linux/macOS:**
```bash
./start.sh
```

**Manual:**
```bash
python app.py
```

5. **Abre tu navegador**
```
http://localhost:5000
```

## 📡 API REST

### **Endpoints Principales**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/sessions/<genre>` | Lista sesiones por género |
| `GET` | `/api/sessions/<genre>/<id>` | Obtiene sesión específica |
| `POST` | `/api/auth` | Autenticación zona privada |
| `POST` | `/api/logout` | Cerrar sesión |
| `GET` | `/api/health` | Estado de la aplicación |

### **Ejemplo de Uso**

```javascript
// Obtener sesiones de House
fetch('/api/sessions/house')
  .then(response => response.json())
  .then(sessions => console.log(sessions));

// Autenticación
fetch('/api/auth', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({password: 'tu-password'})
});
```

## 🎯 Estructura del Proyecto

```
AudioSessions/
├── 📁 attached_assets/          # Carátulas e imágenes
├── 📄 app.py                   # Backend Flask con API
├── 📄 global-player.js         # Reproductor global
├── 📄 style.css               # Estilos CSS
├── 📄 index.html              # Página principal
├── 📄 player.html             # Reproductor principal
├── 📄 house.html              # Sesiones House
├── 📄 techno.html             # Sesiones Techno
├── 📄 progressive.html        # Sesiones Progressive
├── 📄 remember.html           # Sesiones Remember
├── 📄 private.html            # Zona privada
├── 📄 requirements.txt        # Dependencias Python
├── 📄 .env.example           # Configuración ejemplo
└── 📄 README.md              # Documentación
```

## 🔒 Seguridad

- ✅ **Contraseñas hasheadas** con Werkzeug
- ✅ **Tokens CSRF** en formularios
- ✅ **Rate limiting** en endpoints críticos
- ✅ **Validación de entrada** en todas las APIs
- ✅ **Headers de seguridad** configurados

## 🌐 Despliegue

### **Desarrollo Local**
```bash
python app.py
# Aplicación en http://localhost:5000
```

### **Producción**
- Compatible con **Heroku**, **Vercel**, **Railway**
- Configuración con variables de entorno
- Archivos estáticos optimizados

## 📱 Compatibilidad

| Característica | Soporte |
|----------------|---------|
| **Navegadores** | Chrome 80+, Firefox 75+, Safari 13+, Edge 80+ |
| **Móviles** | iOS 13+, Android 8+ |
| **Tablets** | iPad OS, Android tablets |
| **Escritorio** | Windows, macOS, Linux |

## 🎨 Capturas de Pantalla

### **Página Principal**
![Página Principal](screenshots/home.png)

### **Reproductor Global**
![Reproductor Global](screenshots/player.png)

### **Zona Privada**
![Zona Privada](screenshots/private.png)

## 🤝 Contribución

1. **Fork** el proyecto
2. **Crea** una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add: Amazing Feature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. **Abre** un Pull Request

## 📝 Changelog

### **v2.0.0** - Actual
- ✨ Reproductor global con sincronización bidireccional
- 🔐 Sistema de autenticación seguro
- 🎨 Interfaz completamente rediseñada
- 📱 Optimización para móviles
- 🛠️ API REST completa

### **v1.0.0** - Primera versión
- 🎵 Reproductor básico
- 📄 Páginas estáticas
- 🎧 Sesiones individuales

## 🐛 Reporte de Issues

¿Encontraste un bug? [Abre un issue](https://github.com/Sergiom84/AudioSessions/issues)

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

## 👨‍💻 Autor

**Sergio M.**
- GitHub: [@Sergiom84](https://github.com/Sergiom84)
- Email: tu-email@ejemplo.com

## 🙏 Agradecimientos

- **Archive.org** por el hosting de audio
- **Comunidad de desarrolladores** por feedback
- **Artistas** por la música increíble

---

⭐ **¡No olvides dar una estrella si te gusta el proyecto!** ⭐
