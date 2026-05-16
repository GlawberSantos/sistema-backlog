import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

// A biblioteca 'pg' usa automaticamente a variável de ambiente DATABASE_URL se estiver presente.
// Caso contrário, ela pode usar as variáveis individuais (PGHOST, PGUSER, etc.)
// A configuração explícita com connectionString é a mais clara.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
  console.log('🔗 Conectado ao banco de dados PostgreSQL!');
});

// Função para executar queries, facilitando o uso em outros módulos
const query = (text, params) => pool.query(text, params);

// Exportamos o objeto de query e também o pool para casos mais complexos (como transações)
export default {
  query,
  pool, 
};
