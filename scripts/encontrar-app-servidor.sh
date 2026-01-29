#!/bin/bash

# Script para encontrar onde está a aplicação no servidor

SERVER="root@104.218.52.159"

echo "=== 🔍 Procurando aplicação no servidor ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

echo "1️⃣ Procurando diretórios comuns..."
ssh $SERVER "ls -la /var/www/ 2>/dev/null || echo 'Diretório /var/www não existe'"
echo ""

echo "2️⃣ Procurando por arquivos package.json..."
ssh $SERVER "find / -name 'package.json' -type f 2>/dev/null | grep -E '(lotbicho|postenobicho)' | head -5"
echo ""

echo "3️⃣ Verificando processos PM2..."
ssh $SERVER "pm2 list 2>/dev/null || echo 'PM2 não encontrado'"
echo ""

echo "4️⃣ Verificando processos Node.js..."
ssh $SERVER "ps aux | grep -E '(node|next|pm2)' | grep -v grep | head -5"
echo ""

echo "5️⃣ Procurando por arquivos next.config..."
ssh $SERVER "find / -name 'next.config.*' -type f 2>/dev/null | head -5"
echo ""

echo "=== ✅ Busca concluída ==="
