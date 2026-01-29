#!/bin/bash

# Script para testar conexão e executar comandos no servidor

SERVER="root@104.218.52.159"
APP_DIR="/var/www/lotbicho"

echo "=== 🧪 Testando Conexão com Servidor ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

# Testar conexão básica
echo "1️⃣ Testando conexão SSH..."
ssh $SERVER "echo '✅ Conexão estabelecida!' && hostname && pwd" || {
    echo "❌ Falha na conexão SSH"
    exit 1
}

echo ""
echo "2️⃣ Verificando diretório da aplicação..."
ssh $SERVER "cd $APP_DIR && pwd && ls -la | head -10" || {
    echo "❌ Diretório da aplicação não encontrado"
    exit 1
}

echo ""
echo "3️⃣ Verificando status do PM2..."
ssh $SERVER "pm2 status" || {
    echo "⚠️ PM2 não encontrado ou não está rodando"
}

echo ""
echo "4️⃣ Verificando versão do Node..."
ssh $SERVER "node --version && npm --version"

echo ""
echo "=== ✅ Teste de Conexão Concluído ==="
