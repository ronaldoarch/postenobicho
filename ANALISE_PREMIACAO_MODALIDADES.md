# Análise Completa da Lógica de Premiação - Todas as Modalidades

## 📊 Resumo Executivo

Este documento analisa a lógica de premiação de todas as modalidades do sistema, verificando:
- Odds configuradas
- Cálculo de prêmios
- Processamento na liquidação
- Inconsistências ou problemas

---

## 1. Modalidades de GRUPO

### 1.1. Grupo Simples
- **Odd:** 18x (todas as posições)
- **Cálculo:** `valor_unitário * 18`
- **Status:** ✅ Correto
- **Observação:** Modalidade mais simples, funciona corretamente

### 1.2. Dupla de Grupo
- **Odd:** 180x (todas as posições)
- **Cálculo:** `valor_unitário * 180`
- **Status:** ✅ Correto
- **Observação:** Requer acertar 2 grupos diferentes nas posições escolhidas

### 1.3. Terno de Grupo
- **Odd:** 1800x (todas as posições)
- **Cálculo:** `valor_unitário * 1800`
- **Status:** ✅ Correto

### 1.4. Quadra de Grupo
- **Odd:** 5000x (todas as posições)
- **Cálculo:** `valor_unitário * 5000`
- **Status:** ✅ Correto

### 1.5. Quina de Grupo
- **Odd:** 5000x (todas as posições)
- **Cálculo:** `valor_unitário * 5000`
- **Status:** ✅ Correto

### 1.6. Terno de Grupo Seco
- **Odd:** 150x (todas as posições)
- **Cálculo:** `valor_unitário * 150`
- **Status:** ✅ Correto
- **Observação:** Válido apenas do 1º ao 5º prêmio (limitado no código)

---

## 2. Modalidades de NÚMERO

### 2.1. Dezena
- **Odd:** 60x (todas as posições)
- **Cálculo:** `valor_unitário * 60`
- **Status:** ✅ Correto
- **Observação:** Verifica últimos 2 dígitos do prêmio

### 2.2. Centena
- **Odd:** 600x (todas as posições)
- **Cálculo:** `valor_unitário * 600`
- **Status:** ✅ Correto
- **Observação:** Verifica últimos 3 dígitos do prêmio
- **Cotação Especial:** ✅ Suportada (substitui odd normal)

### 2.3. Milhar
- **Odd:** 5000x (1º ao 5º prêmio)
- **Cálculo:** `valor_unitário * 5000`
- **Status:** ✅ Correto
- **Observação:** Verifica 4 dígitos completos do prêmio
- **Cotação Especial:** ✅ Suportada (substitui odd normal)
- **Fórmula com cotação:** `(cotacao_especial / 5000) * premio_calculado`

### 2.4. Dezena Invertida
- **Odd:** 60x (todas as posições)
- **Cálculo:** `valor_unitário * 60`
- **Status:** ✅ Correto
- **Observação:** Gera permutações do número apostado

### 2.5. Centena Invertida
- **Odd:** 600x (todas as posições)
- **Cálculo:** `valor_unitário * 600`
- **Status:** ✅ Correto
- **Observação:** Gera permutações do número apostado

### 2.6. Milhar Invertida
- **Odd:** 200x (1º ao 5º prêmio)
- **Cálculo:** `valor_unitário * 200`
- **Status:** ✅ Correto
- **Observação:** Gera permutações do número apostado (odd reduzida)

### 2.7. Milhar/Centena
- **Odd:** 3300x (1º ao 5º prêmio)
- **Cálculo:** `valor_unitário * 3300`
- **Status:** ✅ Correto
- **Observação:** Aceita 3 ou 4 dígitos, verifica tanto milhar quanto centena
- **Cotação Especial:** ✅ Suportada (verifica milhar e centena)

---

## 3. Modalidades de DEZENA (Combinadas)

### 3.1. Duque de Dezena
- **Odd:** 300x (todas as posições)
- **Cálculo:** `valor_unitário * 300`
- **Status:** ✅ Correto
- **Observação:** Formato "12-23" (2 dezenas diferentes)

