#!/bin/bash

# Script para fazer upload do build para o servidor
# Execute este script do seu computador local

echo "🚀 Iniciando upload do build..."

# Configurações
SERVER="root@104.218.52.159"
REMOTE_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

cd "$LOCAL_DIR"

echo "📤 Fazendo upload de .next/..."
scp -r .next/ "$SERVER:$REMOTE_DIR/"

echo "📤 Fazendo upload de node_modules/..."
scp -r node_modules/ "$SERVER:$REMOTE_DIR/"

echo "📤 Fazendo upload de public/..."
scp -r public/ "$SERVER:$REMOTE_DIR/"

echo "📤 Fazendo upload de prisma/..."
scp -r prisma/ "$SERVER:$REMOTE_DIR/"

echo "📤 Fazendo upload de arquivos de configuração..."
scp package.json "$SERVER:$REMOTE_DIR/"
scp package-lock.json "$SERVER:$REMOTE_DIR/"
scp ecosystem.config.js "$SERVER:$REMOTE_DIR/"

echo "✅ Upload concluído!"
