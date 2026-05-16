import db from '../config/database.js';
import bcrypt from 'bcryptjs';

const dropTables = async (client) => {
  console.log('Limpando banco de dados (removendo tabelas existentes)...');
  await client.query('DROP TABLE IF EXISTS anexos, observacoes, ordens_servico, usuarios CASCADE;');
  console.log('Tabelas removidas com sucesso.');
};

const createTables = async (client) => {
  console.log('Criando tabelas...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL,
      tipo_usuario TEXT NOT NULL CHECK(tipo_usuario IN ('Administrador', 'Supervisor', 'Técnico')),
      uf TEXT,
      data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ordens_servico (
      id SERIAL PRIMARY KEY,
      numero_os TEXT UNIQUE NOT NULL,
      cliente TEXT NOT NULL,
      endereco TEXT DEFAULT '',
      bairro TEXT DEFAULT '',
      cidade TEXT DEFAULT 'Não informado',
      tipo_servico TEXT NOT NULL,
      prioridade TEXT NOT NULL DEFAULT 'Normal',
      status TEXT NOT NULL DEFAULT 'Aberto',
      tecnico_responsavel INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
      data_abertura DATE NOT NULL,
      prazo DATE,
      data_conclusao DATE,
      hora_inicio TIME,
      hora_fim TIME,
      data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS observacoes (
      id SERIAL PRIMARY KEY,
      ordem_servico_id INTEGER NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
      observacao TEXT NOT NULL,
      data TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS anexos (
      id SERIAL PRIMARY KEY,
      ordem_servico_id INTEGER NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
      nome_arquivo TEXT NOT NULL,
      caminho_arquivo TEXT NOT NULL,
      tipo_arquivo TEXT,
      data_upload TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Tabelas criadas com sucesso.');
};

const createIndexes = async (client) => {
  console.log('Criando índices...');
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_os_status ON ordens_servico(status);
    CREATE INDEX IF NOT EXISTS idx_os_tecnico ON ordens_servico(tecnico_responsavel);
    CREATE INDEX IF NOT EXISTS idx_os_data_abertura ON ordens_servico(data_abertura);
    CREATE INDEX IF NOT EXISTS idx_os_cidade ON ordens_servico(cidade);
    CREATE INDEX IF NOT EXISTS idx_obs_ordem ON observacoes(ordem_servico_id);
  `);
  console.log('Índices criados com sucesso.');
};

const insertInitialData = async (client) => {
  console.log('Inserindo dados iniciais...');

  // Usuários
  const users = [
    { name: 'Administrador', email: 'admin@redex.com', pass: 'admin123', role: 'Administrador', uf: null },
    { name: 'Supervisor Exemplo', email: 'supervisor@redex.com', pass: 'super123', role: 'Supervisor', uf: 'SP' },
    { name: 'Técnico Exemplo', email: 'tecnico@redex.com', pass: 'tec123', role: 'Técnico', uf: 'SP' },
  ];

  const userInsertQuery = 'INSERT INTO usuarios (nome, email, senha, tipo_usuario, uf) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING';
  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.pass, 10);
    await client.query(userInsertQuery, [user.name, user.email, hashedPassword, user.role, user.uf]);
  }
  console.log('Usuários iniciais inseridos.');

  // Ordens de Serviço (somente se a tabela estiver vazia)
  const { rows: osCountRows } = await client.query('SELECT COUNT(*) as total FROM ordens_servico');
  if (parseInt(osCountRows[0].total, 10) === 0) {
    const { rows: tecnicoRows } = await client.query("SELECT id FROM usuarios WHERE tipo_usuario = 'Técnico' LIMIT 1");
    const tecnicoId = tecnicoRows.length > 0 ? tecnicoRows[0].id : null;

    const exemplos = [
      ['OS-2024-001', 'João Silva', 'Rua das Flores, 123', 'Centro', 'São Paulo', 'Instalação', 'Alta', 'Aberto', tecnicoId, '2024-01-10', '2024-01-20'],
      ['OS-2024-002', 'Maria Santos', 'Av. Paulista, 456', 'Bela Vista', 'São Paulo', 'Ativação', 'Normal', 'Em andamento', tecnicoId, '2024-01-12', '2024-01-22'],
      ['OS-2024-003', 'Pedro Costa', 'Rua XV de Novembro, 789', 'Centro', 'Campinas', 'Manutenção', 'Urgente', 'Faturado', null, '2024-01-08', '2024-01-15'],
      ['OS-2024-004', 'Ana Oliveira', 'Rua Sete de Setembro, 321', 'Jardim América', 'Ribeirão Preto', 'Reparo', 'Normal', 'Tecnica', tecnicoId, '2024-01-05', '2024-01-10'],
      ['OS-2024-005', 'Carlos Ferreira', 'Av. Brasil, 654', 'Vila Nova', 'Santos', 'Instalação', 'Baixa', 'Aberto', null, '2024-01-15', '2024-01-30'],
      ['OS-2024-006', 'Lucia Mendes', 'Rua das Palmeiras, 987', 'Jardim Paulista', 'São Paulo', 'Ativação', 'Alta', 'Pend Cliente / Comercial', tecnicoId, '2024-01-14', '2024-01-25'],
      ['OS-2024-007', 'Roberto Lima', 'Av. Independência, 147', 'Centro', 'Sorocaba', 'Manutenção', 'Normal', 'Falta RFB', tecnicoId, '2024-01-16', '2024-01-28'],
      ['OS-2024-008', 'Fernanda Souza', 'Rua Tiradentes, 258', 'Vila Mariana', 'São Paulo', 'Instalação', 'Urgente', 'Aberto', null, '2024-01-17', '2024-01-20'],
      ['OS-2024-009', 'Marcos Alves', 'Rua Boa Vista, 369', 'Centro', 'Campinas', 'Reparo', 'Alta', 'Tecnica', tecnicoId, '2024-01-03', '2024-01-08'],
      ['OS-2024-010', 'Juliana Rocha', 'Av. Getúlio Vargas, 741', 'Bairro Novo', 'Ribeirão Preto', 'Ativação', 'Normal', 'Versionado', null, '2024-01-11', '2024-01-21'],
    ];
    
    const osInsertQuery = 'INSERT INTO ordens_servico (numero_os, cliente, endereco, bairro, cidade, tipo_servico, prioridade, status, tecnico_responsavel, data_abertura, prazo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT (numero_os) DO NOTHING';

    for (const ex of exemplos) {
      await client.query(osInsertQuery, ex);
    }
    console.log('Ordens de Serviço de exemplo inseridas.');

    // Observações de exemplo
    const { rows: adminRows } = await client.query("SELECT id FROM usuarios WHERE tipo_usuario = 'Administrador' LIMIT 1");
    if (adminRows.length > 0) {
      const adminId = adminRows[0].id;
      const obsInsertQuery = 'INSERT INTO observacoes (ordem_servico_id, usuario_id, observacao) VALUES ($1, $2, $3)';

      const { rows: os1 } = await client.query("SELECT id FROM ordens_servico WHERE numero_os = 'OS-2024-001'");
      const { rows: os2 } = await client.query("SELECT id FROM ordens_servico WHERE numero_os = 'OS-2024-002'");

      if (os1.length > 0) await client.query(obsInsertQuery, [os1[0].id, adminId, 'Cliente confirmou disponibilidade para visita técnica.']);
      if (os2.length > 0) await client.query(obsInsertQuery, [os2[0].id, adminId, 'Equipamento instalado, aguardando ativação do sinal.']);
      console.log('Observações de exemplo inseridas.');
    }
  } else {
    console.log('Tabela de Ordens de Serviço já contém dados. Pualando inserção de exemplos.');
  }

  console.log('Dados iniciais inseridos com sucesso.');
};


async function initDatabase() {
  const client = await db.pool.connect();
  console.log('🔧 Inicializando banco de dados PostgreSQL...');

  try {
    await client.query('BEGIN');
    
    await dropTables(client);
    await createTables(client);
    await createIndexes(client);
    await insertInitialData(client);

    await client.query('COMMIT');
    
    console.log('✅ Banco de dados inicializado com sucesso!');
    console.log('');
    console.log('👤 Usuários criados:');
    console.log('   Admin:      admin@redex.com     / admin123');
    console.log('   Supervisor: supervisor@redex.com / super123');
    console.log('   Técnico:    tecnico@redex.com   / tec123');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao inicializar o banco de dados:', error);
    process.exit(1);
  } finally {
    client.release();
    // encerrar o pool de conexões para que o script termine
    await db.pool.end();
  }
}

initDatabase();
