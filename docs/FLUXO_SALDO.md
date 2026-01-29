# 💰 Fluxo de Saldo - Documentação

## ✅ Confirmação: O fluxo está CORRETO!

### 1. 📥 **Depósito (Crédito)**
Quando o usuário faz um depósito via PIX:

1. **Geração do QR Code** (`/api/deposito/pix-nxgate`):
   - Cria uma transação com status `pendente`
   - Não credita saldo ainda (aguarda confirmação)

2. **Confirmação via Webhook** (`/api/webhooks/nxgate`):
   - Quando Nxgate envia webhook com `status: "paid"`
   - **Credita o saldo**: `saldo: { increment: transacao.valor + bonusValue }`
   - Aplica bônus de primeiro depósito (se aplicável)
   - Atualiza transação para `status: 'pago'`

**Arquivo**: `app/api/webhooks/nxgate/route.ts` (linhas 90-96)

---

### 2. 🎲 **Aposta (Débito)**
Quando o usuário faz uma aposta:

1. **Validação** (`/api/apostas`):
   - Verifica saldo suficiente
   - Calcula valor total (considerando divisão "each" ou "all")

2. **Débito do Saldo**:
   - **Debita primeiro do saldo**: `debitarSaldo = Math.min(saldoDisponivel, valorTotalParaDebitar)`
   - **Depois debita do bônus** (se necessário): `debitarBonus = restante`
   - Atualiza saldo: `saldo: usuario.saldo - debitarSaldo`
   - Atualiza bônus: `bonus: usuario.bonus - debitarBonus`

**Arquivo**: `app/api/apostas/route.ts` (linhas 213-388)

---

### 3. 💸 **Saque (Débito)**
Quando o usuário solicita um saque:

1. **Validação** (`/api/saque/pix-nxgate`):
   - Verifica saldo suficiente
   - Valida limites mínimo/máximo

2. **Débito Imediato**:
   - **Debita saldo**: `saldo: { decrement: valor }`
   - Cria registro de saque com status `pendente`
   - Aguarda confirmação do gateway

3. **Confirmação via Webhook**:
   - Se `status: "saque-pago"`: Mantém débito (já foi debitado)
   - Se `status: "saque-falhou"`: **Estorna saldo**: `saldo: { increment: saque.valor }`

**Arquivo**: `app/api/saque/pix-nxgate/route.ts` (linha 130-131)
**Arquivo**: `app/api/webhooks/nxgate/route.ts` (linhas 175-194)

---

### 4. 🏆 **Prêmio de Aposta (Crédito)**
Quando uma aposta é ganha (liquidação):

1. **Liquidação** (`/api/resultados/liquidar`):
   - Calcula prêmio total
   - **Credita prêmio**: `saldo: { increment: premioTotalAposta }`

**Arquivo**: `app/api/resultados/liquidar/route.ts` (linhas 1123-1131)

---

## 📊 Resumo do Fluxo

| Ação | Quando | Operação | Arquivo |
|------|--------|----------|---------|
| **Depósito** | Webhook confirma pagamento | `saldo: { increment: valor + bonus }` | `webhooks/nxgate/route.ts` |
| **Aposta** | Usuário cria aposta | `saldo: usuario.saldo - debitarSaldo` | `apostas/route.ts` |
| **Saque** | Usuário solicita saque | `saldo: { decrement: valor }` | `saque/pix-nxgate/route.ts` |
| **Saque Falhou** | Webhook confirma falha | `saldo: { increment: valor }` (estorno) | `webhooks/nxgate/route.ts` |
| **Prêmio** | Aposta é liquidada | `saldo: { increment: premioTotal }` | `resultados/liquidar/route.ts` |

---

## ✅ Conclusão

**SIM, o fluxo está CORRETO:**

- ✅ **Depósito credita saldo** quando webhook confirma pagamento
- ✅ **Aposta debita saldo** quando usuário cria aposta
- ✅ **Saque debita saldo** quando usuário solicita
- ✅ **Prêmio credita saldo** quando aposta é liquidada

Todas as operações estão dentro de transações Prisma para garantir atomicidade e consistência dos dados.
