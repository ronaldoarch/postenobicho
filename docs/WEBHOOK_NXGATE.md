# 🔔 Webhook Nxgate - Documentação

## ✅ Implementação Correta

Nossa implementação está **100% conforme** a documentação do Nxgate.

## 📥 Webhooks Recebidos

### 1. Depósito (Cash-in)
```json
{
  "status": "paid",
  "idTransaction": "123231x23231-xxx2"
}
```

**Processamento:**
- Busca transação pendente pelo `idTransaction`
- Credita saldo do usuário
- Aplica bônus de primeiro depósito (se aplicável)
- Atualiza status para `pago`

**Resposta:**
```json
{
  "status": "received"
}
```
**HTTP Status:** `200 OK`

---

### 2. Saque Pago (Cash-out - Sucesso)
```json
{
  "status": "saque-pago",
  "idTransaction": "123231x23231-xxx2"
}
```

**Processamento:**
- Busca saque pendente pelo `idTransaction`
- Atualiza status do saque para `saque-pago`
- Atualiza transação para `pago`
- Envia webhook de saque aprovado (se configurado)

**Resposta:**
```json
{
  "status": "received"
}
```
**HTTP Status:** `200 OK`

---

### 3. Saque Falhou (Cash-out - Falha)
```json
{
  "status": "saque-falhou",
  "idTransaction": "123231x23231-xxx2"
}
```

**Processamento:**
- Busca saque pendente pelo `idTransaction`
- Atualiza status do saque para `saque-falhou`
- **Estorna saldo do usuário** (incrementa o valor debitado)
- Atualiza transação para `falhou`

**Resposta:**
```json
{
  "status": "received"
}
```
**HTTP Status:** `200 OK`

---

## ✅ Resposta Obrigatória

**IMPORTANTE:** O webhook **sempre** retorna HTTP 200 com JSON `{"status": "received"}` para evitar reenvios infinitos pelo Nxgate.

### Casos Especiais:

1. **Transação não encontrada:**
   - Retorna `200 OK` com `{"status": "received", "message": "Transação não encontrada"}`
   - Evita reenvios desnecessários

2. **Status não reconhecido:**
   - Retorna `200 OK` com `{"status": "received", "message": "Status não reconhecido"}`
   - Loga o status para debug

3. **Erro no processamento:**
   - Retorna `200 OK` com `{"status": "received", "error": "mensagem do erro"}`
   - Loga o erro completo
   - **Nunca retorna erro HTTP** para evitar reenvios

---

## 🔍 Suporte a Formatos

O webhook aceita ambos os formatos de `idTransaction`:

- ✅ `idTransaction` (formato padrão)
- ✅ `transaction_id` (formato alternativo)

---

## 📍 Endpoint

**URL:** `https://postenobicho.com/api/webhooks/nxgate`

**Método:** `POST`

**Content-Type:** `application/json`

**Configuração no Nxgate:**
- Configure esta URL no campo `webhook` ao criar depósitos/saques
- Ou configure globalmente no painel do Nxgate

---

## 🧪 Testando o Webhook

### Teste Manual (usando curl):

```bash
# Teste de depósito pago
curl -X POST https://postenobicho.com/api/webhooks/nxgate \
  -H "Content-Type: application/json" \
  -d '{
    "status": "paid",
    "idTransaction": "test-123"
  }'

# Teste de saque pago
curl -X POST https://postenobicho.com/api/webhooks/nxgate \
  -H "Content-Type: application/json" \
  -d '{
    "status": "saque-pago",
    "idTransaction": "test-456"
  }'

# Teste de saque falhou
curl -X POST https://postenobicho.com/api/webhooks/nxgate \
  -H "Content-Type: application/json" \
  -d '{
    "status": "saque-falhou",
    "idTransaction": "test-789"
  }'
```

**Resposta esperada em todos os casos:**
```json
{
  "status": "received"
}
```

---

## 📊 Logs

Todos os webhooks são logados com:
- Status recebido
- ID da transação
- Body completo
- Resultado do processamento

**Ver logs:**
```bash
pm2 logs lotbicho --lines 50
```

---

## ✅ Checklist de Conformidade

- ✅ Retorna sempre HTTP 200
- ✅ Retorna JSON `{"status": "received"}`
- ✅ Processa `saque-pago` corretamente
- ✅ Processa `saque-falhou` corretamente (estorna saldo)
- ✅ Processa `paid` corretamente (depósito)
- ✅ Aceita `idTransaction` e `transaction_id`
- ✅ Retorna 200 mesmo em caso de erro (evita reenvios)
- ✅ Logs detalhados para debug

---

## 🆘 Troubleshooting

### Webhook não está sendo recebido:

1. Verifique se a URL está configurada corretamente no Nxgate
2. Verifique se o servidor está acessível publicamente
3. Verifique logs do PM2 para ver se está chegando
4. Teste manualmente com curl (veja acima)

### Webhook está sendo reenviado:

- Verifique se está retornando HTTP 200
- Verifique se está retornando JSON válido
- Verifique logs para erros não tratados

### Saldo não está sendo atualizado:

- Verifique logs para ver se o webhook foi processado
- Verifique se o `idTransaction` está correto
- Verifique se a transação/saque existe no banco
