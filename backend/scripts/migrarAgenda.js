import pool from '../config/database.js';

async function migrarAgenda() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS agendas (
        id SERIAL PRIMARY KEY,
        data_agenda DATE NOT NULL,
        tecnico_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        equipe VARCHAR(255),
        criado_por INTEGER REFERENCES usuarios(id),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(data_agenda, tecnico_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS agenda_itens (
        id SERIAL PRIMARY KEY,
        agenda_id INTEGER NOT NULL REFERENCES agendas(id) ON DELETE CASCADE,
        pedido_id VARCHAR(100) NOT NULL,
        id_draft VARCHAR(100),
        empresa_responsavel VARCHAR(255),
        cliente VARCHAR(255),
        endereco TEXT,
        cidade VARCHAR(255),
        servico VARCHAR(255),
        site VARCHAR(100),
        alteracao_projeto BOOLEAN DEFAULT FALSE,
        alteracao_cto BOOLEAN DEFAULT FALSE,
        abordagem BOOLEAN DEFAULT FALSE,
        dgo VARCHAR(50),
        fo VARCHAR(50),
        rede_lancada VARCHAR(100),
        rede_interna VARCHAR(100),
        rede_existente VARCHAR(100),
        enlace_total VARCHAR(100),
        responsavel_local VARCHAR(255),
        contato_local VARCHAR(100),
        status_servico VARCHAR(100) DEFAULT 'PENDENTE',
        observacoes TEXT,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS agenda_fotos (
        id SERIAL PRIMARY KEY,
        agenda_item_id INTEGER NOT NULL REFERENCES agenda_itens(id) ON DELETE CASCADE,
        nome_arquivo VARCHAR(255) NOT NULL,
        caminho VARCHAR(500) NOT NULL,
        tipo VARCHAR(50),
        enviado_por INTEGER REFERENCES usuarios(id),
        enviado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query('COMMIT');
    console.log('✅ Tabelas de agenda criadas com sucesso!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrarAgenda().catch(console.error);
