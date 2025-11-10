/**
 * ExportConfig Entity
 *
 * Representa a configuração de exportação de dados
 * Parte da Domain Layer - Regras de negócio para exportação
 *
 * @class ExportConfig
 */
export class ExportConfig {
  /**
   * Cria uma configuração de exportação
   *
   * @param {Object} params - Parâmetros da exportação
   * @param {string} params.type - Tipo de exportação ('transactions', 'report')
   * @param {string} params.reportType - Tipo de relatório ('monthly', 'category', 'evolution', 'top', 'comparative', 'patterns')
   * @param {Object} params.filters - Filtros para aplicar
   * @param {string} params.format - Formato do arquivo ('pdf')
   * @param {boolean} params.includeCharts - Incluir gráficos no PDF
   * @param {boolean} params.includeSummary - Incluir resumo no PDF
   * @param {string} params.title - Título personalizado
   */
  constructor({
    type,
    reportType = null,
    filters = {},
    format = 'pdf',
    includeCharts = true,
    includeSummary = true,
    title = null
  }) {
    this.validate({ type, format, reportType });

    this.type = type;
    this.reportType = reportType;
    this.filters = this.normalizeFilters(filters);
    this.format = format;
    this.includeCharts = includeCharts;
    this.includeSummary = includeSummary;
    this.title = title;
    this.createdAt = new Date();
  }

  /**
   * Valida os parâmetros da configuração
   *
   * @param {Object} params - Parâmetros a validar
   * @throws {Error} Se os parâmetros forem inválidos
   */
  validate({ type, format, reportType }) {
    const validTypes = ['transactions', 'report'];
    const validFormats = ['pdf'];
    const validReportTypes = [
      'monthly',
      'category',
      'evolution',
      'top',
      'comparative',
      'patterns'
    ];

    if (!validTypes.includes(type)) {
      throw new Error(
        `Tipo de exportação inválido: ${type}. ` +
        `Tipos válidos: ${validTypes.join(', ')}`
      );
    }

    if (!validFormats.includes(format)) {
      throw new Error(
        `Formato não suportado: ${format}. ` +
        `Formatos válidos: ${validFormats.join(', ')}`
      );
    }

    if (type === 'report' && !reportType) {
      throw new Error('Tipo de relatório é obrigatório para exportação de relatórios');
    }

    if (type === 'report' && !validReportTypes.includes(reportType)) {
      throw new Error(
        `Tipo de relatório inválido: ${reportType}. ` +
        `Tipos válidos: ${validReportTypes.join(', ')}`
      );
    }
  }

  /**
   * Normaliza os filtros para o formato correto
   *
   * @param {Object} filters - Filtros brutos
   * @returns {Object} Filtros normalizados
   */
  normalizeFilters(filters) {
    const normalized = { ...filters };

    // Converter strings de data para Date objects
    if (normalized.startDate && typeof normalized.startDate === 'string') {
      normalized.startDate = new Date(normalized.startDate);
    }

    if (normalized.endDate && typeof normalized.endDate === 'string') {
      normalized.endDate = new Date(normalized.endDate);
    }

    // Normalizar tipo
    if (normalized.type && !['income', 'expense'].includes(normalized.type)) {
      delete normalized.type;
    }

    return normalized;
  }

  /**
   * Retorna o título padrão baseado no tipo
   *
   * @returns {string} Título da exportação
   */
  getTitle() {
    if (this.title) {
      return this.title;
    }

    if (this.type === 'transactions') {
      return 'Relatório de Transações';
    }

    const reportTitles = {
      'monthly': 'Relatório Mensal',
      'category': 'Relatório por Categoria',
      'evolution': 'Relatório de Evolução',
      'top': 'Maiores Transações',
      'comparative': 'Relatório Comparativo',
      'patterns': 'Análise de Padrões'
    };

    return reportTitles[this.reportType] || 'Relatório Financeiro';
  }

  /**
   * Gera um nome de arquivo baseado na configuração
   *
   * @returns {string} Nome do arquivo
   */
  generateFilename() {
    const timestamp = Date.now();
    const date = new Date().toISOString().split('T')[0];

    if (this.type === 'transactions') {
      const typeFilter = this.filters.type || 'todas';
      return `transacoes_${typeFilter}_${date}_${timestamp}.${this.format}`;
    }

    return `relatorio_${this.reportType}_${date}_${timestamp}.${this.format}`;
  }

  /**
   * Verifica se a configuração é válida para gerar o arquivo
   *
   * @returns {boolean} True se válida
   */
  isValid() {
    try {
      this.validate({
        type: this.type,
        format: this.format,
        reportType: this.reportType
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Converte para objeto simples
   *
   * @returns {Object} Representação em objeto
   */
  toObject() {
    return {
      type: this.type,
      reportType: this.reportType,
      filters: this.filters,
      format: this.format,
      includeCharts: this.includeCharts,
      includeSummary: this.includeSummary,
      title: this.getTitle(),
      filename: this.generateFilename(),
      createdAt: this.createdAt
    };
  }
}
