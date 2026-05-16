# Sistema de Gestão de Backlog e Ativação de Rede de Telecomunicações - RedeX

Sistema web completo para gestão de backlog e acompanhamento de ativações de rede de telecomunicações, desenvolvido como projeto acadêmico do curso de Análise e Desenvolvimento de Sistemas.

## Índice

- [Descrição do Sistema](#descrição-do-sistema)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e Configuração](#instalação-e-configuração)
- [Execução](#execução)
- [Funcionalidades](#funcionalidades)
- [Credenciais Padrão](#credenciais-padrão)
- [API Endpoints](#api-endpoints)

## Descrição do Sistema

O RedeX é um sistema web responsivo desenvolvido para organizar solicitações de serviços, acompanhar o status das atividades e gerar relatórios operacionais para equipes técnicas responsáveis por instalação, manutenção e ativação de serviços de internet.

### Tipos de Usuários

- **Administrador**: Gerencia usuários, visualiza todos os dados e gera relatórios.
- **Supervisor**: Acompanha backlog, altera status das atividades e distribui tarefas.
- **Técnico**: Visualiza tarefas atribuídas, atualiza status e registra observações.

## Tecnologias Utilizadas

### Backend
- Node.js & Express
- PostgreSQL
- JWT (JSON Web Token) para autenticação
- Bcrypt para criptografia de senhas

### Frontend
- React & Vite
- TailwindCSS
- React Router
- Recharts (Gráficos)
- Lucide React (Ícones)
- Axios (Requisições HTTP)
- XLSX (Importação e Exportação Excel)
- jsPDF & jsPDF-AutoTable (Exportação PDF)

## Estrutura do Projeto

O projeto é um monorepo com duas pastas principais: `backend` e `frontend`.

```
redeX-ativacao/
├── backend/      # Aplicação Node.js/Express
└── frontend/     # Aplicação React
```

## Pré-requisitos

- [Node.js](https://nodejs.org/) (v18 ou superior)
- [Docker](https://www.docker.com/products/docker-desktop/) e Docker Compose (Recomendado para o banco de dados)
- Ou uma instalação local do [PostgreSQL](https://www.postgresql.org/) (v14 ou superior)

## Instalação e Configuração

Siga os passos abaixo para configurar o ambiente de desenvolvimento.

### 1. Backend

Primeiro, vamos configurar o servidor do backend e o banco de dados.

**a. Instale as dependências:**
```bash
cd backend
npm install
```

**b. Configure o Banco de Dados (Use uma das opções abaixo)**

*   **Opção 1: Usando Docker (Recomendado)**
    1.  Crie um arquivo chamado `docker-compose.yml` dentro da pasta `backend` com o seguinte conteúdo:
        ```yml
        version: '3.8'
        services:
          postgres:
            image: postgres:14
            container_name: redex-postgres
            environment:
              POSTGRES_USER: postgres
              POSTGRES_PASSWORD: admin
              POSTGRES_DB: redex_db
            ports:
              - "5432:5432"
            volumes:
              - pgdata:/var/lib/postgresql/data
        volumes:
          pgdata:
        ```
    2.  Inicie o container do PostgreSQL:
        ```bash
        docker-compose up -d
        ```

*   **Opção 2: Usando uma Instalação Local do PostgreSQL**
    1.  Conecte-se ao seu servidor PostgreSQL e crie o banco de dados:
        ```sql
        CREATE DATABASE redex_db;
        ```

**c. Configure as Variáveis de Ambiente**

1.  Ainda no diretório `backend`, copie o arquivo `.env.example` para `.env`.
    ```bash
    # Em Windows (cmd)
    copy .env.example .env
    # Em Linux/macOS ou Git Bash
    cp .env.example .env
    ```
2.  Edite o arquivo `.env` para corresponder à configuração do seu banco de dados. Se você usou o Docker Compose acima, a URL já estará correta.
    ```env
    PORT=3001
    DATABASE_URL=postgresql://postgres:admin@localhost:5432/redex_db
    JWT_SECRET=sua_chave_secreta_muito_segura_altere_isto
    NODE_ENV=development
    ```
    **Importante**: Altere `JWT_SECRET` para um valor seguro.

**d. Inicialize e Popule o Banco de Dados**

Este comando criará todas as tabelas e preencherá o banco com dados de exemplo (usuários e ordens de serviço).
```bash
npm run init-db
```

### 2. Frontend

Agora, vamos configurar a interface do usuário.

**a. Instale as dependências:**
```bash
# A partir da raiz do projeto, navegue até a pasta frontend
cd ../frontend
npm install
```

## Execução

Para rodar a aplicação, você precisará de dois terminais abertos.

**Terminal 1: Iniciar o Backend**
```bash
cd backend
npm run dev
```
O servidor do backend estará rodando em `http://localhost:3001`.

**Terminal 2: Iniciar o Frontend**
```bash
cd frontend
npm run dev
```
A aplicação estará acessível em `http://localhost:3000`.

## Funcionalidades

- **Dashboard Interativo**: Visão geral da operação com cards de status e gráficos de distribuição.
- **Gestão de Backlog Completa**: Crie, liste, filtre, e atualize Ordens de Serviço (OS).
- **Detalhes da Ordem**: Visualize todos os dados de uma OS, seu histórico de observações e atualize seu status.
- **Autenticação e Permissões**: Sistema de login com diferentes níveis de acesso (Administrador, Supervisor, Técnico).
- **Importação Inteligente**: Importe OS em massa a partir de planilhas Excel, com mapeamento flexível de colunas.
- **Relatórios Dinâmicos**: Gere relatórios por UF, região, tempo médio e Tecnicas por período.
- **Exportação de Dados**: Exporte qualquer relatório para os formatos **Excel** e **PDF**.
- **Gestão de Usuários**: (Apenas Admin) Crie, edite e remova usuários do sistema.

## Credenciais Padrão

Após inicializar o banco de dados, você pode fazer login com as seguintes credenciais:
- **Email**: `admin@redex.com`
- **Senha**: `admin123`

## API Endpoints

A API REST está documentada no `backend/routes/`. Os principais endpoints são:

- **Autenticação**: `POST /api/auth/login`
- **Dashboard**: `GET /api/dashboard/stats`
- **Relatórios**: `GET /api/dashboard/relatorio/*`
- **Usuários**: `GET, POST, PUT, DELETE /api/usuarios`
- **Ordens de Serviço**: `GET, POST, PUT, DELETE /api/ordens-servico`
- **Importação**: `POST /api/ordens-servico/importar`
