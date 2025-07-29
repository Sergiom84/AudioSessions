@echo off
echo =================================
echo   Audio Sessions Archive v2.0
echo =================================
echo.
echo Iniciando servidor de desarrollo...
echo.

cd /d "%~dp0"

REM Verificar si Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python no está instalado o no está en el PATH
    echo Por favor instala Python 3.8+ desde https://python.org
    pause
    exit /b 1
)

REM Verificar si Flask está instalado
python -c "import flask" >nul 2>&1
if errorlevel 1 (
    echo Flask no está instalado. Instalando dependencias...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ERROR: No se pudieron instalar las dependencias
        pause
        exit /b 1
    )
)

REM Verificar si existe el archivo .env
if not exist ".env" (
    echo.
    echo ADVERTENCIA: No se encontró archivo .env
    echo Copiando configuración de ejemplo...
    copy ".env.example" ".env"
    echo.
    echo Por favor, edita el archivo .env con tus configuraciones
    echo.
)

echo.
echo Servidor iniciado en: http://localhost:5000
echo.
echo Presiona Ctrl+C para detener el servidor
echo =================================
echo.

python app.py

pause
