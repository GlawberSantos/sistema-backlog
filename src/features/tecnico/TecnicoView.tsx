// src/features/tecnico/TecnicoView.tsx
// Área exclusiva do Técnico.
// - Lista APENAS as atividades atribuídas ao técnico logado.
// - Formulário de encerramento com 3 modelos de CARIMBO (Ativação, Reparo, Construção/Rede),
//   campos compatíveis com o padrão usado no campo, anexo de fotos e geração de texto
//   para copiar/compartilhar no WhatsApp.

import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useAppStore, ScheduleEvent, User, BacklogItem } from '../../store/useAppStore';

type SiteKML = { nome: string; lat: number; lng: number };
type CarimboTipo = 'Ativação' | 'Reparo' | 'Construção';

type FormData = {
  // Comum
  carimboTipo: CarimboTipo;
  tipoRede: 'GPON' | 'ERB/SITE' | '';
  empresaResponsavel: string;
  enderecoReal: string;

  // Rede GPON
  armario: string;
  sp: string;
  cto: string;

  // Rede ERB/SITE
  swa: string;
  portaSwa: string;
  dgo: string;
  portaDgo: string;

  // Responsável local (todos)
  responsavelLocal: string;
  contatoLocal: string;

  // ATIVAÇÃO específico
  cpd: string;
  contatoCpd: string;
  chatDani: string;
  senha: string;
  equipamento: string;
  observacoes: string;

  // REPARO específico
  causa: string;
  solucao: string;
  statusReparo: string;

  // CONSTRUÇÃO específico
  abordagem: '' | 'Sim' | 'Não';
  alteracaoProjeto: '' | 'Sim' | 'Não';
  alteracaoCtoSpSite: '' | 'Sim' | 'Não';
  redeLancada: string;
  redeInterna: string;
  redeExistente: string;
  enlaceTotal: string;

  // Fotos
  fotos: { file: File; preview: string }[];
};

const tipoColor: Record<string, { text: string; border: string; bg: string; label: string }> = {
  Ativação:   { text: '#0eb88a', border: '#0eb88a40', bg: '#0eb88a18', label: 'Ativação' },
  Construção: { text: '#2d7ef0', border: '#2d7ef040', bg: '#2d7ef018', label: 'Construção' },
  Reparo:     { text: '#f5882a', border: '#f5882a40', bg: '#f5882a18', label: 'Reparo' },
  Vistoria:   { text: '#8b5cf6', border: '#8b5cf640', bg: '#8b5cf618', label: 'Vistoria' },
};
const statusColor: Record<string, string> = {
  Agendado: '#2d7ef0', Planejado: '#8b5cf6', Concluída: '#0eb88a', 'Não Concluída': '#e85555', 'Em andamento': '#f5882a',
};

async function filesToDataUrls(files: File[]): Promise<string[]> {
  return Promise.all(
    files.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        }),
    ),
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
function initials(nome: string) {
  return nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}
function parseKML(text: string): SiteKML[] {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  return Array.from(doc.querySelectorAll('Placemark')).flatMap(pm => {
    const nome = pm.querySelector('name')?.textContent?.trim() || 'Site';
    const ct = (pm.querySelector('Point coordinates') || pm.querySelector('coordinates'))?.textContent?.trim();
    if (!ct) return [];
    const p = ct.split(',');
    if (p.length < 2) return [];
    const lng = parseFloat(p[0]), lat = parseFloat(p[1]);
    if (isNaN(lat) || isNaN(lng)) return [];
    return [{ nome, lat, lng }];
  });
}

// ─── UI Primitives ───────────────────────────────────────────────────────────
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ background: '#0f1829', border: '1px solid #1e2e4a', borderRadius: 12, padding: '16px 18px', marginBottom: 12 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: '#4a5a7a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #1e2e4a' }}>{title}</div>
    {children}
  </div>
);

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 10, fontWeight: 600, color: '#4a5a7a', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>{children}</div>
);

