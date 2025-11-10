#!/usr/bin/env node

import dotenv from 'dotenv';
import { database } from './infrastructure/database/NeonDatabase.js';
import { UserRepository } from './infrastructure/database/UserRepository.js';
import { CategoryRepository } from './infrastructure/database/CategoryRepository.js';
import { TransactionRepository } from './infrastructure/database/TransactionRepository.js';
import { NeonAuthService } from './infrastructure/auth/NeonAuthService.js';
import { RegisterUserUseCase } from './application/use-cases/RegisterUserUseCase.js';
import { LoginUserUseCase } from './application/use-cases/LoginUserUseCase.js';
import { CreateCategoryUseCase } from './application/use-cases/CreateCategoryUseCase.js';
import { ListCategoriesUseCase } from './application/use-cases/ListCategoriesUseCase.js';
import { UpdateCategoryUseCase } from './application/use-cases/UpdateCategoryUseCase.js';
import { DeleteCategoryUseCase } from './application/use-cases/DeleteCategoryUseCase.js';
import { SeedDefaultCategoriesUseCase } from './application/use-cases/SeedDefaultCategoriesUseCase.js';
import { CreateTransactionUseCase } from './application/use-cases/CreateTransactionUseCase.js';
import { ListTransactionsUseCase } from './application/use-cases/ListTransactionsUseCase.js';
import { GetTransactionByIdUseCase } from './application/use-cases/GetTransactionByIdUseCase.js';
import { UpdateTransactionUseCase } from './application/use-cases/UpdateTransactionUseCase.js';
import { DeleteTransactionUseCase } from './application/use-cases/DeleteTransactionUseCase.js';
import { GetDashboardDataUseCase } from './application/use-cases/GetDashboardDataUseCase.js';
import { GenerateMonthlyReportUseCase } from './application/use-cases/reports/GenerateMonthlyReportUseCase.js';
import { GenerateCategoryReportUseCase } from './application/use-cases/reports/GenerateCategoryReportUseCase.js';
import { GenerateEvolutionReportUseCase } from './application/use-cases/reports/GenerateEvolutionReportUseCase.js';
import { GenerateTopTransactionsReportUseCase } from './application/use-cases/reports/GenerateTopTransactionsReportUseCase.js';
import { GenerateComparativeReportUseCase } from './application/use-cases/reports/GenerateComparativeReportUseCase.js';
import { GeneratePatternAnalysisUseCase } from './application/use-cases/reports/GeneratePatternAnalysisUseCase.js';
import { BudgetRepository } from './infrastructure/database/BudgetRepository.js';
import { CreateBudgetUseCase } from './application/use-cases/budgets/CreateBudgetUseCase.js';
import { ListBudgetsUseCase } from './application/use-cases/budgets/ListBudgetsUseCase.js';
import { UpdateBudgetUseCase } from './application/use-cases/budgets/UpdateBudgetUseCase.js';
import { DeleteBudgetUseCase } from './application/use-cases/budgets/DeleteBudgetUseCase.js';
import { GetBudgetAlertsUseCase } from './application/use-cases/budgets/GetBudgetAlertsUseCase.js';
import { SuggestBudgetsUseCase } from './application/use-cases/budgets/SuggestBudgetsUseCase.js';
import { GoalRepository } from './infrastructure/database/GoalRepository.js';
import { CreateGoalUseCase } from './application/use-cases/goals/CreateGoalUseCase.js';
import { ListGoalsUseCase } from './application/use-cases/goals/ListGoalsUseCase.js';
import { UpdateGoalUseCase } from './application/use-cases/goals/UpdateGoalUseCase.js';
import { DeleteGoalUseCase } from './application/use-cases/goals/DeleteGoalUseCase.js';
import { AddContributionUseCase } from './application/use-cases/goals/AddContributionUseCase.js';
import { CompleteGoalUseCase } from './application/use-cases/goals/CompleteGoalUseCase.js';
import { GetGoalStatsUseCase } from './application/use-cases/goals/GetGoalStatsUseCase.js';
import { PDFExportService } from './infrastructure/services/PDFExportService.js';
import { ExportTransactionsToPDFUseCase } from './application/use-cases/exports/ExportTransactionsToPDFUseCase.js';
import { ExportReportToPDFUseCase } from './application/use-cases/exports/ExportReportToPDFUseCase.js';
import { AuthScreen } from './adapters/cli/screens/AuthScreen.js';
import { MainScreen } from './adapters/cli/screens/MainScreen.js';
import { errorMessage } from './adapters/cli/utils/banner.js';

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Classe principal da aplicação
 */
