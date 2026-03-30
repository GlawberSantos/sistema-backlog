import pool from '../config/database.js';

async function migrarBanco() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`
      ALTER TABLE ordens_servico
        DROP CONSTRAINT IF EXISTS ordens_servico_tipo_servico_check,
        DROP CONSTRAINT IF EXISTS ordens_servico_prioridade_check,
        DROP CONSTRAINT IF EXISTS ordens_servico_status_check
    `);

    await client.query(`
      ALTER TABLE ordens_servico
        ALTER COLUMN endereco DROP NOT NULL,
        ALTER COLUMN bairro DROP NOT NULL,
        ALTER COLUMN cidade DROP NOT NULL
    `);

    await client.query(`
      ALTER TABLE ordens_servico
        ALTER COLUMN endereco SET DEFAULT '',
        ALTER COLUMN bairro SET DEFAULT '',
        ALTER COLUMN cidade SET DEFAULT 'Não informado',
        ALTER COLUMN prioridade SET DEFAULT 'Normal',
        ALTER COLUMN status SET DEFAULT 'AC'
    `);

    await client.query(`UPDATE ordens_servico SET endereco = '' WHERE endereco IS NULL`);
    await client.query(`UPDATE ordens_servico SET bairro = '' WHERE bairro IS NULL`);
    await client.query(`UPDATE ordens_servico SET cidade = 'Não informado' WHERE cidade IS NULL`);

    await client.query('COMMIT');
    console.log('✅ Migração concluída com sucesso!');
    console.log('   - Constraints CHECK removidas de tipo_servico, prioridade e status');
    console.log('   - Campos endereco, bairro e cidade agora são opcionais');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro na migração:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrarBanco().catch(console.error);
