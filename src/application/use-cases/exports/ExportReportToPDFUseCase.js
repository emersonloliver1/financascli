/**
 * Export Report to PDF Use Case
 *
 * Caso de uso para exportar relatórios para PDF
 * Parte da Application Layer
 *
 * @class ExportReportToPDFUseCase
 */
export class ExportReportToPDFUseCase {
  /**
   * Inicializa o caso de uso
   *
   * @param {PDFExportService} pdfExportService - Serviço de exportação PDF
   * @param {Object} reportUseCases - Objeto com todos os use cases de relatórios
   */
  constructor(pdfExportService, reportUseCases) {
    this.pdfExportService = pdfExportService;
    this.reportUseCases = reportUseCases;
  }

  /**
   * Executa a exportação de relatório
   *
   * @param {string} userId - ID do usuário
   * @param {string} reportType - Tipo do relatório
   * @param {Object} options - Opções do relatório
   * @param {string} options.month - Mês para relatório mensal (formato: YYYY-MM)
   * @param {Date} options.startDate - Data inicial
   * @param {Date} options.endDate - Data final
   * @param {number} options.limit - Limite de resultados
   * @param {string} options.filename - Nome customizado do arquivo
   * @returns {Promise<Object>} Informações do arquivo gerado
   */
  async execute(userId, reportType, options = {}) {
    try {
      // Validar parâmetros
      if (!userId) {
        throw new Error('ID do usuário é obrigatório');
      }

      if (!reportType) {
        throw new Error('Tipo de relatório é obrigatório');
      }

      // 1. Gerar relatório usando o use case apropriado
      const report = await this.generateReport(userId, reportType, options);

      if (!report) {
        throw new Error('Erro ao gerar relatório');
      }

      // 2. Adicionar tipo ao relatório
      report.type = reportType;

      // 3. Gerar PDF usando o serviço
      const pdfOptions = {
        filename: options.filename,
        includeCharts: options.includeCharts !== false
      };

      const result = await this.pdfExportService.generateReportPDF(
        report,
        pdfOptions
      );

      // 4. Retornar resultado
      return {
        success: true,
        ...result,
        reportType,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Erro ao exportar relatório para PDF:', error);
      throw new Error(`Falha na exportação: ${error.message}`);
    }
  }

  /**
   * Gera o relatório baseado no tipo
   *
   * @param {string} userId - ID do usuário
   * @param {string} reportType - Tipo do relatório
   * @param {Object} options - Opções do relatório
   * @returns {Promise<Object>} Dados do relatório
   */
  async generateReport(userId, reportType, options) {
    const validReportTypes = [
      'monthly',
      'category',
      'evolution',
      'top',
      'comparative',
      'patterns'
    ];

    if (!validReportTypes.includes(reportType)) {
      throw new Error(
        `Tipo de relatório inválido: ${reportType}. ` +
        `Tipos válidos: ${validReportTypes.join(', ')}`
      );
    }

    switch (reportType) {
    case 'monthly':
      return await this.generateMonthlyReport(userId, options);

    case 'category':
      return await this.generateCategoryReport(userId, options);

    case 'evolution':
      return await this.generateEvolutionReport(userId, options);

    case 'top':
      return await this.generateTopReport(userId, options);

    case 'comparative':
      return await this.generateComparativeReport(userId, options);

    case 'patterns':
      return await this.generatePatternsReport(userId, options);

    default:
      throw new Error(`Tipo de relatório não implementado: ${reportType}`);
    }
  }

  /**
   * Gera relatório mensal
   *
   * @param {string} userId - ID do usuário
   * @param {Object} options - Opções do relatório
   * @returns {Promise<Object>} Dados do relatório mensal
   */
  async generateMonthlyReport(userId, options) {
    if (!this.reportUseCases.monthly) {
      throw new Error('Use case de relatório mensal não disponível');
    }

    const month = options.month || this.getCurrentMonth();
    const report = await this.reportUseCases.monthly.execute(userId, month);

    return {
      ...report,
      period: this.formatMonth(month)
    };
  }

  /**
   * Gera relatório por categoria
   *
   * @param {string} userId - ID do usuário
   * @param {Object} options - Opções do relatório
   * @returns {Promise<Object>} Dados do relatório de categoria
   */
  async generateCategoryReport(userId, options) {
    if (!this.reportUseCases.category) {
      throw new Error('Use case de relatório por categoria não disponível');
    }

    const period = {
      startDate: options.startDate || this.getDefaultStartDate(),
      endDate: options.endDate || new Date()
    };

    const report = await this.reportUseCases.category.execute(userId, period);

    return {
      ...report,
      period: this.formatPeriod(period)
    };
  }

  /**
   * Gera relatório de evolução
   *
   * @param {string} userId - ID do usuário
   * @param {Object} options - Opções do relatório
   * @returns {Promise<Object>} Dados do relatório de evolução
   */
  async generateEvolutionReport(userId, options) {
    if (!this.reportUseCases.evolution) {
      throw new Error('Use case de relatório de evolução não disponível');
    }

    const months = options.months || 6;
    const report = await this.reportUseCases.evolution.execute(userId, months);

    return {
      ...report,
      monthsAnalyzed: months
    };
  }

  /**
   * Gera relatório de maiores transações
   *
   * @param {string} userId - ID do usuário
   * @param {Object} options - Opções do relatório
   * @returns {Promise<Object>} Dados do relatório de maiores transações
   */
  async generateTopReport(userId, options) {
    if (!this.reportUseCases.top) {
      throw new Error('Use case de relatório de maiores transações não disponível');
    }

    const limit = options.limit || 10;
    const period = {
      startDate: options.startDate || this.getDefaultStartDate(),
      endDate: options.endDate || new Date()
    };

    const report = await this.reportUseCases.top.execute(userId, {
      limit,
      ...period
    });

    return {
      ...report,
      period: this.formatPeriod(period),
      limit
    };
  }

  /**
   * Gera relatório comparativo
   *
   * @param {string} userId - ID do usuário
   * @param {Object} options - Opções do relatório
   * @returns {Promise<Object>} Dados do relatório comparativo
   */
  async generateComparativeReport(userId, options) {
    if (!this.reportUseCases.comparative) {
      throw new Error('Use case de relatório comparativo não disponível');
    }

    const report = await this.reportUseCases.comparative.execute(userId, options);

    return report;
  }

  /**
   * Gera relatório de padrões
   *
   * @param {string} userId - ID do usuário
   * @param {Object} options - Opções do relatório
   * @returns {Promise<Object>} Dados do relatório de padrões
   */
  async generatePatternsReport(userId, options) {
    if (!this.reportUseCases.patterns) {
      throw new Error('Use case de relatório de padrões não disponível');
    }

    const report = await this.reportUseCases.patterns.execute(userId, options);

    return report;
  }

  /**
   * Retorna o mês atual no formato YYYY-MM
   *
   * @returns {string} Mês atual
   */
  getCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Retorna data inicial padrão (início do mês atual)
   *
   * @returns {Date} Data inicial
   */
  getDefaultStartDate() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  /**
   * Formata mês para exibição
   *
   * @param {string} month - Mês no formato YYYY-MM
   * @returns {string} Mês formatado
   */
  formatMonth(month) {
    if (!month) return '';

    const [year, monthNum] = month.split('-');
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const monthIndex = parseInt(monthNum, 10) - 1;
    return `${months[monthIndex]} de ${year}`;
  }

  /**
   * Formata período para exibição
   *
   * @param {Object} period - Período com startDate e endDate
   * @returns {string} Período formatado
   */
  formatPeriod(period) {
    if (!period || (!period.startDate && !period.endDate)) {
      return '';
    }

    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };

    const start = period.startDate
      ? period.startDate.toLocaleDateString('pt-BR', options)
      : 'Início';

    const end = period.endDate
      ? period.endDate.toLocaleDateString('pt-BR', options)
      : 'Hoje';

    return `${start} a ${end}`;
  }
}
