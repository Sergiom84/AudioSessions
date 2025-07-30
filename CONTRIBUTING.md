# Guía de Contribución - AudioSessions

¡Gracias por tu interés en contribuir a AudioSessions! 🎵

## 🚀 Cómo Contribuir

### 1. **Preparación**
```bash
# Fork el repositorio en GitHub
# Clona tu fork
git clone https://github.com/TU-USUARIO/AudioSessions.git
cd AudioSessions

# Configura el repositorio original como upstream
git remote add upstream https://github.com/Sergiom84/AudioSessions.git
```

### 2. **Configuración del Entorno**
```bash
# Instala dependencias
pip install -r requirements.txt

# Copia configuración de ejemplo
cp .env.example .env

# Ejecuta tests (si existen)
python -m pytest tests/
```

### 3. **Desarrollo**
```bash
# Crea una nueva rama para tu feature
git checkout -b feature/mi-nueva-caracteristica

# Desarrolla tu feature
# Asegúrate de seguir las convenciones de código

# Ejecuta la aplicación para probar
python app.py
```

### 4. **Commits**
Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Ejemplos de buenos commits
git commit -m "feat: añadir reproductor en bucle"
git commit -m "fix: corregir error de sincronización"
git commit -m "docs: actualizar README con nuevas características"
git commit -m "style: mejorar espaciado en CSS"
git commit -m "refactor: optimizar función de búsqueda"
```

**Tipos de commit:**
- `feat`: Nueva característica
- `fix`: Corrección de bug
- `docs`: Documentación
- `style`: Formato de código
- `refactor`: Refactorización
- `test`: Añadir/modificar tests
- `chore`: Tareas de mantenimiento

### 5. **Pull Request**
```bash
# Asegúrate de que tu rama esté actualizada
git fetch upstream
git rebase upstream/main

# Push de tu rama
git push origin feature/mi-nueva-caracteristica

# Crea el Pull Request en GitHub
```

## 📋 Checklist para Pull Requests

- [ ] **Código funciona** localmente sin errores
- [ ] **Tests pasan** (si existen)
- [ ] **Documentación actualizada** si es necesario
- [ ] **Commit messages** siguen convenciones
- [ ] **No hay conflictos** con la rama main
- [ ] **Código está formateado** correctamente

## 🎯 Tipos de Contribuciones Buscadas

### **🎵 Nuevas Características**
- Nuevos géneros musicales
- Funcionalidades del reproductor
- Mejoras de UI/UX
- Optimizaciones de rendimiento

### **🐛 Bug Fixes**
- Problemas de reproducción
- Errores de responsive design
- Issues de accesibilidad
- Problemas de sincronización

### **📚 Documentación**
- Mejorar README
- Añadir comentarios al código
- Crear guías de usuario
- Documentar API

### **🧪 Testing**
- Tests unitarios
- Tests de integración
- Tests de UI
- Tests de accesibilidad

## 🎨 Convenciones de Código

### **Python (Backend)**
```python
# Usa snake_case para variables y funciones
def obtener_sesiones_activas():
    pass

# Usa PascalCase para clases
class ReproductorGlobal:
    pass

# Documenta funciones complejas
def sincronizar_reproductores(tiempo_actual):
    """
    Sincroniza el tiempo entre reproductores.
    
    Args:
        tiempo_actual (float): Tiempo en segundos
        
    Returns:
        bool: True si la sincronización fue exitosa
    """
    pass
```

### **JavaScript (Frontend)**
```javascript
// Usa camelCase para variables y funciones
const tiempoActual = 0;

function actualizarProgresoReproductor() {
    // Código aquí
}

// Usa PascalCase para clases
class GlobalAudioPlayer {
    constructor() {
        // Inicialización
    }
}

// Comentarios descriptivos para lógica compleja
// Calcula el porcentaje de progreso basado en tiempo actual
const progreso = (tiempoActual / duracionTotal) * 100;
```

### **CSS**
```css
/* Usa kebab-case para clases */
.reproductor-global {
    /* Propiedades ordenadas alfabéticamente */
    background: var(--primary-bg);
    border-radius: var(--radius);
    padding: var(--spacing-md);
}

/* Agrupa propiedades relacionadas */
.session-card {
    /* Layout */
    display: flex;
    flex-direction: column;
    
    /* Spacing */
    margin: var(--spacing-md);
    padding: var(--spacing-lg);
    
    /* Visual */
    background: var(--card-bg);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    
    /* Animation */
    transition: transform var(--transition-normal);
}
```

## 🔍 Proceso de Review

1. **Revisión automática** - CI/CD checks
2. **Revisión de código** - Mantenedor revisa cambios
3. **Testing** - Se prueban las nuevas características
4. **Merge** - Se integra a la rama principal

## 🎁 Ideas para Contribuir

### **Fácil (Good First Issue)**
- [ ] Añadir nuevas sesiones de música
- [ ] Mejorar textos descriptivos
- [ ] Corregir typos en documentación
- [ ] Optimizar imágenes

### **Intermedio**
- [ ] Implementar búsqueda de sesiones
- [ ] Añadir modo oscuro/claro
- [ ] Crear sistema de favoritos
- [ ] Añadir compartir en redes sociales

### **Avanzado**
- [ ] Implementar PWA (Progressive Web App)
- [ ] Añadir base de datos para sesiones
- [ ] Crear panel de administración
- [ ] Implementar streaming en tiempo real

## 🤝 Código de Conducta

- **Sé respetuoso** con otros contribuidores
- **Mantén las discusiones constructivas**
- **Acepta feedback** con mente abierta
- **Ayuda a otros** cuando puedas

## 📞 ¿Necesitas Ayuda?

- **Issues**: Para bugs y nuevas características
- **Discussions**: Para preguntas generales
- **Email**: Para comunicación directa

¡Esperamos tus contribuciones! 🚀
