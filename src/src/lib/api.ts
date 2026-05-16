// src/lib/api.ts
// Implementação local usando localStorage — sem dependência de servidor externo.
// Simula a interface do json-server para manter compatibilidade com o store.

const DB_KEY = 'smra_db';

type Collections = {
  users: Record<string, unknown>[];
  schedule: Record<string, unknown>[];
  data: Record<string, unknown>[];
};

const DEFAULT_DB: Collections = {
  users: [
    { id: 1, nome: 'Admin SMRA', email: 'admin@smra.com', senha: 'admin123', nivel: 'Administrador', uf: 'PE', status: 'Ativo' },
    { id: 2, nome: 'Supervisor NE', email: 'supervisor@smra.com', senha: 'sup123', nivel: 'Supervisor', uf: 'PE', status: 'Ativo' },
    { id: 3, nome: 'Técnico Glauber Santos', email: 'tecnico@smra.com', senha: 'tec123', nivel: 'Técnico', uf: 'PE', status: 'Ativo' },
  ],
  schedule: [],
  data: [],
};

function loadDB(): Collections {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw) as Collections;
  } catch { /* ignore */ }
  return structuredClone(DEFAULT_DB);
}

function saveDB(db: Collections) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function nextId(collection: Record<string, unknown>[]): number {
  if (!collection.length) return 1;
  const max = Math.max(...collection.map(r => Number((r as { id?: number }).id ?? 0)));
  return max + 1;
}

function wrap<T>(value: T): { data: T } {
  return { data: value };
}

export const api = {
  async get(path: string) {
    const db = loadDB();
    const [col, id] = parsePath(path);
    if (id !== null) {
      const item = db[col]?.find((r: Record<string, unknown>) => r.id == id) ?? null;
      return wrap(item);
    }
    return wrap(db[col] ?? []);
  },

  async post(path: string, body: unknown) {
    const db = loadDB();
    const [col] = parsePath(path);
    const record = { ...(body as Record<string, unknown>), id: nextId(db[col] ?? []) };
    db[col] = [...(db[col] ?? []), record];
    saveDB(db);
    return wrap(record);
  },

  async put(path: string, body: unknown) {
    const db = loadDB();
    const [col, id] = parsePath(path);
    db[col] = db[col].map((r: Record<string, unknown>) =>
      r.id == id ? { ...(body as Record<string, unknown>), id: r.id } : r
    );
    saveDB(db);
    const updated = db[col].find((r: Record<string, unknown>) => r.id == id);
    return wrap(updated);
  },

  async patch(path: string, body: unknown) {
    const db = loadDB();
    const [col, id] = parsePath(path);
    db[col] = db[col].map((r: Record<string, unknown>) =>
      r.id == id ? { ...r, ...(body as Record<string, unknown>) } : r
    );
    saveDB(db);
    const updated = db[col].find((r: Record<string, unknown>) => r.id == id);
    return wrap(updated);
  },

  async delete(path: string) {
    const db = loadDB();
    const [col, id] = parsePath(path);
    db[col] = db[col].filter((r: Record<string, unknown>) => r.id != id);
    saveDB(db);
  },
};

function parsePath(path: string): [keyof Collections, string | null] {
  const parts = path.replace(/^\//, '').split('/');
  const col = parts[0] as keyof Collections;
  const id = parts[1] ?? null;
  return [col, id];
}