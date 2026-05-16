import pool from '../config/database.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function listarAgendas(req, res) {
  const { data, tecnico_nome } = req.query;
  try {
    let query = `
      SELECT a.*, c.nome as criado_por_nome,
             COUNT(ai.id) as total_itens
      FROM agendas a
      LEFT JOIN usuarios c ON a.criado_por = c.id
      LEFT JOIN agenda_itens ai ON ai.agenda_id = a.id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;

    if (tecnico_nome) {
      query += ` AND a.tecnico_nome ILIKE $${i++}`;
      params.push(`%${tecnico_nome}%`);
    }
    if (data) {
      query += ` AND a.data_agenda = $${i++}`;
      params.push(data);
    }
    query += ' GROUP BY a.id, c.nome ORDER BY a.data_agenda DESC, a.tecnico_nome';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar agendas:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
}

export async function buscarAgenda(req, res) {
  const { id } = req.params;
  try {
    const agenda = await pool.query(
      `SELECT a.*, c.nome as criado_por_nome
       FROM agendas a
       LEFT JOIN usuarios c ON a.criado_por = c.id
       WHERE a.id = $1`,
      [id]
    );
    if (!agenda.rows.length) return res.status(404).json({ error: 'Agenda não encontrada' });

    const itens = await pool.query(
      `SELECT ai.*,
              json_agg(
                CASE WHEN af.id IS NOT NULL THEN
                  json_build_object('id', af.id, 'nome_arquivo', af.nome_arquivo, 'caminho', af.caminho, 'tipo', af.tipo)
                ELSE NULL END
              ) FILTER (WHERE af.id IS NOT NULL) as fotos
       FROM agenda_itens ai
       LEFT JOIN agenda_fotos af ON af.agenda_item_id = ai.id
       WHERE ai.agenda_id = $1
       GROUP BY ai.id
       ORDER BY ai.id`,
      [id]
    );

    res.json({ ...agenda.rows[0], itens: itens.rows });
  } catch (err) {
    console.error('Erro ao buscar agenda:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
}

export async function criarAgenda(req, res) {
  const { data_agenda, tecnico_nome, equipe, pedidos } = req.body;
  const criado_por = req.user.id;

  if (!data_agenda || !tecnico_nome || !Array.isArray(pedidos) || pedidos.length === 0) {
    return res.status(400).json({ error: 'data_agenda, tecnico_nome e pedidos são obrigatórios' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const agendaExiste = await client.query(
      'SELECT id FROM agendas WHERE data_agenda = $1 AND tecnico_nome = $2',
      [data_agenda, tecnico_nome]
    );

    let agenda_id;
    if (agendaExiste.rows.length > 0) {
      agenda_id = agendaExiste.rows[0].id;
      await client.query(
        'UPDATE agendas SET equipe = $1 WHERE id = $2',
        [equipe || null, agenda_id]
      );
    } else {
      const nova = await client.query(
        'INSERT INTO agendas (data_agenda, tecnico_nome, equipe, criado_por) VALUES ($1, $2, $3, $4) RETURNING id',
        [data_agenda, tecnico_nome, equipe || null, criado_por]
      );
      agenda_id = nova.rows[0].id;
    }

    let inseridos = 0;
    const erros = [];

    for (const p of pedidos) {
      const pedidoId = String(p.pedido_id || '').trim();
      if (!pedidoId) continue;

      const jaExiste = await client.query(
        'SELECT id FROM agenda_itens WHERE agenda_id = $1 AND pedido_id = $2',
        [agenda_id, pedidoId]
      );
      if (jaExiste.rows.length > 0) {
        erros.push(`Pedido ${pedidoId} já estava na agenda`);
        continue;
      }

      const osRow = await client.query(
        `SELECT cliente, endereco, bairro, cidade, tipo_servico
         FROM ordens_servico WHERE numero_os = $1 LIMIT 1`,
        [pedidoId]
      );
      const os = osRow.rows[0] || {};

      await client.query(
        `INSERT INTO agenda_itens
         (agenda_id, pedido_id, id_draft, empresa_responsavel, cliente, endereco, cidade, servico, site,
          alteracao_projeto, alteracao_cto, abordagem, dgo, fo,
          rede_lancada, rede_interna, rede_existente, enlace_total,
          responsavel_local, contato_local, status_servico, observacoes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)`,
        [
          agenda_id,
          pedidoId,
          p.id_draft || null,
          p.empresa_responsavel || null,
          p.cliente || os.cliente || null,
          p.endereco || (os.endereco ? `${os.endereco}${os.bairro ? ', ' + os.bairro : ''}` : null),
          p.cidade || os.cidade || null,
          p.servico || os.tipo_servico || null,
          p.site || null,
          p.alteracao_projeto === true || p.alteracao_projeto === 'true',
          p.alteracao_cto === true || p.alteracao_cto === 'true',
          p.abordagem === true || p.abordagem === 'true',
          p.dgo || null,
          p.fo || null,
          p.rede_lancada || null,
          p.rede_interna || null,
          p.rede_existente || null,
          p.enlace_total || null,
          p.responsavel_local || null,
          p.contato_local || null,
          p.status_servico || 'PENDENTE',
          p.observacoes || null
        ]
      );
      inseridos++;
    }

    await client.query('COMMIT');
    res.status(201).json({ agenda_id, inseridos, erros });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar agenda:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  } finally {
    client.release();
  }
}

export async function atualizarItem(req, res) {
  const { item_id } = req.params;
  const {
    id_draft, empresa_responsavel, cliente, endereco, cidade, servico, site,
    alteracao_projeto, alteracao_cto, abordagem, dgo, fo,
    rede_lancada, rede_interna, rede_existente, enlace_total,
    responsavel_local, contato_local, status_servico, observacoes
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE agenda_itens SET
        id_draft=$1, empresa_responsavel=$2, cliente=$3, endereco=$4, cidade=$5,
        servico=$6, site=$7, alteracao_projeto=$8, alteracao_cto=$9, abordagem=$10,
        dgo=$11, fo=$12, rede_lancada=$13, rede_interna=$14, rede_existente=$15,
        enlace_total=$16, responsavel_local=$17, contato_local=$18,
        status_servico=$19, observacoes=$20, atualizado_em=NOW()
       WHERE id=$21 RETURNING *`,
      [
        id_draft, empresa_responsavel, cliente, endereco, cidade,
        servico, site, alteracao_projeto, alteracao_cto, abordagem,
        dgo, fo, rede_lancada, rede_interna, rede_existente,
        enlace_total, responsavel_local, contato_local,
        status_servico, observacoes, item_id
      ]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Item não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar item:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
}

