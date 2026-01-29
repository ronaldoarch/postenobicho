#!/bin/bash
# Script para verificar o IP público do servidor
# Execute: ./scripts/verificar-ip-servidor.sh

set -e

SERVER="root@104.218.52.159"

echo "=== 🔍 Verificando IP do Servidor ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

echo "1️⃣ Verificando IP público do servidor..."
echo ""
echo "Método 1 (ifconfig.me):"
ssh $SERVER "curl -s ifconfig.me"
echo ""
echo ""

echo "Método 2 (ipinfo.io):"
ssh $SERVER "curl -s ipinfo.io/ip"
echo ""
echo ""

echo "Método 3 (icanhazip.com):"
ssh $SERVER "curl -s icanhazip.com"
echo ""
echo ""

echo "2️⃣ Verificando IPs de saída (outbound):"
ssh $SERVER "curl -s https://api.ipify.org"
echo ""
echo ""

echo "3️⃣ Verificando configuração de rede:"
ssh $SERVER "hostname -I | awk '{print \$1}'"
echo ""
echo ""

echo "=== ✅ Verificação Concluída! ==="
echo ""
echo "📋 Use o IP que aparece consistentemente em todos os métodos acima."
echo "⚠️  IMPORTANTE: O IP usado pelo Nxgate é o IP de SAÍDA (outbound) da requisição HTTP,"
echo "   não necessariamente o IP local do servidor."
echo ""
echo "💡 Se o servidor estiver atrás de um proxy/load balancer, o IP pode ser diferente."
