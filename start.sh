#!/bin/bash

echo "================================="
echo "  Audio Sessions Archive v2.0"
echo "================================="
echo ""
echo "Iniciando servidor de desarrollo..."
echo ""

# Cambiar al directorio del script
cd "$(dirname "$0")"

# Verificar si Python está instalado
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "ERROR: Python no está instalado"
    echo "Por favor instala Python 3.8+ desde https://python.org"
    exit 1
fi

# Usar python3 si está disponible, sino python
PYTHON_CMD="python3"
if ! command -v python3 &> /dev/null; then
    PYTHON_CMD="python"
fi

# Verificar si Flask está instalado
$PYTHON_CMD -c "import flask" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Flask no está instalado. Instalando dependencias..."
    pip3 install -r requirements.txt || pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "ERROR: No se pudieron instalar las dependencias"
        exit 1
    fi
fi

# Verificar si existe el archivo .env
if [ ! -f ".env" ]; then
    echo ""
    echo "ADVERTENCIA: No se encontró archivo .env"
    echo "Copiando configuración de ejemplo..."
    cp ".env.example" ".env"
    echo ""
    echo "Por favor, edita el archivo .env con tus configuraciones"
    echo ""
fi

echo ""
echo "Servidor iniciado en: http://localhost:5000"
echo ""
echo "Presiona Ctrl+C para detener el servidor"
echo "================================="
echo ""

$PYTHON_CMD app.py
