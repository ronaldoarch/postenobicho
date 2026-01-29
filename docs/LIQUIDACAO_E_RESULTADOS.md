# 🔄 Sistema de Liquidação e Busca de Resultados

## 📋 Visão Geral

O sistema possui uma estratégia **híbrida** para liquidação de apostas, com duas abordagens:

1. **Sistema do Monitor** (opcional, se disponível)
2. **Implementação Própria** (fallback automático)

## 🔍 Busca de Resultados

### Fonte de Dados: bichocerto.com

O sistema busca resultados diretamente do site oficial **bichocerto.com** através de parsing HTML.

**Arquivo:** `lib/bichocerto-parser.ts`

**Função principal:** `buscarResultadosPorNome(nomeLoteria, data)`

### Como Funciona:

1. **Mapeamento de Loterias:**
   - Converte nome da loteria (ex: "PT RIO") para código do bichocerto.com (ex: "rj")
   - Mapeamento completo em `LOTERIA_CODIGO_MAP`

2. **Requisição HTTP:**
   - Endpoint: `https://bichocerto.com/resultados/base/resultado/`
   - Método: POST com form data
   - Parâmetros: `l` (código loteria) e `d` (data YYYY-MM-DD)

3. **Parsing HTML:**
   - Extrai resultados de tabelas HTML (`table_XX`)
   - Identifica divs de resultados (`div_display_XX`)
   - Extrai para cada horário:
     - Posição (1º, 2º, 3º, etc.)
     - Número (milhar de 4 dígitos)
     - Grupo (01-25)
     - Animal (nome do animal)

4. **Formato Retornado:**
```typescript
interface BichoCertoResultado {
  horario: string        // "16:30"
  titulo: string         // "Resultado PTV-RJ 16:30"
  premios: BichoCertoPremio[]
}

interface BichoCertoPremio {
  posicao: string      // "7º"
  numero: string       // "0022"
  grupo: string        // "06"
  animal: string       // "Cabra"
}
```

### Loterias Suportadas:

- **PT RIO** → código "rj"
- **PT SP** → código "sp"
- **NACIONAL** → código "ln"
- **FEDERAL** → código "fd"
- **PT BAHIA** → código "ba"
- **LOTEP** → código "pb"
- **LOTECE** → código "lce"
- **LOOK** → código "lk"
- E outras...

## 💰 Processo de Liquidação

### Endpoint Principal

**POST** `/api/resultados/liquidar`

### Fluxo Completo:

```
1. Verificar se liquidação automática está ativa
   ↓ (se desativada, retorna sem processar)
   
2. Tentar usar Monitor (se usarMonitor=true)
   ↓
   ├─ Monitor disponível? → Usa monitor ✅
   └─ Monitor indisponível? → Continua com próprio ⚙️
   
3. Buscar apostas pendentes
   ↓
   ├─ Filtrar apenas RJ (Rio de Janeiro)
   ├─ Filtrar por loteria (se especificado)
   ├─ Filtrar por data (se especificado)
   └─ Filtrar por horário (se especificado)
   
4. Verificar horário de apuração
   ↓
   ├─ Já passou horário? → Processa ✅
   └─ Ainda não passou? → Pula ⏭️
   
5. Buscar resultados oficiais
   ↓
   ├─ Agrupar apostas por loteria/data
   ├─ Buscar do bichocerto.com
   └─ Converter para formato interno
   
6. Conferir cada aposta
   ↓
   ├─ Parsear detalhes da aposta
   ├─ Extrair modalidade, posição, palpites
   ├─ Usar bet-rules-engine.ts para conferir
   └─ Calcular prêmio
   
7. Atualizar banco de dados
   ↓
   ├─ Marcar aposta como "liquidado" ou "perdida"
   ├─ Creditar prêmio no saldo do usuário
   ├─ Enviar webhook (se configurado)
   └─ Atualizar detalhes da aposta
```

### Filtros Aplicados:

**⚠️ IMPORTANTE:** O sistema atualmente processa **APENAS apostas do Rio de Janeiro (RJ)**.

```typescript
// Filtro aplicado em múltiplos pontos:
if (extracao?.estado !== 'RJ') {
  // Pula esta aposta/extração
  return false
}
```

### Validação de Horário:

O sistema verifica se já passou o horário de apuração antes de liquidar:

- Usa horários REAIS de apuração (não horários internos)
- Considera dias da semana (ex: Federal só Quarta e Sábado)
- Considera horários específicos por extração
- Função: `jaPassouHorarioApuracao()`

## 🎯 Motor de Regras

**Arquivo:** `lib/bet-rules-engine.ts`

O sistema usa um motor de regras próprio para conferir apostas:

