# 🔧 Solução: IPv6 vs IPv4 no Nxgate

## 🔍 Problema Identificado

Pelos logs do servidor, identificamos que:

### IP Usado nas Requisições HTTP ❌
- **IPv6**: `2604:a00:50:210:216:3eff:fe31:917a` ← **Este é o IP que o Nxgate está vendo**
- **IPv4**: `104.218.52.159` ← Este IP está autorizado, mas não está sendo usado

### Erro
```
📥 Nxgate Response Status: 403
📥 Nxgate Response Body: {"status":"error","message":"IP não autorizado."}
```

## 🎯 Causa

O Node.js está preferindo IPv6 quando disponível, mas apenas o IPv4 está autorizado no Nxgate.

## ✅ Solução Implementada

### 1. Forçar Uso de IPv4 no Código

O código agora força o uso de IPv4 primeiro usando `dns.setDefaultResultOrder('ipv4first')` antes de fazer requisições para o Nxgate.

### 2. Configurar Variável de Ambiente (Alternativa)

Se a solução acima não funcionar, você pode configurar no `.env` do servidor:

```bash
NODE_OPTIONS=--dns-result-order=ipv4first
```

E reiniciar o PM2:
```bash
pm2 restart lotbicho --update-env
```

### 3. Autorizar IPv6 no Nxgate (Alternativa)

Se preferir manter IPv6, autorize também o IPv6 no painel do Nxgate:
- `2604:a00:50:210:216:3eff:fe31:917a`

## 📋 Checklist

- [x] Código atualizado para forçar IPv4 primeiro
- [ ] Fazer deploy das alterações
- [ ] Reiniciar PM2: `pm2 restart lotbicho --update-env`
- [ ] Verificar se o IPv4 `104.218.52.159` está autorizado no Nxgate para saques
- [ ] Tentar fazer um saque novamente
- [ ] Se ainda não funcionar, adicionar `NODE_OPTIONS=--dns-result-order=ipv4first` no `.env`

## 🎯 Resultado Esperado

Após o deploy e reiniciar o PM2:

- O Node.js usará IPv4 (`104.218.52.159`) em vez de IPv6
- O Nxgate verá o IPv4 autorizado
- Os saques devem funcionar normalmente

## ⚠️ Nota Importante

**O IPv6 está sendo usado automaticamente** porque o servidor tem ambos os protocolos configurados. A solução força o uso de IPv4 primeiro, garantindo que o IP autorizado seja usado.
