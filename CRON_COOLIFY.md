# Configuração de Cron Job - Poste no Bicho

Este documento descreve como configurar o cron job de liquidação automática no Coolify.

## 📋 Pré-requisitos

1. Aplicação já deployada no Coolify
2. Acesso ao terminal do servidor ou via Coolify Dashboard

## 🔧 Configuração no Coolify

### Opção 1: Via Coolify Dashboard (Recomendado)

1. Acesse o **Coolify Dashboard**
2. Vá em **Applications** > Selecione sua aplicação **Poste no Bicho**
3. Vá na aba **Cron Jobs**
4. Clique em **Add Cron Job**
5. Configure:
   - **Name:** `liquidar-apostas`
   - **Schedule:** `*/5 9-22 * * *` (a cada 5 minutos, das 9h às 22h)
   - **Command:** `bash /app/scripts/cron/liquidar.sh`
   - **User:** `root` ou o usuário do container

### Opção 2: Via Arquivo de Configuração

Crie um arquivo `.coolify/cron` na raiz do projeto:

```bash
# Liquidação automática de apostas
# Executa a cada 5 minutos, das 9h às 22h
*/5 9-22 * * * bash /app/scripts/cron/liquidar.sh
```

## 📝 Configuração Manual (SSH)

Se preferir configurar manualmente via SSH:

```bash
# Acessar o container
docker exec -it <container-name> bash

# Editar crontab
crontab -e

# Adicionar linha:
*/5 9-22 * * * bash /app/scripts/cron/liquidar.sh >> /app/logs/cron.log 2>&1
```

## ⚙️ Variáveis de Ambiente

O script usa as seguintes variáveis de ambiente (opcionais):

- `API_URL`: URL da API (padrão: `http://localhost:3000`)
- `LOG_DIR`: Diretório de logs (padrão: `scripts/logs`)

Para configurar no Coolify:

1. Vá em **Applications** > **Poste no Bicho** > **Environment Variables**
2. Adicione:
   ```
   API_URL=http://localhost:3000
   LOG_DIR=/app/logs
   ```

## 📊 Horários de Execução Recomendados

### Horários de Sorteio (Brasil)

- **Manhã:** 08:00 - 12:00 (executar a cada 5 minutos)
- **Tarde:** 13:00 - 18:00 (executar a cada 5 minutos)
- **Noite:** 19:00 - 23:00 (executar a cada 5 minutos)
- **Madrugada:** 00:00 - 07:00 (executar a cada 10 minutos)

### Configuração Sugerida

```bash
# Durante horários de sorteio (9h-22h): a cada 5 minutos
*/5 9-22 * * * bash /app/scripts/cron/liquidar.sh

# Durante madrugada (0h-8h): a cada 10 minutos
*/10 0-8 * * * bash /app/scripts/cron/liquidar.sh
```

## 🔍 Monitoramento

### Ver Logs do Cron

```bash
# Logs do script
tail -f /app/logs/liquidacao-$(date '+%Y%m%d').log

# Logs do cron (se configurado)
tail -f /app/logs/cron.log
```

### Verificar Execução

```bash
# Ver último log
ls -lt /app/logs/liquidacao-*.log | head -1

# Ver últimas execuções
grep "Liquidação concluída" /app/logs/liquidacao-*.log | tail -10
```

## 🐛 Troubleshooting

### Problema: Cron não executa

**Solução:**
1. Verificar se o arquivo tem permissão de execução:
   ```bash
   chmod +x /app/scripts/cron/liquidar.sh
   ```

2. Verificar se o caminho está correto no crontab

3. Verificar logs do cron:
   ```bash
   grep CRON /var/log/syslog
   ```

### Problema: Script retorna erro 404

**Solução:**
1. Verificar se a aplicação está rodando:
   ```bash
   curl http://localhost:3000/api/resultados/liquidar
   ```

2. Verificar variável `API_URL` no ambiente

### Problema: Timeout na execução

**Solução:**
1. Aumentar timeout no script (linha 33):
   ```bash
   --max-time 120  # 2 minutos
   ```

2. Verificar se a API externa está respondendo

## 📚 Referências

- [Documentação Coolify - Cron Jobs](https://coolify.io/docs)
- [Cron Expression Generator](https://crontab.guru/)
- [Guia de Produção](./PRODUCAO.md)

---

**Última atualização:** 27 de Janeiro de 2025
