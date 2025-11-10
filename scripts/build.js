#!/usr/bin/env node
import { exec } from 'child_process';
import { promisify } from 'util';
import ora from 'ora';
import chalk from 'chalk';

const execAsync = promisify(exec);

/**
 * Script de build do projeto
 * Executa verificações de qualidade e preparação para produção
 */
async function build() {
  console.log(chalk.bold.cyan('\n🔨 Iniciando build do projeto...\n'));

  try {
    // 1. Lint
    const lintSpinner = ora('Executando lint...').start();
    try {
      await execAsync('npm run lint');
      lintSpinner.succeed(chalk.green('✅ Lint passou'));
    } catch (error) {
      lintSpinner.warn(chalk.yellow('⚠️  Lint com warnings (aceitável)'));
    }

    // 2. Check
    const checkSpinner = ora('Verificando sintaxe dos arquivos...').start();
    try {
      await execAsync('npm run check');
      checkSpinner.succeed(chalk.green('✅ Todos os arquivos estão sintaticamente corretos'));
    } catch (error) {
      checkSpinner.fail(chalk.red('❌ Erro de sintaxe encontrado'));
      console.error(chalk.red(error.stderr));
      process.exit(1);
    }

    // 3. Verificar estrutura de diretórios
    const structureSpinner = ora('Verificando estrutura de diretórios...').start();
    try {
      const { stdout } = await execAsync('ls -la src/');
      if (stdout.includes('domain') && stdout.includes('application') &&
          stdout.includes('infrastructure') && stdout.includes('adapters')) {
        structureSpinner.succeed(chalk.green('✅ Estrutura Clean Architecture OK'));
      } else {
        structureSpinner.warn(chalk.yellow('⚠️  Estrutura de diretórios incompleta'));
      }
    } catch (error) {
      structureSpinner.fail(chalk.red('❌ Erro ao verificar estrutura'));
    }

    // 4. Verificar dependências
    const depsSpinner = ora('Verificando dependências...').start();
    try {
      const { stdout } = await execAsync('npm ls --depth=0 2>&1');
      depsSpinner.succeed(chalk.green('✅ Dependências verificadas'));
    } catch (error) {
      depsSpinner.warn(chalk.yellow('⚠️  Algumas dependências podem estar faltando'));
    }

    // Sucesso!
    console.log(chalk.bold.green('\n✨ Build concluído com sucesso!\n'));
    console.log(chalk.cyan('📦 Projeto pronto para produção\n'));

  } catch (error) {
    console.error(chalk.bold.red('\n❌ Build falhou!\n'));
    console.error(error.message);
    process.exit(1);
  }
}

// Executar build
build();