const TextInput = ({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
  <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    style={{ width: '100%', boxSizing: 'border-box', background: '#0a0f1a', border: '1px solid #1e2e4a', borderRadius: 8, padding: '9px 12px', color: '#e8edf5', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
);

const TextArea = ({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) => (
  <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
    style={{ width: '100%', boxSizing: 'border-box', background: '#0a0f1a', border: '1px solid #1e2e4a', borderRadius: 8, padding: '9px 12px', color: '#e8edf5', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
);

const YesNoToggle = ({ value, onChange }: { value: '' | 'Sim' | 'Não'; onChange: (v: 'Sim' | 'Não') => void }) => (
  <div style={{ display: 'flex', gap: 8 }}>
    {(['Sim', 'Não'] as const).map(opt => (
      <button key={opt} type="button" onClick={() => onChange(opt)}
        style={{ flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, border: value === opt ? 'none' : '1px solid #1e2e4a', background: value === opt ? (opt === 'Sim' ? '#0eb88a' : '#e85555') : 'transparent', color: value === opt ? '#fff' : '#4a5a7a' }}>
        {opt}
      </button>
    ))}
  </div>
);

const InfoRow = ({ label, value }: { label: string; value?: string | null }) =>
  value ? (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#4a5a7a', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, color: '#e8edf5', fontWeight: 500 }}>{value}</div>
    </div>
  ) : null;

// ─── Geração do CARIMBO em texto ─────────────────────────────────────────────
function gerarCarimbo(form: FormData, ev: ScheduleEvent, bk: BacklogItem | undefined): string {
  const ep = ev.extendedProps;
  const cliente = ep.cliente || bk?.Cliente || '';
  const endereco = form.enderecoReal || bk?.Endereco || '';
  const cidade = bk?.Cidade || '';
  const idProduto = bk?.Pedido || ep.itemID || String(ev.id);
  const sep = '〰〰〰〰〰〰〰〰〰〰〰〰';

  const cabecalhoRede = (() => {
    if (form.tipoRede === 'GPON') {
      return [
        'REDE GPON',
        `ARMÁRIO: ${form.armario || ''}`,
        `SP: ${form.sp || ''}`,
        `CTO: ${form.cto || ''}`,
      ].join('\n');
    }
    if (form.tipoRede === 'ERB/SITE') {
      return [
        'REDE ERB/SITE',
        `SWA: ${form.swa || ''}`,
        `PORTA: ${form.portaSwa || ''}`,
        `DGO: ${form.dgo || ''}`,
        `PORTA: ${form.portaDgo || ''}`,
      ].join('\n');
    }
    return '';
  })();

  const baseHeader = [
    `ID PRODUTO: ${idProduto}`,
    `TIPO: ${form.tipoRede || '—'}`,
    `EMPRESA RESPONSÁVEL: ${form.empresaResponsavel || bk?.Bucle_Contratada || ''}`,
    `CLIENTE: ${cliente}`,
    `ENDEREÇO: ${endereco}`,
    `CIDADE: ${cidade}`,
  ].join('\n');

  if (form.carimboTipo === 'Ativação') {
    return [
      '📄 CARIMBO TÉCNICO DE ATIVAÇÃO',
      '',
      baseHeader,
      '',
      cabecalhoRede,
      '',
      `👤 Quem acompanhou: ${form.responsavelLocal || ''}`,
      `CONTATO: ${form.contatoLocal || ''}`,
      '',
      `🖥️ CPD: ${form.cpd || ''}`,
      `📞 Contato: ${form.contatoCpd || ''}`,
      `💬 Chat Dani: ${form.chatDani || ''}`,
      `🔐 Senha: ${form.senha || ''}`,
      `📡 Equipamento utilizado: ${form.equipamento || ''}`,
      '',
      `📝 Observações: ${form.observacoes || ''}`,
      '',
      'STATUS DA ATIVAÇÃO: CONCLUÍDO COM SUCESSO.',
      sep,
    ].join('\n');
  }

  if (form.carimboTipo === 'Reparo') {
    return [
      '📄 CARIMBO TÉCNICO REPARO',
      '',
      baseHeader,
      '',
      cabecalhoRede,
      '',
      `RESPONSÁVEL NO LOCAL: ${form.responsavelLocal || ''}`,
      `CONTATO: ${form.contatoLocal || ''}`,
      '',
      `⚠️ Causa: ${form.causa || ''}`,
      '',
      `🛠️ Solução: ${form.solucao || ''}`,
      '',
      `📌 Status: ${form.statusReparo || 'CONCLUIDO'}`,
      '',
      'STATUS DA CONSTRUÇÃO: REPARO CONCLUÍDO COM SUCESSO.',
      sep,
    ].join('\n');
  }

  // Construção / Rede
  return [
    '📄 CARIMBO TÉCNICO CONSTRUÇÃO/REDE',
    '',
    baseHeader,
    '',
    cabecalhoRede,
    '',
    `RESPONSÁVEL NO LOCAL: ${form.responsavelLocal || ''}`,
    `CONTATO: ${form.contatoLocal || ''}`,
    '',
    `ABORDAGEM: ${form.abordagem || 'NÃO'}`,
    `ALTERAÇÃO DE PROJETO: ${form.alteracaoProjeto || 'NÃO'}`,
    `ALTERAÇÃO DE CTO/SP/SITE: ${form.alteracaoCtoSpSite || 'NÃO'}`,
    '',
    sep,
    '',
    `● REDE LANÇADA: ${form.redeLancada || ''}`,
    `● REDE INTERNA: ${form.redeInterna || ''}`,
    `● REDE EXISTENTE: ${form.redeExistente || ''}`,
    `● ENLACE TOTAL: ${form.enlaceTotal || ''}`,
    '',
    sep,
    '',
    'STATUS DA CONSTRUÇÃO: CONCLUÍDO COM SUCESSO.',
  ].join('\n');
}

// ─── Tela de Detalhe ────────────────────────────────────────────────────────
function DetalheAtividade({ event, backlogItem, onBack, onConcluir, saving }: {
  event: ScheduleEvent;
  backlogItem: BacklogItem | undefined;
  currentUser: User;
  sites: SiteKML[];
  onBack: () => void;
  onConcluir: (form: FormData, status: 'Concluída' | 'Não Concluído', carimbo: string) => void | Promise<void>;
  saving?: boolean;
}) {
  const ep = event.extendedProps;

  // Carimbo padrão = tipo do evento (mapeia Vistoria → Reparo).
  const carimboPadrao: CarimboTipo =
    ep.tipo === 'Construção' ? 'Construção'
    : ep.tipo === 'Vistoria' ? 'Reparo'
    : 'Ativação';

  const [form, setForm] = useState<FormData>({
    carimboTipo: carimboPadrao,
    tipoRede: backlogItem?.Tecnologia_Report === 'ERB' ? 'ERB/SITE' : backlogItem?.Tecnologia_Report === 'GPON' ? 'GPON' : '',
    empresaResponsavel: backlogItem?.Bucle_Contratada || '',
    enderecoReal: backlogItem?.Endereco || '',
    armario: '', sp: '', cto: '',
    swa: '', portaSwa: '', dgo: '', portaDgo: '',
    responsavelLocal: '', contatoLocal: '',
    cpd: '', contatoCpd: '', chatDani: '', senha: '', equipamento: '', observacoes: '',
    causa: '', solucao: '', statusReparo: 'CONCLUIDO',
    abordagem: 'Não', alteracaoProjeto: 'Não', alteracaoCtoSpSite: 'Não',
    redeLancada: '', redeInterna: '', redeExistente: '', enlaceTotal: '',
    fotos: [],
  });

  const [confirmando, setConfirmando] = useState(false);
  const [carimboGerado, setCarimboGerado] = useState<string | null>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  const upd = (partial: Partial<FormData>) => setForm(prev => ({ ...prev, ...partial }));

  function handleFotos(e: ChangeEvent<HTMLInputElement>) {
    const novas = Array.from(e.target.files || []).map(file => ({ file, preview: URL.createObjectURL(file) }));
    upd({ fotos: [...form.fotos, ...novas] });
    e.target.value = '';
  }
  function removerFoto(idx: number) {
    const nova = [...form.fotos]; URL.revokeObjectURL(nova[idx].preview); nova.splice(idx, 1); upd({ fotos: nova });
  }

  const color = tipoColor[form.carimboTipo] || tipoColor['Ativação'];

  const carimboPreview = gerarCarimbo(form, event, backlogItem);

  function copiarCarimbo() {
    navigator.clipboard?.writeText(carimboPreview).then(() => {
      setCarimboGerado(carimboPreview);
    });
  }
  function compartilharWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(carimboPreview)}`;
    window.open(url, '_blank');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1a', fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${color.text}cc, ${color.text}88)`, padding: '0 0 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px' }}>
          <button type="button" onClick={onBack} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '7px 12px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
            ← Voltar
          </button>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>
            {new Date(event.start).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
          </div>
        </div>
        <div style={{ padding: '0 16px' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>Encerramento Técnico</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>{ep.cliente}</span>
            <span style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>{ep.status}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 16px 100px', maxWidth: 900, margin: '0 auto' }}>

        {/* Seletor de tipo de carimbo */}
        <Section title="🧾 Tipo de Carimbo">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {(['Ativação', 'Reparo', 'Construção'] as CarimboTipo[]).map(t => {
              const c = tipoColor[t];
              const active = form.carimboTipo === t;
              return (
                <button key={t} type="button" onClick={() => upd({ carimboTipo: t })}
                  style={{ padding: '10px 6px', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 13, border: active ? 'none' : '1px solid #1e2e4a', background: active ? c.text : 'transparent', color: active ? '#fff' : '#8a9bbf' }}>
                  {t}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Informações da atividade (somente leitura) */}
        <Section title="📋 Informações da Atividade">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 18px' }}>
            <InfoRow label="ID Produto" value={backlogItem?.Pedido || ep.itemID || String(event.id)} />
            <InfoRow label="Empresa" value={backlogItem?.Bucle_Contratada} />
            <InfoRow label="OS SCD" value={backlogItem?.OS_SCD} />
            <InfoRow label="OS TBS" value={backlogItem?.OS_TBS} />
            <div style={{ gridColumn: '1 / -1' }}><InfoRow label="Cliente" value={ep.cliente} /></div>
            <div style={{ gridColumn: '1 / -1' }}><InfoRow label="Endereço Cadastrado" value={backlogItem?.Endereco} /></div>
            <InfoRow label="Cidade" value={backlogItem?.Cidade} />
            <InfoRow label="UF" value={backlogItem?.UF} />
          </div>
        </Section>

        {/* Identificação editável */}
        <Section title="🏷️ Identificação">
          <div style={{ marginBottom: 12 }}>
            <FieldLabel>Tipo</FieldLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {(['GPON', 'ERB/SITE'] as const).map(t => {
                const active = form.tipoRede === t;
                return (
                  <button key={t} type="button" onClick={() => upd({ tipoRede: t })}
                    style={{ padding: '9px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, border: active ? 'none' : '1px solid #1e2e4a', background: active ? '#2d7ef0' : 'transparent', color: active ? '#fff' : '#8a9bbf' }}>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <FieldLabel>Empresa Responsável</FieldLabel>
            <TextInput value={form.empresaResponsavel} onChange={v => upd({ empresaResponsavel: v })} placeholder="R2 / VIVO / ICOMON..." />
          </div>
          <div>
            <FieldLabel>Endereço real (Ponto B)</FieldLabel>
            <TextInput value={form.enderecoReal} onChange={v => upd({ enderecoReal: v })} placeholder="Endereço onde o serviço foi executado" />
          </div>
        </Section>

        {/* Rede GPON */}
        {form.tipoRede === 'GPON' && (
          <Section title="🌐 Rede GPON">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <div><FieldLabel>Armário</FieldLabel><TextInput value={form.armario} onChange={v => upd({ armario: v })} placeholder="I05" /></div>
              <div><FieldLabel>SP</FieldLabel><TextInput value={form.sp} onChange={v => upd({ sp: v })} placeholder="149" /></div>
              <div><FieldLabel>CTO</FieldLabel><TextInput value={form.cto} onChange={v => upd({ cto: v })} placeholder="1171" /></div>
            </div>
          </Section>
        )}

        {/* Rede ERB/SITE */}
        {form.tipoRede === 'ERB/SITE' && (
          <Section title="📡 Rede ERB/SITE">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div><FieldLabel>SWA</FieldLabel><TextInput value={form.swa} onChange={v => upd({ swa: v })} /></div>
              <div><FieldLabel>Porta (SWA)</FieldLabel><TextInput value={form.portaSwa} onChange={v => upd({ portaSwa: v })} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><FieldLabel>DGO</FieldLabel><TextInput value={form.dgo} onChange={v => upd({ dgo: v })} /></div>
              <div><FieldLabel>Porta (DGO)</FieldLabel><TextInput value={form.portaDgo} onChange={v => upd({ portaDgo: v })} /></div>
            </div>
          </Section>
        )}

        {/* Responsável no local */}
        <Section title="👤 Responsável no Local">
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
            <div><FieldLabel>Nome</FieldLabel><TextInput value={form.responsavelLocal} onChange={v => upd({ responsavelLocal: v })} placeholder="Ex: ANTONIO VITOR" /></div>
            <div><FieldLabel>Contato</FieldLabel><TextInput value={form.contatoLocal} onChange={v => upd({ contatoLocal: v })} placeholder="71 98190-7873" /></div>
          </div>
        </Section>

        {/* Campos específicos por carimbo */}
        {form.carimboTipo === 'Ativação' && (
          <Section title="✅ Dados de Ativação">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div><FieldLabel>🖥️ CPD</FieldLabel><TextInput value={form.cpd} onChange={v => upd({ cpd: v })} placeholder="ENEAS" /></div>
              <div><FieldLabel>📞 Contato CPD</FieldLabel><TextInput value={form.contatoCpd} onChange={v => upd({ contatoCpd: v })} placeholder="+55..." /></div>
              <div><FieldLabel>💬 Chat Dani</FieldLabel><TextInput value={form.chatDani} onChange={v => upd({ chatDani: v })} placeholder="ALEXANDRE" /></div>
              <div><FieldLabel>🔐 Senha</FieldLabel><TextInput value={form.senha} onChange={v => upd({ senha: v })} placeholder="gsg1055773" /></div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <FieldLabel>📡 Equipamento utilizado</FieldLabel>
              <TextInput value={form.equipamento} onChange={v => upd({ equipamento: v })} placeholder="DATACOM EDD 2104" />
            </div>
            <div>
              <FieldLabel>📝 Observações</FieldLabel>
              <TextArea value={form.observacoes} onChange={v => upd({ observacoes: v })} placeholder="Detalhes adicionais..." />
            </div>
          </Section>
        )}

        {form.carimboTipo === 'Reparo' && (
          <Section title="🛠️ Dados de Reparo">
            <div style={{ marginBottom: 10 }}>
              <FieldLabel>⚠️ Causa</FieldLabel>
              <TextArea value={form.causa} onChange={v => upd({ causa: v })} placeholder="Causa do problema..." />
            </div>
            <div style={{ marginBottom: 10 }}>
              <FieldLabel>🛠️ Solução</FieldLabel>
              <TextArea value={form.solucao} onChange={v => upd({ solucao: v })} placeholder="Solução aplicada..." />
            </div>
            <div>
              <FieldLabel>📌 Status</FieldLabel>
              <TextInput value={form.statusReparo} onChange={v => upd({ statusReparo: v })} placeholder="CONCLUIDO" />
            </div>
          </Section>
        )}

        {form.carimboTipo === 'Construção' && (
          <Section title="🏗️ Dados de Construção/Rede">
            <div style={{ marginBottom: 12 }}><FieldLabel>Abordagem</FieldLabel><YesNoToggle value={form.abordagem} onChange={v => upd({ abordagem: v })} /></div>
            <div style={{ marginBottom: 12 }}><FieldLabel>Alteração de Projeto</FieldLabel><YesNoToggle value={form.alteracaoProjeto} onChange={v => upd({ alteracaoProjeto: v })} /></div>
            <div style={{ marginBottom: 14 }}><FieldLabel>Alteração de CTO/SP/Site</FieldLabel><YesNoToggle value={form.alteracaoCtoSpSite} onChange={v => upd({ alteracaoCtoSpSite: v })} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><FieldLabel>● Rede Lançada</FieldLabel><TextInput value={form.redeLancada} onChange={v => upd({ redeLancada: v })} placeholder="200 m" /></div>
              <div><FieldLabel>● Rede Interna</FieldLabel><TextInput value={form.redeInterna} onChange={v => upd({ redeInterna: v })} /></div>
              <div><FieldLabel>● Rede Existente</FieldLabel><TextInput value={form.redeExistente} onChange={v => upd({ redeExistente: v })} /></div>
              <div><FieldLabel>● Enlace Total</FieldLabel><TextInput value={form.enlaceTotal} onChange={v => upd({ enlaceTotal: v })} placeholder="200 m" /></div>
            </div>
          </Section>
        )}

        {/* Fotos */}
        <Section title="📷 Fotos do Serviço">
          <div style={{ fontSize: 12, color: '#4a5a7a', marginBottom: 10 }}>Anexe quantas fotos forem necessárias.</div>
          <input ref={fotoInputRef} type="file" accept="image/*" multiple capture="environment" onChange={handleFotos} style={{ display: 'none' }} />
          <button type="button" onClick={() => fotoInputRef.current?.click()}
            style={{ width: '100%', padding: '11px', borderRadius: 8, cursor: 'pointer', background: 'transparent', border: '2px dashed #1e2e4a', color: '#8a9bbf', fontWeight: 600, fontSize: 13, marginBottom: 14 }}>
            📷 Adicionar Fotos ({form.fotos.length})
          </button>
          {form.fotos.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {form.fotos.map((f, idx) => (
                <div key={idx} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '1', background: '#0a0f1a', border: '1px solid #1e2e4a' }}>
                  <img src={f.preview} alt={`foto-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <button type="button" onClick={() => removerFoto(idx)}
                    style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(232,85,85,0.9)', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', color: '#fff', fontWeight: 700, fontSize: 12 }}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Preview do carimbo */}
        <Section title="📄 Pré-visualização do Carimbo">
          <pre style={{ background: '#0a0f1a', border: '1px solid #1e2e4a', borderRadius: 8, padding: 12, color: '#cfd8ec', fontSize: 12, fontFamily: 'ui-monospace, monospace', whiteSpace: 'pre-wrap', maxHeight: 280, overflow: 'auto', margin: 0 }}>
            {carimboPreview}
          </pre>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
            <button type="button" onClick={copiarCarimbo}
              style={{ padding: '10px', borderRadius: 8, cursor: 'pointer', background: '#2d7ef018', border: '1px solid #2d7ef040', color: '#2d7ef0', fontWeight: 700, fontSize: 13 }}>
              {carimboGerado ? '✓ Copiado!' : '📋 Copiar'}
            </button>
            <button type="button" onClick={compartilharWhatsApp}
              style={{ padding: '10px', borderRadius: 8, cursor: 'pointer', background: '#0eb88a18', border: '1px solid #0eb88a40', color: '#0eb88a', fontWeight: 700, fontSize: 13 }}>
              💬 WhatsApp
            </button>
          </div>
        </Section>

        {/* Concluir */}
        {!confirmando ? (
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={() => setConfirmando(true)}
              style={{ flex: 2, padding: '14px', borderRadius: 10, cursor: 'pointer', background: 'linear-gradient(135deg, #0eb88a, #0dd8a0)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 15 }}>
              ✓ Concluir Atividade
            </button>
            <button type="button" disabled={saving} onClick={() => onConcluir(form, 'Não Concluído', carimboPreview)}
              style={{ flex: 1, padding: '14px', borderRadius: 10, cursor: saving ? 'wait' : 'pointer', background: 'transparent', border: '2px solid #e85555', color: '#e85555', fontWeight: 700, fontSize: 14, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Salvando...' : 'Não Concluído'}
            </button>
          </div>
        ) : (
          <div style={{ background: '#0eb88a18', border: '1px solid #0eb88a40', borderRadius: 12, padding: '18px', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0eb88a', marginBottom: 6 }}>Confirmar Conclusão?</div>
            <div style={{ fontSize: 12, color: '#4a5a7a', marginBottom: 14 }}>A atividade será marcada como Concluída.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setConfirmando(false)}
                style={{ flex: 1, padding: '11px', borderRadius: 8, cursor: 'pointer', background: 'transparent', border: '1px solid #1e2e4a', color: '#8a9bbf', fontWeight: 600 }}>
                Cancelar
              </button>
              <button type="button" disabled={saving} onClick={() => onConcluir(form, 'Concluída', carimboPreview)}
                style={{ flex: 2, padding: '11px', borderRadius: 8, cursor: saving ? 'wait' : 'pointer', background: '#0eb88a', border: 'none', color: '#fff', fontWeight: 700, fontSize: 14, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Salvando...' : '✓ Confirmar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Lista principal ────────────────────────────────────────────────────────
export default function TecnicoView() {
  const { currentUser, schedule, data, setCurrentUser, updateBacklogItem, updateScheduleEvent } = useAppStore();
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [saving, setSaving] = useState(false);
  const [sites, setSites] = useState<SiteKML[]>([]);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}kml/sites.kml`)
      .then(r => (r.ok ? r.text() : Promise.reject()))
      .then(text => setSites(parseKML(text)))
      .catch(() => { /* silencioso */ });
  }, []);

  if (!currentUser) return null;

  // 🔒 SEGURANÇA: técnico só enxerga atividades atribuídas ao próprio nome.
  const minhasAtividades = schedule
    .filter(e => e.extendedProps.tecnico === currentUser.nome)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const groups = minhasAtividades.reduce<Record<string, ScheduleEvent[]>>((acc, ev) => {
    const key = new Date(ev.start).toDateString();
    (acc[key] ||= []).push(ev);
    return acc;
  }, {});
  const today = new Date().toDateString();

  async function handleConcluir(form: FormData, status: 'Concluída' | 'Não Concluído', carimbo: string) {
    if (!selectedEvent || saving) return;
    setSaving(true);
    try {
      const fotos = await filesToDataUrls(form.fotos.map((f) => f.file));
      await updateScheduleEvent(selectedEvent.id, {
        extendedProps: {
          ...selectedEvent.extendedProps,
          status,
          fotos,
          carimbo,
          concluidoEm: new Date().toISOString(),
        },
      });
      if (selectedEvent.extendedProps.itemID) {
        const backlogStatus = status === 'Concluída' ? 'Concluído' : 'Não Concluído';
        await updateBacklogItem(selectedEvent.extendedProps.itemID, { Status: backlogStatus });
      }
      setSelectedEvent(null);
    } finally {
      setSaving(false);
    }
  }

  if (selectedEvent) {
    const backlogItem = data.find(d => d.ID === selectedEvent.extendedProps.itemID);
    return (
      <DetalheAtividade
        event={selectedEvent} backlogItem={backlogItem} currentUser={currentUser}
        sites={sites} onBack={() => setSelectedEvent(null)} onConcluir={handleConcluir} saving={saving}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1a', fontFamily: 'inherit' }}>
      <div style={{ background: 'linear-gradient(135deg, #0f1829, #1a2540)', borderBottom: '1px solid #1e2e4a', padding: '16px 16px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: 'linear-gradient(135deg, #2d7ef0, #0dd8d8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
              📡
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#e8edf5' }}>SMRA</div>
              <div style={{ fontSize: 11, color: '#4a5a7a' }}>Área do Técnico</div>
            </div>
          </div>
          <button type="button" onClick={() => setCurrentUser(null)}
            style={{ background: '#e8555518', border: '1px solid #e8555530', borderRadius: 9, padding: '8px 12px', color: '#e85555', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
            Sair
          </button>
        </div>
        <div style={{ background: '#0a0f1a', border: '1px solid #1e2e4a', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 46, height: 46, borderRadius: 10, background: '#0eb88a20', color: '#0eb88a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
            {initials(currentUser.nome)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e8edf5' }}>{currentUser.nome}</div>
            <div style={{ fontSize: 12, color: '#4a5a7a', marginTop: 2 }}>Técnico · {currentUser.uf}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#0eb88a' }}>{minhasAtividades.length}</div>
            <div style={{ fontSize: 10, color: '#4a5a7a' }}>atividades</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 14px 32px' }}>
        {minhasAtividades.length === 0 ? (
          <div style={{ marginTop: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#4a5a7a' }}>Nenhuma atividade atribuída a você</div>
          </div>
        ) : (
          Object.entries(groups).map(([dateStr, events]) => {
            const isToday = dateStr === today;
            const d = new Date(dateStr);
            const dateLabel = isToday ? 'Hoje' : d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
            return (
              <div key={dateStr} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: isToday ? '#2d7ef0' : '#4a5a7a', textTransform: 'capitalize' }}>{dateLabel}</div>
                  {isToday && <span style={{ background: '#2d7ef020', color: '#2d7ef0', borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>HOJE</span>}
                  <div style={{ flex: 1, height: 1, background: '#1e2e4a' }} />
                  <span style={{ fontSize: 11, color: '#2a3a5a' }}>{events.length}</span>
                </div>
                {events.map(ev => {
                  const c = tipoColor[ev.extendedProps.tipo] || tipoColor['Ativação'];
                  const ep2 = ev.extendedProps;
                  return (
                    <button key={ev.id} type="button" onClick={() => setSelectedEvent(ev)}
                      style={{ width: '100%', textAlign: 'left', display: 'block', background: '#0f1829', border: '1px solid #1e2e4a', borderRadius: 12, padding: 0, marginBottom: 10, cursor: 'pointer', overflow: 'hidden' }}>
                      <div style={{ height: 4, background: c.text, borderRadius: '12px 12px 0 0' }} />
                      <div style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                          <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 700 }}>{ep2.tipo}</span>
                          <span style={{ background: `${statusColor[ep2.status] || '#8b5cf6'}18`, color: statusColor[ep2.status] || '#8b5cf6', borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 600 }}>{ep2.status}</span>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#e8edf5', marginBottom: 4 }}>{ep2.cliente}</div>
                        <div style={{ fontSize: 12, color: '#4a5a7a', marginBottom: 10 }}>OS: {ep2.pon || ep2.itemID}</div>
                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: '#8a9bbf' }}>
                          <span>📅 {formatDate(ev.start)}</span>
                          <span>🕒 {formatTime(ev.start)}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
