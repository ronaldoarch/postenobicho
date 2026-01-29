# ✅ Solução: IP para Saques no Nxgate

## 🔍 Problema Identificado

Pelos logs do servidor, identificamos que:

### Payload ✅ CORRETO
```json
{
  "api_key": "b6ff5cd34c...",
  "valor": 30,
  "chave_pix": "219***",
  "tipo_chave": "PHONE",
  "webhook": "https://postenobicho.com/api/webhooks/nxgate"
}
```

### IP ❌ DIFERENTE DO AUTORIZADO

**IP que o servidor está usando para fazer requisições HTTP:**
- `177.192.9.91` ← **Este é o IP que o Nxgate está vendo**

**IPs que você autorizou:**
- `104.218.52.159` ← IP local do servidor (não é o usado nas requisições)
- `2604:a00:50:210:216:3eff:fe31:917a` ← IPv6

## 🎯 Solução

### 1. Autorizar o IP Real Usado

No painel do Nxgate, na seção **"IP Seguro para Saques"** ou **"Cash-out"**, adicione:

```
177.192.9.91
```

### 2. Por que isso acontece?

O servidor tem múltiplos IPs:
- **IP Local**: `104.218.52.159` (usado para SSH, acesso direto)
- **IP de Saída HTTP**: `177.192.9.91` (usado para requisições HTTP de saída)
- **IPv6**: `2604:a00:50:210:216:3eff:fe31:917a`

O Nxgate verifica o **IP de origem da requisição HTTP**, que é `177.192.9.91`, não o IP local do servidor.

### 3. Verificação nos Logs

Quando você tentar fazer um saque, os logs mostrarão:

```
Server IP (local): 177.192.9.91
⚠️  IMPORTANTE: O IP usado na requisição pode ser diferente do IP local!
⚠️  O Nxgate verifica o IP de origem da requisição HTTP, não o IP do servidor.
```

## ✅ Checklist

- [ ] Autorizar `177.192.9.91` no painel do Nxgate (seção de Saques)
- [ ] Manter `104.218.52.159` autorizado (para depósitos, se necessário)
- [ ] Aguardar alguns minutos após autorizar (cache)
- [ ] Tentar fazer um saque novamente

## 📝 Nota Importante

**Depósitos funcionam** porque o IP `177.192.9.91` provavelmente já está autorizado para depósitos (cash-in), mas **não está autorizado para saques** (cash-out).

O Nxgate tem whitelist separada para:
- ✅ Depósitos (cash-in) - já autorizado
- ❌ Saques (cash-out) - precisa autorizar `177.192.9.91`

## 🎉 Após Autorizar

Após autorizar o IP `177.192.9.91` para saques no painel do Nxgate, os saques devem funcionar normalmente.
