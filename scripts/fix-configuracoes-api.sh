#!/bin/bash
# Script para corrigir erro 500 na API de configurações
# Execute: ./scripts/fix-configuracoes-api.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🔧 Corrigindo API de Configurações ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

# 1. Verificar usuário admin primeiro
echo "1️⃣ Verificando usuário admin..."
bash $LOCAL_DIR/scripts/verificar-admin.sh

# 2. Enviar arquivos corrigidos
echo ""
echo "2️⃣ Enviando arquivos corrigidos..."
rsync -avz $LOCAL_DIR/app/api/admin/configuracoes/route.ts $SERVER:$SERVER_DIR/app/api/admin/configuracoes/
rsync -avz $LOCAL_DIR/lib/configuracoes-store.ts $SERVER:$SERVER_DIR/lib/

# 3. Fazer build
echo ""
echo "3️⃣ Fazendo build..."
ssh $SERVER << 'ENDSSH'
cd /var/www/postenobicho
npm run build
ENDSSH

# 4. Reiniciar PM2
echo ""
echo "4️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho"

echo ""
echo "=== ✅ Correções aplicadas! ==="
echo ""
echo "📋 O que foi corrigido:"
echo "  ✅ Adicionada autenticação e verificação de admin"
echo "  ✅ Melhorado tratamento de erros com mensagens detalhadas"
echo "  ✅ Corrigido tratamento de webhookEvents (string/array)"
echo ""