class App {
  constructor() {
    this.database = null;
    this.userRepository = null;
    this.categoryRepository = null;
    this.transactionRepository = null;
    this.authService = null;
    this.registerUseCase = null;
    this.loginUseCase = null;
    this.createCategoryUseCase = null;
    this.listCategoriesUseCase = null;
    this.updateCategoryUseCase = null;
    this.deleteCategoryUseCase = null;
    this.seedDefaultCategoriesUseCase = null;
    this.createTransactionUseCase = null;
    this.listTransactionsUseCase = null;
    this.getTransactionByIdUseCase = null;
    this.updateTransactionUseCase = null;
    this.deleteTransactionUseCase = null;
    this.getDashboardDataUseCase = null;
    this.generateMonthlyReportUseCase = null;
    this.generateCategoryReportUseCase = null;
    this.generateEvolutionReportUseCase = null;
    this.generateTopTransactionsReportUseCase = null;
    this.generateComparativeReportUseCase = null;
    this.generatePatternAnalysisUseCase = null;
    this.budgetRepository = null;
    this.createBudgetUseCase = null;
    this.listBudgetsUseCase = null;
    this.updateBudgetUseCase = null;
    this.deleteBudgetUseCase = null;
    this.getBudgetAlertsUseCase = null;
    this.suggestBudgetsUseCase = null;
    this.goalRepository = null;
    this.createGoalUseCase = null;
    this.listGoalsUseCase = null;
    this.updateGoalUseCase = null;
    this.deleteGoalUseCase = null;
    this.addContributionUseCase = null;
    this.completeGoalUseCase = null;
    this.getGoalStatsUseCase = null;
    this.pdfExportService = null;
    this.exportTransactionsUseCase = null;
    this.exportReportUseCase = null;
  }

  /**
   * Inicializa as dependências
   */
  async initialize() {
    try {
      // Conectar ao banco de dados
      this.database = database;
      await this.database.connect();
      await this.database.initializeTables();

      // Inicializar repositórios
      this.userRepository = new UserRepository(this.database);
      this.categoryRepository = new CategoryRepository(this.database);
      this.transactionRepository = new TransactionRepository(this.database);
      this.budgetRepository = new BudgetRepository(this.database);
      this.goalRepository = new GoalRepository(this.database);

      // Inicializar serviços
      this.authService = new NeonAuthService(this.userRepository, this.database);

      // Inicializar casos de uso de autenticação
      this.registerUseCase = new RegisterUserUseCase(
        this.authService,
        this.userRepository
      );
      this.loginUseCase = new LoginUserUseCase(this.authService);

      // Inicializar casos de uso de categorias
      this.createCategoryUseCase = new CreateCategoryUseCase(this.categoryRepository);
      this.listCategoriesUseCase = new ListCategoriesUseCase(this.categoryRepository);
      this.updateCategoryUseCase = new UpdateCategoryUseCase(this.categoryRepository);
      this.deleteCategoryUseCase = new DeleteCategoryUseCase(this.categoryRepository);
      this.seedDefaultCategoriesUseCase = new SeedDefaultCategoriesUseCase(this.categoryRepository);

      // Inicializar casos de uso de transações
      this.createTransactionUseCase = new CreateTransactionUseCase(
        this.transactionRepository,
        this.categoryRepository
      );
      this.listTransactionsUseCase = new ListTransactionsUseCase(this.transactionRepository);
      this.getTransactionByIdUseCase = new GetTransactionByIdUseCase(this.transactionRepository);
      this.updateTransactionUseCase = new UpdateTransactionUseCase(
        this.transactionRepository,
        this.categoryRepository
      );
      this.deleteTransactionUseCase = new DeleteTransactionUseCase(this.transactionRepository);

      // Inicializar casos de uso de dashboard
      this.getDashboardDataUseCase = new GetDashboardDataUseCase(this.transactionRepository);

      // Inicializar casos de uso de relatórios
      this.generateMonthlyReportUseCase = new GenerateMonthlyReportUseCase(this.transactionRepository);
      this.generateCategoryReportUseCase = new GenerateCategoryReportUseCase(this.transactionRepository, this.categoryRepository);
      this.generateEvolutionReportUseCase = new GenerateEvolutionReportUseCase(this.transactionRepository);
      this.generateTopTransactionsReportUseCase = new GenerateTopTransactionsReportUseCase(this.transactionRepository);
      this.generateComparativeReportUseCase = new GenerateComparativeReportUseCase(this.transactionRepository);
      this.generatePatternAnalysisUseCase = new GeneratePatternAnalysisUseCase(this.transactionRepository);

      // Inicializar casos de uso de orçamentos
      this.createBudgetUseCase = new CreateBudgetUseCase(this.budgetRepository, this.categoryRepository);
      this.listBudgetsUseCase = new ListBudgetsUseCase(this.budgetRepository);
      this.updateBudgetUseCase = new UpdateBudgetUseCase(this.budgetRepository);
      this.deleteBudgetUseCase = new DeleteBudgetUseCase(this.budgetRepository);
      this.getBudgetAlertsUseCase = new GetBudgetAlertsUseCase(this.budgetRepository);
      this.suggestBudgetsUseCase = new SuggestBudgetsUseCase(this.budgetRepository, this.categoryRepository);

      // Inicializar casos de uso de metas
      this.createGoalUseCase = new CreateGoalUseCase(this.goalRepository);
      this.listGoalsUseCase = new ListGoalsUseCase(this.goalRepository);
      this.updateGoalUseCase = new UpdateGoalUseCase(this.goalRepository);
      this.deleteGoalUseCase = new DeleteGoalUseCase(this.goalRepository);
      this.addContributionUseCase = new AddContributionUseCase(this.goalRepository);
      this.completeGoalUseCase = new CompleteGoalUseCase(this.goalRepository);
      this.getGoalStatsUseCase = new GetGoalStatsUseCase(this.goalRepository);

      // Inicializar serviço de exportação
      this.pdfExportService = new PDFExportService();

      // Inicializar casos de uso de exportação
      this.exportTransactionsUseCase = new ExportTransactionsToPDFUseCase(
        this.transactionRepository,
        this.pdfExportService
      );

      this.exportReportUseCase = new ExportReportToPDFUseCase(
        this.pdfExportService,
        {
          monthly: this.generateMonthlyReportUseCase,
          category: this.generateCategoryReportUseCase,
          evolution: this.generateEvolutionReportUseCase,
          top: this.generateTopTransactionsReportUseCase,
          comparative: this.generateComparativeReportUseCase,
          patterns: this.generatePatternAnalysisUseCase
        }
      );

      // Executar seed de categorias padrão (apenas primeira vez)
      await this.seedDefaultCategoriesUseCase.execute();

      return true;
    } catch (error) {
      console.error('\n');
      console.error(errorMessage(`Erro ao inicializar aplicação:\n${error.message}`));
      console.error('\n');
      console.error('Verifique se o arquivo .env está configurado corretamente.');
      console.error('Exemplo: copie .env.example para .env e preencha com suas credenciais.\n');
      return false;
    }
  }