### 3.2. Terno de Dezena
- **Odd:** 5000x (todas as posições)
- **Cálculo:** `valor_unitário * 5000`
- **Status:** ✅ Correto
- **Observação:** Formato "12-23-34" (3 dezenas diferentes)

### 3.3. Quadra de Dezena
- **Odd:** 300x (todas as posições)
- **Cálculo:** `valor_unitário * 300`
- **Status:** ✅ Correto
- **Observação:** Formato "12-23-34-45" (4 dezenas diferentes)

### 3.4. Duque de Dezena (EMD)
- **Odd:** 300x (todas as posições)
- **Cálculo:** `valor_unitário * 300`
- **Status:** ✅ Correto
- **Observação:** 
  - Usuário digita milhar de 4 dígitos
  - Sistema extrai 3 dezenas EMD (Esquerda, Meio, Direita)
  - Usuário seleciona 2 das 3 dezenas

### 3.5. Terno de Dezena (EMD)
- **Odd:** 5000x (todas as posições)
- **Cálculo:** `valor_unitário * 5000`
- **Status:** ✅ Correto
- **Observação:** 
  - Usuário digita milhar de 4 dígitos
  - Sistema extrai automaticamente as 3 dezenas EMD

### 3.6. Dezeninha
- **Odd:** Variável (15x, 150x ou 1500x)
- **Cálculo:** Baseado na quantidade de dezenas:
  - 3 dezenas: 15x
  - 4 dezenas: 150x
  - 5 dezenas: 1500x
- **Status:** ✅ Correto
- **Observação:** Multiplicador varia conforme quantidade de dezenas selecionadas

---

## 4. Modalidades PASSE

### 4.1. Passe Vai
- **Odd:** 300x (fixo 1º-2º prêmio)
- **Cálculo:** `valor_unitário * 300`
- **Status:** ✅ Correto
- **Observação:** 
  - Requer 2 grupos diferentes
  - Grupo 1 deve aparecer no 1º prêmio
  - Grupo 2 deve aparecer no 2º prêmio

### 4.2. Passe Vai e Vem
- **Odd:** 150x (fixo 1º-2º prêmio)
- **Cálculo:** `valor_unitário * 150`
- **Status:** ✅ Correto
- **Observação:** 
  - Requer 2 grupos diferentes
  - Grupo 1 no 1º E Grupo 2 no 2º OU
  - Grupo 2 no 1º E Grupo 1 no 2º

---

## 5. Fórmula Geral de Cálculo

### 5.1. Cálculo de Unidades
```typescript
qtd_posicoes = pos_to - pos_from + 1
qtd_combinacoes = calcularCombinacoes(modalidade, palpite)
unidades = qtd_combinacoes * qtd_posicoes
valor_unitario = valor_apostado / unidades
```

### 5.2. Cálculo de Prêmio
```typescript
odd = buscarOdd(modalidade, pos_from, pos_to)
premio_unidade = odd * valor_unitario
acertos = contarAcertos(resultado, palpite, pos_from, pos_to)
premio_total = acertos * premio_unidade
```

### 5.3. Aplicação de Cotação Especial
```typescript
// Apenas para MILHAR, CENTENA e MILHAR_CENTENA
if (esta_cotada && cotacao_especial > 0) {
  premio_total = (cotacao_especial / odd_normal) * premio_total
} else if (esta_cotada && cotacao_especial === null) {
  premio_total = premio_total / 6  // Redução padrão
}
```

---

## 6. Verificações na Liquidação

### 6.1. Processamento de Apostas de Grupo
- ✅ Processa corretamente: GRUPO, DUPLA_GRUPO, TERNO_GRUPO, QUADRA_GRUPO, QUINA_GRUPO
- ✅ Processa: TERNO_GRUPO_SECO (limitado ao 5º prêmio)
- ✅ Processa: PASSE, PASSE_VAI_E_VEM

### 6.2. Processamento de Apostas Numéricas
- ✅ Processa corretamente: DEZENA, CENTENA, MILHAR
- ✅ Processa: DEZENA_INVERTIDA, CENTENA_INVERTIDA, MILHAR_INVERTIDA
- ✅ Processa: MILHAR_CENTENA
- ✅ Processa: DUQUE_DEZENA, TERNO_DEZENA, QUADRA_DEZENA
- ✅ Processa: DUQUE_DEZENA_EMD, TERNO_DEZENA_EMD
- ✅ Processa: DEZENINHA

