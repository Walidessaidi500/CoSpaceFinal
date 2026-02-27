#!/bin/bash
# Este script está diseñado para ejecutarse manualmente o como comando de inicio en Railway
set -e

echo "🚀 Iniciando configuración de la base de datos para Railway..."

echo "🧹 Limpiando cachés antiguas..."
php artisan config:clear
php artisan cache:clear

echo "🏗️ Ejecutando las migraciones..."
# --force es necesario en producción para que no pida confirmación interactiva
php artisan migrate --force

echo "🌱 Ejecutando los seeders..."
# Si quieres vaciar toda la base de datos y volver a crearla con seeders, descomenta la siguiente línea y comenta las otras dos (CUIDADO: Borrará datos existentes)
# php artisan migrate:fresh --seed --force
php artisan db:seed --force

echo "📦 Re-cacheando configuración para optimizar rendimiento..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "✅ Script finalizado correctamente!"
