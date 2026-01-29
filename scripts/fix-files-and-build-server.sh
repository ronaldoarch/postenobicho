#!/bin/bash
# Script para corrigir arquivos corrompidos e fazer build no servidor
# Execute este script do seu Mac

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🔧 Corrigindo arquivos e fazendo build no servidor ==="
echo ""

# 1. Parar PM2 no servidor
echo "1️⃣ Parando PM2 no servidor..."
ssh $SERVER "cd $SERVER_DIR && pm2 stop lotbicho || true"

# 2. Enviar arquivos corrigidos
echo ""
echo "2️⃣ Enviando arquivos corrigidos..."
scp $LOCAL_DIR/app/cadastro/page.tsx $SERVER:$SERVER_DIR/app/cadastro/
scp $LOCAL_DIR/app/suporte/page.tsx $SERVER:$SERVER_DIR/app/suporte/

# 3. Verificar se os arquivos foram corrigidos
echo ""
echo "3️⃣ Verificando arquivos no servidor..."
ssh $SERVER "cd $SERVER_DIR && grep -n 'try {' app/cadastro/page.tsx | head -1"
ssh $SERVER "cd $SERVER_DIR && head -10 app/suporte/page.tsx | tail -5"

# 4. Instalar dependências
echo ""
echo "4️⃣ Instalando dependências no servidor..."
ssh $SERVER "cd $SERVER_DIR && npm install"

# 5. Limpar build antigo
echo ""
echo "5️⃣ Limpando build antigo..."
ssh $SERVER "cd $SERVER_DIR && rm -rf .next"

# 6. Fazer build (vai demorar alguns minutos)
echo ""
echo "6️⃣ Fazendo build no servidor (isso pode demorar alguns minutos)..."
ssh $SERVER "cd $SERVER_DIR && npm run build"

# 7. Verificar se build foi criado
echo ""
echo "7️⃣ Verificando se build foi criado..."
ssh $SERVER "cd $SERVER_DIR && ls -la .next | head -5"

# 8. Reiniciar PM2
echo ""
echo "8️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho"

# 9. Verificar logs
echo ""
echo "9️⃣ Verificando logs..."
ssh $SERVER "cd $SERVER_DIR && pm2 logs lotbicho --lines 20 --nostream"

echo ""
echo "✅ Processo concluído!"
