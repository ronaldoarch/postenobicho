# ⏰ Horários de Apuração para Liquidação

Este documento lista todos os horários de apuração configurados no sistema para a liquidação automática de apostas.

## 📋 Horários Configuráveis no Banco de Dados

O sistema possui uma tabela `ConfiguracaoHorarios` que permite configurar os horários de apuração. Os valores padrão são:

| Horário | Valor Padrão | Descrição |
|---------|--------------|-----------|
| `horario09` | `09:10` | Horário de apuração das 09h |
| `horario11` | `11:10` | Horário de apuração das 11h |
| `horario14` | `14:10` | Horário de apuração das 14h |
| `horario16` | `16:10` | Horário de apuração das 16h |
| `horario18` | `18:10` | Horário de apuração das 18h |
| `horario21` | `21:10` | Horário de apuração das 21h |
| `horarioFederal` | `19:55` | Horário de apuração da Federal |

**Dias especiais:**
- `diasFederal`: `Quarta,Sábado` - Dias em que a Federal tem sorteio
- `diasSem18e21`: `Domingo` - Dias sem extrações às 18h e 21h

## 🎯 Horários de Apuração por Extração (PT RIO)

Com base nas extrações configuradas em `data/extracoes.ts`, os horários reais de apuração para **PT RIO** são:

| ID | Horário | Real Close Time | Close Time | Dias com Sorteio |
|----|---------|-----------------|------------|------------------|
| 37 | 09:20 | **09:10** | 09:20 | Seg, Ter, Qua, Sex, Sáb, Dom |
| 15 | 11:20 | **11:10** | 11:20 | Seg, Ter, Qua, Sex, Sáb, Dom |
| 16 | 14:20 | **14:10** | 14:20 | Seg, Ter, Qua, Sex, Sáb, Dom |
| 17 | 16:20 | **16:10** | 16:20 | Seg, Ter, Qua, Sex, Sáb, Dom |
| 18 | 18:20 | **18:10** | 18:20 | Seg, Ter, Sex |
| 19 | 21:20 | **21:10** | 21:20 | Seg, Ter, Qua, Sex, Sáb |

**Nota:** O sistema usa o `realCloseTime` (horário real de apuração) para verificar se já pode liquidar. O `closeTime` é o horário de fechamento das apostas.

## 🏛️ Horários de Apuração - Federal

| ID | Horário | Real Close Time | Close Time | Dias com Sorteio |
|----|---------|-----------------|------------|------------------|
| 32 | 20:00 | **19:50** | 20:00 | Sábado |

## 🔄 Como Funciona a Verificação de Horário

A função `jaPassouHorarioApuracao()` verifica:

1. **Se já passou o horário de apuração inicial (`startTimeReal`)**:
   - Calculado como `realCloseTime - 30 minutos`
   - Exemplo: Se `realCloseTime` é `09:10`, o `startTimeReal` é `08:40`

2. **Se o dia da semana tem sorteio**:
   - Verifica se o dia da semana da aposta está na lista de dias com sorteio
   - Exemplo: PT RIO 18:20 só tem sorteio Segunda, Terça e Sexta

3. **Se a data do concurso já passou**:
   - Se a data é hoje, verifica se já passou o horário
   - Se a data é passado, permite liquidar
   - Se a data é futuro, bloqueia liquidação

## 📊 Horários da Nova API (PosteNoBicho)

A nova API busca resultados nos seguintes horários:

### Rio de Janeiro (PT RIO)
- **09 Horas** (09:00)
- **11 Horas** (11:00)
- **14 Horas** (14:00)
- **16 Horas** (16:00)
- **18 Horas** (18:00)
- **21 Horas** (21:00)

### Federal
- **18 Horas** (18:00)

## ⚙️ Configuração no Admin

Os horários podem ser ajustados na página de configurações do admin:
- **Rota:** `/admin/configuracoes`
- **Seção:** Configuração de Horários

## 🔍 Exemplo de Verificação

```typescript
// Para PT RIO 09:20 em uma Segunda-feira
// realCloseTime: 09:10
// startTimeReal: 08:40 (09:10 - 30 minutos)
// Dias com sorteio: Seg, Ter, Qua, Sex, Sáb, Dom

// A liquidação só acontece se:
// 1. Hoje é Segunda-feira ✅
// 2. Já passou das 08:40 ✅
// 3. A data do concurso é hoje ou passado ✅
```

## 📝 Observações Importantes

1. **Horário de Brasília**: Todos os horários são calculados em relação ao horário de Brasília (GMT-3)

2. **Margem de segurança**: O sistema usa `startTimeReal` (30 minutos antes do `realCloseTime`) para permitir liquidação antecipada

3. **Dias sem sorteio**: Algumas extrações não têm sorteio em certos dias:
   - PT RIO 18:20: Apenas Segunda, Terça e Sexta
   - PT RIO 21:20: Não tem sorteio Quinta e Domingo
   - Federal: Apenas Sábado

4. **Liquidação automática**: O sistema só liquida apostas após passar o horário de apuração inicial
