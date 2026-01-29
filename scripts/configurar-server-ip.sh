#!/bin/bash
# Script para configurar SERVER_IP no .env do servidor
# Execute: ./scripts/configurar-server-ip.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"

echo "=== 🔧 Configurando SERVER_IP no Servidor ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

echo "1️⃣ Verificando IP público do servidor..."
SERVER_IP=$(ssh $SERVER "curl -s ifconfig.me || curl -s ipinfo.io/ip || echo '104.218.52.159'")
echo "IP detectado: $SERVER_IP"
echo ""

echo "2️⃣ Configurando SERVER_IP no .env..."
ssh $SERVER << ENDSSH
cd /var/www/postenobicho

# Verificar se SERVER_IP já existe no .env
if grep -q "^SERVER_IP=" .env 2>/dev/null; then
  echo "📝 SERVER_IP já existe no .env, atualizando..."
  sed -i "s|^SERVER_IP=.*|SERVER_IP=$SERVER_IP|" .env
else
  echo "📝 Adicionando SERVER_IP ao .env..."
  echo "" >> .env
  echo "# IP público do servidor (usado para identificar o IP nas requisições HTTP)" >> .env
  echo "SERVER_IP=$SERVER_IP" >> .env
fi

echo "✅ SERVER_IP configurado: $SERVER_IP"
echo ""
echo "📋 Conteúdo do .env (apenas SERVER_IP):"
grep "^SERVER_IP=" .env || echo "⚠️  SERVER_IP não encontrado no .env"
ENDSSH

echo ""
echo "3️⃣ Reiniciando PM2 para aplicar variáveis de ambiente..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho --update-env"

echo ""
echo "=== ✅ Configuração Concluída! ==="
echo ""
echo "📋 Próximos passos:"
echo "  1. Verifique se o IP $SERVER_IP está autorizado no Nxgate para saques"
echo "  2. Tente fazer um saque novamente"
echo "  3. Verifique os logs: pm2 logs lotbicho --lines 50"
echo ""
