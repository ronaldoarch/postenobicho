#!/bin/bash
# Script para testar qual IP o Nxgate está vendo nas requisições
# Execute: ./scripts/test-nxgate-ip.sh

set -e

SERVER="root@104.218.52.159"
SERVER_DIR="/var/www/postenobicho"

echo "=== 🔍 Testando IP Usado pelo Nxgate ==="
echo ""
echo "📝 Você precisará digitar a senha SSH: bicho@321"
echo ""

echo "1️⃣ Verificando IPs do servidor..."
echo ""
echo "IP Público (ifconfig.me):"
ssh $SERVER "curl -s ifconfig.me"
echo ""
echo ""

echo "IP Público (ipinfo.io):"
ssh $SERVER "curl -s ipinfo.io/ip"
echo ""
echo ""

echo "2️⃣ Testando requisição para Nxgate (simular saque)..."
echo ""
echo "⚠️  Isso vai fazer uma requisição real para o Nxgate!"
echo "⚠️  Use uma API key de teste se possível."
echo ""
read -p "Continuar? (s/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
  echo "Cancelado."
  exit 0
fi

echo ""
echo "3️⃣ Executando teste no servidor..."
ssh $SERVER << 'ENDSSH'
cd /var/www/postenobicho

# Criar script temporário para testar (usar apenas .env para simplificar)
cat > /tmp/test-nxgate-ip.js << 'EOF'
const https = require('https');
const fs = require('fs');

function testNxgate() {
  try {
    let apiKey = '';
    let source = '';

    // Ler API key do .env
    try {
      const envContent = fs.readFileSync('.env', 'utf8');
      const apiKeyMatch = envContent.match(/NXGATE_API_KEY\s*=\s*(.+)/);
      if (apiKeyMatch) {
        apiKey = apiKeyMatch[1].trim().replace(/^["']|["']$/g, '');
        source = '.env';
      }
    } catch (envError) {
      console.error('❌ Erro ao ler .env:', envError.message);
    }

    if (!apiKey) {
      console.error('❌ API Key não encontrada no .env');
      console.error('💡 Verifique se NXGATE_API_KEY está configurada no .env');
      console.error('💡 Ou configure o gateway no painel admin (/admin/gateways)');
      process.exit(1);
    }

    console.log('🔑 API Key:', apiKey.substring(0, 10) + '...');
    console.log('📋 Fonte:', source);
    console.log('');
    console.log('⚠️  NOTA: Se você configurou o gateway no painel admin,');
    console.log('   a API key do gateway será usada em vez da do .env.');
    console.log('   Verifique /admin/gateways para ver qual API key está configurada.');
    console.log('');

    // Fazer requisição de teste (valor mínimo)
    const payload = JSON.stringify({
      api_key: apiKey,
      valor: 10.00,
      chave_pix: '00000000000',
      tipo_chave: 'CPF',
      webhook: 'https://postenobicho.com/api/webhooks/nxgate'
    });

    const options = {
      hostname: 'nxgate.com.br',
      port: 443,
      path: '/api/pix/sacar',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
        'Content-Length': payload.length
      }
    };

    console.log('📤 Enviando requisição para:', options.hostname + options.path);
    console.log('');

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        console.log('📥 Status Code:', res.statusCode);
        console.log('📥 Headers:', JSON.stringify(res.headers, null, 2));
        console.log('');

        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          console.log('📥 Response Body:');
          console.log(data);
          console.log('');

          try {
            const responseData = JSON.parse(data);
            
            if (res.statusCode === 403) {
              const errorMsg = responseData.error || responseData.message || '';
              
              if (errorMsg.includes('API Key') || errorMsg.includes('api_key') || errorMsg.includes('chave')) {
                console.log('❌ Erro 403: API Key inválida ou desativada');
                console.log('');
                console.log('💡 SOLUÇÃO:');
                console.log('   1. Verifique se a API key está correta no painel admin (/admin/gateways)');
                console.log('   2. Verifique se a API key está ativa no painel do Nxgate');
                console.log('   3. Verifique se a API key tem permissão para saques');
                console.log('   4. Compare a API key do gateway com a do painel do Nxgate');
                console.log('');
                console.log('📋 API Key usada:', apiKey.substring(0, 15) + '...');
                console.log('📋 Fonte:', source);
              } else if (errorMsg.includes('IP') || errorMsg.includes('ip') || errorMsg.includes('autorizado')) {
                console.log('❌ Erro 403: IP não autorizado');
                console.log('');
                console.log('💡 SOLUÇÃO:');
                console.log('   O IP que o Nxgate está vendo pode ser diferente do IP autorizado.');
                console.log('   Servidor tem IPv6:', '2604:a00:50:210:216:3eff:fe31:917a');
                console.log('   Servidor tem IPv4:', '104.218.52.159');
                console.log('   Autorize ambos os IPs no painel do Nxgate se necessário.');
              } else {
                console.log('❌ Erro 403:', errorMsg || 'Desconhecido');
                console.log('');
                console.log('💡 Verifique os logs acima para mais detalhes.');
              }
            } else if (res.statusCode === 200) {
              console.log('✅ Requisição bem-sucedida!');
              console.log('');
              console.log('📋 Resposta:', JSON.stringify(responseData, null, 2));
            } else {
              console.log('⚠️  Status inesperado:', res.statusCode);
              console.log('📋 Resposta:', data);
            }
          } catch (e) {
            console.log('⚠️  Não foi possível fazer parse da resposta JSON');
            console.log('📋 Resposta raw:', data);
          }
          
          resolve();
        });
      });

      req.on('error', (error) => {
        console.error('❌ Erro na requisição:', error);
        reject(error);
      });

      req.write(payload);
      req.end();
    });
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

testNxgate().catch((error) => {
  console.error('❌ Erro:', error);
  process.exit(1);
});
EOF

# Executar com node
node /tmp/test-nxgate-ip.js
rm -f /tmp/test-nxgate-ip.js
ENDSSH

echo ""
echo "=== ✅ Teste Concluído! ==="
echo ""
echo "📋 Se recebeu erro 403, compare o IP autorizado no painel com os IPs mostrados acima."
echo "💡 O IP usado pelo Nxgate é o IP de SAÍDA (outbound) da requisição HTTP."
echo ""
echo "💡 IMPORTANTE:"
echo "   - Se você configurou o gateway no painel admin, a API key do gateway será usada"
echo "   - Verifique /admin/gateways para ver qual API key está configurada"
echo "   - Compare essa API key com a do painel do Nxgate"
