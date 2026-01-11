# Diferenças de Design: Modalidades

## Site Original (https://pontodobicho.com/jogo-do-bicho)

### Layout e Estrutura:
1. **Título**: "Modalidade:" (singular, sem "Selecione a")
2. **Instrução**: "Para começar, escolha a modalidade de jogo."
3. **Botão "Cotações Especiais"**: Está ao lado direito do título "Modalidade:"
4. **Grid**: 2 colunas fixas (8 modalidades em cada coluna)
5. **Design dos cards**: Mais simples, cards em botões retangulares

### Design dos Cards:
- Cards retangulares simples
- Nome da modalidade em cima
- Valor abaixo do nome
- Cada card é um botão clicável
- Modalidade "Milhar" tem ícone de chama vermelha ao lado do valor

---

## Nossa Implementação Atual

### Layout e Estrutura:
1. **Título**: "Selecione a modalidade:" ❌ DIFERENTE
2. **Instrução**: "Escolha o tipo de aposta que deseja realizar." ❌ DIFERENTE
3. **Botão "Cotações Especiais"**: Está abaixo das modalidades ❌ DIFERENTE
4. **Grid**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` (3 colunas em telas grandes) ❌ DIFERENTE
5. **Design dos cards**: Cards mais elaborados com bordas e sombras

---

## Correções Necessárias:

1. ✅ Mudar título para "Modalidade:"
2. ✅ Mudar instrução para "Para começar, escolha a modalidade de jogo."
3. ✅ Mover botão "Cotações Especiais" para ao lado do título
4. ✅ Ajustar grid para 2 colunas fixas
5. ✅ Simplificar design dos cards
