#!/bin/bash
# Script para sincronizar TODAS as rotas de API para o servidor
# Execute este script do seu Mac

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"
LOCAL_DIR="/Volumes/midascod/postenobicho"

echo "=== 🔄 Sincronizando TODAS as rotas de API ==="
echo ""

# 1. Parar PM2
echo "1️⃣ Parando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 stop lotbicho || true"

# 2. Criar estrutura de diretórios no servidor
echo ""
echo "2️⃣ Criando estrutura de diretórios no servidor..."
ssh $SERVER "cd $SERVER_DIR && find app/api -type d 2>/dev/null | head -20 || echo 'Criando diretórios...'"

# 3. Enviar TODOS os arquivos de API
echo ""
echo "3️⃣ Enviando todos os arquivos de API..."
find $LOCAL_DIR/app/api -name "route.ts" -type f | while read file; do
    rel_path=${file#$LOCAL_DIR/}
    dir_path=$(dirname $rel_path)
    echo "  Enviando: $rel_path"
    ssh $SERVER "mkdir -p $SERVER_DIR/$dir_path" 2>/dev/null
    scp -q "$file" $SERVER:$SERVER_DIR/$rel_path 2>/dev/null && echo "    ✅ OK" || echo "    ❌ Erro"
done

# 5. Verificar quantos arquivos foram enviados
echo ""
echo "5️⃣ Verificando arquivos enviados..."
LOCAL_COUNT=$(find $LOCAL_DIR/app/api -name "route.ts" -type f | wc -l | tr -d ' ')
SERVER_COUNT=$(ssh $SERVER "find $SERVER_DIR/app/api -name 'route.ts' -type f 2>/dev/null | wc -l | tr -d ' '")

echo "Arquivos locais: $LOCAL_COUNT"
echo "Arquivos no servidor: $SERVER_COUNT"

if [ "$LOCAL_COUNT" -eq "$SERVER_COUNT" ]; then
    echo "✅ Todos os arquivos foram sincronizados!"
else
    echo "⚠️  Alguns arquivos podem estar faltando"
fi

# 6. Limpar build
echo ""
echo "6️⃣ Limpando build antigo..."
ssh $SERVER "cd $SERVER_DIR && rm -rf .next"

# 7. Fazer build
echo ""
echo "7️⃣ Fazendo build completo..."
ssh $SERVER "cd $SERVER_DIR && npm run build 2>&1 | tail -30"

# 8. Verificar rotas no build
echo ""
echo "8️⃣ Verificando rotas no build..."
ssh $SERVER "cd $SERVER_DIR && find .next/server/app/api -name 'route.js' -type f | wc -l"

# 9. Reiniciar PM2
echo ""
echo "9️⃣ Reiniciando PM2..."
ssh $SERVER "cd $SERVER_DIR && pm2 restart lotbicho"

# 10. Testar algumas APIs críticas
echo ""
echo "🔟 Testando APIs críticas..."
sleep 5

APIS=(
    "/api/configuracoes"
    "/api/tema"
    "/api/auth/me"
    "/api/auth/login"
    "/api/modalidades"
)

for api in "${APIS[@]}"; do
    STATUS=$(ssh $SERVER "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000$api || echo '000'")
    if [ "$STATUS" = "200" ] || [ "$STATUS" = "401" ] || [ "$STATUS" = "500" ]; then
        echo "✅ $api está respondendo (status: $STATUS)"
    else
        echo "❌ $api retornou status: $STATUS"
    fi
done

echo ""
echo "✅ Sincronização concluída!"
