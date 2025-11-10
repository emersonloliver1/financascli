#!/usr/bin/env node

/**
 * Script de teste para validar exportação de PDF
 */

import { PDFExportService } from './src/infrastructure/services/PDFExportService.js';

async function testPDFExport() {
  console.log('\n📄 Testando Exportação de PDF...\n');

  const pdfService = new PDFExportService();

  // Dados de exemplo
  const testData = {
    transactions: [
      {
        id: '1',
        date: new Date('2025-01-15'),
        type: 'income',
        amount: 5000,
        description: 'Salário',
        category_name: 'Salário'
      },
      {
        id: '2',
        date: new Date('2025-01-16'),
        type: 'expense',
        amount: 150,
        description: 'Supermercado',
        category_name: 'Alimentação'
      },
      {
        id: '3',
        date: new Date('2025-01-17'),
        type: 'expense',
        amount: 80,
        description: 'Gasolina',
        category_name: 'Transporte'
      },
      {
        id: '4',
        date: new Date('2025-01-18'),
        type: 'expense',
        amount: 200,
        description: 'Conta de luz',
        category_name: 'Moradia'
      },
      {
        id: '5',
        date: new Date('2025-01-19'),
        type: 'income',
        amount: 300,
        description: 'Freelance',
        category_name: 'Renda Extra'
      }
    ],
    summary: {
      totalIncome: 5300,
      totalExpense: 430,
      balance: 4870,
      count: 5
    }
  };

  try {
    console.log('🔨 Gerando PDF de Transações...');
    const result = await pdfService.generateTransactionsPDF(testData, {
      includeSummary: true,
      filename: 'teste_transacoes.pdf'
    });

    console.log('✅ PDF gerado com sucesso!');
    console.log(`📁 Arquivo: ${result.filename}`);
    console.log(`📂 Caminho: ${result.filepath}`);
    console.log(`📄 Páginas: ${result.pages}`);
    console.log(`💾 Tamanho: ${(result.size / 1024).toFixed(2)} KB`);
    console.log('\n✨ Teste concluído com sucesso!\n');
  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error);
    process.exit(1);
  }

  // Teste de relatório
  try {
    console.log('\n🔨 Gerando PDF de Relatório Mensal...');

    const monthlyReport = {
      type: 'monthly',
      summary: {
        totalIncome: 5300,
        totalExpense: 430,
        balance: 4870,
        count: 5
      },
      categoryBreakdown: [
        { icon: '🍔', name: 'Alimentação', total: 150, percentage: 34.88 },
        { icon: '🏠', name: 'Moradia', total: 200, percentage: 46.51 },
        { icon: '🚗', name: 'Transporte', total: 80, percentage: 18.61 }
      ],
      topTransactions: [
        {
          description: 'Conta de luz',
          amount: 200,
          category_name: 'Moradia',
          date: new Date('2025-01-18')
        },
        {
          description: 'Supermercado',
          amount: 150,
          category_name: 'Alimentação',
          date: new Date('2025-01-16')
        }
      ]
    };

    const reportResult = await pdfService.generateReportPDF(monthlyReport, {
      filename: 'teste_relatorio_mensal.pdf'
    });

    console.log('✅ Relatório PDF gerado com sucesso!');
    console.log(`📁 Arquivo: ${reportResult.filename}`);
    console.log(`📂 Caminho: ${reportResult.filepath}`);
    console.log(`📄 Páginas: ${reportResult.pages}`);
    console.log(`💾 Tamanho: ${(reportResult.size / 1024).toFixed(2)} KB`);
    console.log('\n✨ Todos os testes concluídos com sucesso!\n');
  } catch (error) {
    console.error('❌ Erro ao gerar relatório PDF:', error);
    process.exit(1);
  }
}

testPDFExport();
