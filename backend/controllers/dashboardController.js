import pool from '../config/database.js';

export async function getDashboardStats(req, res) {
  try {
    const results = await Promise.allSettled([
      pool.query("SELECT COUNT(*) as total FROM ordens_servico WHERE status != 'Tecnica'"),
      pool.query("SELECT COUNT(*) as total FROM ordens_servico WHERE status = 'Falta RFB'"),
      pool.query("SELECT COUNT(*) as total FROM ordens_servico WHERE status = 'Tecnica'"),
      pool.query("SELECT COUNT(*) as total FROM ordens_servico WHERE prazo < CURRENT_DATE AND status != 'Tecnica'"),
      pool.query("SELECT status, COUNT(*) as total FROM ordens_servico GROUP BY status"),
      pool.query("SELECT cidade, COUNT(*) as total FROM ordens_servico WHERE status != 'Tecnica' GROUP BY cidade ORDER BY total DESC LIMIT 10"),
      pool.query(`SELECT COALESCE(u.uf, 'Não informado') as uf, COUNT(os.id) as total FROM ordens_servico os LEFT JOIN usuarios u ON os.tecnico_responsavel = u.id WHERE os.status != 'Tecnica' GROUP BY COALESCE(u.uf, 'Não informado') ORDER BY total DESC LIMIT 10`),
      pool.query("SELECT tipo_servico, COUNT(*) as total FROM ordens_servico GROUP BY tipo_servico")
    ]);

    const getResultValue = (result, key, defaultValue) => {
      if (result.status === 'fulfilled' && result.value.rows) {
        if (key) {
          return result.value.rows.length > 0 ? parseInt(result.value.rows[0][key]) : defaultValue;
        }
        return result.value.rows;
      }
      console.error(`Falha na consulta do dashboard:`, result.reason);
      return defaultValue;
    };

    res.json({
      totalBacklog:   getResultValue(results[0], 'total', 0),
      emAndamento:    getResultValue(results[1], 'total', 0),
      concluidos:     getResultValue(results[2], 'total', 0),
      atrasados:      getResultValue(results[3], 'total', 0),
      porStatus:      getResultValue(results[4], null, []),
      porCidade:      getResultValue(results[5], null, []),
      porUF:          getResultValue(results[6], null, []),
      porTipoServico: getResultValue(results[7], null, [])
    });

  } catch (error) {
    console.error('Erro inesperado ao buscar estatísticas do dashboard:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
}

export async function getRelatorioBacklogPorUF(req, res) {
  try {
    const result = await pool.query(
      `SELECT 
        COALESCE(u.uf, 'Não informado') as uf,
        COUNT(CASE WHEN os.status = 'AC' THEN 1 END) as ac,
        COUNT(CASE WHEN os.status = 'Falta RFB' THEN 1 END) as em_execucao,
        COUNT(CASE WHEN os.status = 'Faturado' THEN 1 END) as pendente_comercial,
        COUNT(CASE WHEN os.status = 'Pend Cliente / Comercial' THEN 1 END) as pendente_material,
        COUNT(CASE WHEN os.status = 'Tecnica' THEN 1 END) as concluido,
        COUNT(*) as total
       FROM ordens_servico os
       LEFT JOIN usuarios u ON os.tecnico_responsavel = u.id
       GROUP BY COALESCE(u.uf, 'Não informado')
       ORDER BY total DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao gerar relatório por técnico:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
}

export async function getRelatorioBacklogPorRegiao(req, res) {
  try {
    const result = await pool.query(
      `SELECT
        cidade,
        COUNT(CASE WHEN status = 'AC' THEN 1 END) as ac,
        COUNT(CASE WHEN status = 'Falta RFB' THEN 1 END) as em_execucao,
        COUNT(CASE WHEN status = 'Faturado' THEN 1 END) as pendente_comercial,
        COUNT(CASE WHEN status = 'Pend Cliente / Comercial' THEN 1 END) as pendente_material,
        COUNT(CASE WHEN status = 'Tecnica' THEN 1 END) as concluido,
        COUNT(*) as total
       FROM ordens_servico
       GROUP BY cidade
       ORDER BY total DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao gerar relatório por região:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
}

export async function getRelatorioConcluidosPorPeriodo(req, res) {
  const { data_inicio, data_fim } = req.query;

  try {
    let query = `
      SELECT 
        DATE(data_conclusao) as data,
        COUNT(*) as total
      FROM ordens_servico
      WHERE status = 'Tecnica' AND data_conclusao IS NOT NULL
    `;
    const params = [];

    if (data_inicio && data_fim) {
      query += ` AND data_conclusao BETWEEN $1 AND $2`;
      params.push(data_inicio, data_fim);
    }

    query += ` GROUP BY DATE(data_conclusao) ORDER BY data`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao gerar relatório de Tecnicas:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
}

export async function getRelatorioTempoMedio(req, res) {
  try {
    const result = await pool.query(
      `SELECT 
        tipo_servico,
        AVG(EXTRACT(DAY FROM (data_conclusao - data_abertura))) as tempo_medio_dias
       FROM ordens_servico
       WHERE status = 'Tecnica' AND data_conclusao IS NOT NULL
       GROUP BY tipo_servico`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao calcular tempo médio:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
}
