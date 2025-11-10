/**
 * PDF Export Service
 *
 * Serviço responsável pela geração de PDFs profissionais
 * Parte da Infrastructure Layer
 *
 * @class PDFExportService
 */
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class PDFExportService {
  /**
   * Inicializa o serviço de exportação PDF
   */
  constructor() {
    this.exportsDir = path.join(process.cwd(), 'exports');
    this.ensureExportsDir();

    // Configurações de estilo
    this.colors = {
      primary: '#2c3e50',
      secondary: '#7f8c8d',
      success: '#27ae60',
      danger: '#e74c3c',
      info: '#3498db',
      warning: '#f39c12',
      light: '#ecf0f1',
      dark: '#34495e'
    };

    this.fonts = {
      title: 20,
      subtitle: 16,
      heading: 14,
      body: 10,
      small: 8
    };
  }

  /**
   * Garante que o diretório de exports existe
   */
  ensureExportsDir() {
    if (!fs.existsSync(this.exportsDir)) {
      fs.mkdirSync(this.exportsDir, { recursive: true });
    }
  }

  /**
   * Gera PDF de transações
   *
   * @param {Object} data - Dados das transações
   * @param {Array} data.transactions - Lista de transações
   * @param {Object} data.summary - Resumo financeiro
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Object>} Informações do arquivo gerado
   */
  async generateTransactionsPDF(data, options = {}) {
    const filename = options.filename || `transacoes_${Date.now()}.pdf`;
    const filepath = path.join(this.exportsDir, filename);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          bufferPages: true,
          info: {
            Title: 'Relatório de Transações',
            Author: 'Sistema de Gestão Financeira',
            Subject: 'Exportação de Transações',
            CreationDate: new Date()
          }
        });

        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        // Header principal
        this.addHeader(doc, 'Relatório de Transações');

        // Período (se informado)
        if (options.period) {
          this.addPeriodInfo(doc, options.period);
        }

        // Resumo financeiro
        if (data.summary && options.includeSummary !== false) {
          this.addSummary(doc, data.summary);
          doc.moveDown(2);
        }

        // Tabela de transações
        if (data.transactions && data.transactions.length > 0) {
          doc.fontSize(this.fonts.heading)
            .fillColor(this.colors.primary)
            .text('Lista de Transações', { underline: true });

          doc.moveDown(0.5);

          this.addTransactionsTable(doc, data.transactions);
        } else {
          doc.fontSize(this.fonts.body)
            .fillColor(this.colors.secondary)
            .text('Nenhuma transação encontrada para o período selecionado.', {
              align: 'center'
            });
        }

        // Footer em todas as páginas
        this.addFooter(doc);

        doc.end();

        stream.on('finish', () => {
          resolve({
            filepath,
            filename,
            size: fs.statSync(filepath).size,
            pages: doc.bufferedPageRange().count
          });
        });

        stream.on('error', (error) => {
          reject(new Error(`Erro ao gerar PDF: ${error.message}`));
        });
      } catch (error) {
        reject(new Error(`Erro ao criar documento PDF: ${error.message}`));
      }
    });
  }

  /**
   * Gera PDF de relatório
   *
   * @param {Object} report - Dados do relatório
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Object>} Informações do arquivo gerado
   */
  async generateReportPDF(report, options = {}) {
    const filename = options.filename || `relatorio_${report.type}_${Date.now()}.pdf`;
    const filepath = path.join(this.exportsDir, filename);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          bufferPages: true,
          info: {
            Title: this.getReportTitle(report.type),
            Author: 'Sistema de Gestão Financeira',
            Subject: `Relatório ${report.type}`,
            CreationDate: new Date()
          }
        });

        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        // Header
        this.addHeader(doc, this.getReportTitle(report.type));

        // Conteúdo específico do relatório
        switch (report.type) {
        case 'monthly':
          this.addMonthlyReportContent(doc, report);
          break;
        case 'category':
          this.addCategoryReportContent(doc, report);
          break;
        case 'evolution':
          this.addEvolutionReportContent(doc, report);
          break;
        case 'top':
          this.addTopReportContent(doc, report);
          break;
        case 'comparative':
          this.addComparativeReportContent(doc, report);
          break;
        case 'patterns':
          this.addPatternsReportContent(doc, report);
          break;
        default:
          throw new Error(`Tipo de relatório não suportado: ${report.type}`);
        }

        // Footer
        this.addFooter(doc);

        doc.end();

        stream.on('finish', () => {
          resolve({
            filepath,
            filename,
            size: fs.statSync(filepath).size,
            pages: doc.bufferedPageRange().count
          });
        });

        stream.on('error', (error) => {
          reject(new Error(`Erro ao gerar PDF: ${error.message}`));
        });
      } catch (error) {
        reject(new Error(`Erro ao criar documento PDF: ${error.message}`));
      }
    });
  }

  /**
   * Adiciona cabeçalho ao PDF
   *
   * @param {PDFDocument} doc - Documento PDF
   * @param {string} title - Título do documento
   */
  addHeader(doc, title) {
    // Linha superior decorativa
    doc.rect(50, 50, doc.page.width - 100, 3)
      .fill(this.colors.info);

    doc.moveDown(0.5);

    // Título principal
    doc.fontSize(this.fonts.title)
      .fillColor(this.colors.primary)
      .text(title, { align: 'center' });

    // Data de geração
    doc.fontSize(this.fonts.small)
      .fillColor(this.colors.secondary)
      .text(
        `Gerado em ${this.formatDate(new Date())} às ${this.formatTime(new Date())}`,
        { align: 'center' }
      );

    doc.moveDown(1.5);
  }

  /**
   * Adiciona informação de período
   *
   * @param {PDFDocument} doc - Documento PDF
   * @param {Object} period - Informações do período
   */
  addPeriodInfo(doc, period) {
    doc.fontSize(this.fonts.body)
      .fillColor(this.colors.dark)
      .text(`Período: ${period.start} a ${period.end}`, { align: 'center' });

    doc.moveDown(1);
  }

  /**
   * Adiciona resumo financeiro
   *
   * @param {PDFDocument} doc - Documento PDF
   * @param {Object} summary - Dados do resumo
   */
  addSummary(doc, summary) {
    const boxY = doc.y;
    const boxHeight = 100;

    // Caixa de fundo
    doc.rect(50, boxY, doc.page.width - 100, boxHeight)
      .fill(this.colors.light);

    doc.y = boxY + 15;

    // Título do resumo
    doc.fontSize(this.fonts.heading)
      .fillColor(this.colors.primary)
      .text('Resumo Financeiro', 50, doc.y, { align: 'center' });

    doc.moveDown(1);

    const leftX = 100;
    const rightX = 350;
    const currentY = doc.y;

    // Receitas (esquerda)
    doc.fontSize(this.fonts.body)
      .fillColor(this.colors.secondary)
      .text('Receitas:', leftX, currentY);

    doc.fontSize(this.fonts.subtitle)
      .fillColor(this.colors.success)
      .text(`R$ ${this.formatMoney(summary.totalIncome || 0)}`, leftX, currentY + 15);

    // Despesas (direita)
    doc.fontSize(this.fonts.body)
      .fillColor(this.colors.secondary)
      .text('Despesas:', rightX, currentY);

    doc.fontSize(this.fonts.subtitle)
      .fillColor(this.colors.danger)
      .text(`R$ ${this.formatMoney(summary.totalExpense || 0)}`, rightX, currentY + 15);

    doc.moveDown(3);

    // Saldo (centralizado)
    const balance = (summary.balance !== undefined)
      ? summary.balance
      : (summary.totalIncome || 0) - (summary.totalExpense || 0);
    const balanceColor = balance >= 0 ? this.colors.success : this.colors.danger;
    const balanceLabel = balance >= 0 ? 'Saldo Positivo' : 'Saldo Negativo';

    doc.fontSize(this.fonts.body)
      .fillColor(this.colors.secondary)
      .text(balanceLabel, { align: 'center' });

    doc.fontSize(this.fonts.subtitle)
      .fillColor(balanceColor)
      .text(`R$ ${this.formatMoney(Math.abs(balance))}`, { align: 'center' });

    // Total de transações (se disponível)
    if (summary.count !== undefined) {
      doc.moveDown(0.5);
      doc.fontSize(this.fonts.small)
        .fillColor(this.colors.secondary)
        .text(`Total de Transações: ${summary.count}`, { align: 'center' });
    }

    doc.y = boxY + boxHeight + 10;
  }

  /**
   * Adiciona tabela de transações
   *
   * @param {PDFDocument} doc - Documento PDF
   * @param {Array} transactions - Lista de transações
   */
  addTransactionsTable(doc, transactions) {
    const tableTop = doc.y;
    const rowHeight = 25;
    const pageHeight = doc.page.height - doc.page.margins.bottom - 50;

    // Cabeçalhos da tabela
    const headers = [
      { label: 'Data', x: 50, width: 70 },
      { label: 'Categoria', x: 130, width: 130 },
      { label: 'Descrição', x: 270, width: 180 },
      { label: 'Valor', x: 460, width: 90, align: 'right' }
    ];

    // Desenhar cabeçalhos
    let currentY = tableTop;
    doc.fontSize(this.fonts.body)
      .fillColor(this.colors.primary);

    headers.forEach(header => {
      doc.text(
        header.label,
        header.x,
        currentY,
        { width: header.width, align: header.align || 'left' }
      );
    });

    // Linha abaixo do cabeçalho
    currentY += 15;
    doc.moveTo(50, currentY)
      .lineTo(doc.page.width - 50, currentY)
      .stroke(this.colors.secondary);

    currentY += 5;

    // Iterar sobre transações
    transactions.forEach((transaction, index) => {
      // Verificar se precisa de nova página
      if (currentY > pageHeight) {
        doc.addPage();
        currentY = 50;

        // Re-desenhar cabeçalhos
        doc.fontSize(this.fonts.body)
          .fillColor(this.colors.primary);

        headers.forEach(header => {
          doc.text(
            header.label,
            header.x,
            currentY,
            { width: header.width, align: header.align || 'left' }
          );
        });

        currentY += 15;
        doc.moveTo(50, currentY)
          .lineTo(doc.page.width - 50, currentY)
          .stroke(this.colors.secondary);
        currentY += 5;
      }

      doc.fontSize(this.fonts.small)
        .fillColor(this.colors.dark);

      // Data
      const transactionDate = new Date(transaction.date);
      doc.text(
        this.formatDate(transactionDate),
        headers[0].x,
        currentY,
        { width: headers[0].width }
      );

      // Categoria
      doc.text(
        transaction.category_name || 'Sem categoria',
        headers[1].x,
        currentY,
        { width: headers[1].width }
      );

      // Descrição
      const description = transaction.description || '-';
      const truncatedDesc = description.length > 35
        ? description.substring(0, 32) + '...'
        : description;

      doc.text(
        truncatedDesc,
        headers[2].x,
        currentY,
        { width: headers[2].width }
      );

      // Valor
      const valueColor = transaction.type === 'income'
        ? this.colors.success
        : this.colors.danger;
      const valuePrefix = transaction.type === 'income' ? '+' : '-';

      doc.fillColor(valueColor)
        .text(
          `${valuePrefix} R$ ${this.formatMoney(transaction.amount)}`,
          headers[3].x,
          currentY,
          { width: headers[3].width, align: 'right' }
        );

      currentY += rowHeight;

      // Linha separadora sutil (a cada 5 transações)
      if ((index + 1) % 5 === 0 && index < transactions.length - 1) {
        doc.moveTo(50, currentY - 5)
          .lineTo(doc.page.width - 50, currentY - 5)
          .stroke(this.colors.light);
      }
    });
  }

  /**
   * Adiciona conteúdo do relatório mensal
   *
   * @param {PDFDocument} doc - Documento PDF
   * @param {Object} report - Dados do relatório
   */
  addMonthlyReportContent(doc, report) {
    // Resumo
    if (report.summary) {
      this.addSummary(doc, report.summary);
      doc.moveDown(2);
    }

    // Gastos por categoria
    if (report.categoryBreakdown && report.categoryBreakdown.length > 0) {
      doc.fontSize(this.fonts.heading)
        .fillColor(this.colors.primary)
        .text('Gastos por Categoria', { underline: true });

      doc.moveDown(0.5);

      report.categoryBreakdown.forEach((cat, index) => {
        const barY = doc.y;
        const barWidth = 300;
        const barHeight = 15;
        const percentage = parseFloat(cat.percentage) || 0;
        const fillWidth = (barWidth * percentage) / 100;

        // Barra de progresso
        doc.rect(100, barY, barWidth, barHeight)
          .stroke(this.colors.secondary);

        doc.rect(100, barY, fillWidth, barHeight)
          .fill(this.colors.info);

        // Texto da categoria
        doc.fontSize(this.fonts.small)
          .fillColor(this.colors.dark)
          .text(
            `${cat.icon || '📊'} ${cat.name}`,
            50,
            barY + 2,
            { width: 45, align: 'right' }
          );

        // Valor e percentual
        doc.text(
          `R$ ${this.formatMoney(cat.total)} (${percentage.toFixed(1)}%)`,
          410,
          barY + 2
        );

        doc.moveDown(1.2);
      });
    }

    // Top transações
    if (report.topTransactions && report.topTransactions.length > 0) {
      doc.moveDown(1);
      doc.fontSize(this.fonts.heading)
        .fillColor(this.colors.primary)
        .text('Maiores Despesas', { underline: true });

      doc.moveDown(0.5);

      report.topTransactions.slice(0, 5).forEach((trans, index) => {
        doc.fontSize(this.fonts.small)
          .fillColor(this.colors.dark)
          .text(`${index + 1}. ${trans.description || 'Sem descrição'}`);

        doc.fillColor(this.colors.danger)
          .text(
            `R$ ${this.formatMoney(trans.amount)}`,
            { align: 'right' }
          );

        doc.moveDown(0.3);
      });
    }
  }

  /**
   * Adiciona conteúdo do relatório por categoria
   *
   * @param {PDFDocument} doc - Documento PDF
   * @param {Object} report - Dados do relatório
   */
  addCategoryReportContent(doc, report) {
    if (report.categories && report.categories.length > 0) {
      report.categories.forEach((category, index) => {
        if (index > 0) {
          doc.moveDown(1.5);
        }

        // Nome da categoria
        doc.fontSize(this.fonts.subtitle)
          .fillColor(this.colors.primary)
          .text(`${category.icon || '📂'} ${category.name}`);

        doc.moveDown(0.5);

        // Estatísticas
        doc.fontSize(this.fonts.body)
          .fillColor(this.colors.secondary)
          .text(`Total: R$ ${this.formatMoney(category.total)}`);

        doc.text(`Transações: ${category.count}`);

        if (category.average) {
          doc.text(`Média: R$ ${this.formatMoney(category.average)}`);
        }

        if (category.percentage) {
          doc.text(`Percentual: ${category.percentage.toFixed(1)}%`);
        }
      });
    } else {
      doc.fontSize(this.fonts.body)
        .fillColor(this.colors.secondary)
        .text('Nenhuma categoria encontrada.', { align: 'center' });
    }
  }

  /**
   * Adiciona conteúdo do relatório de evolução
   *
   * @param {PDFDocument} doc - Documento PDF
   * @param {Object} report - Dados do relatório
   */
  addEvolutionReportContent(doc, report) {
    if (report.monthlyData && report.monthlyData.length > 0) {
      doc.fontSize(this.fonts.heading)
        .fillColor(this.colors.primary)
        .text('Evolução Mensal', { underline: true });

      doc.moveDown(1);

      // Tabela de evolução
      const headers = [
        { label: 'Mês', x: 50, width: 100 },
        { label: 'Receitas', x: 160, width: 100, align: 'right' },
        { label: 'Despesas', x: 270, width: 100, align: 'right' },
        { label: 'Saldo', x: 380, width: 100, align: 'right' }
      ];

      let currentY = doc.y;

      // Cabeçalhos
      doc.fontSize(this.fonts.body)
        .fillColor(this.colors.primary);

      headers.forEach(header => {
        doc.text(
          header.label,
          header.x,
          currentY,
          { width: header.width, align: header.align || 'left' }
        );
      });

      currentY += 15;
      doc.moveTo(50, currentY)
        .lineTo(doc.page.width - 50, currentY)
        .stroke(this.colors.secondary);
      currentY += 5;

      // Dados
      report.monthlyData.forEach(month => {
        doc.fontSize(this.fonts.small);

        // Mês
        doc.fillColor(this.colors.dark)
          .text(month.label, headers[0].x, currentY, { width: headers[0].width });

        // Receitas
        doc.fillColor(this.colors.success)
          .text(
            `R$ ${this.formatMoney(month.income || 0)}`,
            headers[1].x,
            currentY,
            { width: headers[1].width, align: 'right' }
          );

        // Despesas
        doc.fillColor(this.colors.danger)
          .text(
            `R$ ${this.formatMoney(month.expense || 0)}`,
            headers[2].x,
            currentY,
            { width: headers[2].width, align: 'right' }
          );

        // Saldo
        const balance = (month.balance !== undefined)
          ? month.balance
          : (month.income || 0) - (month.expense || 0);
        const balanceColor = balance >= 0 ? this.colors.success : this.colors.danger;

        doc.fillColor(balanceColor)
          .text(
            `R$ ${this.formatMoney(balance)}`,
            headers[3].x,
            currentY,
            { width: headers[3].width, align: 'right' }
          );

        currentY += 20;
      });

      // Tendência
      if (report.trend) {
        doc.moveDown(2);
        doc.fontSize(this.fonts.body)
          .fillColor(this.colors.dark)
          .text(`Tendência: ${report.trend}`);
      }
    } else {
      doc.fontSize(this.fonts.body)
        .fillColor(this.colors.secondary)
        .text('Dados de evolução não disponíveis.', { align: 'center' });
    }
  }

  /**
   * Adiciona conteúdo do relatório de maiores transações
   *
   * @param {PDFDocument} doc - Documento PDF
   * @param {Object} report - Dados do relatório
   */
  addTopReportContent(doc, report) {
    if (report.topExpenses && report.topExpenses.length > 0) {
      doc.fontSize(this.fonts.heading)
        .fillColor(this.colors.primary)
        .text('Maiores Despesas', { underline: true });

      doc.moveDown(0.5);

      report.topExpenses.forEach((trans, index) => {
        doc.fontSize(this.fonts.body)
          .fillColor(this.colors.dark)
          .text(`${index + 1}. ${trans.description || 'Sem descrição'}`);

        doc.fontSize(this.fonts.small)
          .fillColor(this.colors.secondary)
          .text(`${trans.category_name || 'Sem categoria'} - ${this.formatDate(new Date(trans.date))}`);

        doc.fontSize(this.fonts.subtitle)
          .fillColor(this.colors.danger)
          .text(`R$ ${this.formatMoney(trans.amount)}`, { align: 'right' });

        doc.moveDown(0.8);
      });
    }

    if (report.topIncomes && report.topIncomes.length > 0) {
      doc.moveDown(1.5);
      doc.fontSize(this.fonts.heading)
        .fillColor(this.colors.primary)
        .text('Maiores Receitas', { underline: true });

      doc.moveDown(0.5);

      report.topIncomes.forEach((trans, index) => {
        doc.fontSize(this.fonts.body)
          .fillColor(this.colors.dark)
          .text(`${index + 1}. ${trans.description || 'Sem descrição'}`);

        doc.fontSize(this.fonts.small)
          .fillColor(this.colors.secondary)
          .text(`${trans.category_name || 'Sem categoria'} - ${this.formatDate(new Date(trans.date))}`);

        doc.fontSize(this.fonts.subtitle)
          .fillColor(this.colors.success)
          .text(`R$ ${this.formatMoney(trans.amount)}`, { align: 'right' });

        doc.moveDown(0.8);
      });
    }
  }

  /**
   * Adiciona conteúdo do relatório comparativo
   *
   * @param {PDFDocument} doc - Documento PDF
   * @param {Object} report - Dados do relatório
   */
  addComparativeReportContent(doc, report) {
    if (report.currentPeriod && report.previousPeriod) {
      const current = report.currentPeriod;
      const previous = report.previousPeriod;

      // Período atual
      doc.fontSize(this.fonts.heading)
        .fillColor(this.colors.primary)
        .text('Período Atual', { underline: true });

      doc.moveDown(0.5);
      this.addSummary(doc, current);

      // Período anterior
      doc.moveDown(2);
      doc.fontSize(this.fonts.heading)
        .fillColor(this.colors.primary)
        .text('Período Anterior', { underline: true });

      doc.moveDown(0.5);
      this.addSummary(doc, previous);

      // Variações
      if (report.variations) {
        doc.moveDown(2);
        doc.fontSize(this.fonts.heading)
          .fillColor(this.colors.primary)
          .text('Variações', { underline: true });

        doc.moveDown(0.5);
        doc.fontSize(this.fonts.body);

        Object.entries(report.variations).forEach(([key, value]) => {
          const color = value >= 0 ? this.colors.success : this.colors.danger;
          const sign = value >= 0 ? '+' : '';

          doc.fillColor(this.colors.dark)
            .text(`${key}: `, { continued: true })
            .fillColor(color)
            .text(`${sign}${value.toFixed(1)}%`);

          doc.moveDown(0.3);
        });
      }
    }
  }

  /**
   * Adiciona conteúdo do relatório de padrões
   *
   * @param {PDFDocument} doc - Documento PDF
   * @param {Object} report - Dados do relatório
   */
  addPatternsReportContent(doc, report) {
    if (report.patterns && report.patterns.length > 0) {
      doc.fontSize(this.fonts.heading)
        .fillColor(this.colors.primary)
        .text('Padrões Identificados', { underline: true });

      doc.moveDown(1);

      report.patterns.forEach((pattern, index) => {
        doc.fontSize(this.fonts.body)
          .fillColor(this.colors.dark)
          .text(`${index + 1}. ${pattern.description}`);

        if (pattern.frequency) {
          doc.fontSize(this.fonts.small)
            .fillColor(this.colors.secondary)
            .text(`Frequência: ${pattern.frequency}`);
        }

        if (pattern.impact) {
          doc.text(`Impacto: ${pattern.impact}`);
        }

        doc.moveDown(0.8);
      });
    }

    if (report.insights && report.insights.length > 0) {
      doc.moveDown(1.5);
      doc.fontSize(this.fonts.heading)
        .fillColor(this.colors.primary)
        .text('Insights', { underline: true });

      doc.moveDown(0.5);

      report.insights.forEach(insight => {
        doc.fontSize(this.fonts.body)
          .fillColor(this.colors.info)
          .text(`💡 ${insight}`);

        doc.moveDown(0.5);
      });
    }
  }

  /**
   * Adiciona rodapé em todas as páginas
   *
   * @param {PDFDocument} doc - Documento PDF
   */
  addFooter(doc) {
    const pages = doc.bufferedPageRange();

    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);

      const bottomY = doc.page.height - 40;

      // Linha decorativa
      doc.moveTo(50, bottomY - 10)
        .lineTo(doc.page.width - 50, bottomY - 10)
        .stroke(this.colors.info);

      // Texto do footer
      doc.fontSize(this.fonts.small)
        .fillColor(this.colors.secondary)
        .text(
          `Sistema de Gestão Financeira Pessoal - Página ${i + 1} de ${pages.count}`,
          50,
          bottomY,
          { align: 'center', width: doc.page.width - 100 }
        );
    }
  }

  /**
   * Formata valor monetário
   *
   * @param {number} value - Valor a formatar
   * @returns {string} Valor formatado
   */
  formatMoney(value) {
    const numValue = parseFloat(value) || 0;
    return numValue
      .toFixed(2)
      .replace('.', ',')
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  /**
   * Formata data
   *
   * @param {Date} date - Data a formatar
   * @returns {string} Data formatada
   */
  formatDate(date) {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Formata hora
   *
   * @param {Date} date - Data para extrair hora
   * @returns {string} Hora formatada
   */
  formatTime(date) {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }

    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Retorna título do relatório
   *
   * @param {string} type - Tipo do relatório
   * @returns {string} Título
   */
  getReportTitle(type) {
    const titles = {
      'monthly': 'Relatório Mensal',
      'category': 'Relatório por Categoria',
      'evolution': 'Relatório de Evolução',
      'top': 'Maiores Transações',
      'comparative': 'Relatório Comparativo',
      'patterns': 'Análise de Padrões'
    };

    return titles[type] || 'Relatório Financeiro';
  }

  /**
   * Obtém o caminho completo de um arquivo exportado
   *
   * @param {string} filename - Nome do arquivo
   * @returns {string} Caminho completo
   */
  getFilePath(filename) {
    return path.join(this.exportsDir, filename);
  }

  /**
   * Remove um arquivo exportado
   *
   * @param {string} filename - Nome do arquivo
   * @returns {boolean} True se removido com sucesso
   */
  deleteExport(filename) {
    try {
      const filepath = this.getFilePath(filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      return false;
    }
  }

  /**
   * Lista todos os arquivos exportados
   *
   * @returns {Array} Lista de arquivos
   */
  listExports() {
    try {
      const files = fs.readdirSync(this.exportsDir);
      return files
        .filter(file => file.endsWith('.pdf'))
        .map(file => {
          const filepath = path.join(this.exportsDir, file);
          const stats = fs.statSync(filepath);
          return {
            filename: file,
            filepath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          };
        })
        .sort((a, b) => b.created - a.created);
    } catch (error) {
      console.error('Erro ao listar exports:', error);
      return [];
    }
  }
}
