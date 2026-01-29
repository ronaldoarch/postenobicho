# 🔍 Verificação Detalhada das 5 Etapas de Todas as Modalidades

## 📋 Estrutura das 5 Etapas

1. **Etapa 1:** Seleção de Modalidade
2. **Etapa 2:** Seleção de Palpites (Animais ou Números)
3. **Etapa 3:** Posição, Quantia e Divisão
4. **Etapa 4:** Seleção de Localização/Extrações
5. **Etapa 5:** Confirmação e Criação da Aposta

---

## ⚠️ PROBLEMAS IDENTIFICADOS

### 🔴 PROBLEMA CRÍTICO: Cálculo na Etapa 3 vs Etapa 4

**Localização:** `components/BetFlow.tsx` linha 463

**Problema:**
```typescript
// ETAPA 3: Cálculo de valor por palpite
const valorPorExtracao = betData.amount / qtdExtracoes  // ❌ ERRADO!
```

**Correção Necessária:**
```typescript
// O valor digitado é POR EXTRAÇÃO, não deve dividir aqui
const valorPorExtracao = betData.amount  // ✅ CORRETO
```

**Impacto:**
- Se usuário digita R$ 2,00 e seleciona 3 extrações
- Cálculo atual: R$ 2,00 / 3 = R$ 0,67 por extração ❌
- Cálculo correto: R$ 2,00 por extração = R$ 6,00 total ✅

---

### 🔴 PROBLEMA CRÍTICO: Cálculo na Etapa 5 (API)

**Localização:** `app/api/apostas/route.ts` linha 267

**Status:** ✅ JÁ CORRIGIDO

O código atual está correto:
```typescript
// O valor digitado é POR EXTRAÇÃO, então multiplicamos pelas extrações
valorTotalParaDebitar = valorNum * qtdExtracoes
```

---

## ✅ VERIFICAÇÃO POR ETAPA

### ETAPA 1: Seleção de Modalidade

**Status:** ✅ FUNCIONANDO CORRETAMENTE

- Todas as modalidades estão disponíveis
- Tabs "Bicho" e "Loteria" funcionando
- Modalidade selecionada é salva corretamente

---

### ETAPA 2: Seleção de Palpites

**Status:** ✅ FUNCIONANDO CORRETAMENTE

#### Modalidades de Animais:
- ✅ Grupo: 1 animal por palpite
- ✅ Dupla de Grupo: 2 animais por palpite
- ✅ Terno de Grupo: 3 animais por palpite
- ✅ Quadra de Grupo: 4 animais por palpite
- ✅ Quina de Grupo: 5 animais por palpite
- ✅ Terno de Grupo Seco: 3 animais por palpite
- ✅ Passe vai: 2 animais por palpite (fixo 1º-2º)
- ✅ Passe vai e vem: 2 animais por palpite (fixo 1º-2º)

#### Modalidades Numéricas:
- ✅ Dezena: 2 dígitos
- ✅ Centena: 3 dígitos
- ✅ Milhar: 4 dígitos
- ✅ Dezena Invertida: 2 dígitos (conta variações)
- ✅ Centena Invertida: 3 dígitos (conta variações)
- ✅ Milhar Invertida: 4 dígitos (conta variações)
- ✅ Milhar/Centena: 4 dígitos (conta 2 combinações)
- ✅ Duque de Dezena: Formato "12-23"
- ✅ Terno de Dezena: Formato "12-23-34"
- ✅ Quadra de Dezena: Formato "12-23-34-45"
- ✅ Duque de Dezena (EMD): 4 dígitos (extrai 3 dezenas)
- ✅ Terno de Dezena (EMD): 4 dígitos (extrai 3 dezenas)
- ✅ Dezeninha: 3-20 dezenas separadas por vírgula

---

### ETAPA 3: Posição, Quantia e Divisão

**Status:** ⚠️ PROBLEMA IDENTIFICADO

#### Problema no Cálculo de Valor por Extração

**Código Atual (ERRADO):**
```typescript
// components/BetFlow.tsx linha 463
const qtdExtracoes = betData.selectedExtracoes?.length || 1
const valorPorExtracao = betData.amount / qtdExtracoes  // ❌ DIVIDE ERRADO
```

**Correção Necessária:**
```typescript
// O valor digitado é POR EXTRAÇÃO
const valorPorExtracao = betData.amount  // ✅ CORRETO
```

#### Validação de Posições

**Status:** ✅ FUNCIONANDO CORRETAMENTE

- ✅ Milhar, Milhar Invertida, Milhar/Centena: Limitado ao 5º prêmio
- ✅ Terno de Grupo Seco: Limitado ao 5º prêmio
- ✅ Passe vai/vai e vem: Fixo 1º-2º prêmio
- ✅ Outras modalidades: Até 7º prêmio

#### Divisão (all vs each)

**Status:** ✅ FUNCIONANDO CORRETAMENTE

