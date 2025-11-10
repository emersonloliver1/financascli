#!/usr/bin/env node

import { spawn } from 'node-pty';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Import dependencies for export API
import { database } from './src/infrastructure/database/NeonDatabase.js';
import { TransactionRepository } from './src/infrastructure/database/TransactionRepository.js';
import { PDFExportService } from './src/infrastructure/services/PDFExportService.js';
import { ExportTransactionsToPDFUseCase } from './src/application/use-cases/exports/ExportTransactionsToPDFUseCase.js';
import { ExportReportToPDFUseCase } from './src/application/use-cases/exports/ExportReportToPDFUseCase.js';
import { GenerateMonthlyReportUseCase } from './src/application/use-cases/reports/GenerateMonthlyReportUseCase.js';
import { GenerateCategoryReportUseCase } from './src/application/use-cases/reports/GenerateCategoryReportUseCase.js';
import { GenerateEvolutionReportUseCase } from './src/application/use-cases/reports/GenerateEvolutionReportUseCase.js';
import { GenerateTopTransactionsReportUseCase } from './src/application/use-cases/reports/GenerateTopTransactionsReportUseCase.js';
import { CategoryRepository } from './src/infrastructure/database/CategoryRepository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Servidor Web para Terminal Emulado + API de Exportação
 * Executa o CLI do sistema financeiro no navegador
 * E fornece APIs REST para exportação de dados
 */

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,        // 60 segundos
  pingInterval: 25000,       // 25 segundos (envia ping a cada 25s)
  transports: ['websocket', 'polling'], // Fallback para polling
  allowUpgrades: true,
  perMessageDeflate: false   // Desabilitar compressão (melhor para Fly.io)
});

const PORT = process.env.WEB_PORT || 3000;

// Middleware para parsing de JSON
app.use(express.json());

// Servir arquivos estáticos
app.use(express.static(join(__dirname, 'public')));

// Servir pasta exports para download
app.use('/downloads', express.static(join(__dirname, 'exports')));

// Inicializar dependências da API
let exportTransactionsUseCase;
let exportReportUseCase;

async function initializeExportAPI() {
  try {
    await database.connect();
    await database.initializeTables();

    const transactionRepository = new TransactionRepository(database);
    const categoryRepository = new CategoryRepository(database);
    const pdfExportService = new PDFExportService();

    // Use cases de relatórios
    const monthlyReportUseCase = new GenerateMonthlyReportUseCase(transactionRepository);
    const categoryReportUseCase = new GenerateCategoryReportUseCase(transactionRepository, categoryRepository);
    const evolutionReportUseCase = new GenerateEvolutionReportUseCase(transactionRepository);
    const topReportUseCase = new GenerateTopTransactionsReportUseCase(transactionRepository);

    // Use cases de exportação
    exportTransactionsUseCase = new ExportTransactionsToPDFUseCase(
      transactionRepository,
      pdfExportService
    );

    exportReportUseCase = new ExportReportToPDFUseCase(
      pdfExportService,
      {
        monthly: monthlyReportUseCase,
        category: categoryReportUseCase,
        evolution: evolutionReportUseCase,
        top: topReportUseCase
      }
    );

    console.log('✅ API de Exportação inicializada');
  } catch (error) {
    console.error('❌ Erro ao inicializar API de Exportação:', error);
  }
}

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'terminal.html'));
});

// Rota para página de exportação
app.get('/export', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'export.html'));
});

// API: Exportar transações para PDF
app.post('/api/export/transactions', async (req, res) => {
  try {
    const { userId, filters } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'ID do usuário é obrigatório'
      });
    }

    const result = await exportTransactionsUseCase.execute(userId, filters || {});

    res.json({
      success: true,
      filename: result.filename,
      downloadUrl: `/downloads/${result.filename}`,
      transactionCount: result.transactionCount,
      pages: result.pages,
      size: result.size
    });
  } catch (error) {
    console.error('Erro ao exportar transações:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao gerar PDF de transações'
    });
  }
});

// API: Exportar relatório para PDF
app.post('/api/export/report', async (req, res) => {
  try {
    const { userId, reportType, options } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'ID do usuário é obrigatório'
      });
    }

    if (!reportType) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de relatório é obrigatório'
      });
    }

    const result = await exportReportUseCase.execute(userId, reportType, options || {});

    res.json({
      success: true,
      filename: result.filename,
      downloadUrl: `/downloads/${result.filename}`,
      pages: result.pages,
      size: result.size
    });
  } catch (error) {
    console.error('Erro ao exportar relatório:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao gerar PDF de relatório'
    });
  }
});

// API: Listar exports disponíveis
app.get('/api/exports', async (req, res) => {
  try {
    const pdfExportService = new PDFExportService();
    const exports = pdfExportService.listExports();

    res.json({
      success: true,
      exports
    });
  } catch (error) {
    console.error('Erro ao listar exports:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao listar exports'
    });
  }
});

// Gerenciar conexões WebSocket
io.on('connection', (socket) => {
  console.log(`✅ Nova conexão: ${socket.id}`);

  // Keep-alive: enviar ping a cada 20 segundos
  const keepAliveInterval = setInterval(() => {
    if (socket.connected) {
      socket.emit('ping');
    }
  }, 20000);

  // Spawnar processo PTY (pseudo-terminal)
  const ptyProcess = spawn('node', ['src/index.js'], {
    name: 'xterm-256color',
    cols: 80,
    rows: 30,
    cwd: __dirname,
    env: process.env
  });

  console.log(`🚀 Terminal spawned para ${socket.id}`);

  // Responder ao pong do cliente
  socket.on('pong', () => {
    // Cliente ainda está vivo
  });

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
    clearInterval(keepAliveInterval);
    ptyProcess.kill();
  });

  // Tratar erros do PTY
  ptyProcess.onExit(({ exitCode, signal }) => {
    console.log(`Terminal encerrado: exit code ${exitCode}, signal ${signal}`);
    socket.disconnect();
  });
});

// Iniciar servidor
server.listen(PORT, async () => {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                                                          ║');
  console.log('║       💰 SISTEMA DE GESTÃO FINANCEIRA - WEB              ║');
  console.log('║                                                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  console.log(`🌐 Servidor rodando em: http://localhost:${PORT}`);
  console.log(`🖥️  Terminal: http://localhost:${PORT}`);
  console.log(`📤 Exportação: http://localhost:${PORT}/export\n`);

  // Inicializar API de Exportação
  await initializeExportAPI();

  console.log('📝 Logs:');
});

// Tratar erros
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error);
});

process.on('unhandledRejection', (reason) => {
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