- **Função principal:** `conferirPalpite()`
- Suporta todas as modalidades (Grupo, Milhar, Centena, etc.)
- Calcula prêmios baseado em odds configuradas
- Considera cotações especiais (milhares/centenas cotadas)
- Calcula valor unitário e prêmio por unidade

## 🔧 Configuração

### Variáveis de Ambiente:

```env
# URL do monitor (opcional)
BICHO_CERTO_API=https://okgkgswwkk8ows0csow0c4gg.agenciamidas.com/api/resultados

# Cookie PHPSESSID do bichocerto.com (opcional, para acesso histórico)
BICHOCERTO_PHPSESSID=...
```

### Configuração no Banco:

**Tabela:** `Configuracao`

- `liquidacaoAutomatica` (Boolean): Ativa/desativa liquidação automática

## 📊 Endpoints Disponíveis

### 1. GET `/api/resultados/liquidar`
Retorna estatísticas de apostas:
```json
{
  "pendentes": 25,
  "liquidadas": 150,
  "perdidas": 50,
  "total": 225
}
```

### 2. POST `/api/resultados/liquidar`
Processa liquidação de apostas pendentes.

**Body (opcional):**
```json
{
  "loteria": "PT RIO",
  "dataConcurso": "2026-01-21",
  "horario": "16:20",
  "usarMonitor": true
}
```

**Resposta:**
```json
{
  "message": "Liquidação concluída",
  "processadas": 10,
  "liquidadas": 3,
  "premioTotal": 150.50,
  "fonte": "proprio" // ou "monitor"
}
```

### 3. POST `/api/resultados/liquidar/manual`
Liquidação manual (força processamento sem validação de horário).

## ⚙️ Liquidação Manual vs Automática

### Automática (`/api/resultados/liquidar`):
- ✅ Valida horário de apuração
- ✅ Filtra apenas apostas que já podem ser liquidadas
- ✅ Mais segura (não liquida antes do tempo)

### Manual (`/api/resultados/liquidar/manual`):
- ⚠️ Não valida horário
- ⚠️ Processa todas as apostas pendentes
- ⚠️ Use apenas para testes ou correções

## 🔄 Cron Job (Automação)

**Arquivo:** `scripts/cron/liquidar.sh`

```bash
# Executar a cada 1 minuto após horários de sorteio
*/1 * * * * /caminho/para/liquidar.sh
```

O script:
1. Verifica se liquidação automática está ativa
2. Chama `/api/resultados/liquidar` com `usarMonitor=true`
3. Registra logs

## 📝 Logs e Debugging

### Logs Importantes:

- `📊 Total de apostas pendentes: X, do RJ: Y`
- `📊 Total de resultados encontrados: X`
- `✅ Liquidação processada pelo monitor`
- `⚠️ Monitor não disponível, usando implementação própria`
- `⏭️ Pulando extração X - Estado: Y (apenas RJ permitido)`
- `❌ Erro ao processar aposta X`

### Debug Endpoint:

**GET** `/api/resultados/liquidar/debug`

Retorna informações sobre:
- Status do parser
- Status do monitor
- Apostas pendentes
- Resultados disponíveis

## 🚨 Limitações Atuais

1. **Apenas RJ:** Sistema processa apenas apostas do Rio de Janeiro
2. **Dependência Externa:** Depende do bichocerto.com estar disponível
3. **Parsing HTML:** Pode quebrar se estrutura do site mudar
4. **Sem Cache:** Sempre busca resultados frescos (pode ser lento)

## 🔮 Melhorias Futuras

1. ✅ Adicionar cache de resultados
2. ✅ Suportar outros estados além de RJ
3. ✅ Múltiplas fontes de resultados (fallback)
4. ✅ API de resultados própria
5. ✅ Webhook de resultados em tempo real
6. ✅ Retry automático em caso de falha

## 📞 Troubleshooting

### Problema: Nenhum resultado encontrado

**Possíveis causas:**
- Site bichocerto.com indisponível
- Data incorreta (resultados ainda não disponíveis)
- Loteria não mapeada corretamente
- Estrutura HTML do site mudou

**Solução:**
1. Verificar logs de erro
2. Testar busca manual: `buscarResultadosPorNome("PT RIO", "2026-01-21")`
3. Verificar mapeamento de loterias
4. Verificar estrutura HTML retornada

### Problema: Apostas não sendo liquidadas

**Possíveis causas:**
- Liquidação automática desativada
- Horário de apuração ainda não passou
- Apostas não são do RJ
- Resultados não encontrados

**Solução:**
1. Verificar `liquidacaoAutomatica` na configuração
2. Verificar logs de horário de apuração
3. Verificar filtro de estado (RJ)
4. Verificar se resultados foram encontrados

---

**Última atualização:** 2026-01-21