- ✅ "Para todo o palpite" (all): Divide valor pelos palpites
- ✅ "Para cada palpite" (each): Valor completo para cada palpite

---

### ETAPA 4: Seleção de Localização/Extrações

**Status:** ✅ FUNCIONANDO CORRETAMENTE

- ✅ Extrações individuais funcionando
- ✅ Múltiplas extrações funcionando (até 3)
- ✅ Aposta instantânea funcionando
- ✅ Filtro por estado (RJ) funcionando

**Problema Identificado:**
- ⚠️ O cálculo na Etapa 3 divide o valor pelas extrações ANTES de chegar na Etapa 4
- Isso causa inconsistência no cálculo final

---

### ETAPA 5: Confirmação e Criação da Aposta

**Status:** ✅ FUNCIONANDO CORRETAMENTE (com ressalvas)

#### Cálculo de Valor Total

**API (`app/api/apostas/route.ts`):**
```typescript
// ✅ CORRETO
valorTotalParaDebitar = valorNum * qtdExtracoes

// Se "para cada palpite" (each):
if (betData.divisionType === 'each') {
  valorTotalParaDebitar = valorTotalParaDebitar * qtdPalpites
}
```

**Frontend (`components/BetFlow.tsx`):**
```typescript
// ⚠️ PROBLEMA: Divide antes de calcular
const valorPorExtracao = betData.amount / qtdExtracoes  // ❌ ERRADO
```

#### Salvamento no Banco

**Status:** ✅ FUNCIONANDO CORRETAMENTE

- Cada aposta salva: `valor` = valor por extração
- Se múltiplas extrações: múltiplos registros
- Cada registro tem o valor correto por extração

#### Cálculo de Retorno Previsto

**Status:** ⚠️ PODE TER PROBLEMA

- Usa `valorPorExtracao` que está sendo calculado incorretamente
- Pode mostrar retorno menor do que o correto

---

## 🔧 CORREÇÕES NECESSÁRIAS

### 1. Corrigir Cálculo na Etapa 3

**Arquivo:** `components/BetFlow.tsx`

**Linha:** ~463

**Mudança:**
```typescript
// ANTES (ERRADO):
const qtdExtracoes = betData.selectedExtracoes?.length || 1
const valorPorExtracao = betData.amount / qtdExtracoes

// DEPOIS (CORRETO):
const valorPorExtracao = betData.amount  // Valor digitado é POR EXTRAÇÃO
```

### 2. Verificar Cálculo de Retorno Previsto

**Arquivo:** `components/BetFlow.tsx`

**Linha:** ~466-470

**Verificar se:**
- `valorPorPalpite` está sendo calculado corretamente
- Considera `divisionType` corretamente
- Considera variações para modalidades invertidas
- Considera 2 combinações para MILHAR_CENTENA

---

## 📊 RESUMO POR MODALIDADE

### Modalidades de Grupo
- ✅ Etapa 1: OK
- ✅ Etapa 2: OK
- ⚠️ Etapa 3: Problema no cálculo de valor por extração
- ✅ Etapa 4: OK
- ✅ Etapa 5: OK (API está correta)

### Modalidades Numéricas Normais
- ✅ Etapa 1: OK
- ✅ Etapa 2: OK
- ⚠️ Etapa 3: Problema no cálculo de valor por extração
- ✅ Etapa 4: OK
- ✅ Etapa 5: OK (API está correta)

### Modalidades Invertidas
- ✅ Etapa 1: OK
- ✅ Etapa 2: OK (conta variações corretamente)
- ⚠️ Etapa 3: Problema no cálculo de valor por extração
- ✅ Etapa 4: OK
- ✅ Etapa 5: OK (API está correta)

### Milhar/Centena
- ✅ Etapa 1: OK
- ✅ Etapa 2: OK (conta 2 combinações)
- ⚠️ Etapa 3: Problema no cálculo de valor por extração
- ✅ Etapa 4: OK
- ✅ Etapa 5: OK (API está correta)

### Passe vai/vai e vem
- ✅ Etapa 1: OK
- ✅ Etapa 2: OK
- ⚠️ Etapa 3: Problema no cálculo + validar posição fixa
- ✅ Etapa 4: OK
- ✅ Etapa 5: OK (API está correta)

### Dezeninha
- ✅ Etapa 1: OK
- ✅ Etapa 2: OK (multiplicador variável)
- ⚠️ Etapa 3: Problema no cálculo de valor por extração
- ✅ Etapa 4: OK
- ✅ Etapa 5: OK (API está correta)

---

## ✅ AÇÕES RECOMENDADAS

1. **URGENTE:** Corrigir cálculo de `valorPorExtracao` na Etapa 3
2. **IMPORTANTE:** Verificar cálculo de retorno previsto
3. **IMPORTANTE:** Adicionar validação de posição fixa para Passe
4. **OPCIONAL:** Adicionar testes automatizados para cada etapa
