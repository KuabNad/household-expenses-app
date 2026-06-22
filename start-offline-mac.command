#!/bin/zsh
cd "$(dirname "$0")"

if [ ! -f "offline-dist/index.html" ]; then
  echo "Preparando Gastos del hogar para uso offline..."
  npm run build:offline:mac || {
    echo ""
    echo "No se pudo preparar la aplicación. Ejecuta primero: npm install"
    read -k 1 "?Pulsa cualquier tecla para cerrar."
    exit 1
  }
fi

node scripts/offline-server.mjs