### 6.3. Aplicação de Cotação Especial
- ✅ Verifica milhar cotada para modalidade MILHAR
- ✅ Verifica centena cotada para modalidade CENTENA
- ✅ Verifica ambas para modalidade MILHAR_CENTENA
- ✅ Aplica cotação especial corretamente (substitui odd normal)
- ✅ Aplica redução de 1/6 se cotada mas sem cotação definida

---

## 7. Inconsistências Encontradas

### 7.1. Valores Exibidos vs Odds Reais

**Status:** ✅ **CORRIGIDO** - Todos os valores agora correspondem às odds reais:

| Modalidade | Valor Exibido | Odd Real | Status |
|------------|---------------|----------|--------|
| Grupo | R$ 18.00 | 18x | ✅ Correto |
| Dupla de Grupo | R$ 180.00 | 180x | ✅ **CORRIGIDO** |
| Terno de Grupo | R$ 1800.00 | 1800x | ✅ **CORRIGIDO** |
| Quadra de Grupo | R$ 5000.00 | 5000x | ✅ **CORRIGIDO** |
| Quina de Grupo | R$ 5000.00 | 5000x | ✅ Correto |
| Milhar | R$ 5000.00 | 5000x | ✅ **CORRIGIDO** |
| Milhar Invertida | R$ 200.00 | 200x | ✅ **CORRIGIDO** |
| Milhar/Centena | R$ 3300.00 | 3300x | ✅ Correto |
| Centena | R$ 600.00 | 600x | ✅ Correto |
| Dezena | R$ 60.00 | 60x | ✅ Correto |
| Passe vai | R$ 300.00 | 300x | ✅ **CORRIGIDO** |
| Passe vai e vem | R$ 150.00 | 150x | ✅ **CORRIGIDO** |

**Observação:** Os valores exibidos são para R$ 1,00 apostado. O cálculo real considera o valor unitário após divisão por posições.

### 7.2. Limitação de Posições

- **Milhar:** Limitado ao 5º prêmio (não tem '1-7')
- **Milhar Invertida:** Limitado ao 5º prêmio
- **Milhar/Centena:** Limitado ao 5º prêmio
- **Terno de Grupo Seco:** Limitado ao 5º prêmio

**Status:** ✅ Correto (conforme regras do jogo)

---

## 8. Recomendações

### 8.1. Correções Realizadas ✅

1. **Valores atualizados em `data/modalities.ts`:**
   - ✅ Dupla de Grupo: R$ 16.00 → R$ 180.00
   - ✅ Terno de Grupo: R$ 150.00 → R$ 1800.00
   - ✅ Quadra de Grupo: R$ 1000.00 → R$ 5000.00
   - ✅ Milhar: R$ 6000.00 → R$ 5000.00
   - ✅ Milhar Invertida: R$ 6000.00 → R$ 200.00
   - ✅ Passe vai: R$ 90.00 → R$ 300.00
   - ✅ Passe vai e vem: R$ 90.00 → R$ 150.00

2. **Documentação:**
   - Os valores exibidos são para R$ 1,00 apostado
   - O cálculo real considera o valor unitário após divisão por posições

### 8.2. Melhorias Sugeridas

1. **Adicionar validação:**
   - Verificar se todas as modalidades têm odds definidas
   - Validar se todas as modalidades são processadas na liquidação

2. **Testes:**
   - Criar testes unitários para cada modalidade
   - Validar cálculo de prêmios com diferentes valores e posições

---

## 9. Conclusão

✅ **A lógica de premiação está funcionando corretamente para todas as modalidades.**

✅ **A aplicação de cotação especial está correta** (substitui odd normal, não multiplica).

✅ **Todos os valores exibidos foram corrigidos** e agora correspondem às odds reais.

✅ **Todas as modalidades são processadas corretamente na liquidação automática e manual.**

### Resumo das Correções Aplicadas:
- ✅ Valores exibidos atualizados para refletir odds reais
- ✅ Cotação especial aplicada corretamente (substitui odd normal)
- ✅ Todas as modalidades funcionando corretamente
- ✅ Documentação completa criada
