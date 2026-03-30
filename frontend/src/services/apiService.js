import api from './api';

export const login = async (email, senha) => {
  const response = await api.post('/auth/login', { email, senha });
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};

export const getRelatorioTecnico = async () => {
  const response = await api.get('/dashboard/relatorio/uf');
  return response.data;
};

export const listarUfs = async () => {
  const response = await api.get('/usuarios/ufs');
  return response.data;
};

export const getRelatorioRegiao = async () => {
  const response = await api.get('/dashboard/relatorio/regiao');
  return response.data;
};

export const getRelatorioConcluidos = async (data_inicio, data_fim) => {
  const response = await api.get('/dashboard/relatorio/concluidos', {
    params: { data_inicio, data_fim }
  });
  return response.data;
};

export const getRelatorioTempoMedio = async () => {
  const response = await api.get('/dashboard/relatorio/tempo-medio');
  return response.data;
};

export const listarUsuarios = async () => {
  const response = await api.get('/usuarios');
  return response.data;
};

export const criarUsuario = async (usuario) => {
  const response = await api.post('/usuarios', usuario);
  return response.data;
};

export const atualizarUsuario = async (id, usuario) => {
  const response = await api.put(`/usuarios/${id}`, usuario);
  return response.data;
};

export const deletarUsuario = async (id) => {
  const response = await api.delete(`/usuarios/${id}`);
  return response.data;
};

export const listarTecnicos = async () => {
  const response = await api.get('/usuarios/tecnicos');
  return response.data;
};

export const listarOrdensServico = async (filtros = {}) => {
  const response = await api.get('/ordens-servico', { params: filtros });
  return response.data;
};

export const buscarOrdemServico = async (id) => {
  const response = await api.get(`/ordens-servico/${id}`);
  return response.data;
};

export const criarOrdemServico = async (ordem) => {
  const response = await api.post('/ordens-servico', ordem);
  return response.data;
};

export const atualizarOrdemServico = async (id, ordem) => {
  const response = await api.put(`/ordens-servico/${id}`, ordem);
  return response.data;
};

export const deletarOrdemServico = async (id) => {
  const response = await api.delete(`/ordens-servico/${id}`);
  return response.data;
};

export const adicionarObservacao = async (id, observacao) => {
  const response = await api.post(`/ordens-servico/${id}/observacoes`, { observacao });
  return response.data;
};

export const importarPlanilha = async (ordens) => {
  const response = await api.post('/ordens-servico/importar', { ordens });
  return response.data;
};

export const listarAgendas = async (params = {}) => {
  const response = await api.get('/agenda', { params });
  return response.data;
};

export const buscarAgenda = async (id) => {
  const response = await api.get(`/agenda/${id}`);
  return response.data;
};

export const criarAgenda = async (payload) => {
  const response = await api.post('/agenda', payload);
  return response.data;
};

export const atualizarItemAgenda = async (item_id, dados) => {
  const response = await api.put(`/agenda/item/${item_id}`, dados);
  return response.data;
};

export const deletarItemAgenda = async (item_id) => {
  const response = await api.delete(`/agenda/item/${item_id}`);
  return response.data;
};

export const uploadFotosAgenda = async (item_id, files) => {
  const formData = new FormData();
  files.forEach(f => formData.append('fotos', f));
  const response = await api.post(`/agenda/item/${item_id}/fotos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const deletarFotoAgenda = async (foto_id) => {
  const response = await api.delete(`/agenda/foto/${foto_id}`);
  return response.data;
};

export const buscarPedidoNaBase = async (pedido_id) => {
  const response = await api.get(`/agenda/pedido/${encodeURIComponent(pedido_id)}`);
  return response.data;
};
