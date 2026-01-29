# 📊 Verificação de Cotações

## 🔍 Status Atual

### Banco de Dados
- **Total de cotações no banco:** 0
- **Status:** ❌ Nenhuma cotação encontrada no banco

### Código (Hardcoded)
As cotações estão definidas no código (`lib/bet-rules-engine.ts`) na função `buscarOdd()`:

| Modalidade | Odd (1-1) | Odd (1-3) | Odd (1-5) | Odd (1-7) |
|------------|-----------|-----------|-----------|-----------|
| **Grupo** | 18x | 18x | 18x | 18x |
| **Dupla de Grupo** | 180x | 180x | 180x | 180x |
| **Terno de Grupo** | 1800x | 1800x | 1800x | 1800x |
| **Quadra de Grupo** | 5000x | 5000x | 5000x | 5000x |
| **Quina de Grupo** | 5000x | 5000x | 5000x | 5000x |
| **Dezena** | 60x | 60x | 60x | 60x |
| **Centena** | 600x | 600x | 600x | 600x |
| **Milhar** | 5000x | 5000x | 5000x | - |
| **Dezena Invertida** | 60x | 60x | 60x | 60x |
| **Centena Invertida** | 600x | 600x | 600x | 600x |
| **Milhar Invertida** | **200x** | **200x** | **200x** | - |
| **Milhar/Centena** | 3300x | 3300x | 3300x | - |
| **Duque de Dezena** | 300x | 300x | 300x | 300x |
| **Terno de Dezena** | 5000x | 5000x | 5000x | 5000x |
| **Quadra de Dezena** | 300x | 300x | 300x | 300x |
| **Duque de Dezena (EMD)** | 300x | 300x | 300x | 300x |
| **Terno de Dezena (EMD)** | 5000x | 5000x | 5000x | 5000x |
| **Passe vai** | 300x | - | - | - |
| **Passe vai e vem** | 150x | - | - | - |
| **Dezeninha** | 15x* | 15x* | 15x* | 15x* |
| **Terno de Grupo Seco** | 150x | 150x | 150x | 150x |

\* Dezeninha varia: 3 dezenas = 15x, 4 dezenas = 150x, 5+ dezenas = 1500x

## ✅ Sincronização

### Cotações no `data/modalities.ts` vs Código

| Modalidade | `data/modalities.ts` | `lib/bet-rules-engine.ts` | Status |
|------------|---------------------|---------------------------|--------|
| Grupo | 1x R$ 18.00 | 18x | ✅ Sincronizado |
| Milhar | 1x R$ 5000.00 | 5000x | ✅ Sincronizado |
| Dupla de Grupo | 1x R$ 180.00 | 180x | ✅ Sincronizado |
| Milhar/Centena | 1x R$ 3300.00 | 3300x | ✅ Sincronizado |
| Terno de Grupo | 1x R$ 1800.00 | 1800x | ✅ Sincronizado |
| Centena | 1x R$ 600.00 | 600x | ✅ Sincronizado |
| Quadra de Grupo | 1x R$ 5000.00 | 5000x | ✅ Sincronizado |
| Dezena | 1x R$ 60.00 | 60x | ✅ Sincronizado |
| Quina de Grupo | 1x R$ 5000.00 | 5000x | ✅ Sincronizado |
| **Milhar Invertida** | **1x R$ 200.00** | **200x** | ✅ **Sincronizado** |
| Duque de Dezena | 1x R$ 300.00 | 300x | ✅ Sincronizado |
| Centena Invertida | 1x R$ 600.00 | 600x | ✅ Sincronizado |
| Terno de Dezena | 1x R$ 5000.00 | 5000x | ✅ Sincronizado |
| Dezena Invertida | 1x R$ 60.00 | 60x | ✅ Sincronizado |
| Passe vai | 1x R$ 300.00 | 300x | ✅ Sincronizado |
| Passe vai e vem | 1x R$ 150.00 | 150x | ✅ Sincronizado |
| Quadra de Dezena | 1x R$ 300.00 | 300x | ✅ Sincronizado |
| Duque de Dezena (EMD) | 1x R$ 300.00 | 300x | ✅ Sincronizado |
| Terno de Dezena (EMD) | 1x R$ 5000.00 | 5000x | ✅ Sincronizado |
| Dezeninha | Variável | 15x-1500x* | ✅ Sincronizado |
| Terno de Grupo Seco | 1x R$ 150.00 | 150x | ✅ Sincronizado |

## 🔧 Problema Identificado

### Retorno Previsto Zerado

O problema de retorno previsto aparecer como R$ 0.00 pode estar relacionado a:

1. **Número não selecionado:** Quando o usuário ainda não selecionou um número, o cálculo pode falhar
2. **Quantidade de palpites zero:** Se `qtdPalpites = 0`, o cálculo pode resultar em divisão por zero ou valores inválidos

### Correção Aplicada

Modificado `BetConfirmation.tsx` para usar `1` como padrão quando não há palpites selecionados:

```typescript
// ANTES:
const qtdPalpites = isNumberModality ? betData.numberBets.length : betData.animalBets.length

// DEPOIS:
const qtdPalpites = isNumberModality 
  ? (betData.numberBets.length || 1) 
  : (betData.animalBets.length || 1)
```

## 📝 Recomendações

1. **Cotações no Banco:** Considerar criar uma tabela de cotações no banco de dados para permitir atualização dinâmica sem precisar alterar código.

2. **Validação:** Adicionar validação para garantir que sempre há pelo menos 1 palpite antes de calcular retorno.

3. **Fallback:** Manter as cotações hardcoded como fallback caso não haja cotações no banco.

## ✅ Conclusão

- ✅ **Cotações sincronizadas:** Todos os valores em `data/modalities.ts` correspondem aos valores em `lib/bet-rules-engine.ts`
- ✅ **Milhar Invertida:** Cotação de 200x está correta em ambos os lugares
- ⚠️ **Banco de dados:** Não há cotações no banco (sistema usa apenas código hardcoded)
- 🔧 **Correção aplicada:** Ajustado cálculo para não falhar quando não há palpites selecionados
