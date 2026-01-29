#!/bin/bash
# Script para testar funcionalidades localmente

set -e

echo "=== 🧪 Testando funcionalidades localmente ==="
echo ""

# Verificar se o servidor está rodando
echo "1️⃣ Verificando se o servidor está rodando..."
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo "   ❌ Servidor não está rodando!"
  echo "   Inicie o servidor com: npm run dev"
  exit 1
fi

echo "   ✅ Servidor está rodando"

# Testar rotas principais
echo ""
echo "2️⃣ Testando rotas principais..."
ROUTES=(
  "/"
  "/admin/login"
  "/jogo-do-bicho"
  "/cotacao"
  "/minhas-apostas"
)

for route in "${ROUTES[@]}"; do
  STATUS=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:3000$route" 2>/dev/null || echo "000")
  if [ "$STATUS" = "200" ] || [ "$STATUS" = "301" ] || [ "$STATUS" = "302" ]; then
    echo "   ✅ $route (status: $STATUS)"
  else
    echo "   ❌ $route (status: $STATUS)"
  fi
done

# Testar API de configurações
echo ""
echo "3️⃣ Testando APIs..."
APIS=(
  "/api/configuracoes"
  "/api/tema"
  "/api/modalidades"
)

for api in "${APIS[@]}"; do
  STATUS=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:3000$api" 2>/dev/null || echo "000")
  if [ "$STATUS" = "200" ] || [ "$STATUS" = "401" ]; then
    echo "   ✅ $api (status: $STATUS)"
  else
    echo "   ❌ $api (status: $STATUS)"
  fi
done

# Testar upload (deve retornar 400 sem arquivo, mas a rota deve existir)
echo ""
echo "4️⃣ Testando rota de upload..."
UPLOAD_STATUS=$(curl -s -o /dev/null -w '%{http_code}' -X POST "http://localhost:3000/api/upload" 2>/dev/null || echo "000")
if [ "$UPLOAD_STATUS" = "400" ] || [ "$UPLOAD_STATUS" = "200" ]; then
  echo "   ✅ /api/upload está respondendo (status: $UPLOAD_STATUS - esperado sem arquivo)"
else
  echo "   ⚠️  /api/upload retornou status: $UPLOAD_STATUS"
fi

echo ""
echo "✅ Testes concluídos!"
echo ""
echo "📝 Para testar manualmente:"
echo "   1. Acesse http://localhost:3000"
echo "   2. Teste o login admin: http://localhost:3000/admin/login"
echo "   3. Teste upload de banner no admin"
echo "   4. Verifique se as imagens aparecem corretamente"
