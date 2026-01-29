
import { buscarResultadosRJPosteNoBicho } from '../lib/postenobicho-api-parser';

async function verificarAPI() {
  const hoje = '2026-01-24'; // Data de hoje conforme imagem
  console.log(`Verificando API para ${hoje}...`);
  
  try {
    const resultados = await buscarResultadosRJPosteNoBicho(hoje);
    
    if (resultados.length === 0) {
      console.log('❌ Nenhum resultado encontrado na API para hoje.');
    } else {
      console.log(`✅ Encontrados ${resultados.length} resultados para RJ:`);
      resultados.forEach(r => {
        console.log(`- Horário: ${r.horario} (Loteria: ${r.loteria}) - Prêmios: ${r.premios.length}`);
      });
    }
  } catch (error) {
    console.error('Erro ao consultar API:', error);
  }
}

verificarAPI();
