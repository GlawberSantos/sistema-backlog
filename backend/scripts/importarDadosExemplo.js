import db from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importarDadosExemplo() {
  const client = await db.pool.connect();
  
  try {
    const sqlPath = path.join(__dirname, 'dadosExemplo.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.toUpperCase().startsWith('SELECT')) {
        const result = await client.query(statement);
        console.log('\n📊 Estatísticas:');
        result.rows.forEach(row => {
          console.log(`   ${row.info} ${row.total}`);
        });
      } else {
        await client.query(statement);
      }
    }

    console.log('\n✅ Dados de exemplo importados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao importar dados:', error.message);
    throw error;
  } finally {
    client.release();
    await db.pool.end();
  }
}

importarDadosExemplo().catch(console.error);
