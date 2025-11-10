#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

/**
 * Cria interface de readline
 */
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Faz uma pergunta ao usuário
 */
function question(rl, query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

/**
 * Script de setup do projeto
 */
async function setup() {
  console.log('\n🚀 Setup do Sistema de Gestão Financeira\n');
  console.log('═'.repeat(50));
  console.log('\n');

  const rl = createInterface();

  try {
    // Verificar se .env já existe
    const envPath = join(projectRoot, '.env');
    if (existsSync(envPath)) {
      const overwrite = await question(
        rl,
        '⚠️  Arquivo .env já existe. Deseja sobrescrevê-lo? (s/N): '
      );

      if (overwrite.toLowerCase() !== 's') {
        console.log('\n✓ Setup cancelado.\n');
        rl.close();
        return;
      }
    }

    console.log('📝 Por favor, forneça as seguintes informações:\n');

    // Solicitar connection string do Neon
    console.log('1. Connection String do NeonDB');
    console.log('   Você pode obter no painel do Neon: https://console.neon.tech/');
    const connectionString = await question(rl, '   Connection String: ');

    // Informações sobre Neon Auth
    console.log('\n2. Credenciais do Neon Auth (Opcional)');
    console.log('   Se você já provisionou o Neon Auth, forneça as credenciais.');
    console.log('   Caso contrário, deixe em branco.\n');

    const projectId = await question(rl, '   STACK_PROJECT_ID (opcional): ');
    const publishableKey = await question(rl, '   STACK_PUBLISHABLE_CLIENT_KEY (opcional): ');
    const secretKey = await question(rl, '   STACK_SECRET_SERVER_KEY (opcional): ');

    // Criar arquivo .env
    const envContent = `# Neon Database Configuration
NEON_PROJECT_ID=snowy-fog-68500057
NEON_DATABASE_NAME=neondb
NEON_CONNECTION_STRING=${connectionString}

# Neon Auth (Stack Auth) Configuration
NEXT_PUBLIC_STACK_PROJECT_ID=${projectId || ''}
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=${publishableKey || ''}
STACK_SECRET_SERVER_KEY=${secretKey || ''}

# Application Configuration
NODE_ENV=development
PORT=3000
`;

    writeFileSync(envPath, envContent);

    console.log('\n✅ Arquivo .env criado com sucesso!\n');
    console.log('═'.repeat(50));
    console.log('\n📦 Próximos passos:\n');
    console.log('   1. Instale as dependências: npm install');
    console.log('   2. Inicie a aplicação: npm start');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Erro durante o setup:', error.message);
    console.error('\n');
  } finally {
    rl.close();
  }
}

// Executar setup
setup();
