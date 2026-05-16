// src/features/tecnico/TecnicoView.tsx
// Tela exclusiva do Técnico — exibe atividades de Ativação e Construção atribuídas a ele.
// Formulário completo de encerramento com KML, fotos e distância.

import { useState, useRef, useEffect, useCallback, ChangeEvent } from 'react';
import { useAppStore, ScheduleEvent, User } from '../../store/useAppStore';

type SiteKML = { nome: string; lat: number; lng: number };

type FormData = {
  alteracaoProjeto: '' | 'Sim' | 'Não';
  alteracaoCtoSpSite: '' | 'Sim' | 'Não';
  abordagem: string;
  houveTrocaSite: '' | 'Sim' | 'Não';
  dgo: string;
  fo: string;
  redeLancada: string;
  redeInterna: string;
  redeExistente: string;
  enlaceTotal: string;
  responsavelLocal: string;
  contato: string;
  siglaSite: string;
  enderecoClienteManual: string;
  latCliente: number | null;
  lngCliente: number | null;
  fotos: { file: File; preview: string }[];
};

const tipoColor: Record<string, { bg: string; text: string; border: string; label: string }> = {
  Ativação:   { bg: '#0eb88a18', text: '#0eb88a', border: '#0eb88a40', label: 'Ativação' },
  Construção: { bg: '#2d7ef018', text: '#2d7ef0', border: '#2d7ef040', label: 'Construção' },
};
const statusColor: Record<string, string> = {
  Agendado: '#2d7ef0', Planejado: '#8b5cf6', Concluída: '#0eb88a', 'Em andamento': '#f5882a',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
function initials(nome: string) {
  return nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}
function sanitizeId(v?: string | null): string {
  if (!v) return '—';
  // If it looks like a Date string (contains weekday names or timezone), return empty
  if (/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)|GMT|\d{4}\s\d{2}:\d{2}:\d{2}/.test(v)) return '—';
  return v;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371, dLat = ((lat2 - lat1) * Math.PI) / 180, dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const q = encodeURIComponent(address + ', Brasil');
    const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, { headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'SMRA-Telecom/1.0' } });
    const j = await r.json();
    if (j.length > 0) return { lat: parseFloat(j[0].lat), lng: parseFloat(j[0].lon) };
    return null;
  } catch { return null; }
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

const InfoRow = ({ label, value }: { label: string; value?: string | null }) =>
  value ? (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#4a5a7a', textTransform: 'uppercase' as const, letterSpacing: 0.8, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, color: '#e8edf5', fontWeight: 500 }}>{value}</div>
    </div>
  ) : null;

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ background: '#0f1829', border: '1px solid #1e2e4a', borderRadius: 12, padding: '18px 20px', marginBottom: 14 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: '#4a5a7a', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #1e2e4a' }}>{title}</div>
    {children}
  </div>
);

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 10, fontWeight: 600, color: '#4a5a7a', textTransform: 'uppercase' as const, letterSpacing: 0.8, marginBottom: 5 }}>{children}</div>
);

