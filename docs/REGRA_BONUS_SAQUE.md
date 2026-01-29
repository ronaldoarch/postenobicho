# 🎁 Regra de Bônus e Saque

## 📋 Resumo da Regra

**O usuário só pode sacar depois de gastar todo o saldo e o bônus bloqueado.**

### Regras Adicionais:
1. **Usuário precisa apostar pelo menos uma vez com saldo real antes de usar bônus**
2. **Usuário precisa apostar pelo menos uma vez (saldo ou bônus) antes de poder sacar**

## 🔒 Como Funciona

### 1. **Quando o usuário recebe bônus** (primeiro depósito):
- `saldo` é incrementado com `valor do depósito + bônus`
- `bonus` é incrementado com `valor do bônus`
- `bonusBloqueado` é incrementado com `valor do bônus` (mesmo valor)
- `rolloverNecessario` é incrementado com `(valor do depósito + bônus) × 3` (rollover 3x)
- `rolloverAtual` começa em `0`

### 2. **Quando o usuário aposta**:
- ❌ **Bloqueado usar bônus** se:
  - Tentar usar bônus (`useBonus = true`) mas ainda não apostou com saldo real (`jaApostouComSaldoReal = false`)
  - Mensagem: "Você precisa apostar pelo menos uma vez com saldo real antes de usar o bônus"
- ✅ **Permitido usar bônus** se:
  - Já apostou com saldo real (`jaApostouComSaldoReal = true`)
- O sistema debita primeiro do `saldo`, depois do `bonus`
- `rolloverAtual` é incrementado com o valor apostado
- Marca `jaApostouComSaldoReal = true` se debitou saldo real
- Marca `jaApostou = true` se debitou saldo ou bônus
- **Se `rolloverAtual >= rolloverNecessario`**: 
  - `bonusBloqueado` é zerado (bônus liberado)
  - `rolloverNecessario` é zerado
  - O usuário agora pode sacar normalmente

### 3. **Quando o usuário tenta sacar**:
- ❌ **Bloqueado** se:
  - `jaApostou = false` (nunca apostou)
  - Mensagem: "Você precisa apostar pelo menos uma vez antes de poder sacar"
  - OU `bonusBloqueado > 0` E `rolloverAtual < rolloverNecessario` (tem bônus bloqueado e rollover pendente)
- ✅ **Permitido** se:
  - `jaApostou = true` (já apostou pelo menos uma vez)
  - E (`bonusBloqueado === 0` OU `rolloverAtual >= rolloverNecessario`)

## 📊 Exemplo Prático

### Cenário 1: Usuário recebe bônus
- Depósito: R$ 100,00
- Bônus: R$ 50,00 (50% até R$ 100)
- Estado inicial:
  - `saldo`: R$ 150,00
  - `bonus`: R$ 50,00
  - `bonusBloqueado`: R$ 50,00
  - `rolloverNecessario`: R$ 450,00 (150 × 3)
  - `rolloverAtual`: R$ 0,00

### Cenário 2: Usuário aposta R$ 200,00
- Estado após aposta:
  - `saldo`: R$ 0,00 (debitou R$ 150 do saldo)
  - `bonus`: R$ 0,00 (debitou R$ 50 do bônus)
  - `bonusBloqueado`: R$ 50,00 (ainda bloqueado)
  - `rolloverAtual`: R$ 200,00
  - **Saque**: ❌ Bloqueado (rollover pendente: falta R$ 250,00)

### Cenário 3: Usuário aposta mais R$ 250,00
- Estado após aposta:
  - `saldo`: R$ 0,00
  - `bonus`: R$ 0,00
  - `bonusBloqueado`: R$ 0,00 ✅ (liberado!)
  - `rolloverAtual`: R$ 450,00
  - `rolloverNecessario`: R$ 0,00 ✅ (completado!)
  - **Saque**: ✅ Permitido (rollover completo)

## 🔧 Implementação Técnica

### Arquivos Modificados:
1. **`prisma/schema.prisma`**:
   - Adiciona campo `jaApostouComSaldoReal Boolean @default(false)`
   - Adiciona campo `jaApostou Boolean @default(false)`

2. **`app/api/saque/pix-nxgate/route.ts`**:
   - Adiciona validação de `jaApostou` (bloqueia se nunca apostou)
   - Adiciona validação de `bonusBloqueado` e `rolloverNecessario`
   - Bloqueia saque se houver bônus bloqueado e rollover pendente

3. **`app/api/apostas/route.ts`**:
   - Adiciona validação para bloquear uso de bônus se não apostou com saldo real ainda
   - Marca `jaApostouComSaldoReal = true` quando debita saldo real
   - Marca `jaApostou = true` quando debita saldo ou bônus
   - Adiciona lógica para liberar `bonusBloqueado` quando `rolloverAtual >= rolloverNecessario`
   - Zera `rolloverNecessario` quando completo

### Validação de Uso de Bônus:
```typescript
if (useBonusFlag && bonusDisponivel > 0 && !usuario.jaApostouComSaldoReal) {
  throw new Error('Você precisa apostar pelo menos uma vez com saldo real antes de usar o bônus')
}
```

### Validação de Saque:
```typescript
if (!user.jaApostou) {
  return error('Você precisa apostar pelo menos uma vez antes de poder sacar.')
}

if (bonusBloqueado > 0 && !rolloverCompleto) {
  return error('Você ainda possui bônus bloqueado. Complete o rollover para liberar o bônus e poder sacar.')
}
```

### Liberação de Bônus:
```typescript
if (bonusBloqueadoFinal > 0 && novoRolloverAtual >= rolloverNecessario && rolloverNecessario > 0) {
  bonusLiberado = bonusBloqueadoFinal
  bonusBloqueadoFinal = 0
  rolloverNecessario = 0
}
```

## ✅ Benefícios

1. **Previne abuso**: Usuários não podem sacar bônus sem apostar
2. **Garante engajamento**: Usuários precisam completar o rollover para sacar
3. **Transparência**: Mensagens claras sobre o que falta para liberar o bônus
