#!/bin/bash
# Script para fazer rebuild completo garantindo todas as rotas
# Execute este script do seu Mac

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🔄 Rebuild completo com todas as rotas ==="
echo ""

# 1. Parar PM2
echo "1️⃣ Parando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 stop lotbicho || true"

# 2. Criar diretórios e enviar TODOS os arquivos de API que estão faltando
echo ""
echo "2️⃣ Criando diretórios e enviando arquivos de API que estão faltando..."
ssh $SERVER "cd $SERVER_DIR && mkdir -p app/api/configuracoes app/api/tema"
scp $LOCAL_DIR/app/api/configuracoes/route.ts $SERVER:$SERVER_DIR/app/api/configuracoes/
scp $LOCAL_DIR/app/api/tema/route.ts $SERVER:$SERVER_DIR/app/api/tema/

# 3. Verificar se arquivos foram enviados
echo ""
echo "3️⃣ Verificando se arquivos foram enviados..."
ssh $SERVER "cd $SERVER_DIR && ls -la app/api/configuracoes/route.ts app/api/tema/route.ts"

# 4. Limpar build completamente
echo ""
echo "4️⃣ Limpando build completamente..."
ssh $SERVER "cd $SERVER_DIR && rm -rf .next"

# 5. Limpar cache do Next.js
echo ""
echo "5️⃣ Limpando cache do Next.js..."
ssh $SERVER "cd $SERVER_DIR && rm -rf .next/cache 2>/dev/null || true"

# 6. Fazer build completo
echo ""
echo "6️⃣ Fazendo build completo (isso pode demorar vários minutos)..."
ssh $SERVER "cd $SERVER_DIR && npm run build 2>&1 | tail -50"

# 7. Verificar se rotas foram incluídas
echo ""
echo "7️⃣ Verificando se rotas foram incluídas no build..."
ssh $SERVER "cd $SERVER_DIR && find .next/server/app/api -name 'route.js' -type f | grep -E '(configuracoes|tema)' || echo '⚠️  Rotas não encontradas'"

# 8. Listar todas as rotas de API
echo ""
echo "8️⃣ Listando todas as rotas de API no build..."
ssh $SERVER "cd $SERVER_DIR && find .next/server/app/api -name 'route.js' -type f | sort | head -20"

# 9. Reiniciar PM2
echo ""
echo "9️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho"

# 10. Aguardar servidor iniciar
echo ""
echo "🔟 Aguardando servidor iniciar..."
sleep 5

# 11. Testar APIs
echo ""
echo "1️⃣1️⃣ Testando APIs..."
CONFIG_API=$(ssh $SERVER "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/configuracoes || echo '000'")
TEMA_API=$(ssh $SERVER "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/tema || echo '000'")

if [ "$CONFIG_API" = "200" ]; then
    echo "✅ /api/configuracoes está funcionando!"
else
    echo "❌ /api/configuracoes retornou código: $CONFIG_API"
fi

if [ "$TEMA_API" = "200" ]; then
    echo "✅ /api/tema está funcionando!"
else
    echo "❌ /api/tema retornou código: $TEMA_API"
fi

echo ""
echo "✅ Rebuild concluído!"