const TextInput = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) => (
  <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    style={{ width: '100%', boxSizing: 'border-box' as const, background: '#0a0f1a', border: '1px solid #1e2e4a', borderRadius: 8, padding: '9px 12px', color: '#e8edf5', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
);

const YesNoToggle = ({ value, onChange }: { value: '' | 'Sim' | 'Não'; onChange: (v: 'Sim' | 'Não') => void }) => (
  <div style={{ display: 'flex', gap: 8 }}>
    {(['Sim', 'Não'] as const).map(opt => (
      <button key={opt} type="button" onClick={() => onChange(opt)}
        style={{ flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, border: value === opt ? 'none' : '1px solid #1e2e4a', background: value === opt ? (opt === 'Sim' ? '#0eb88a' : '#e85555') : 'transparent', color: value === opt ? '#fff' : '#4a5a7a', transition: 'all 0.15s' }}>
        {opt}
      </button>
    ))}
  </div>
);

function DetalheAtividade({ event, backlogItem, currentUser, sites, onBack, onConcluir }: {
  event: ScheduleEvent;
  backlogItem: ReturnType<typeof useAppStore.getState>['data'][0] | undefined;
  currentUser: User;
  sites: SiteKML[];
  onBack: () => void;
  onConcluir: (form: FormData, status: 'Concluída' | 'Não Concluído') => void;
}) {
  const tipo = event.extendedProps.tipo;
  const color = tipoColor[tipo] || tipoColor['Ativação'];
  const ep = event.extendedProps;

  const [form, setForm] = useState<FormData>({
    alteracaoProjeto: '', alteracaoCtoSpSite: '', abordagem: '', houveTrocaSite: '',
    dgo: '', fo: '', redeLancada: '', redeInterna: '', redeExistente: '',
    enlaceTotal: '', responsavelLocal: '', contato: '',
    siglaSite: ep.pon || ep.itemID || '',
    enderecoClienteManual: backlogItem?.Endereco || '',
    latCliente: null, lngCliente: null, fotos: [],
  });

  const [geocoding, setGeocoding] = useState(false);
  const [distancia, setDistancia] = useState<{ km: number; site: SiteKML } | null>(null);
  const [rotaCoords, setRotaCoords] = useState<[number, number][] | null>(null);
  const [clienteCoords, setClienteCoords] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [distError, setDistError] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  const upd = (partial: Partial<FormData>) => setForm(prev => ({ ...prev, ...partial }));

  // Site vinculado: busca pela sigla digitada no campo (form.siglaSite)
  const siteVinculado: SiteKML | null = (() => {
    if (!sites.length || !form.siglaSite.trim()) return null;
    const lower = form.siglaSite.trim().toLowerCase();
    return sites.find(s => s.nome.toLowerCase().includes(lower)) || null;
  })();

  async function calcularDistancia() {
    if (!form.enderecoClienteManual.trim()) { setDistError('Informe o endereço do cliente.'); return; }
    if (!sites.length) { setDistError('Arquivo KML não carregado. Coloque em public/kml/sites.kml'); return; }
    if (!form.siglaSite.trim()) { setDistError('Informe a sigla do site antes de calcular.'); return; }
    setGeocoding(true); setDistError(''); setDistancia(null); setRotaCoords(null);
    const coords = await geocodeAddress(form.enderecoClienteManual);
    if (!coords) { setDistError('Endereço não encontrado. Tente ser mais específico.'); setGeocoding(false); return; }
    upd({ latCliente: coords.lat, lngCliente: coords.lng });
    setClienteCoords(coords);

    const siteAlvo = siteVinculado || (() => {
      let menor = Infinity, siteProximo = sites[0];
      for (const s of sites) { const d = haversine(coords.lat, coords.lng, s.lat, s.lng); if (d < menor) { menor = d; siteProximo = s; } }
      return siteProximo;
    })();

    if (!siteVinculado) {
      setDistError(`⚠️ Sigla "${form.siglaSite}" não encontrada no KML. Exibindo site mais próximo.`);
    }

    const d = haversine(coords.lat, coords.lng, siteAlvo.lat, siteAlvo.lng);
    setDistancia({ km: d, site: siteAlvo });

    // Buscar rota real via OSRM (gratuito, sem chave)
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${siteAlvo.lng},${siteAlvo.lat};${coords.lng},${coords.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.routes?.[0]?.geometry?.coordinates) {
        const coords2: [number, number][] = json.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
        setRotaCoords(coords2);
        // Usar distância real da rota se disponível
        const distKm = json.routes[0].distance / 1000;
        setDistancia({ km: distKm, site: siteAlvo });
      }
    } catch { /* fallback para distância em linha reta já calculada */ }

    setGeocoding(false);
  }

  function handleFotos(e: ChangeEvent<HTMLInputElement>) {
    const novas = Array.from(e.target.files || []).map(file => ({ file, preview: URL.createObjectURL(file) }));
    upd({ fotos: [...form.fotos, ...novas] });
    e.target.value = '';
  }
  function removerFoto(idx: number) {
    const nova = [...form.fotos]; URL.revokeObjectURL(nova[idx].preview); nova.splice(idx, 1); upd({ fotos: nova });
  }

  // Carregar Leaflet dinamicamente e inicializar mapa
  useEffect(() => {
    if (!rotaCoords || !distancia || !clienteCoords) return;

    function initMap(L: any) {
      const container = mapRef.current;
      if (!container) return;
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }

      const site = distancia!.site;
      const map = L.map(container, { zoomControl: true, attributionControl: true });
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

      const siteIcon = L.divIcon({
        html: '<div style="width:14px;height:14px;background:#2d7ef0;border:3px solid #fff;border-radius:50%;box-shadow:0 0 6px #2d7ef088;"></div>',
        className: '', iconAnchor: [7, 7],
      });
      const clienteIcon = L.divIcon({
        html: '<div style="width:14px;height:14px;background:#0eb88a;border:3px solid #fff;border-radius:50%;box-shadow:0 0 6px #0eb88a88;"></div>',
        className: '', iconAnchor: [7, 7],
      });

      L.marker([site.lat, site.lng], { icon: siteIcon }).addTo(map).bindPopup('<b>Site: ' + site.nome + '</b>').openPopup();
      L.marker([clienteCoords!.lat, clienteCoords!.lng], { icon: clienteIcon }).addTo(map).bindPopup('<b>Cliente</b>');

      const polyline = L.polyline(rotaCoords!, { color: '#2d7ef0', weight: 5, opacity: 0.9 }).addTo(map);
      map.fitBounds(polyline.getBounds(), { padding: [30, 30] });
    }

    if ((window as any).L) {
      setTimeout(() => initMap((window as any).L), 50);
      return;
    }

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setTimeout(() => initMap((window as any).L), 50);
    document.head.appendChild(script);

    return () => {
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    };
  }, [rotaCoords, distancia, clienteCoords, mapReady]);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1a', fontFamily: 'inherit' }}>
      <div style={{ background: `linear-gradient(135deg, ${color.text}cc, ${color.text}88)`, padding: '0 0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px' }}>
          <button type="button" onClick={onBack} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '7px 12px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
            Lista de atividades
          </button>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>
            {new Date(event.start).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
          </div>
        </div>
        <div style={{ padding: '4px 16px 0' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>Formulário de Encerramento</div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>{color.label}</span>
            <span style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>{ep.status}</span>
          </div>
        </div>
      </div>

      {/* Layout: 2 colunas no desktop, 1 no mobile */}
      <div style={{ padding: '16px 20px 100px', maxWidth: 1400, margin: '0 auto' }}>
        <style>{`
          @media (min-width: 900px) { .smra-grid { display: grid !important; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; } }
          @media (max-width: 899px) { .smra-grid { display: block !important; } }
        `}</style>
        <div className="smra-grid" style={{ display: 'block' }}>

        {/* INFORMAÇÕES DA ATIVIDADE */}
        <Section title="📋 Informações da Atividade">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <InfoRow label="ID Produto"          value={backlogItem?.Pedido || ep.itemID || String(event.id)} />
            <InfoRow label="ID Draft"            value={sanitizeId(backlogItem?.DraftEncontrado)} />
            <InfoRow label="Empresa Responsável" value={backlogItem?.Bucle_Contratada || 'SMRA Telecom'} />
            <InfoRow label="Produto"             value={backlogItem?.Produto} />
            <InfoRow label="Serviço"             value={backlogItem?.Servico} />
            <InfoRow label="Tecnologia"          value={backlogItem?.Tecnologia_Report} />
            <InfoRow label="OS SCD"              value={backlogItem?.OS_SCD} />
            <InfoRow label="OS TBS"              value={backlogItem?.OS_TBS} />
          </div>
        </Section>

        {/* INFORMAÇÕES DO CLIENTE */}
        <Section title="👤 Informações do Cliente">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <div style={{ gridColumn: '1 / -1' }}><InfoRow label="Cliente" value={ep.cliente} /></div>
            {backlogItem && <>
              <div style={{ gridColumn: '1 / -1' }}><InfoRow label="Endereço Cadastrado" value={backlogItem.Endereco} /></div>
              <InfoRow label="Cidade" value={backlogItem.Cidade} />
              <InfoRow label="Estado" value={backlogItem.UF} />
            </>}
          </div>
        </Section>

        {/* INFORMAÇÕES DA REDE */}
        <Section title="🌐 Informações da Rede">
          <div style={{ marginBottom: 16 }}><FieldLabel>Alteração de Projeto</FieldLabel><YesNoToggle value={form.alteracaoProjeto} onChange={v => upd({ alteracaoProjeto: v })} /></div>
          <div style={{ marginBottom: 16 }}><FieldLabel>Alteração de CTO / SP / Site</FieldLabel><YesNoToggle value={form.alteracaoCtoSpSite} onChange={v => upd({ alteracaoCtoSpSite: v })} /></div>
          <div style={{ marginBottom: 16 }}><FieldLabel>Abordagem</FieldLabel><TextInput value={form.abordagem} onChange={v => upd({ abordagem: v })} placeholder="Descreva a abordagem..." /></div>
          <div style={{ marginBottom: 16 }}><FieldLabel>Houve Troca do Site?</FieldLabel><YesNoToggle value={form.houveTrocaSite} onChange={v => upd({ houveTrocaSite: v })} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><FieldLabel>DGO</FieldLabel><TextInput value={form.dgo} onChange={v => upd({ dgo: v })} placeholder="DGO..." /></div>
            <div><FieldLabel>FO</FieldLabel><TextInput value={form.fo} onChange={v => upd({ fo: v })} placeholder="FO..." /></div>
          </div>
        </Section>

        {/* DETALHES DA REDE */}
        <Section title="📡 Detalhes da Rede">
          {([
            ['Rede Lançada', 'redeLancada'], ['Rede Interna', 'redeInterna'], ['Rede Existente', 'redeExistente'],
            ['Enlace Total', 'enlaceTotal'], ['Responsável no Local', 'responsavelLocal'], ['Contato', 'contato'],
          ] as [string, keyof FormData][]).map(([label, key]) => (
            <div key={key as string} style={{ marginBottom: 14 }}>
              <FieldLabel>{label}</FieldLabel>
              <TextInput value={form[key] as string} onChange={v => upd({ [key]: v } as Partial<FormData>)} placeholder={`Informe ${label.toLowerCase()}...`} />
            </div>
          ))}
        </Section>

        {/* DISTÂNCIA CLIENTE ↔ SITE */}
        <Section title="📍 Distância Cliente ↔ Site">
          <div style={{ marginBottom: 12, fontSize: 12, color: '#4a5a7a', lineHeight: 1.6 }}>
            Informe a <strong style={{ color: '#e8edf5' }}>sigla do site</strong> (Ponto A) e o <strong style={{ color: '#e8edf5' }}>endereço do cliente</strong> (Ponto B) para calcular a distância.
          </div>

          {!sites.length && (
            <div style={{ background: '#f5882a18', border: '1px solid #f5882a40', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#f5882a' }}>
              ⚠️ KML não encontrado. Coloque o arquivo em <strong>public/kml/sites.kml</strong>
            </div>
          )}

          {/* Campo Sigla do Site */}
          <div style={{ marginBottom: 12 }}>
            <FieldLabel>Sigla do Site (Ponto A — KML)</FieldLabel>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={form.siglaSite}
                onChange={e => {
                  upd({ siglaSite: e.target.value });
                  setDistancia(null);
                  setDistError('');
                }}
                placeholder="Ex: SITE-001, PE-REC-001..."
                style={{ flex: 1, boxSizing: 'border-box' as const, background: '#0a0f1a', border: `1px solid ${siteVinculado ? '#0eb88a' : '#1e2e4a'}`, borderRadius: 8, padding: '9px 12px', color: '#e8edf5', fontSize: 13, outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
              />
            </div>
            {/* Feedback inline da busca no KML */}
            {form.siglaSite.trim() && sites.length > 0 && (
              <div style={{ marginTop: 6, fontSize: 11, color: siteVinculado ? '#0eb88a' : '#f5882a', display: 'flex', alignItems: 'center', gap: 5 }}>
                {siteVinculado
                  ? <>✓ Encontrado: <strong>{siteVinculado.nome}</strong> &nbsp;·&nbsp; {siteVinculado.lat.toFixed(5)}, {siteVinculado.lng.toFixed(5)}</>
                  : <>✗ Sigla não encontrada no KML. Verifique ou tente parte do nome.</>
                }
              </div>
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <FieldLabel>Endereço Real do Cliente (Ponto B)</FieldLabel>
            <TextInput value={form.enderecoClienteManual} onChange={v => upd({ enderecoClienteManual: v })} placeholder="Ex: Rua das Flores, 100, Recife - PE" />
          </div>

          <button type="button" onClick={calcularDistancia} disabled={geocoding}
            style={{ width: '100%', padding: '10px', borderRadius: 8, cursor: geocoding ? 'wait' : 'pointer', background: '#2d7ef018', border: '1px solid #2d7ef040', color: '#2d7ef0', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {geocoding ? '⏳ Geocodificando...' : '📍 Calcular Distância'}
          </button>

          {distError && <div style={{ marginTop: 10, background: '#f5882a18', border: '1px solid #f5882a40', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#f5882a' }}>{distError}</div>}

          {distancia && (
            <div style={{ marginTop: 14 }}>
              {/* Card de resultado */}
              <div style={{ background: '#0eb88a18', border: '1px solid #0eb88a40', borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#0eb88a', textTransform: 'uppercase' as const, letterSpacing: 0.8, marginBottom: 6 }}>
                  {rotaCoords ? 'Distância Real (Rota)' : 'Distância em Linha Reta'}
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#0eb88a' }}>{distancia.km.toFixed(2)} km</div>
                <div style={{ display: 'flex', gap: 20, marginTop: 8, flexWrap: 'wrap' as const }}>
                  <div style={{ fontSize: 12 }}>
                    <span style={{ color: '#4a5a7a' }}>🔵 Site: </span>
                    <span style={{ color: '#e8edf5', fontWeight: 600 }}>{distancia.site.nome}</span>
                  </div>
                  <div style={{ fontSize: 12 }}>
                    <span style={{ color: '#4a5a7a' }}>🟢 Cliente: </span>
                    <span style={{ color: '#e8edf5', fontWeight: 600 }}>{form.enderecoClienteManual}</span>
                  </div>
                </div>
              </div>

              {/* Mapa Leaflet */}
              {rotaCoords && (
                <div
                  ref={el => { (mapRef as any).current = el; if (el && !mapReady) setMapReady(true); }}
                  style={{ width: '100%', height: 320, borderRadius: 10, overflow: 'hidden', border: '1px solid #1e2e4a', marginTop: 4 }}
                />
              )}
            </div>
          )}
        </Section>

        {/* FOTOS */}
        <Section title="📷 Anexar Fotos">
          <div style={{ fontSize: 12, color: '#4a5a7a', marginBottom: 12 }}>Sem limite de imagens. Selecione múltiplas de uma vez.</div>
          <input ref={fotoInputRef} type="file" accept="image/*" multiple onChange={handleFotos} style={{ display: 'none' }} />
          <button type="button" onClick={() => fotoInputRef.current?.click()}
            style={{ width: '100%', padding: '11px', borderRadius: 8, cursor: 'pointer', background: 'transparent', border: '2px dashed #1e2e4a', color: '#8a9bbf', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
            📷 Adicionar Fotos ({form.fotos.length})
          </button>
          {form.fotos.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {form.fotos.map((f, idx) => (
                <div key={idx} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '1', background: '#0a0f1a', border: '1px solid #1e2e4a' }}>
                  <img src={f.preview} alt={`foto-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' as const, display: 'block' }} />
                  <button type="button" onClick={() => removerFoto(idx)}
                    style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(232,85,85,0.9)', border: 'none', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontWeight: 700, fontSize: 12 }}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        </div>{/* end smra-grid */}

        {/* BOTÕES */}
        {!confirmando ? (
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={() => setConfirmando(true)}
              style={{ flex: 2, padding: '14px', borderRadius: 10, cursor: 'pointer', background: 'linear-gradient(135deg, #0eb88a, #0dd8a0)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              ✓ Concluir
            </button>
            <button type="button" onClick={() => onConcluir(form, 'Não Concluído')}
              style={{ flex: 1, padding: '14px', borderRadius: 10, cursor: 'pointer', background: 'transparent', border: '2px solid #e85555', color: '#e85555', fontWeight: 700, fontSize: 14 }}>
              Não Concluído
            </button>
          </div>
        ) : (
          <div style={{ background: '#0eb88a18', border: '1px solid #0eb88a40', borderRadius: 12, padding: '20px', textAlign: 'center' as const }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0eb88a', marginBottom: 8 }}>Confirmar Conclusão?</div>
            <div style={{ fontSize: 12, color: '#4a5a7a', marginBottom: 16 }}>Esta ação marcará a atividade como Concluída.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setConfirmando(false)}
                style={{ flex: 1, padding: '11px', borderRadius: 8, cursor: 'pointer', background: 'transparent', border: '1px solid #1e2e4a', color: '#8a9bbf', fontWeight: 600 }}>
                Cancelar
              </button>
              <button type="button" onClick={() => onConcluir(form, 'Concluída')}
                style={{ flex: 2, padding: '11px', borderRadius: 8, cursor: 'pointer', background: '#0eb88a', border: 'none', color: '#fff', fontWeight: 700, fontSize: 14 }}>
                ✓ Confirmar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TecnicoView() {
  const { currentUser, schedule, data, setCurrentUser, updateBacklogItem } = useAppStore();
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [sites, setSites] = useState<SiteKML[]>([]);

  useEffect(() => {
    fetch('/kml/sites.kml')
      .then(r => (r.ok ? r.text() : Promise.reject()))
      .then(text => setSites(parseKML(text)))
      .catch(() => {});
  }, []);

  if (!currentUser) return null;

  const minhasAtividades = schedule
    .filter(e => e.extendedProps.tecnico === currentUser.nome && (e.extendedProps.tipo === 'Ativação' || e.extendedProps.tipo === 'Construção'))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const groups = minhasAtividades.reduce<Record<string, ScheduleEvent[]>>((acc, ev) => {
    const key = new Date(ev.start).toDateString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(ev);
    return acc;
  }, {});

  const today = new Date().toDateString();

  function handleConcluir(form: FormData, status: 'Concluída' | 'Não Concluído') {
    if (selectedEvent?.extendedProps.itemID) {
      updateBacklogItem(selectedEvent.extendedProps.itemID, { Status: status });
    }
    console.log('[SMRA] Encerramento:', { status, form });
    setSelectedEvent(null);
  }

  if (selectedEvent) {
    const backlogItem = data.find(d => d.ID === selectedEvent.extendedProps.itemID);
    return (
      <DetalheAtividade
        event={selectedEvent} backlogItem={backlogItem} currentUser={currentUser}
        sites={sites} onBack={() => setSelectedEvent(null)} onConcluir={handleConcluir}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1a', fontFamily: 'inherit' }}>
      <div style={{ background: 'linear-gradient(135deg, #0f1829, #1a2540)', borderBottom: '1px solid #1e2e4a', padding: '16px 16px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: 'linear-gradient(135deg, #2d7ef0, #0dd8d8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.136 12.006a8.25 8.25 0 0 1 13.728 0M2 8.974a12 12 0 0 1 20 0" />
                <circle cx="12" cy="19" r="1.5" fill="white" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#e8edf5' }}>SMRA</div>
              <div style={{ fontSize: 11, color: '#4a5a7a' }}>
                Área do Técnico
                {sites.length > 0 && <span style={{ marginLeft: 8, color: '#0eb88a' }}>· {sites.length} sites KML ✓</span>}
              </div>
            </div>
          </div>
          <button type="button" onClick={() => setCurrentUser(null)}
            style={{ background: '#e8555518', border: '1px solid #e8555530', borderRadius: 9, padding: '8px 12px', color: '#e85555', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            Sair
          </button>
        </div>
        <div style={{ background: '#0a0f1a', border: '1px solid #1e2e4a', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 46, height: 46, borderRadius: 10, background: '#0eb88a20', color: '#0eb88a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
            {initials(currentUser.nome)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e8edf5' }}>{currentUser.nome}</div>
            <div style={{ fontSize: 12, color: '#4a5a7a', marginTop: 2 }}>Técnico · {currentUser.uf}</div>
          </div>
          <div style={{ textAlign: 'right' as const }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#0eb88a' }}>{minhasAtividades.length}</div>
            <div style={{ fontSize: 10, color: '#4a5a7a' }}>atividades</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 14px 32px' }}>
        {minhasAtividades.length === 0 ? (
          <div style={{ marginTop: 60, textAlign: 'center' as const }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#4a5a7a' }}>Nenhuma atividade agendada</div>
            <div style={{ fontSize: 13, color: '#2a3a5a', marginTop: 6 }}>Quando o supervisor agendar, aparecerá aqui.</div>
          </div>
        ) : (
          Object.entries(groups).map(([dateStr, events]) => {
            const isToday = dateStr === today;
            const d = new Date(dateStr);
            const dateLabel = isToday ? 'Hoje' : d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
            return (
              <div key={dateStr} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: isToday ? '#2d7ef0' : '#4a5a7a', textTransform: 'capitalize' as const }}>{dateLabel}</div>
                  {isToday && <span style={{ background: '#2d7ef020', color: '#2d7ef0', borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>HOJE</span>}
                  <div style={{ flex: 1, height: 1, background: '#1e2e4a' }} />
                  <span style={{ fontSize: 11, color: '#2a3a5a' }}>{events.length}</span>
                </div>
                {events.map(ev => {
                  const c = tipoColor[ev.extendedProps.tipo] || tipoColor['Ativação'];
                  const ep2 = ev.extendedProps;
                  return (
                    <button key={ev.id} type="button" onClick={() => setSelectedEvent(ev)}
                      style={{ width: '100%', textAlign: 'left' as const, display: 'block', background: '#0f1829', border: '1px solid #1e2e4a', borderRadius: 12, padding: 0, marginBottom: 10, cursor: 'pointer', overflow: 'hidden', transition: 'border-color 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = c.border)}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e2e4a')}>
                      <div style={{ height: 4, background: c.text, borderRadius: '12px 12px 0 0' }} />
                      <div style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const }}>
                            <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 700 }}>{ep2.tipo}</span>
                            <span style={{ background: `${statusColor[ep2.status] || '#8b5cf6'}18`, color: statusColor[ep2.status] || '#8b5cf6', borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 600 }}>{ep2.status}</span>
                          </div>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a5a7a" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}><path d="M9 18l6-6-6-6"/></svg>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#e8edf5', marginBottom: 4, lineHeight: 1.3 }}>{ep2.cliente}</div>
                        <div style={{ fontSize: 12, color: '#4a5a7a', marginBottom: 10 }}>OS: {ep2.pon || ep2.itemID}</div>
                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' as const }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#8a9bbf' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                            {formatDate(ev.start)}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#8a9bbf' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                            {formatTime(ev.start)}
                          </div>
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