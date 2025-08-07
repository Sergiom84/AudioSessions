@echo off
cd /d "c:\Users\Sergio\Desktop\AudioSession"
echo Verificando estado de Git...
git status
echo.
echo Añadiendo archivos modificados...
git add .
echo.
echo Haciendo commit...
git commit -m "🚀 Fix: Mejoras en reproductor móvil - Control táctil mejorado para barra de progreso, mejor detección de dispositivos iOS, funciones adicionales de seek y stop, logging más detallado para debug de Android"
echo.
echo Subiendo cambios a GitHub...
git push origin main
echo.
echo ¡Cambios subidos exitosamente!
pause
