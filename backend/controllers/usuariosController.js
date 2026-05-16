import db from '../config/database.js';
import bcrypt from 'bcryptjs';

export async function listarUsuarios(req, res) {
  try {
    const { rows } = await db.query(
      'SELECT id, nome, email, tipo_usuario, uf, data_criacao FROM usuarios ORDER BY nome'
    );
    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
}

export async function criarUsuario(req, res) {
  const { nome, email, senha, tipo_usuario, uf } = req.body;

  if (!nome || !email || !senha || !tipo_usuario) {
    return res.status(400).json({ error: 'Campos obrigatórios: nome, email, senha, tipo_usuario' });
  }

  try {
    const hashedPassword = bcrypt.hashSync(senha, 10);
    const { rows } = await db.query(`
      INSERT INTO usuarios (nome, email, senha, tipo_usuario, uf)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, nome, email, tipo_usuario, uf, data_criacao
    `, [nome, email, hashedPassword, tipo_usuario, uf || null]);

    res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
}

export async function atualizarUsuario(req, res) {
  const { id } = req.params;
  const { nome, email, tipo_usuario, senha, uf } = req.body;

  try {
    let query = '';
    let params = [];
    let paramCount = 1;

    if (senha) {
      const hashedPassword = bcrypt.hashSync(senha, 10);
      query = `
        UPDATE usuarios SET nome = $${paramCount++}, email = $${paramCount++}, tipo_usuario = $${paramCount++}, senha = $${paramCount++}, uf = $${paramCount++}
        WHERE id = $${paramCount++}
        RETURNING id, nome, email, tipo_usuario, uf
      `;
      params = [nome, email, tipo_usuario, hashedPassword, uf || null, id];
    } else {
      query = `
        UPDATE usuarios SET nome = $${paramCount++}, email = $${paramCount++}, tipo_usuario = $${paramCount++}, uf = $${paramCount++}
        WHERE id = $${paramCount++}
        RETURNING id, nome, email, tipo_usuario, uf
      `;
      params = [nome, email, tipo_usuario, uf || null, id];
    }

    const { rows } = await db.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
}

export async function deletarUsuario(req, res) {
  const { id } = req.params;

  // Não permite deletar o próprio usuário logado
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: 'Não é possível deletar o próprio usuário' });
  }

  try {
    const { rowCount } = await db.query('DELETE FROM usuarios WHERE id = $1', [id]);

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
}

export async function listarTecnicos(req, res) {
  try {
    const { rows } = await db.query(`
      SELECT id, nome, email, uf FROM usuarios
      WHERE tipo_usuario IN ($1, $2)
      ORDER BY nome
    `, ['Técnico', 'Supervisor']);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar técnicos:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
}

export async function listarUfs(req, res) {
  try {
    // Buscar UFs distinctas da tabela ordens_servico (coluna UF da planilha)
    const { rows } = await db.query(`
      SELECT DISTINCT uf FROM ordens_servico
      WHERE uf IS NOT NULL AND uf != ''
      ORDER BY uf
    `);
    res.json(rows.map(r => r.uf));
  } catch (error) {
    console.error('Erro ao listar UFs:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
}
