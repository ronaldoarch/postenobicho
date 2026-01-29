#!/bin/bash
# Script para corrigir usuário admin - torna qualquer usuário admin ou cria admin@postenobicho.com
# Execute: ./scripts/corrigir-usuario-admin.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🔧 Corrigindo Usuário Admin ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

# Enviar script de correção
echo "1️⃣ Enviando script de correção..."
rsync -avz $LOCAL_DIR/scripts/corrigir-admin.ts $SERVER:$SERVER_DIR/scripts/

# Executar script
echo ""
echo "2️⃣ Executando correção..."
ssh $SERVER "cd $SERVER_DIR && npx tsx scripts/corrigir-admin.ts"

echo ""
echo "=== ✅ Correção concluída! ==="
echo ""
echo "📋 Próximos passos:"
echo "   1. Faça logout do admin"
echo "   2. Faça login novamente com admin@postenobicho.com / admin123"
echo "   3. Ou continue usando izamanuela54@outlook.com (agora é admin)"
echo ""
