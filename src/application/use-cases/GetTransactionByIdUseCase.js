/**
 * Caso de uso: Buscar transação por ID
 */
export class GetTransactionByIdUseCase {
  constructor(transactionRepository) {
    this.transactionRepository = transactionRepository;
  }

  /**
   * Executa a busca de uma transação por ID
   * @param {Object} params - { id: string, userId: string }
   * @returns {Promise<{success: boolean, transaction?: Transaction, errors?: string[]}>}
   */
  async execute({ id, userId }) {
    try {
      // Validar parâmetros
      if (!id || !userId) {
        return { success: false, errors: ['ID e UserId são obrigatórios'] };
      }

      // Buscar transação
      const transaction = await this.transactionRepository.findById(id);

      if (!transaction) {
        return { success: false, errors: ['Transação não encontrada'] };
      }

      // Verificar se a transação pertence ao usuário
      if (!transaction.belongsTo(userId)) {
        return {
          success: false,
          errors: ['Você não tem permissão para visualizar esta transação']
        };
      }

      return { success: true, transaction };

    } catch (error) {
      return {
        success: false,
        errors: [`Erro ao buscar transação: ${error.message}`]
      };
    }
  }
}
