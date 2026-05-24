# SMRA — Sistema de Monitoramento de Rede e Ativações

Aplicação web para gestão de backlog, agenda técnica, produção diária e encerramento de atividades em campo. Projeto acadêmico do curso de Análise e Desenvolvimento de Sistemas.

## Índice

- [Descrição](#descrição)
- [Tecnologias](#tecnologias)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e execução](#instalação-e-execução)
- [Funcionalidades](#funcionalidades)
- [Credenciais padrão](#credenciais-padrão)
- [Persistência de dados](#persistência-de-dados)
- [Deploy (GitHub Pages)](#deploy-github-pages)

## Descrição

O **SMRA** organiza ordens de serviço (backlog), permite agendar atividades para técnicos, acompanhar a produção do dia e registrar encerramentos em campo (carimbo, fotos e status).

### Perfis de usuário

| Perfil | Acesso |
|--------|--------|
| **Administrador** | Todas as telas, gestão de usuários, relatórios e importação |
| **Supervisor** | Dashboard, backlog, agenda, produção diária, relatórios e importação |
| **Técnico** | Área exclusiva: lista de atividades atribuídas, formulário de encerramento, fotos e carimbo para WhatsApp |

## Tecnologias

- **React 18** + **TypeScript**
- **Vite** (build e dev server)
- **Tailwind CSS**
- **React Router** (navegação)
- **Zustand** (estado global)
- **Chart.js** / react-chartjs-2 (dashboard)
- **FullCalendar** (agenda)
- **XLSX** (importação e exportação Excel)
- **jsPDF** + jsPDF-AutoTable + html2canvas (exportação PDF)

> Não há backend separado neste repositório. Os dados são persistidos no **localStorage** do navegador (`src/lib/api.ts`).

## Estrutura do projeto

```
smra/
├── public/           # Assets estáticos (ex.: KML de sites)
├── src/
│   ├── components/   # Layout, UI, tema
│   ├── features/     # Páginas (dashboard, backlog, agenda, técnico…)
│   ├── lib/          # API local (localStorage)
│   ├── routes/       # Rotas React Router
│   └── store/        # Zustand (useAppStore)
├── index.html
├── package.json
└── vite.config.ts
```

## Pré-requisitos

- [Node.js](https://nodejs.org/) **18+** (recomendado: LTS)
- npm (incluído com o Node)

Não é necessário Docker, PostgreSQL nem servidor backend para desenvolvimento local.

## Instalação e execução

```bash
# Na raiz do repositório
npm install
npm run dev
```

Acesse: **http://localhost:5173/sistema-backlog/**

Outros comandos:

```bash
npm run build    # Gera pasta dist/ (produção)
npm run preview  # Pré-visualiza o build localmente
```

## Funcionalidades

- **Dashboard**: indicadores, gráficos e exportação (Excel/PDF)
- **Backlog geral**: listagem, filtros por coluna, exportação
- **Agenda técnica**: calendário (FullCalendar), agendamento por técnico
- **Produção diária**: atividades do dia, filtros por status/técnico, visualização de fotos do encerramento
- **Relatórios**: relatórios operacionais com exportação
- **Importar planilha**: carga em massa via Excel
- **Usuários**: cadastro e edição (administrador)
- **Área do técnico**: encerramento com modelos de carimbo (Ativação, Reparo, Construção), anexo de fotos; ao concluir, o status na agenda e na produção diária passa para **Concluída** automaticamente

## Credenciais padrão

Usuários criados automaticamente na primeira execução (se o banco local estiver vazio):

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Administrador | `admin@smra.com` | `admin123` |
| Supervisor | `supervisor@smra.com` | `sup123` |
| Técnico | `tecnico@smra.com` | `tec123` |

## Persistência de dados

- Chave no navegador: `smra_db` (localStorage)
- Coleções: `users`, `schedule`, `data` (backlog)
- Para **resetar** todos os dados: DevTools → Application → Local Storage → remover `smra_db`, ou executar no console: `localStorage.removeItem('smra_db')` e recarregar a página

## Deploy (GitHub Pages)

O `vite.config.ts` define `base: '/sistema-backlog/'`. Após `npm run build`, publique o conteúdo de `dist/` no GitHub Pages com esse subcaminho.

---

**Nota:** Versões anteriores deste README descreviam o projeto **RedeX** com pastas `backend/` e `frontend/`, Express e PostgreSQL. Essa arquitetura **não corresponde** ao código atual deste repositório.