export async function uploadFotos(req, res) {
  const { item_id } = req.params;
  const files = req.files;
  if (!files || files.length === 0) return res.status(400).json({ error: 'Nenhuma foto enviada' });

  try {
    const inseridas = [];
    for (const file of files) {
      const result = await pool.query(
        `INSERT INTO agenda_fotos (agenda_item_id, nome_arquivo, caminho, tipo, enviado_por)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [item_id, file.originalname, `/uploads/agenda/${file.filename}`, file.mimetype, req.user.id]
      );
      inseridas.push(result.rows[0]);
    }
    res.status(201).json(inseridas);
  } catch (err) {
    console.error('Erro ao salvar fotos:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
}

export async function deletarFoto(req, res) {
  const { foto_id } = req.params;
  try {
    const foto = await pool.query('SELECT * FROM agenda_fotos WHERE id = $1', [foto_id]);
    if (!foto.rows.length) return res.status(404).json({ error: 'Foto não encontrada' });

    const caminho = path.join(process.cwd(), 'uploads', 'agenda', path.basename(foto.rows[0].caminho));
    if (fs.existsSync(caminho)) fs.unlinkSync(caminho);

    await pool.query('DELETE FROM agenda_fotos WHERE id = $1', [foto_id]);
    res.json({ message: 'Foto removida' });
  } catch (err) {
    console.error('Erro ao deletar foto:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
}

export async function deletarItem(req, res) {
  const { item_id } = req.params;
  try {
    await pool.query('DELETE FROM agenda_itens WHERE id = $1', [item_id]);
    res.json({ message: 'Item removido da agenda' });
  } catch (err) {
    console.error('Erro ao deletar item:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
}

export async function buscarPedidoNaBase(req, res) {
  const { pedido_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT numero_os as pedido_id, cliente, endereco, bairro, cidade, tipo_servico as servico
       FROM ordens_servico WHERE numero_os = $1 LIMIT 1`,
      [pedido_id]
    );
    if (!result.rows.length) {
      return res.json({ pedido_id, encontrado: false });
    }
    res.json({ ...result.rows[0], encontrado: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
}
