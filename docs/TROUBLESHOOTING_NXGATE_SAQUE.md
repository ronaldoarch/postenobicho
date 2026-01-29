# 🔧 Troubleshooting: Erro 403 ao Fazer Saque no Nxgate

## ✅ SITUAÇÃO: Depósitos Funcionam, Saques Não

**Se você consegue depositar mas não consegue sacar**, isso indica que:

✅ IP está autorizado para depósitos (cash-in)  
✅ API key funciona para depósitos  
❌ Mas há algo diferente para saques (cash-out)

## 🔍 IP REAL IDENTIFICADO NOS LOGS

**Pelos logs do servidor, identificamos que o IP usado nas requisições HTTP é:**
- `177.192.9.91` ← **Este é o IP que o Nxgate está vendo**

**Este IP é diferente do IP local do servidor:**
- IP Local: `104.218.52.159` (usado para SSH)
- IP de Saída HTTP: `177.192.9.91` (usado para requisições HTTP)

**SOLUÇÃO:** Autorize o IP `177.192.9.91` no painel do Nxgate na seção de **Saques** (cash-out).

## 📊 Análise do Problema

Baseado nos testes realizados, identificamos dois problemas possíveis:

### 1. ⚠️ Erro: "API Key inválida ou desativada"

**Sintoma:**
- Erro 403 com mensagem `{"error":"API Key inválida ou desativada"}`

**Causas Possíveis:**
1. API key incorreta no banco de dados (gateway)
2. API key diferente entre gateway e painel do Nxgate
3. API key desativada no painel do Nxgate
4. API key sem permissão para saques

**Solução:**
1. Acesse `/admin/gateways` no painel admin
2. Verifique a API key configurada para o gateway Nxgate
3. Compare com a API key no painel do Nxgate
4. Verifique se a API key está ativa
5. Verifique se a API key tem permissão para saques

---

### 2. ⚠️ Erro: "IP não autorizado"

**Sintoma:**
- Erro 403 com mensagem `{"error":"IP não autorizado"}`

**Causas Possíveis:**
1. IP IPv6 não autorizado (servidor tem IPv6: `2604:a00:50:210:216:3eff:fe31:917a`)
2. IP IPv4 diferente do autorizado
3. IP de saída diferente do IP local

**Solução:**
1. Autorize o IPv6 no painel do Nxgate: `2604:a00:50:210:216:3eff:fe31:917a`
2. Autorize o IPv4 no painel do Nxgate: `104.218.52.159`
3. Verifique se ambos os IPs estão na seção "IP Seguro para Saques"

---

## 🔍 Como Diagnosticar

### Passo 1: Verificar API Key

Execute no servidor:
```bash
ssh root@104.218.52.159 'cd /var/www/postenobicho && node -e "
const { PrismaClient } = require(\"@prisma/client\");
const prisma = new PrismaClient();
prisma.gateway.findFirst({ where: { tipo: \"nxgate\", active: true } })
  .then(g => {
    console.log(\"Gateway ID:\", g?.id);
    console.log(\"API Key:\", g?.apiKey ? g.apiKey.substring(0, 15) + \"...\" : \"NÃO ENCONTRADA\");
    prisma.\$disconnect();
  });
"'
```

### Passo 2: Testar Requisição

Execute:
```bash
./scripts/test-nxgate-ip.sh
```

Este script vai:
- Mostrar qual API key está sendo usada (gateway ou .env)
- Fazer uma requisição de teste para o Nxgate
- Mostrar o erro exato retornado
- Sugerir soluções baseadas no erro

---

## ✅ Checklist de Verificação (DEPÓSITOS FUNCIONAM)

Como depósitos já funcionam, você precisa verificar especificamente para **SAQUES**:

- [ ] **IP autorizado para SAQUES** (não apenas depósitos)
  - [ ] IPv4 `104.218.52.159` está na seção **"IP Seguro para Saques"**
  - [ ] IPv6 `2604:a00:50:210:216:3eff:fe31:917a` está autorizado para saques (se necessário)
  - [ ] Verifique se há uma seção separada de "Saques" ou "Cash-out" no painel

- [ ] **API key tem permissão para SAQUES**
  - [ ] API key está correta no painel admin (`/admin/gateways`)
  - [ ] API key está ativa no painel do Nxgate
  - [ ] API key tem permissão para **saques** (não apenas depósitos)
  - [ ] Verifique se há uma opção para ativar "Permitir saques" ou "Cash-out" na configuração da API key

- [ ] **Configurações Gerais**
  - [ ] Gateway está marcado como "Ativo" no painel admin
  - [ ] Aguardou alguns minutos após autorizar IP (cache)
  - [ ] Tentou fazer saque novamente após autorizar IP

---

## 🆘 Se Nada Funcionar

1. Entre em contato com o suporte do Nxgate
2. Informe claramente:
   - ✅ **"Depósitos funcionam normalmente"**
   - ❌ **"Saques retornam erro 403"**
   - API key que está usando (primeiros 10 caracteres)
   - IPs autorizados para depósitos (IPv4 e IPv6)
   - Erro exato recebido ao tentar sacar

3. Peça especificamente para verificar:
   - Se há whitelist separada para saques (cash-out)
   - Se o IP precisa ser autorizado separadamente para saques
   - Se a API key tem permissão para saques (cash-out)
   - Qual IP está sendo usado nas requisições de saque
   - Se há alguma configuração adicional necessária para saques

4. **Mencione que depósitos funcionam** - isso ajuda o suporte a identificar que o problema é específico de saques

---

## 📝 Notas Importantes

- ✅ **Depósitos funcionam**: Confirma que IP e API key estão corretos para depósitos
- ❌ **Saques não funcionam**: Indica problema específico de configuração de saques
- 🔑 **Whitelist Separada**: Nxgate tem whitelist separada para depósitos e saques
- 🔐 **Permissões da API Key**: API key pode ter permissão para depósitos mas não para saques
- 🌐 **Dois IPs**: Servidor tem IPv4 e IPv6 - autorize ambos para saques se necessário
- 📋 **API Key**: Sistema usa primeiro a do gateway (banco), depois .env

## 🎯 Solução Rápida

1. **No painel do Nxgate**, procure por:
   - "IP Seguro para Saques"
   - "Cash-out IP Whitelist"
   - "Withdrawals IP"
   - Seção separada de "Saques" em "Configurações" → "IPs Autorizados"

2. **Adicione o IP `104.218.52.159`** na seção de **SAQUES** (não apenas depósitos)

3. **Verifique permissões da API key**:
   - Procure por opções como "Permitir saques", "Cash-out enabled", "Withdrawals"
   - Ative a permissão de saques se estiver desativada

4. **Aguarde alguns minutos** e tente novamente
