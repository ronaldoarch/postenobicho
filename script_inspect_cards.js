// Script para inspecionar cards de modalidades no site original
// Execute este script no Console do DevTools após a página carregar completamente

(function() {
  console.log('🔍 Iniciando inspeção dos cards de modalidades...');
  
  // Aguarda a página carregar completamente
  setTimeout(() => {
    // Tenta encontrar os cards de várias formas
    const selectors = [
      'button[class*="grid"]', // Botões em grid
      'button[class*="border"]', // Botões com border
      '[class*="modalidade"]', // Elementos com "modalidade" no class
      'button', // Todos os botões
    ];
    
    let cards = [];
    
    // Procura pelos cards
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        const text = el.textContent || '';
        // Filtra cards que contenham nomes de modalidades ou valores
        if (
          text.includes('Grupo') || 
          text.includes('Milhar') || 
          text.includes('Centena') ||
          text.includes('Dezena') ||
          text.includes('R$') ||
          (text.match(/\d+x R\$ \d+/) && text.length < 100)
        ) {
          // Evita duplicatas
          if (!cards.find(c => c.element === el)) {
            cards.push({ element: el, text: text.trim() });
          }
        }
      });
    });
    
    console.log(`✅ Encontrados ${cards.length} cards`);
    
    if (cards.length > 0) {
      const firstCard = cards[0].element;
      const styles = window.getComputedStyle(firstCard);
      const parent = firstCard.parentElement;
      const parentStyles = parent ? window.getComputedStyle(parent) : null;
      
      // Extrai informações detalhadas
      const info = {
        // Classes do card
        cardClasses: firstCard.className,
        
        // Padding
        padding: styles.padding,
        paddingTop: styles.paddingTop,
        paddingRight: styles.paddingRight,
        paddingBottom: styles.paddingBottom,
        paddingLeft: styles.paddingLeft,
        
        // Margin
        margin: styles.margin,
        marginTop: styles.marginTop,
        marginBottom: styles.marginBottom,
        
        // Gap do grid
        parentGap: parentStyles ? parentStyles.gap : null,
        parentColumnGap: parentStyles ? parentStyles.columnGap : null,
        parentRowGap: parentStyles ? parentStyles.rowGap : null,
        
        // Grid
        parentDisplay: parentStyles ? parentStyles.display : null,
        parentGridTemplateColumns: parentStyles ? parentStyles.gridTemplateColumns : null,
        
        // Font
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        lineHeight: styles.lineHeight,
        
        // Border
        border: styles.border,
        borderWidth: styles.borderWidth,
        borderRadius: styles.borderRadius,
        borderColor: styles.borderColor,
        
        // Dimensões
        width: styles.width,
        height: styles.height,
        minHeight: styles.minHeight,
        
        // Layout
        display: styles.display,
        flexDirection: styles.flexDirection,
        alignItems: styles.alignItems,
        justifyContent: styles.justifyContent,
        
        // Cores
        backgroundColor: styles.backgroundColor,
        color: styles.color,
      };
      
      // Destaca o card no navegador
      firstCard.style.outline = '3px solid red';
      firstCard.style.outlineOffset = '2px';
      
      console.log('📊 Informações do primeiro card:');
      console.table(info);
      
      console.log('\n📋 JSON completo:');
      console.log(JSON.stringify(info, null, 2));
      
      // Copia para clipboard se possível
      try {
        navigator.clipboard.writeText(JSON.stringify(info, null, 2));
        console.log('\n✅ JSON copiado para a área de transferência!');
      } catch (e) {
        console.log('\n⚠️ Não foi possível copiar automaticamente. Copie manualmente o JSON acima.');
      }
      
      return info;
    } else {
      console.warn('❌ Nenhum card encontrado. A página pode ainda estar carregando.');
      console.log('💡 Dica: Execute este script novamente após alguns segundos.');
      return null;
    }
  }, 3000); // Aguarda 3 segundos para a página carregar
})();
