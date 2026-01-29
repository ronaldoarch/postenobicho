# ✅ Verificação do Cálculo de Premiação

## Exemplo Testado

**Dados da aposta:**
- Modalidade: Grupo
- Posição: 1º ao 5º
- Palpites: 4 grupos
- Valor por palpite: R$ 10,00
- Valor total: R$ 40,00
- Retorno previsto esperado: R$ 144,00

## Cálculo Passo a Passo

### 1. Valor por Palpite
- Valor total: R$ 40,00
- Quantidade de palpites: 4
- Tipo de divisão: `all` (divide entre todos)
- **Valor por palpite: R$ 40,00 ÷ 4 = R$ 10,00** ✅

### 2. Unidades por Palpite
- Combinações: 1 (Grupo simples não é combinado)
- Posições: 5 (1º ao 5º)
- **Unidades por palpite: 1 × 5 = 5 unidades** ✅

### 3. Valor Unitário
- Valor por palpite: R$ 10,00
- Unidades: 5
- **Valor unitário: R$ 10,00 ÷ 5 = R$ 2,00** ✅

### 4. Cotação (Odd)
- Modalidade: GRUPO
- Posição: 1º-5º
- **Odd: 18x** ✅

### 5. Prêmio por Unidade
- Odd: 18x
- Valor unitário: R$ 2,00
- **Prêmio por unidade: 18 × R$ 2,00 = R$ 36,00** ✅

### 6. Retorno por Palpite (assumindo 1 acerto)
- Acertos: 1
- Prêmio por unidade: R$ 36,00
- **Retorno por palpite: 1 × R$ 36,00 = R$ 36,00** ✅

### 7. Retorno Total
- Quantidade de palpites: 4
- Retorno por palpite: R$ 36,00
- **Retorno total: 4 × R$ 36,00 = R$ 144,00** ✅

## ✅ Resultado

**O cálculo está CORRETO!**

O sistema calcula exatamente como esperado:
- ✅ Valor unitário correto
- ✅ Odd correta (18x para Grupo 1º-5º)
- ✅ Prêmio por unidade correto
- ✅ Retorno por palpite correto
- ✅ Retorno total correto

## Código Verificado

### Funções Principais:
1. **`calcularValorPorPalpite()`** - Calcula valor por palpite baseado no tipo de divisão
2. **`calcularGrupo()`** - Calcula unidades e valor unitário para modalidades de grupo
3. **`buscarOdd()`** - Busca a odd (multiplicador) da modalidade
4. **`calcularPremioUnidade()`** - Calcula prêmio por unidade (odd × valor unitário)
5. **`calcularPremioPalpite()`** - Calcula prêmio total do palpite (acertos × prêmio por unidade)

### Localização no Código:
- `lib/bet-rules-engine.ts` - Funções de cálculo
- `components/BetFlow.tsx` - Cálculo do retorno previsto (linhas 293-429)

## Observações

1. **Tipo de Divisão**: O cálculo assume divisão `all` (divide o valor entre todos os palpites). Se for `each`, cada palpite teria o valor total.

2. **Assunção de Acerto**: O retorno previsto assume que cada palpite ganha 1 vez. Isso é uma estimativa para mostrar ao usuário o potencial retorno.

3. **Cálculo Real vs Previsto**: O cálculo real na liquidação usa a função `conferirPalpite()` que verifica quantos acertos realmente ocorreram no resultado.

## Teste Realizado

Execute o script de teste para verificar:
```bash
npx tsx scripts/test-calculo-premio-completo.ts
```

Resultado esperado:
```
✅ CÁLCULO CORRETO!
Retorno calculado: R$ 144.00
Retorno esperado: R$ 144,00
```
