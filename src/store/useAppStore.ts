import { create } from 'zustand';
import { api } from '../lib/api';

export type User = {
  id: number;
  nome: string;
  email: string;
  senha: string;
  nivel: 'Administrador' | 'Supervisor' | 'Técnico';
  uf: string;
  status: 'Ativo' | 'Inativo';
};

export type BacklogItem = {
  TarefaAtualDraft: string;
  id?: number;

  // ── Identificação ────────────────────────────────────────────────────────
  ID: string;
  Pedido: string;               // col A   — ID Produto
  DraftEncontrado?: string;     // col CG  — ID Draft
  Bucle_Contratada?: string;    // col HH  — Empresa Responsável
  OS_SCD?: string;              // col BA  — Número OS (SITE ou GPON)
  OS_TBS?: string;               // OS TBS
  Tecnologia_Report?: string;   // col CO  — 'ERB'→SITE | 'GPON'→GPON
  Capacitacao_ERB?: string;     // Capacitação ERB

  // ── Cliente ──────────────────────────────────────────────────────────────
  Cliente: string;
  Endereco: string;
  Numero?: string;
  CEP?: string;
  Cidade: string;
  UF: string;
  CNPJ?: string;
  Produto?: string;
  Servico?: string;
  Carteira?: string;

  // ── Datas e prazos ───────────────────────────────────────────────────────
  'Data de Abertura': string;
  Prazo: string;
  DataTecnica?: string;
  Data_RFS?: string;
  DataRede?: string;
  Data_Planejada_Status?: string;
  Dias_CarteiraAtual?: number;
  PRAZO_BSC?: string;

  // ── Classificação e rede ─────────────────────────────────────────────────
  Status: string;
  Responsavel?: string;
  Tipo: 'Construção' | 'Ativação' | 'Vistoria';
  Classificacao_rede?: string;
  'GD - Classificacao_rede'?: string;
  ConfigStatus?: string;
  Ofensor_Tecnico_Vivo_2?: string;

  // ── Gestão / BSC ─────────────────────────────────────────────────────────
  GRUPO_BSC?: string;
  Efika_GIS?: string;
  TM_Regional?: string;
  PON?: string;
};

export type ScheduleEvent = {
  id: number;
  title: string;
  start: string;
  end?: string;
  extendedProps: {
    tipo: string;
    tecnico: string;
    cliente: string;
    status: string;
    pon?: string;
    itemID?: string;
  };
};

type AppState = {
  data: BacklogItem[];
  users: User[];
  schedule: ScheduleEvent[];
  currentUser: User | null;
  activeView: string;
  loading: boolean;

  loadAll: () => Promise<void>;
  setCurrentUser: (user: User | null) => void;
  setActiveView: (view: string) => void;

  updateBacklogItem: (id: string, updates: Partial<BacklogItem>) => Promise<void>;
  importData: (newData: BacklogItem[], onProgress?: (done: number, total: number) => void) => Promise<void>;

  addScheduleEvent: (event: Omit<ScheduleEvent, 'id'> & { id?: number }) => Promise<void>;
  removeScheduleEvent: (id: number) => Promise<void>;
  updateScheduleEvent: (id: number, updates: Partial<ScheduleEvent>) => Promise<void>;

  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: number, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
};

export const useAppStore = create<AppState>((set, get) => ({
  data: [],
  users: [],
  schedule: [],
  currentUser: null,
  activeView: 'dashboard',
  loading: false,

  loadAll: async () => {
    set({ loading: true });
    try {
      const [usersRes, scheduleRes, dataRes] = await Promise.all([
        api.get('/users'),
        api.get('/schedule'),
        api.get('/data'),
      ]);
      const users = (Array.isArray(usersRes) ? usersRes : usersRes.data) as User[];
      const schedule = (Array.isArray(scheduleRes) ? scheduleRes : scheduleRes.data) as ScheduleEvent[];
      const data = (Array.isArray(dataRes) ? dataRes : dataRes.data) as BacklogItem[];

      set({ users, schedule, data });
    } finally {
      set({ loading: false });
    }
  },

  setCurrentUser: (user) => set({ currentUser: user }),
  setActiveView: (view) => set({ activeView: view }),

  updateBacklogItem: async (ID, updates) => {
    const item = get().data.find(d => d.ID === ID);
    if (!item || item.id == null) return;
    const response = await api.patch(`/data/${item.id}`, updates);
    const updated = response.data as BacklogItem;
    set(s => ({ data: s.data.map(d => d.ID === ID ? { ...d, ...updated } : d) }));
  },

  importData: async (newData, onProgress?: (done: number, total: number) => void) => {
    // 1) Deletar registros existentes em lotes de 20 paralelos
    const existing = get().data;
    const toDelete = existing.filter(d => d.id != null);
    const DEL_CHUNK = 20;
    for (let i = 0; i < toDelete.length; i += DEL_CHUNK) {
      await Promise.all(toDelete.slice(i, i + DEL_CHUNK).map(d => api.delete(`/data/${d.id}`)));
    }

    // 2) Inserir novos registros em lotes de 20 paralelos, reportando progresso
    const INS_CHUNK = 20;
    const inserted: BacklogItem[] = [];
    for (let i = 0; i < newData.length; i += INS_CHUNK) {
      const chunk = newData.slice(i, i + INS_CHUNK);
      const results = await Promise.all(chunk.map(d => api.post('/data', d).then(res => res.data as BacklogItem)));
      inserted.push(...results);
      onProgress?.(inserted.length, newData.length);
    }
    set({ data: inserted });
  },

  addScheduleEvent: async (event) => {
    const response = await api.post('/schedule', event);
    const created = response.data as ScheduleEvent; // Aqui o TS aceita
    set(s => ({ schedule: [...s.schedule, created] }));
  },

  removeScheduleEvent: async (id) => {
    await api.delete(`/schedule/${id}`);
    set(s => ({ schedule: s.schedule.filter(e => e.id !== id) }));
  },

  updateScheduleEvent: async (id, updates) => {
    const response = await api.patch(`/schedule/${id}`, updates);
    const updated = response.data as ScheduleEvent;
    set(s => ({ schedule: s.schedule.map(e => e.id === id ? { ...e, ...updated } : e) }));
  },

  addUser: async (user) => {
    const response = await api.post('/users', user);
    const created = response.data as User;
    set(s => ({ users: [...s.users, created] }));
  },

  updateUser: async (id, updates) => {
    const response = await api.patch(`/users/${id}`, updates);
    const updated = response.data as User;
    set(s => ({ users: s.users.map(u => u.id === id ? { ...u, ...updated } : u) }));
  },

  deleteUser: async (id) => {
    await api.delete(`/users/${id}`);
    set(s => ({ users: s.users.filter(u => u.id !== id) }));
  },
}));