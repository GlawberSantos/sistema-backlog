# Instruções para Configuração do Ambiente

Olá! Para que o sistema funcione corretamente, precisamos garantir que o backend (servidor) consiga se conectar ao banco de dados PostgreSQL. Os erros que você está vendo (código 500) geralmente acontecem porque essa conexão não está configurada.

Siga os passos abaixo para resolver o problema:

## Passo 1: Entendendo o arquivo `.env`

O `backend` precisa de um arquivo especial chamado `.env` para guardar informações sensíveis, como a senha do banco de dados. Este arquivo não é enviado para o GitHub por segurança.

Existe um arquivo de exemplo chamado `.env.example` na pasta `backend`. Vamos usá-lo como base.

## Passo 2: Criando o arquivo `.env`

1.  **Navegue até a pasta `backend`** do seu projeto.
2.  **Copie o arquivo `backend/.env.example`** e renomeie a cópia para `backend/.env`.

## Passo 3: Configurando a conexão com o banco de dados

1.  **Abra o arquivo `.env`** que você acabou de criar.
2.  **Edite a linha `DATABASE_URL`** com os dados do seu banco de dados PostgreSQL.

O formato da `DATABASE_URL` é:
`postgresql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO`

**Exemplo:**

Se você tem um banco de dados local com:
*   Usuário: `postgres`
*   Senha: `minhasenha`
*   Rodando em: `localhost`
*   Na porta: `5432`
*   Com um banco chamado: `redex`

A sua `DATABASE_URL` no arquivo `.env` deve ficar assim:
```
DATABASE_URL=postgresql://postgres:minhasenha@localhost:5432/redex
```

**Importante:** Certifique-se de que o banco de dados (`redex` no exemplo) já foi criado no seu PostgreSQL.

## Passo 4: Reiniciando o servidor

Depois de criar e configurar o arquivo `.env`, **reinicie o servidor backend**.

Se o servidor backend estiver rodando em um terminal, pare-o (geralmente com `Ctrl + C`) e inicie-o novamente com o comando que você usa (por exemplo, `npm run dev` ou `node server.js`).

---

Após seguir esses passos, o backend deverá conseguir se conectar ao banco de dados e os erros 500 devem desaparecer. Se o problema persistir, por favor, me avise!
