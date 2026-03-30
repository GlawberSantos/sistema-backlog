import db from '../config/database.js';

// Helper para construir a query de listagem dinamicamente
const buildListQuery = (queryParams) => {
  const { status, tecnico, data_inicio, data_fim, tipo_servico, cidade, bairro, prioridade, busca, uf } = queryParams;
  
  let query = `
    SELECT os.*, u.nome as tecnico_nome, u.uf as tecnico_uf
    FROM ordens_servico os
    LEFT JOIN usuarios u ON os.tecnico_responsavel = u.id
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (status) { query += ` AND os.status = $${paramIndex++}`; params.push(status); }
  if (uf) { query += ` AND os.uf = $${paramIndex++}`; params.push(uf); }
  if (tecnico) { query += ` AND os.tecnico_responsavel = $${paramIndex++}`; params.push(tecnico); }
  if (data_inicio) { query += ` AND os.data_abertura >= $${paramIndex++}`; params.push(data_inicio); }
  if (data_fim) { query += ` AND os.data_abertura <= $${paramIndex++}`; params.push(data_fim); }
  if (tipo_servico) { query += ` AND os.tipo_servico = $${paramIndex++}`; params.push(tipo_servico); }
  if (cidade) { query += ` AND os.cidade ILIKE $${paramIndex++}`; params.push(`%${cidade}%`); }
  if (bairro) { query += ` AND os.bairro ILIKE $${paramIndex++}`; params.push(`%${bairro}%`); }
  if (prioridade) { query += ` AND os.prioridade = $${paramIndex++}`; params.push(prioridade); }
  if (busca) {
    query += ` AND (os.numero_os ILIKE $${paramIndex} OR os.cliente ILIKE $${paramIndex} OR os.cidade ILIKE $${paramIndex})`;
    params.push(`%${busca}%`);
    paramIndex++;
  }

  query += ' ORDER BY os.data_abertura DESC, os.id DESC';
  return { query, params };
};

export async function listarOrdensServico(req, res) {
  try {
    const { query, params } = buildListQuery(req.query);
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar ordens de serviço:', error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}

export async function buscarOrdemServico(req, res) {
  const { id } = req.params;

  try {
    const osPromise = db.query(`
      SELECT os.*, u.nome as tecnico_nome, u.uf as tecnico_uf
      FROM ordens_servico os
      LEFT JOIN usuarios u ON os.tecnico_responsavel = u.id
      WHERE os.id = $1
    `, [id]);

    const obsPromise = db.query(`
      SELECT o.*, u.nome as usuario_nome
      FROM observacoes o
      JOIN usuarios u ON o.usuario_id = u.id
      WHERE o.ordem_servico_id = $1
      ORDER BY o.data DESC
    `, [id]);

    const anexosPromise = db.query(`
      SELECT a.*, u.nome as usuario_nome
      FROM anexos a
      JOIN usuarios u ON a.usuario_id = u.id
      WHERE a.ordem_servico_id = $1
      ORDER BY a.data_upload DESC
    `, [id]);

    const [osResult, obsResult, anexosResult] = await Promise.all([osPromise, obsPromise, anexosPromise]);

    if (osResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
    }

    res.json({ ...osResult.rows[0], observacoes: obsResult.rows, anexos: anexosResult.rows });
  } catch (error) {
    console.error('Erro ao buscar ordem de serviço:', error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}

export async function criarOrdemServico(req, res) {
  const {
    numero_os, cliente, endereco, bairro, cidade, uf,
    tipo_servico, prioridade, status, tecnico_responsavel,
    data_abertura, prazo
  } = req.body;

  if (!numero_os || !cliente || !tipo_servico) {
    return res.status(400).json({ error: 'Campos obrigatórios: numero_os, cliente, tipo_servico' });
  }

  try {
    const query = `
      INSERT INTO ordens_servico
        (numero_os, cliente, endereco, bairro, cidade, uf, tipo_servico, prioridade, status, tecnico_responsavel, data_abertura, prazo)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;
    const params = [
      numero_os,
      cliente,
      endereco || '',
      bairro || '',
      cidade || 'Não informado',
      uf || 'SP',
      tipo_servico,
      prioridade || 'Normal',
      status || 'Aberto',
      tecnico_responsavel || null,
      data_abertura || new Date().toISOString().split('T')[0],
      prazo || null
    ];

    const { rows } = await db.query(query, params);
    res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === '23505') { // UNIQUE constraint violation
      return res.status(400).json({ error: 'Número de OS já cadastrado' });
    }
    console.error('Erro ao criar ordem de serviço:', error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}

