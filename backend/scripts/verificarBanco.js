import db from '../config/database.js';
import adicionarColumnaUf from './migracaoAdicionarUf.js';

async function inicializarBanco() {
  try {
    console.log('🔧 Iniciando verificações do banco de dados...');
    
    // Executar migração para adicionar coluna UF
    await adicionarColumnaUf();
    
    console.log('✅ Banco de dados pronto!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error);
    process.exit(1);
  }
}

inicializarBanco();
