import pool from '../config/database.js';

async function adicionarUfOrdensServico() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verificar se a coluna já existe
    const { rows } = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='ordens_servico' AND column_name='uf'
    `);

    if (rows.length === 0) {
      // Adicionar coluna UF
      await client.query(`
        ALTER TABLE ordens_servico
        ADD COLUMN uf TEXT DEFAULT 'SP'
      `);
      console.log('✅ Coluna UF adicionada com sucesso!');
    } else {
      console.log('ℹ️  Coluna UF já existe.');
    }

    // Criar índice para melhor performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_os_uf ON ordens_servico(uf)
    `);

    await client.query('COMMIT');
    console.log('✅ Migração concluída com sucesso!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro na migração:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

adicionarUfOrdensServico().catch(console.error);
