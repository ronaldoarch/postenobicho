#!/bin/bash
# Script completo para corrigir todos os problemas:
# 1. Páginas 404
# 2. Login admin 401
# 3. Tornar usuário admin

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🔧 Corrigindo todos os problemas ==="
echo ""

# 1. Parar PM2
echo "1️⃣ Parando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 stop all || true"

# 2. Enviar schema atualizado (com campo admin)
echo ""
echo "2️⃣ Enviando schema atualizado..."
scp "$LOCAL_DIR/prisma/schema.prisma" $SERVER:$SERVER_DIR/prisma/schema.prisma

# 3. Enviar scripts necessários
echo ""
echo "3️⃣ Enviando scripts..."
scp "$LOCAL_DIR/scripts/make-user-admin.ts" $SERVER:$SERVER_DIR/scripts/make-user-admin.ts
scp "$LOCAL_DIR/scripts/reset-admin-password.ts" $SERVER:$SERVER_DIR/scripts/reset-admin-password.ts

# 4. Sincronizar páginas que estão dando 404
echo ""
echo "4️⃣ Sincronizando páginas..."
rsync -avz --progress \
  "$LOCAL_DIR/app/jogo-do-bicho/" \
  $SERVER:$SERVER_DIR/app/jogo-do-bicho/

rsync -avz --progress \
  "$LOCAL_DIR/app/minhas-apostas/" \
  $SERVER:$SERVER_DIR/app/minhas-apostas/

# 5. Atualizar schema no banco
echo ""
echo "5️⃣ Atualizando schema no banco..."
ssh $SERVER "cd $SERVER_DIR && npx prisma db push --accept-data-loss"

# 6. Regenerar Prisma Client
echo ""
echo "6️⃣ Regenerando Prisma Client..."
ssh $SERVER "cd $SERVER_DIR && npx prisma generate"

# 7. Resetar senha do admin
echo ""
echo "7️⃣ Resetando senha do admin..."
echo "   Digite a nova senha (ou pressione Enter para usar 'admin123'):"
read -s NEW_PASSWORD
NEW_PASSWORD=${NEW_PASSWORD:-admin123}
ssh $SERVER "cd $SERVER_DIR && AUTH_SECRET=\$(grep AUTH_SECRET .env | cut -d '=' -f2) && AUTH_SECRET=\${AUTH_SECRET:-dev-secret} npx tsx scripts/reset-admin-password.ts '$NEW_PASSWORD'"

# 8. Tornar usuário admin
echo ""
echo "8️⃣ Tornando usuário admin..."
ssh $SERVER "cd $SERVER_DIR && npx tsx scripts/make-user-admin.ts"

# 9. Limpar build antigo
echo ""
echo "9️⃣ Limpando build antigo..."
ssh $SERVER "cd $SERVER_DIR && rm -rf .next"

# 10. Rebuild
echo ""
echo "🔟 Fazendo rebuild..."
ssh $SERVER "cd $SERVER_DIR && npm run build"

# 11. Reiniciar PM2
echo ""
echo "1️⃣1️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart all || pm2 start ecosystem.config.js"

# 12. Verificar status
echo ""
echo "1️⃣2️⃣ Verificando status..."
ssh $SERVER "pm2 status"

echo ""
echo "✅ Processo concluído!"
echo ""
echo "📝 Teste:"
echo "   - Login admin: /admin/login (email: admin@postenobicho.com)"
echo "   - Páginas: /jogo-do-bicho, /jogo-do-bicho/resultados, /jogo-do-bicho/cotacao, /minhas-apostas"
