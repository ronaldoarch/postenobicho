# Diferenças Críticas: Modalidades - Original vs Nossa Implementação

## 🔴 DIFERENÇA PRINCIPAL: Tabs

### Site Original (https://pontodobicho.com/jogo-do-bicho)
- **NÃO TEM TABS** "Bicho" e "Loterias"
- Título direto: **"Modalidade:"**
- Instrução: "Para começar, escolha a modalidade de jogo."
- Botão "📊 Cotações Especiais" ao lado do título

### Nossa Implementação
- **TEM TABS** "Bicho" e "Loterias" ❌ INCORRETO
- Título: "Selecione a modalidade:"
- Subtítulo: "Escolha o tipo de aposta que deseja realizar."

**CORREÇÃO NECESSÁRIA:** Remover as tabs e mostrar todas as modalidades diretamente

---

## 📊 Modalidades: Original vs Nossa

### Site Original (16 modalidades):
**Coluna Esquerda:**
1. Grupo - 1x R$ 18.00
2. Dupla de Grupo - 1x R$ 16.00
3. Terno de Grupo - 1x R$ 150.00
4. Quadra de Grupo - 1x R$ 1000.00
5. Quina de Grupo - 1x R$ 5000.00
6. Duque de Dezena - 1x R$ 300.00
7. Terno de Dezena - 1x R$ 5000.00
8. Passe vai - 1x R$ 90.00

**Coluna Direita:**
9. Milhar - 1x R$ 6000.00
10. Milhar/Centena - 1x R$ 3300.00
11. Centena - 1x R$ 600.00
12. Dezena - 1x R$ 60.00
13. Milhar Invertida - 1x R$ 6000.00
14. Centena Invertida - 1x R$ 600.00
15. Dezena Invertida - 1x R$ 60.00
16. Passe vai e vem - 1x R$ 90.00

**Total: 16 modalidades**

### Nossa Implementação (6 modalidades):
1. Grupo - 1x R$ 18.00 ✅
2. Milhar - 1x R$ 6000.00 ✅
3. Centena - 1x R$ 600.00 ✅
4. Dezena - 1x R$ 60.00 ✅
5. Passe-vai 1/2 - 1x R$ 160.00 ❌ (nome diferente: "Passe vai" é R$ 90.00)
6. Passe-vai 1/5 - 1x R$ 90.00 ❌ (pode ser "Passe vai e vem")

**Total: 6 modalidades**

---

## ❌ Modalidades Faltando na Nossa Implementação:

1. **Dupla de Grupo** - 1x R$ 16.00
2. **Terno de Grupo** - 1x R$ 150.00
3. **Quadra de Grupo** - 1x R$ 1000.00
4. **Quina de Grupo** - 1x R$ 5000.00
5. **Duque de Dezena** - 1x R$ 300.00
6. **Terno de Dezena** - 1x R$ 5000.00
7. **Passe vai** - 1x R$ 90.00
8. **Milhar/Centena** - 1x R$ 3300.00
9. **Milhar Invertida** - 1x R$ 6000.00
10. **Centena Invertida** - 1x R$ 600.00
11. **Dezena Invertida** - 1x R$ 60.00
12. **Passe vai e vem** - 1x R$ 90.00

**Total faltando: 12 modalidades**

---

## 🔍 Diferenças de Nomenclatura:

| Original | Nossa | Status |
|----------|-------|--------|
| Passe vai | Passe-vai 1/2 | ❌ Nome diferente |
| Passe vai e vem | Passe-vai 1/5 | ❌ Nome diferente |

---

## 📋 Ações Necessárias:

1. **URGENTE:** Remover tabs "Bicho" e "Loterias"
2. **URGENTE:** Adicionar as 12 modalidades faltantes
3. Corrigir nomenclatura das modalidades "Passe vai"
4. Atualizar layout para 2 colunas (conforme original)
5. Ajustar título e instruções para corresponder ao original
