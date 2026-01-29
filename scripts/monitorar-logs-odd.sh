#!/bin/bash
# Script para monitorar logs de busca de odd

SERVER_USER="root"
SERVER_IP="104.218.52.159"
SSH_KEY_PATH="$HOME/.ssh/id_rsa_postenobicho"

echo "🔍 Monitorando logs de busca de odd..."
echo "Pressione Ctrl+C para parar"
echo ""

while true; do
  # Buscar logs recentes relacionados a odd
  LOGS=$(ssh -i "$SSH_KEY_PATH" "$SERVER_USER@$SERVER_IP" "pm2 logs lotbicho --lines 50 --nostream 2>&1 | grep -E '(🔍 buscarOdd|✅ Usando cotação|⚠️ Usando odd hardcoded|api/odd|Erro ao buscar odd)' | tail -10")
  
  if [ ! -z "$LOGS" ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "$(date '+%H:%M:%S') - Novos logs encontrados:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "$LOGS"
    echo ""
  fi
  
  sleep 5
done
