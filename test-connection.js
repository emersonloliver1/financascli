import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  const connectionString = process.env.NEON_CONNECTION_STRING;

  console.log('🔍 Testando conexão com Neon DB...');
  console.log('📍 Host:', connectionString?.match(/@([^/]+)/)?.[1] || 'não encontrado');

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Conexão bem-sucedida!');

    const result = await client.query('SELECT NOW()');
    console.log('⏰ Hora do servidor:', result.rows[0].now);

    await client.end();
  } catch (error) {
    console.error('❌ Erro na conexão:');
    console.error('   Tipo:', error.code);
    console.error('   Mensagem:', error.message);
    console.error('\n💡 Verifique:');
    console.error('   1. Connection string está correta no .env');
    console.error('   2. Projeto Neon está ativo');
    console.error('   3. Seu IP não está bloqueado');
  }
}

testConnection();
