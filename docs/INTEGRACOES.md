# 🔗 Integrações - Meta Pixel e Webhook

## 📋 Visão Geral

A página de **Integrações** (`/admin/integracoes`) centraliza todas as configurações de rastreamento e integração externa do sistema.

## 🎯 Funcionalidades

### 1. Meta Pixel (Facebook)

Rastreamento avançado usando Facebook Pixel + Conversions API.

**Configuração:**
- **Meta Pixel ID**: ID do seu pixel do Facebook
- **Conversions API Access Token**: Token para envio server-side

**Eventos Rastreados:**
- ✅ Cadastro de usuário
- ✅ Apostas realizadas
- ✅ Depósitos confirmados
- ✅ Saques solicitados
- ✅ Visualizações de páginas

### 2. Webhook Tracking

Envio de eventos para webhook externo para rastreamento e integração.

**Configuração:**
- **URL do Webhook**: Endpoint que receberá os eventos
- **Secret (Opcional)**: Secret para assinatura HMAC-SHA256
- **Eventos**: Seleção de quais eventos enviar

**Eventos Disponíveis:**
- ✅ `cadastro` - Cadastro de usuário
- ✅ `deposito` - Primeiro depósito
- ✅ `redeposito` - Segundo depósito ou mais
- ✅ `aposta` - Aposta criada
- ✅ `aposta_ganha` - Aposta ganha/liquidada
- ✅ `saque` - Saque solicitado
- ✅ `saque_aprovado` - Saque aprovado/pago
- ✅ `login` - Login do usuário
- ✅ `visualizacao_pagina` - Visualização de página importante

## 📡 Formato do Webhook

### Estrutura do Payload

```json
{
  "event": "cadastro|deposito|aposta|...",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    // Dados específicos do evento
  },
  "signature": "hash_hmac_sha256" // Se secret configurado
}
```

### Headers Enviados

```
Content-Type: application/json
User-Agent: PosteNoBicho-Webhook/1.0
X-Webhook-Signature: hash_hmac_sha256 (se secret configurado)
```

### Exemplos de Eventos

#### Cadastro
```json
{
  "event": "cadastro",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "userId": 123,
    "nome": "João Silva",
    "email": "joao@example.com",
    "telefone": "11999999999",
    "dataCadastro": "2024-01-01T12:00:00Z"
  }
}
```

#### Depósito
```json
{
  "event": "deposito",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "userId": 123,
    "email": "joao@example.com",
    "valor": 100.00,
    "transactionId": "tx_123456",
    "depositosAnteriores": 0,
    "saldoAtual": 100.00,
    "isRedeposito": false
  }
}
```

#### Redepósito
```json
{
  "event": "redeposito",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "userId": 123,
    "email": "joao@example.com",
    "valor": 50.00,
    "transactionId": "tx_789012",
    "depositosAnteriores": 1,
    "saldoAtual": 150.00,
    "isRedeposito": true
  }
}
```

#### Aposta
```json
{
  "event": "aposta",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "userId": 123,
    "email": "joao@example.com",
    "apostaId": 456,
    "valor": 10.00,
    "modalidade": "Grupo",
    "status": "pendente"
  }
}
```

#### Aposta Ganha
```json
{
  "event": "aposta_ganha",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "userId": 123,
    "email": "joao@example.com",
    "apostaId": 456,
    "premio": 180.00,
    "saldoAtual": 280.00
  }
}
```

#### Saque
```json
{
  "event": "saque",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "userId": 123,
    "email": "joao@example.com",
    "saqueId": 789,
    "valor": 50.00,
    "status": "pendente"
  }
}
```

#### Saque Aprovado
```json
{
  "event": "saque_aprovado",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "userId": 123,
    "email": "joao@example.com",
    "saqueId": 789,
    "valor": 50.00,
    "status": "aprovado"
  }
}
```

#### Login
```json
{
  "event": "login",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "userId": 123,
    "email": "joao@example.com"
  }
}
```

## 🔒 Segurança

### Assinatura do Webhook (HMAC-SHA256)

Se um `webhookSecret` for configurado, todas as requisições serão assinadas:

1. O payload JSON é serializado
2. Um hash HMAC-SHA256 é calculado usando o secret
3. O hash é enviado no header `X-Webhook-Signature` e no campo `signature` do payload

**Validação no seu servidor:**
```javascript
const crypto = require('crypto')
const secret = 'seu-secret-aqui'
const payload = JSON.stringify(req.body)
const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex')

if (signature !== req.headers['x-webhook-signature']) {
  return res.status(401).json({ error: 'Assinatura inválida' })
}
```

## 🧪 Testando

### Testar Webhook

Na página de integrações, há um botão **"🧪 Testar Webhook"** que envia um evento de teste para verificar se o endpoint está funcionando.

### Logs

Os erros de webhook são logados no console do servidor. Verifique os logs do PM2:
```bash
pm2 logs --lines 50
```

## 📊 Onde os Eventos são Enviados

### Cadastro
- `app/api/auth/register/route.ts`

### Depósito/Redepósito
- `app/api/webhooks/receba/route.ts` (webhook Receba)
- `app/api/webhooks/nxgate/route.ts` (webhook Nxgate)

### Aposta
- `app/api/apostas/route.ts`

### Aposta Ganha
- `app/api/apostas/route.ts` (aposta instantânea)
- `app/api/resultados/liquidar/route.ts` (liquidação automática)

### Saque
- `app/api/saque/pix-nxgate/route.ts` (solicitação)
- `app/api/webhooks/nxgate/route.ts` (aprovação)

### Login
- `app/api/auth/login/route.ts`

## ⚙️ Configuração no Banco de Dados

Os campos são armazenados na tabela `Configuracao`:

- `metaPixelId` - ID do Meta Pixel
- `metaAccessToken` - Token da Conversions API
- `metaPixelEnabled` - Ativar/desativar Meta Pixel
- `webhookUrl` - URL do webhook
- `webhookEnabled` - Ativar/desativar webhook
- `webhookEvents` - JSON array com eventos habilitados
- `webhookSecret` - Secret para assinatura

## 🚀 Próximos Passos

1. Configure o Meta Pixel ID e Access Token
2. Configure a URL do webhook
3. Selecione os eventos que deseja rastrear
4. (Opcional) Configure o secret para assinatura
5. Teste o webhook usando o botão de teste
6. Monitore os logs para verificar se os eventos estão sendo enviados
