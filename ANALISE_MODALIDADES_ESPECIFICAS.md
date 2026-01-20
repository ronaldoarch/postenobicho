# Análise Detalhada das Modalidades Específicas

## Modalidades Analisadas

1. **Quadra de Dezena**
2. **Terno de Dezena EMD**
3. **Terno de Grupo Seco**
4. **Duque de Dezena EMD**
5. **Dezeninha**

---

## 1. Quadra de Dezena

### Configuração
- **Odd:** 300x (todas as posições: 1-1, 1-3, 1-5, 1-7)
- **Tipo:** Modalidade de dezena combinada

### Lógica de Conferência
```typescript
conferirQuadraDezena(resultado, dezenasApostadas, pos_from, pos_to)
```

**Regras:**
- Requer exatamente **4 dezenas diferentes** apostadas
- Formato: `"12,23,34,45"` (separadas por vírgula ou espaço)
- Verifica cada prêmio no intervalo `pos_from` a `pos_to`
- Extrai a dezena de cada prêmio (últimos 2 dígitos)
- **Acerta se encontrar TODAS as 4 dezenas** nos resultados
- Retorna `hits = 1` se todas foram encontradas, `0` caso contrário

### Cálculo de Prêmio
```typescript
unidades = 1 * qtd_posicoes
valor_unitario = valor_apostado / unidades
premio_unidade = 300 * valor_unitario
premio_total = hits * premio_unidade
```

### Status
✅ **Correto** - Implementação está funcionando corretamente

---

## 2. Terno de Dezena EMD

### Configuração
- **Odd:** 5000x (todas as posições: 1-1, 1-3, 1-5, 1-7)
- **Tipo:** Modalidade EMD (Esquerda, Meio, Direita)

### Lógica de Conferência
```typescript
conferirTernoDezenaEMD(resultado, dezenasApostadas, pos_from, pos_to)
```

**Regras:**
- Requer exatamente **3 dezenas diferentes** apostadas
- Formato: `"12,23,34"` (separadas por vírgula ou espaço)
- Para cada prêmio, extrai as 3 dezenas EMD:
  - **Esquerda:** Primeiros 2 dígitos (ex: 1234 → 12)
  - **Meio:** Dígitos do meio (ex: 1234 → 23)
  - **Direita:** Últimos 2 dígitos (ex: 1234 → 34)
- Verifica se as dezenas apostadas batem com as dezenas EMD de qualquer prêmio
- **Acerta se encontrar TODAS as 3 dezenas** nos resultados (usando EMD)
- Retorna `hits = 1` se todas foram encontradas, `0` caso contrário

### Função Auxiliar
```typescript
function extrairDezenasEMD(milhar: number): number[] {
  const milharStr = milhar.toString().padStart(4, '0')
  const esquerda = parseInt(milharStr.slice(0, 2), 10)
  const meio = parseInt(milharStr.slice(1, 3), 10)
  const direita = parseInt(milharStr.slice(2, 4), 10)
  return [esquerda, meio, direita]
}
```

### Cálculo de Prêmio
```typescript
unidades = 1 * qtd_posicoes
valor_unitario = valor_apostado / unidades
premio_unidade = 5000 * valor_unitario
premio_total = hits * premio_unidade
```

### Status
✅ **Correto** - Implementação está funcionando corretamente

---

## 3. Terno de Grupo Seco

### Configuração
- **Odd:** 150x (todas as posições: 1-1, 1-3, 1-5, 1-7)
- **Tipo:** Modalidade de grupo com limitação de posições

### Lógica de Conferência
```typescript
conferirTernoGrupo(resultado, gruposApostados, pos_from, Math.min(pos_to, 5))
```

**Regras:**
- Requer exatamente **3 grupos diferentes** apostados
- **LIMITAÇÃO ESPECIAL:** Válido apenas do **1º ao 5º prêmio**
- Mesmo que o usuário escolha "1º ao 7º", o sistema limita a `pos_to = 5`
- Verifica se todos os 3 grupos aparecem nos resultados (limitados ao 5º prêmio)
- **Acerta se TODOS os 3 grupos** estiverem presentes
- Retorna `hits = 1` se todos foram encontrados, `0` caso contrário

### Cálculo de Prêmio
```typescript
unidades = 1 * qtd_posicoes (limitado ao máximo de 5)
valor_unitario = valor_apostado / unidades
premio_unidade = 150 * valor_unitario
premio_total = hits * premio_unidade
```

### Status
✅ **Correto** - Implementação está funcionando corretamente com limitação ao 5º prêmio

---

## 4. Duque de Dezena EMD

### Configuração
- **Odd:** 300x (todas as posições: 1-1, 1-3, 1-5, 1-7)
- **Tipo:** Modalidade EMD (Esquerda, Meio, Direita)

