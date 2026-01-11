// Script para executar no Console do DevTools
// Cole este código no console e pressione Enter

const cards = document.querySelectorAll('button, [role="button"]');
const modalityCards = Array.from(cards).filter(card => {
  const text = card.textContent || '';
  return text.includes('Grupo') || text.includes('Milhar') || text.includes('R$') || text.includes('1x R$');
});

console.log('Total de cards encontrados:', modalityCards.length);

if (modalityCards.length > 0) {
  const firstCard = modalityCards[0];
  const styles = window.getComputedStyle(firstCard);
  
  console.log('\n=== PRIMEIRO CARD DE MODALIDADE ===');
  console.log('Elemento:', firstCard);
  console.log('Classes:', firstCard.className);
  console.log('Padding:', styles.padding);
  console.log('Padding Top:', styles.paddingTop);
  console.log('Padding Right:', styles.paddingRight);
  console.log('Padding Bottom:', styles.paddingBottom);
  console.log('Padding Left:', styles.paddingLeft);
  console.log('Gap:', styles.gap);
  console.log('Font Size:', styles.fontSize);
  console.log('Border Radius:', styles.borderRadius);
  console.log('Width:', styles.width);
  console.log('Height:', styles.height);
  console.log('Border Width:', styles.borderWidth);
  
  // Tentar encontrar o container grid
  const parent = firstCard.parentElement;
  if (parent) {
    const parentStyles = window.getComputedStyle(parent);
    console.log('\n=== CONTAINER (GRID) ===');
    console.log('Elemento:', parent);
    console.log('Classes:', parent.className);
    console.log('Gap:', parentStyles.gap);
    console.log('Grid Template Columns:', parentStyles.gridTemplateColumns);
    console.log('Padding:', parentStyles.padding);
  }
  
  // Retornar objeto com todas as informações
  const result = {
    cardClasses: firstCard.className,
    padding: styles.padding,
    paddingTop: styles.paddingTop,
    paddingRight: styles.paddingRight,
    paddingBottom: styles.paddingBottom,
    paddingLeft: styles.paddingLeft,
    gap: styles.gap,
    fontSize: styles.fontSize,
    borderRadius: styles.borderRadius,
    width: styles.width,
    height: styles.height,
    borderWidth: styles.borderWidth,
    parentClasses: parent ? parent.className : null,
    parentGap: parent ? parentStyles.gap : null,
    parentGridColumns: parent ? parentStyles.gridTemplateColumns : null
  };
  
  console.log('\n=== OBJETO COMPLETO ===');
  console.log(JSON.stringify(result, null, 2));
  
  // Destacar o card no navegador
  firstCard.style.outline = '3px solid red';
  firstCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  return result;
} else {
  console.log('Nenhum card de modalidade encontrado. Tentando buscar por outros seletores...');
  
  // Tentar outros seletores
  const allButtons = document.querySelectorAll('button');
  console.log('Total de botões na página:', allButtons.length);
  
  allButtons.forEach((btn, index) => {
    const text = btn.textContent || '';
    if (text.includes('R$') || text.length < 50) {
      console.log(`Botão ${index}:`, text.substring(0, 30), 'Classes:', btn.className);
    }
  });
}
