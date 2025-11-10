#!/usr/bin/env node

import { spawn } from 'node-pty';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Servidor Web para Terminal Emulado
 * Executa o CLI do sistema financeiro no navegador
 */

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.WEB_PORT || 3000;

// Servir arquivos estáticos
app.use(express.static(join(__dirname, 'public')));

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'terminal.html'));
});

// Gerenciar conexões WebSocket
io.on('connection', (socket) => {
  console.log(`✅ Nova conexão: ${socket.id}`);

  // Spawnar processo PTY (pseudo-terminal)
  const ptyProcess = spawn('node', ['src/index.js'], {
    name: 'xterm-256color',
    cols: 80,
    rows: 30,
    cwd: __dirname,
    env: process.env
  });

  console.log(`🚀 Terminal spawned para ${socket.id}`);

  // Enviar output do terminal para o cliente
  ptyProcess.onData((data) => {
    socket.emit('output', data);
  });

  // Receber input do cliente e enviar para o terminal
  socket.on('input', (data) => {
    ptyProcess.write(data);
  });

  // Redimensionar terminal
  socket.on('resize', ({ cols, rows }) => {
    try {
      ptyProcess.resize(cols, rows);
    } catch (error) {
      console.error('Erro ao redimensionar:', error.message);
    }
  });

  // Limpar quando cliente desconectar
  socket.on('disconnect', () => {
    console.log(`❌ Desconexão: ${socket.id}`);
    ptyProcess.kill();
  });

  // Tratar erros do PTY
  ptyProcess.onExit(({ exitCode, signal }) => {
    console.log(`Terminal encerrado: exit code ${exitCode}, signal ${signal}`);
    socket.disconnect();
  });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                                                          ║');
  console.log('║       💰 SISTEMA DE GESTÃO FINANCEIRA - WEB              ║');
  console.log('║                                                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  console.log(`🌐 Servidor rodando em: http://localhost:${PORT}`);
  console.log(`🖥️  Acesse pelo navegador para usar o terminal\n`);
  console.log('📝 Logs:');
});

// Tratar erros
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado');
    process.exit(0);
  });
});
