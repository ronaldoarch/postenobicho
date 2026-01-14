# Changelog - Modificações da Plataforma JB (Licenciada)

## Resumo Geral

Este documento descreve todas as modificações implementadas na plataforma conforme especificações.

---

## 🔧 Modificações Implementadas

### 1. Mudança de Nome do Projeto

- **Nome anterior:** Lot Bicho
- **Nome atual:** Poste no Bicho
- **Arquivos modificados:**
  - `package.json` - Nome do pacote atualizado
  - `README.md` - Documentação atualizada
  - `prisma/schema.prisma` - Configuração padrão atualizada

---

### 2. Novas Modalidades Adicionadas

#### 2.1. Quadra de Dezena
- **ID:** 17
- **Cotação:** 1x R$ 300.00
- **Tipo:** `QUADRA_DEZENA`
- **Status:** ✅ Implementado

#### 2.2. Duque de Dezena (EMD)
- **ID:** 18
- **Cotação:** 1x R$ 300.00
- **Tipo:** `DUQUE_DEZENA_EMD`
- **Descrição:** Esquerda, Meio e Direita
- **Status:** ✅ Implementado

#### 2.3. Terno de Dezena (EMD)
- **ID:** 19
- **Cotação:** 1x R$ 5000.00
- **Tipo:** `TERNO_DEZENA_EMD`
- **Descrição:** Esquerda, Meio e Direita
- **Status:** ✅ Implementado

#### 2.4. Dezeninha
- **ID:** 20
- **Cotação:** Variável (conforme quantidade de dezenas)
- **Tipo:** `DEZENINHA`
- **Multiplicadores:**
  - 3 dezenas → 15x1
  - 4 dezenas → 150x1
  - 5 dezenas → 1500x1
- **Status:** ✅ Implementado

#### 2.5. Terno de Grupo Seco
- **ID:** 21
- **Cotação:** 1x R$ 150.00
- **Tipo:** `TERNO_GRUPO_SECO`
- **Descrição:** Modalidade independente da Dezeninha, válida do 1º ao 5º prêmio
- **Status:** ✅ Implementado

---

### 3. Sistema de Descarga / Controle de Banca

#### 3.1. Funcionamento
- **Controle por:** Modalidade e Prêmio (1º ao 5º)
- **Comportamento:** Não bloqueia apostas, apenas gera alertas
- **Arquivos criados:**
  - `lib/descarga.ts` - Lógica de controle de banca
  - `app/api/admin/descarga/route.ts` - API para gerenciar limites

#### 3.2. Modelos de Dados (Prisma)
- **LimiteDescarga:** Define limites por modalidade e prêmio
- **AlertaDescarga:** Registra quando limites são excedidos

#### 3.3. Funcionalidades
- ✅ Definir limite por modalidade e prêmio
- ✅ Verificar limite ao criar apostas
- ✅ Gerar alertas quando limite é excedido
- ✅ Visualizar alertas no painel ADM
- ✅ Marcar alertas como resolvidos

---

### 4. Milhar e Centena Cotadas

#### 4.1. Regra Implementada
- **Verificação:** Ocorre somente no momento da apuração
- **Cálculo:** Se milhar/centena estiver cotada, paga 1/6 do valor da cotação normal
- **Exemplo:**
  - Milhar 2026 está cotada
  - Jogador aposta R$ 1,00
  - Cotação normal: R$ 4.000
  - Valor pago: 4.000 ÷ 6 = 666,67

#### 4.2. Arquivos Criados
- `lib/cotacao.ts` - Funções para verificar cotações
- `app/api/admin/cotacoes-especiais/route.ts` - API para gerenciar cotações

#### 4.3. Modelo de Dados (Prisma)
- **CotacaoEspecial:** Armazena milhares e centenas cotadas
  - Tipo: 'milhar' ou 'centena'
  - Número: Número cotado (formatado)
  - Ativo: Boolean

---

### 5. Atualizações no Motor de Regras

#### 5.1. Novas Funções
- `calcularMultiplicadorDezeninha()` - Calcula multiplicador baseado na quantidade de dezenas
- `verificarMilharCotada()` - Verifica se milhar está cotada
- `verificarCentenaCotada()` - Verifica se centena está cotada
- `calcularPremioUnidade()` - Atualizada para aplicar redução de 1/6 quando cotada

#### 5.2. Tipos Atualizados
- Adicionados novos tipos de modalidade ao `ModalityType`
- Suporte completo para todas as novas modalidades

---

## 📊 Estrutura de Banco de Dados

### Novos Modelos Prisma

```prisma
model LimiteDescarga {
  id              Int      @id @default(autoincrement())
  modalidade      String
  premio          Int      // 1 ao 5
  limite          Float
  ativo           Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([modalidade, premio])
  @@index([modalidade])
}

model AlertaDescarga {
  id              Int      @id @default(autoincrement())
  modalidade      String
  premio          Int
  valorAtual      Float
  limite          Float
  excedente       Float
  resolvido       Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([modalidade, premio])
  @@index([resolvido])
  @@index([createdAt])
}

model CotacaoEspecial {
  id              Int      @id @default(autoincrement())
  tipo            String   // 'milhar' ou 'centena'
  numero          String   // Número cotado
  ativo           Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([tipo, numero])
  @@index([tipo, ativo])
}
```

---

## 🚀 Próximos Passos

### Migração do Banco de Dados
```bash
npx prisma migrate dev --name adicionar_modificacoes_jb
```

### Configuração Inicial
1. Criar limites de descarga via API `/api/admin/descarga`
2. Cadastrar cotações especiais via API `/api/admin/cotacoes-especiais`
3. Configurar modalidades no banco de dados

---

## 📝 Notas Importantes

1. **Sistema de Descarga:** Não bloqueia apostas, apenas gera alertas. O administrador deve monitorar e fazer descarga manual quando necessário.

2. **Cotações Especiais:** A verificação de cotação ocorre apenas na apuração, não interfere na criação da aposta.

3. **Dezeninha:** Os multiplicadores variam conforme a quantidade de dezenas selecionadas (3, 4 ou 5 dezenas).

4. **Terno de Grupo Seco:** É uma modalidade independente da Dezeninha, válida apenas do 1º ao 5º prêmio.

---

## ✅ Checklist de Implementação

- [x] Mudança de nome do projeto
- [x] Adicionar novas modalidades
- [x] Implementar sistema de descarga
- [x] Implementar verificação de cotações especiais
- [x] Atualizar motor de regras
- [x] Criar APIs de administração
- [x] Atualizar tipos TypeScript
- [ ] Criar migração do banco de dados
- [ ] Testes das novas funcionalidades
- [ ] Documentação de uso

---

**Data de Implementação:** 2025-01-27
**Versão:** 1.1.0