### Lógica de Conferência
```typescript
conferirDuqueDezenaEMD(resultado, dezenaApostada, pos_from, pos_to)
```

**Regras:**
- Requer **1 dezena** apostada (0-99)
- Para cada prêmio, extrai as 3 dezenas EMD:
  - **Esquerda:** Primeiros 2 dígitos
  - **Meio:** Dígitos do meio
  - **Direita:** Últimos 2 dígitos
- Verifica se a dezena apostada bate com **qualquer uma** das 3 dezenas EMD
- **Acerta se a dezena aparecer em qualquer posição EMD** de qualquer prêmio
- Retorna `hits` = número de vezes que a dezena foi encontrada (pode ser múltiplo)

### Diferença do Terno EMD
- **Duque EMD:** 1 dezena, conta quantas vezes aparece (pode ser múltiplo)
- **Terno EMD:** 3 dezenas, precisa acertar todas (hits = 0 ou 1)

### Cálculo de Prêmio
```typescript
unidades = 1 * qtd_posicoes
valor_unitario = valor_apostado / unidades
premio_unidade = 300 * valor_unitario
premio_total = hits * premio_unidade  // hits pode ser > 1
```

### Status
✅ **Correto** - Implementação está funcionando corretamente

---

## 5. Dezeninha

### Configuração
- **Odd:** Variável conforme quantidade de dezenas:
  - 3 dezenas: **15x**
  - 4 dezenas: **150x**
  - 5 dezenas: **1500x**
- **Tipo:** Modalidade de dezena múltipla

### Lógica de Conferência
```typescript
conferirDezeninha(resultado, dezenasApostadas, pos_from, pos_to)
```

**Regras:**
- Requer entre **3 e 5 dezenas** apostadas
- Formato: `"12,23,34"` (3 dezenas), `"12,23,34,45"` (4 dezenas), ou `"12,23,34,45,56"` (5 dezenas)
- Verifica cada prêmio no intervalo `pos_from` a `pos_to`
- Extrai a dezena de cada prêmio (últimos 2 dígitos)
- **Acerta se encontrar TODAS as dezenas apostadas** nos resultados
- Retorna `hits = 1` se todas foram encontradas, `0` caso contrário

### Cálculo de Odd Dinâmico
```typescript
// Conta quantas dezenas foram apostadas
const dezenasArray = palpite.numero.split(/[,\s]+/).filter(d => d.trim().length > 0)
const qtdDezenas = dezenasArray.length

// Ajusta odd conforme quantidade
if (qtdDezenas === 3) odd = 15
else if (qtdDezenas === 4) odd = 150
else if (qtdDezenas === 5) odd = 1500
```

### Cálculo de Prêmio
```typescript
unidades = 1 * qtd_posicoes
valor_unitario = valor_apostado / unidades
premio_unidade = odd_dinamico * valor_unitario
premio_total = hits * premio_unidade
```

### Correções Aplicadas
✅ **Criada função específica `conferirDezeninha()`** para lidar corretamente com múltiplas dezenas
✅ **Corrigido cálculo de quantidade de dezenas** para contar corretamente dezenas separadas por vírgula
✅ **Adicionado tratamento especial** na função `conferirPalpite()` para usar a função específica

### Status
✅ **Correto** - Implementação corrigida e funcionando corretamente

---

## Resumo das Verificações

| Modalidade | Odd | Lógica de Conferência | Status |
|------------|-----|----------------------|--------|
| Quadra de Dezena | 300x | ✅ Acerta se encontrar todas as 4 dezenas | ✅ Correto |
| Terno de Dezena EMD | 5000x | ✅ Acerta se encontrar todas as 3 dezenas (EMD) | ✅ Correto |
| Terno de Grupo Seco | 150x | ✅ Acerta se encontrar todos os 3 grupos (limitado ao 5º) | ✅ Correto |
| Duque de Dezena EMD | 300x | ✅ Acerta se encontrar a dezena (EMD, pode ser múltiplo) | ✅ Correto |
| Dezeninha | 15x/150x/1500x | ✅ Acerta se encontrar todas as dezenas (odd dinâmico) | ✅ **CORRIGIDO** |

---

## Observações Importantes

1. **Terno de Grupo Seco:** Sempre limitado ao 5º prêmio, mesmo que o usuário escolha "1º ao 7º"

2. **Modalidades EMD:** Usam a função `extrairDezenasEMD()` para extrair as 3 dezenas possíveis de cada milhar

3. **Dezeninha:** Requer função específica porque precisa contar múltiplas dezenas, não apenas verificar uma

4. **Formato de Entrada:** Todas as modalidades de dezena múltipla usam formato separado por vírgula: `"12,23,34"`

5. **Processamento na Liquidação:** Todas as modalidades são processadas corretamente na liquidação automática e manual
