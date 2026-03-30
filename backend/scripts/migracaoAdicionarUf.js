import db from '../config/database.js';

async function adicionarColumnaUf() {
  try {
    // Verificar se a coluna já existe
    const result = await db.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='ordens_servico' AND column_name='uf'
      )
    `);

    if (!result.rows[0].exists) {
      // Adicionar coluna UF com valor padrão 'SP'
      await db.query(`
        ALTER TABLE ordens_servico
        ADD COLUMN uf TEXT DEFAULT 'SP'
      `);
      console.log('✅ Coluna UF adicionada com sucesso!');

      // Criar índice para melhor performance
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_os_uf ON ordens_servico(uf)
      `);
      console.log('✅ Índice criado com sucesso!');
    } else {
      console.log('ℹ️  Coluna UF já existe.');
    }
  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
    throw error;
  }
}

export default adicionarColumnaUf;
