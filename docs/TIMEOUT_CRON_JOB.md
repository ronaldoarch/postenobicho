# ⏱️ Solução para Timeout no Cron Job

## ❌ Problema: "Failed (timeout)"

O cron-job.org está dando timeout porque o endpoint pode demorar para processar.

---

## ✅ Soluções

### Solução 1: Aumentar Timeout no cron-job.org

Na aba **ADVANCED** do cron-job.org:

1. Encontre o campo **"Timeout"**
2. Aumente de `30` para `60` ou `90` segundos
3. Salve o cron job

### Solução 2: Verificar URL Correta

⚠️ **IMPORTANTE:** Verifique se a URL está correta!

Na imagem vi: `ig4044cgogk084sc0g888404` (tem "404" no meio)

**Deve ser:** `ig4o44cgogk084sc0g8884o4` (sem "404")

Corrija a URL no cron-job.org:
```
https://ig4o44cgogk084sc0g8884o4.agenciamidas.com/api/resultados/liquidar
```

### Solução 3: Processamento Assíncrono (Futuro)

Para processar muitas apostas, podemos implementar:
- Processamento em background
- Retornar resposta imediata
- Processar depois

---

## 🔧 Configuração Recomendada no cron-job.org

### Aba COMMON:
- **Title:** Liquidação Automática - Lot Bicho
- **URL:** `https://ig4o44cgogk084sc0g8884o4.agenciamidas.com/api/resultados/liquidar`
- **Enable job:** ✅ Ativado
- **Schedule:** Every 5 minutes

### Aba ADVANCED:
- **Request method:** POST
- **Headers:** `Content-Type: application/json`
- **Request body:** `{"usarMonitor": true}`
- **Timeout:** `60` ou `90` segundos ← **AUMENTAR AQUI**
- **Time zone:** America/Sao_Paulo

---

## 🧪 Testar Novamente

1. Corrija a URL (se necessário)
2. Aumente o timeout para 60-90 segundos
3. Clique em **"TEST RUN"** novamente
4. Se ainda der timeout, aumente para 120 segundos

---

## 📊 Por que pode dar timeout?

- Busca resultados externos (pode demorar)
- Processa múltiplas apostas
- Múltiplas queries no banco de dados
- Rede pode estar lenta

**Solução:** Aumentar timeout resolve na maioria dos casos.

---

**Última atualização:** 2026-01-15
