# 🔒 Configuração de IP Whitelist no Nxgate

## ⚠️ Problema: "IP não autorizado"

Se você está recebendo o erro **"IP não autorizado"** ao tentar fazer saques ou depósitos via Nxgate, significa que o IP do seu servidor não está na lista de IPs autorizados no painel do Nxgate.

### 📌 Nota Importante - DEPÓSITOS FUNCIONAM MAS SAQUES NÃO

**Se você consegue depositar mas não consegue sacar:**

✅ **O que está funcionando:**
- IP está autorizado para depósitos (cash-in)
- API key funciona para depósitos

❌ **O que precisa ser verificado:**

1. **Whitelist Separada para Saques:**
   - O Nxgate tem whitelist separada para depósitos e saques
   - O IP precisa estar autorizado na seção **"IP Seguro para Saques"** ou **"Cash-out"**
   - Mesmo IP autorizado para depósitos precisa ser autorizado novamente para saques

2. **Permissões da API Key:**
   - A API key pode ter permissão para depósitos mas não para saques
   - Verifique se há uma opção para ativar permissão de saques na configuração da API key

3. **Seção Específica no Painel:**
   - Procure por uma seção específica de **"Saques"**, **"Cash-out"** ou **"Withdrawals"**
   - Pode estar em **"Configurações"** → **"IPs Autorizados"** → **"Saques"**

## 📋 Como Resolver

### 1. Descobrir o IP do Servidor

Execute no servidor:

```bash
curl -s ifconfig.me
# ou
curl -s ipinfo.io/ip
```

Ou verifique nos logs do PM2 quando tentar fazer um saque - o IP será logado.

### 2. Autorizar o IP no Painel Nxgate

1. Acesse o painel do Nxgate
2. Vá em **Configurações** ou **Segurança**
3. Encontre a seção **"IPs Autorizados"** ou **"Whitelist de IPs"**
4. **IMPORTANTE**: Verifique se há seções separadas:
   - **"IPs para Depósitos"** (cash-in) - já deve estar autorizado se depósitos funcionam
   - **"IPs para Saques"** (cash-out) - adicione o IP aqui também
5. Adicione o IP do seu servidor na seção de **Saques**
6. Salve as alterações

### 2.1. Verificar Permissões da API Key

Além do IP, verifique se a API key tem permissão para saques:

1. No painel do Nxgate, vá em **API Keys** ou **Chaves de API**
2. Encontre sua API key
3. Verifique se há opções como:
   - ✅ Permitir depósitos (cash-in)
   - ✅ Permitir saques (cash-out)
4. Ative a permissão para saques se necessário

### 3. Verificar se Funcionou

Após autorizar o IP, tente fazer um saque novamente. O erro deve desaparecer.

## 🔍 Verificar IP Atual nos Logs

Quando você tentar fazer um saque, os logs mostrarão:

```
=== DEBUG SAQUE PIX NXGATE ===
Server IP: [IP_DO_SERVIDOR]
```

Use esse IP para autorizar no painel do Nxgate.

## 📝 Nota Importante

- O IP pode mudar se o servidor estiver em um provedor de cloud sem IP fixo
- Considere usar um IP fixo (Elastic IP na AWS, por exemplo) para evitar problemas
- Alguns provedores podem usar múltiplos IPs - autorize todos se necessário

## 🆘 IP Já Autorizado mas Ainda Recebe Erro 403?

Se o IP já está autorizado no painel mas ainda recebe erro 403:

### Possíveis Causas:

1. **IP de Saída Diferente:**
   - O Nxgate verifica o **IP de origem da requisição HTTP** (outbound)
   - Se o servidor estiver atrás de proxy/load balancer, o IP pode ser diferente
   - O IP usado pode ser diferente do IP local do servidor
   - Execute o script `scripts/test-nxgate-ip.sh` para testar qual IP o Nxgate está vendo

2. **Cache do Nxgate:**
   - Pode haver cache de alguns minutos
   - Aguarde 5-10 minutos após adicionar o IP
   - Tente novamente após aguardar

3. **IP IPv6 vs IPv4:**
   - Verifique se está autorizando o IP correto (IPv4 ou IPv6)
   - O servidor pode estar usando IPv6 enquanto você autorizou IPv4 (ou vice-versa)
   - Verifique se há IPv6 autorizado também

4. **Múltiplos IPs:**
   - Alguns provedores usam múltiplos IPs para balanceamento
   - O IP pode mudar entre requisições
   - Autorize todos os IPs possíveis ou use um IP fixo

5. **Formato do IP:**
   - Certifique-se de que o IP está no formato correto (sem espaços, sem barras)
   - Exemplo correto: `104.218.52.159`
   - Exemplo errado: `104.218.52.159/32` ou ` 104.218.52.159 `

6. **API Key Diferente:**
   - Verifique se está usando a mesma API key que tem o IP autorizado
   - Diferentes API keys podem ter diferentes IPs autorizados

### Como Descobrir o IP Real Usado:

**Opção 1: Script de Teste**
```bash
./scripts/test-nxgate-ip.sh
```
Este script faz uma requisição real para o Nxgate e mostra qual IP está sendo usado.

**Opção 2: Verificar IPs do Servidor**
```bash
./scripts/verificar-ip-servidor.sh
```
Este script verifica todos os IPs possíveis do servidor.

**Opção 3: Verificar nos Logs**
Quando tentar fazer um saque, verifique os logs do PM2:
```bash
pm2 logs lotbicho --lines 50
```

Procure por:
```
=== DEBUG SAQUE PIX NXGATE ===
Server IP (local): [IP_AQUI]
⚠️  IMPORTANTE: O IP usado na requisição pode ser diferente do IP local!
```

### Solução: Verificar IP Real Usado pelo Nxgate

O problema pode ser que o IP autorizado (`104.218.52.159`) é diferente do IP que o Nxgate está vendo na requisição HTTP.

**Para descobrir o IP real:**
1. Execute `./scripts/test-nxgate-ip.sh` no servidor
2. Ou entre em contato com o suporte do Nxgate e peça para verificar qual IP está sendo usado nas requisições de saque
3. Compare com o IP autorizado no painel

### Solução Alternativa:

Se o problema persistir:
1. Entre em contato com o suporte do Nxgate
2. Informe o IP que está autorizado (`104.218.52.159`)
3. Informe o erro exato recebido (`403 - IP não autorizado`)
4. Peça para verificar qual IP está sendo usado nas requisições de saque
5. Peça para verificar se há algum problema na autorização ou cache