export async function atualizarOrdemServico(req, res) {
  const { id } = req.params;
  const {
    cliente, endereco, bairro, cidade, uf, tipo_servico,
    prioridade, status, tecnico_responsavel, prazo,
    data_conclusao, hora_inicio, hora_fim
  } = req.body;

  try {
    let dataConclusaoFinal = data_conclusao;
    if (status === 'Tecnica' && !dataConclusaoFinal) {
      dataConclusaoFinal = new Date().toISOString().split('T')[0];
    }

    const query = `
      UPDATE ordens_servico
      SET cliente = $1, endereco = $2, bairro = $3, cidade = $4, uf = $5, tipo_servico = $6,
          prioridade = $7, status = $8, tecnico_responsavel = $9, prazo = $10,
          data_conclusao = $11, hora_inicio = $12, hora_fim = $13
      WHERE id = $14
      RETURNING *;
    `;
    const params = [
      cliente,
      endereco || '',
      bairro || '',
      cidade || 'Não informado',
      uf || 'SP',
      tipo_servico,
      prioridade || 'Normal',
      status || 'Aberto',
      tecnico_responsavel || null,
      prazo || null,
      dataConclusaoFinal || null,
      hora_inicio || null,
      hora_fim || null,
      id
    ];

    const { rows } = await db.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar ordem de serviço:', error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}

export async function deletarOrdemServico(req, res) {
  const { id } = req.params;

  try {
    const { rowCount } = await db.query('DELETE FROM ordens_servico WHERE id = $1', [id]);

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
    }

    res.status(200).json({ message: 'Ordem de serviço deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar ordem de serviço:', error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}

export async function adicionarObservacao(req, res) {
  const { id: ordemServicoId } = req.params;
  const { observacao } = req.body;
  const { id: usuarioId } = req.user;

  if (!observacao || !observacao.trim()) {
    return res.status(400).json({ error: 'Observação não pode ser vazia' });
  }

  try {
    const { rows: osRows } = await db.query('SELECT id FROM ordens_servico WHERE id = $1', [ordemServicoId]);
    if (osRows.length === 0) {
      return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
    }

    const query = `
      INSERT INTO observacoes (ordem_servico_id, usuario_id, observacao)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const { rows } = await db.query(query, [ordemServicoId, usuarioId, observacao.trim()]);

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Erro ao adicionar observação:', error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}

export async function importarPlanilha(req, res) {
  const { ordens } = req.body;

  if (!Array.isArray(ordens) || ordens.length === 0) {
    return res.status(400).json({ error: 'Dados inválidos ou lista vazia' });
  }

  const resultados = { sucesso_insert: 0, sucesso_update: 0, erros: [] };
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    for (const ordem of ordens) {
      const numeroOs = String(ordem.numero_os || '').trim();
      const cliente = String(ordem.cliente || '').trim();

      if (!numeroOs || !cliente) {
        resultados.erros.push({ numero_os: numeroOs || '(sem número)', erro: 'Campos obrigatórios ausentes: numero_os ou cliente' });
        continue;
      }
      
      const dataAbertura = ordem.data_abertura ? String(ordem.data_abertura).trim() : new Date().toISOString().split('T')[0];
      const params = [
        cliente,
        String(ordem.endereco || '').trim(),
        String(ordem.bairro || '').trim(),
        String(ordem.cidade || 'Não informado').trim(),
        String(ordem.tipo_servico || 'Instalação').trim(),
        String(ordem.prioridade || 'Normal').trim(),
        String(ordem.status || 'Aberto').trim(),
        dataAbertura,
        ordem.prazo ? String(ordem.prazo).trim() : null,
        numeroOs
      ];

      try {
        const { rows } = await client.query('SELECT id FROM ordens_servico WHERE numero_os = $1', [numeroOs]);
        
        if (rows.length > 0) {
          const updateQuery = `
            UPDATE ordens_servico
            SET cliente = $1, endereco = $2, bairro = $3, cidade = $4, tipo_servico = $5,
                prioridade = $6, status = $7, data_abertura = $8, prazo = $9
            WHERE numero_os = $10
          `;
          await client.query(updateQuery, params);
          resultados.sucesso_update++;
        } else {
          const insertQuery = `
            INSERT INTO ordens_servico (cliente, endereco, bairro, cidade, tipo_servico, prioridade, status, data_abertura, prazo, numero_os)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `;
          await client.query(insertQuery, params);
          resultados.sucesso_insert++;
        }
      } catch (error) {
        resultados.erros.push({ numero_os: numeroOs, erro: error.message });
      }
    }

    await client.query('COMMIT');
    res.json(resultados);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro na importação:', error);
    res.status(500).json({ error: 'Erro ao importar dados' });
  } finally {
    client.release();
  }
}
