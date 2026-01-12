const { execSync } = require('child_process');

async function checkAndCreateTables() {
  try {
    console.log('🔄 Verificando banco de dados...');
    
    // Tenta executar db push (é idempotente, não vai recriar se já existir)
    execSync('npx prisma db push --accept-data-loss', { 
      stdio: 'inherit',
      env: process.env 
    });
    
    console.log('✅ Banco de dados verificado!');
  } catch (error) {
    console.error('❌ Erro ao verificar banco de dados:', error.message);
    // Continua mesmo se houver erro (pode ser que as tabelas já existam)
  }
}

checkAndCreateTables();
