
const { buscarResultadosPosteNoBicho } = require('../lib/postenobicho-api-parser');

async function main() {
  try {
    console.log('Buscando resultados para 22/01/2026 14:00...');
    const resultados = await buscarResultadosPosteNoBicho('2026-01-22', '14');
    console.log(JSON.stringify(resultados, null, 2));
  } catch (error) {
    console.error('Erro:', error);
  }
}

main();