  /**
   * Inicia a aplicação
   */
  async start() {
    try {
      // Inicializar dependências
      const initialized = await this.initialize();
      if (!initialized) {
        process.exit(1);
      }

      // Loop principal
      let currentUser = null;

      while (true) {
        // Se não houver usuário logado, mostrar tela de autenticação
        if (!currentUser) {
          const authScreen = new AuthScreen(
            this.registerUseCase,
            this.loginUseCase,
            this.userRepository
          );
          currentUser = await authScreen.show();

          // Se usuário fechou a aplicação
          if (!currentUser) {
            break;
          }
        }

        // Mostrar tela principal
        const mainScreen = new MainScreen(
          currentUser,
          {
            createCategoryUseCase: this.createCategoryUseCase,
            listCategoriesUseCase: this.listCategoriesUseCase,
            updateCategoryUseCase: this.updateCategoryUseCase,
            deleteCategoryUseCase: this.deleteCategoryUseCase
          },
          {
            createTransactionUseCase: this.createTransactionUseCase,
            listTransactionsUseCase: this.listTransactionsUseCase,
            getTransactionByIdUseCase: this.getTransactionByIdUseCase,
            updateTransactionUseCase: this.updateTransactionUseCase,
            deleteTransactionUseCase: this.deleteTransactionUseCase
          },
          this.getDashboardDataUseCase,
          {
            generateMonthlyReport: this.generateMonthlyReportUseCase,
            generateCategoryReport: this.generateCategoryReportUseCase,
            generateEvolutionReport: this.generateEvolutionReportUseCase,
            generateTopTransactionsReport: this.generateTopTransactionsReportUseCase,
            generateComparativeReport: this.generateComparativeReportUseCase,
            generatePatternAnalysisReport: this.generatePatternAnalysisUseCase
          },
          {
            createBudget: this.createBudgetUseCase,
            listBudgets: this.listBudgetsUseCase,
            updateBudget: this.updateBudgetUseCase,
            deleteBudget: this.deleteBudgetUseCase,
            getBudgetAlerts: this.getBudgetAlertsUseCase,
            suggestBudgets: this.suggestBudgetsUseCase
          },
          {
            createGoal: this.createGoalUseCase,
            listGoals: this.listGoalsUseCase,
            updateGoal: this.updateGoalUseCase,
            deleteGoal: this.deleteGoalUseCase,
            addContribution: this.addContributionUseCase,
            completeGoal: this.completeGoalUseCase,
            getGoalStats: this.getGoalStatsUseCase
          },
          {
            transactions: this.exportTransactionsUseCase,
            report: this.exportReportUseCase
          }
        );
        const action = await mainScreen.show();

        // Se usuário escolheu sair
        if (action === 'exit') {
          await this.authService.logout();
          currentUser = null;
        }
      }

      // Encerrar
      console.log('\n👋 Até logo!\n');
      await this.cleanup();
      process.exit(0);
    } catch (error) {
      console.error('\n');
      console.error(errorMessage(`Erro inesperado:\n${error.message}`));
      console.error('\n');
      await this.cleanup();
      process.exit(1);
    }
  }

  /**
   * Limpa recursos
   */
  async cleanup() {
    if (this.database) {
      await this.database.close();
    }
  }
}

// Iniciar aplicação
const app = new App();
app.start();
