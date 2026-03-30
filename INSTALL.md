# Guia Rápido de Instalação - Sistema RedeX

## Passo 1: Pré-requisitos
Instale em sua máquina:
- Node.js (v18+): https://nodejs.org/
- PostgreSQL (v14+): https://www.postgresql.org/

## Passo 2: Configure o Banco de Dados
Abra o PostgreSQL e execute:
```sql
CREATE DATABASE redex_ativacao;
```

## Passo 3: Configure o Backend

### 3.1 Navegue até o diretório backend
```bash
cd backend
```

### 3.2 Instale as dependências
```bash
npm install
```

### 3.3 Configure as variáveis de ambiente
Copie o arquivo `.env.example` para `.env`:
```bash
copy .env.example .env
```

Edite o arquivo `.env` e ajuste:
```env
PORT=3001
DATABASE_URL=postgresql://postgres:SUA_SENHA_AQUI@localhost:5432/redex_ativacao
JWT_SECRET=GERE_UMA_CHAVE_SECRETA_SEGURA_AQUI
NODE_ENV=development
```

### 3.4 Inicialize o banco de dados
```bash
npm run init-db
```

Você verá:
```
✅ Banco de dados inicializado com sucesso!
👤 Usuário padrão criado:
   Email: admin@redex.com
   Senha: admin123
```

## Passo 4: Configure o Frontend

### 4.1 Abra um novo terminal e navegue até o frontend
```bash
cd ..\frontend
```

### 4.2 Instale as dependências
```bash
npm install
```

## Passo 5: Execute o Sistema

### 5.1 Inicie o Backend
No terminal do backend:
```bash
npm run dev
```
Você verá:
```
🚀 Servidor rodando na porta 3001
📡 API disponível em http://localhost:3001/api
```

### 5.2 Inicie o Frontend
No terminal do frontend:
```bash
npm run dev
```
Você verá algo como:
```
VITE v5.0.8  ready in XXX ms
➜  Local:   http://localhost:3000/
```

## Passo 6: Acesse o Sistema

Abra seu navegador e acesse: **http://localhost:3000**

Faça login com:
- **Email:** admin@redex.com
- **Senha:** admin123

## Comandos Úteis

### Backend
```bash
npm run dev      # Inicia servidor com auto-reload
npm start        # Inicia servidor em modo produção
npm run init-db  # Reinicializa o banco de dados
```

### Frontend
```bash
npm run dev      # Inicia servidor de desenvolvimento
npm run build    # Cria build de produção
npm run preview  # Preview do build de produção
```

## Solução Rápida de Problemas

### ❌ Erro: "spawn powershell.exe ENOENT"
Execute os comandos usando o Prompt de Comando (cmd) do Windows, não o PowerShell.

### ❌ Erro: "connect ECONNREFUSED" no backend
- Verifique se o PostgreSQL está rodando
- Confirme se a `DATABASE_URL` no `.env` está correta
- Teste a conexão: `psql -U postgres -d redex_ativacao`

### ❌ Erro: "Network Error" no frontend
- Confirme se o backend está rodando na porta 3001
- Verifique se não há firewall bloqueando

### ❌ Erro ao instalar dependências
Limpe o cache e reinstale:
```bash
npm cache clean --force
del /s /q node_modules
npm install
```

## Estrutura de Diretórios

```
redeX-ativacao/
├── backend/          → Servidor Node.js + Express
├── frontend/         → Aplicação React + Vite
└── README.md         → Documentação completa
```

## Próximos Passos

1. Explore o **Dashboard** para ver as estatísticas
2. Acesse o **Backlog** para gerenciar ordens de serviço
3. Teste a **Importação de Planilha** (formato na documentação)
4. Gere **Relatórios** e exporte para Excel
5. Crie novos **Usuários** (somente Administrador)

## Importar Dados de Exemplo

Se você possui o arquivo `base.xlsx`, vá em:
**Importar Planilha** → Selecione o arquivo → **Preview** → **Confirmar Importação**

Formato esperado no Excel:
| numero_os | cliente | endereco | bairro | cidade | tipo_servico | prioridade | status | data_abertura | prazo |
|-----------|---------|----------|--------|--------|--------------|------------|--------|---------------|-------|

---

**Precisa de ajuda?** Consulte o README.md completo para documentação detalhada.
