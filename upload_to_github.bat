@echo off
echo ==========================================
echo  AudioSessions - Subiendo a GitHub
echo ==========================================

cd /d "c:\Users\Sergio\Desktop\IA\APP´s\AudioSessions"

echo.
echo Verificando estado de Git...
git status

echo.
echo Agregando todos los archivos...
git add -A

echo.
echo Creando commit...
git commit -m "🎵 AudioSessions v2.0: Media Session API completa y mejoras UX

✨ Características principales implementadas:
- 📱 Media Session API para pantalla de bloqueo (título + imagen)
- 🔄 Modal de reanudación con auto-play automático  
- 📥 Modal de instrucciones de descarga con imagen
- 🔧 Corrección de iconos SVG en botón play/pause
- 🧭 Navegación optimizada con soporte móvil

🎯 Mejoras técnicas:
- URLs de audio/descarga unificadas en todas las sesiones
- Extracción robusta de artwork desde attached_assets/
- Sistema de logging detallado para debugging
- Gestión sincronizada del estado de audio
- Corrección texto Nati Nati según carátula

💻 Archivos principales modificados:
- player.html: Modales, auto-play, navegación mejorada
- global-player.js: Media Session API optimizada
- Páginas de género: URLs actualizadas

🎉 Resultado: Experiencia completa con pantalla de bloqueo funcional"

echo.
echo Configurando repositorio remoto...
git remote add origin https://github.com/Sergiom84/AudioSessions.git 2>nul

echo.
echo Subiendo a GitHub...
git push -u origin main

echo.
echo Verificando últimos commits...
git log --oneline -3

echo.
echo ==========================================
echo  Proceso completado!
echo ==========================================
pause
