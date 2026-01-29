#!/bin/bash

# Script para conectar ao servidor

SERVER="root@104.218.52.159"
APP_DIR="/var/www/lotbicho"

echo "=== 🔌 Conectando ao Servidor ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""
echo "Servidor: $SERVER"
echo "Diretório da aplicação: $APP_DIR"
echo ""
echo "Comandos úteis após conectar:"
echo "  cd $APP_DIR"
echo "  pm2 status"
echo "  pm2 logs lotbicho"
echo "  npx prisma migrate status"
echo ""

ssh $SERVER
