# 🔍 O Que Está Faltando - Soluções de Liquidação

**Data:** 27 de Janeiro de 2025

Este documento lista o que ainda precisa ser implementado conforme o documento de soluções fornecido.

---

## ⚠️ Pendências Identificadas

### 1. ❌ Problema 3: Normalização de Horários

**Status:** NÃO IMPLEMENTADO

**O que falta:**
- Criar arquivo `data/horarios-reais-apuracao.ts` com mapeamento de horários reais de apuração
- Implementar função `normalizarHorarioResultado()` na API de resultados (`app/api/resultados/route.ts`)
- Aplicar normalização na transformação dos resultados antes de retornar

**Por que é importante:**
- A API externa retorna horários de apuração reais (ex: "20:40")
- O sistema usa horários internos de fechamento (ex: "20:15")
- Sem normalização, o match de horários pode falhar

**Impacto:** Médio - Pode causar problemas de match de horários, mas tem fallbacks implementados

---

### 2. ⚠️ Problema 6: Verificação de Horário de Apuração (Completa)

**Status:** PARCIALMENTE IMPLEMENTADO

**O que está implementado:**
- ✅ Verificação básica de `closeTime` (linhas 223-250 de `liquidar/route.ts`)
- ✅ Verifica se é hoje e se já passou o horário de fechamento

**O que falta:**
- ❌ Função `jaPassouHorarioApuracao()` completa conforme documento
- ❌ Verificação de dia da semana (`temSorteioNoDia()`)
- ❌ Uso de horário real de apuração (`getHorarioRealApuracao()`)
- ❌ Verificação usando `startTimeReal` (horário inicial de apuração)
- ❌ Timezone correto (Brasília) para comparações

**Por que é importante:**
- Algumas loterias só têm sorteio em dias específicos da semana
- O horário real de apuração pode ser diferente do horário de fechamento
- Usar `startTimeReal` permite liquidar assim que o resultado pode estar disponível

**Impacto:** Médio - A verificação atual funciona, mas pode ser melhorada para ser mais precisa

---

## 📋 Detalhamento do Que Falta

### Função `jaPassouHorarioApuracao()` Completa

**Localização:** `app/api/resultados/liquidar/route.ts`

**O que deve fazer:**
1. Buscar extração por ID ou nome
2. Obter horário real de apuração (`getHorarioRealApuracao()`)
3. Verificar se o dia da semana tem sorteio (`temSorteioNoDia()`)
4. Comparar horário atual (Brasília) com `startTimeReal`
5. Retornar `true` se já pode liquidar, `false` se ainda não pode

**Exemplo de uso:**
```typescript
if (!jaPassouHorarioApuracao(aposta.loteria, aposta.dataConcurso, aposta.horario)) {
  console.log(`⏸️  Pulando aposta ${aposta.id} - aguardando apuração`)
  continue
}
```

---

### Função `getHorarioRealApuracao()`

**Localização:** `data/horarios-reais-apuracao.ts` (novo arquivo)

**O que deve fazer:**
- Retornar objeto com `startTimeReal` e `closeTimeReal` para cada loteria/horário
- Mapear horários internos para horários reais de apuração

**Estrutura esperada:**
```typescript
interface HorarioReal {
  startTimeReal: string  // Ex: "20:15" (início da apuração)
  closeTimeReal: string  // Ex: "20:40" (fim da apuração)
}

function getHorarioRealApuracao(nomeLoteria: string, horarioInterno: string): HorarioReal | null {
  // Mapeamento de horários reais
}
```

---

### Função `temSorteioNoDia()`

**Localização:** `data/horarios-reais-apuracao.ts` ou `app/api/resultados/liquidar/route.ts`

**O que deve fazer:**
- Verificar se a loteria tem sorteio no dia da semana especificado
- Retornar `true` se tem sorteio, `false` se não tem

**Exemplo:**
```typescript
function temSorteioNoDia(horarioReal: HorarioReal, diaSemana: number): boolean {
  // diaSemana: 0 = domingo, 1 = segunda, ..., 6 = sábado
  // Verificar configuração da loteria
}
```

---

### Função `normalizarHorarioResultado()`

**Localização:** `app/api/resultados/route.ts`

**O que deve fazer:**
- Normalizar horário do resultado da API externa para horário interno
- Usar mapeamento de horários reais para fazer a conversão
- Retornar horário normalizado

**Exemplo:**
```typescript
function normalizarHorarioResultado(loteriaNome: string, horarioResultado: string): string {
  // Buscar horário real de apuração
  // Comparar horário do resultado com horários reais
  // Retornar horário interno correspondente
}
```

---

## 🎯 Priorização

### Prioridade Alta
1. **Implementar `jaPassouHorarioApuracao()` completa** - Melhora precisão da liquidação
2. **Criar arquivo de horários reais** - Base para outras funções

### Prioridade Média
3. **Implementar `normalizarHorarioResultado()`** - Melhora match de horários, mas tem fallbacks

### Prioridade Baixa
4. **Implementar `temSorteioNoDia()`** - Útil apenas se houver loterias com dias específicos

---

## 📊 Resumo Visual

```
✅ Problema 1: Mistura de Prêmios          → IMPLEMENTADO
✅ Problema 2: Match de Nomes              → IMPLEMENTADO
❌ Problema 3: Normalização de Horários    → NÃO IMPLEMENTADO
✅ Problema 4: Filtro de Datas             → JÁ ESTAVA OK
✅ Problema 5: Agrupamento                 → IMPLEMENTADO
⚠️  Problema 6: Verificação de Horário     → PARCIAL (falta função completa)
✅ Problema 7: Inferência de UF            → IMPLEMENTADO
```

---

## 🚀 Próximos Passos Recomendados

1. **Criar arquivo de horários reais** (`data/horarios-reais-apuracao.ts`)
   - Mapear horários internos → horários reais de apuração
   - Incluir `startTimeReal` e `closeTimeReal`

2. **Implementar `jaPassouHorarioApuracao()` completa**
   - Usar horários reais
   - Verificar dia da semana
   - Usar timezone Brasília

3. **Implementar `normalizarHorarioResultado()`**
   - Aplicar na transformação dos resultados
   - Normalizar antes de retornar

4. **Testar em produção**
   - Verificar se liquidação está mais precisa
   - Monitorar logs para identificar problemas

---

**Última atualização:** 27 de Janeiro de 2025
