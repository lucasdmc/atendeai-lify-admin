/**
 * DIAGNÓSTICO DO SISTEMA DE AGENDAMENTO
 * 
 * Este script identifica problemas específicos no sistema:
 * 1. Verificação de dependências
 * 2. Verificação de configurações
 * 3. Verificação de conectividade
 * 4. Análise de logs e erros
 */

import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// ✅ CORREÇÃO: Carregar variáveis de ambiente ANTES de qualquer verificação
dotenv.config();

// ✅ CORREÇÃO: __dirname para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class AppointmentSystemDiagnostic {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.recommendations = [];
  }

  /**
   * Executa diagnóstico completo
   */
  async runDiagnostic() {
    console.log('🔍 INICIANDO DIAGNÓSTICO DO SISTEMA DE AGENDAMENTO');
    console.log('=' .repeat(80));
    
    try {
      // Diagnóstico 1: Verificação de arquivos
      await this.diagnoseFileStructure();
      
      // Diagnóstico 2: Verificação de dependências
      await this.diagnoseDependencies();
      
      // Diagnóstico 3: Verificação de configurações
      await this.diagnoseConfigurations();
      
      // Diagnóstico 4: Verificação de conectividade
      await this.diagnoseConnectivity();
      
      // Diagnóstico 5: Análise de código
      await this.diagnoseCodeIssues();
      
      // Relatório de diagnóstico
      this.generateDiagnosticReport();
      
    } catch (error) {
      console.error('💥 ERRO NO DIAGNÓSTICO:', error);
      this.issues.push({
        category: 'DIAGNÓSTICO',
        issue: error.message,
        severity: 'CRITICAL'
      });
      this.generateDiagnosticReport();
    }
  }

  /**
   * Diagnóstico 1: Verificação de arquivos
   */
  async diagnoseFileStructure() {
    console.log('\n📁 DIAGNÓSTICO 1: VERIFICAÇÃO DE ESTRUTURA DE ARQUIVOS');
    console.log('-'.repeat(50));
    
    try {
      // Verificar arquivos essenciais
      const essentialFiles = [
        'services/core/appointmentFlowManager.js',
        'services/core/llmOrchestratorService.js',
        'services/core/googleCalendarService.js',
        'services/core/clinicContextManager.js',
        'services/core/index.js',
        'routes/webhook-final.js',
        'env.example'
      ];
      
      for (const file of essentialFiles) {
        try {
          await fs.access(file);
          console.log(`✅ ${file} - Presente`);
        } catch (error) {
          console.error(`❌ ${file} - AUSENTE`);
          this.issues.push({
            category: 'ARQUIVOS',
            issue: `Arquivo essencial ausente: ${file}`,
            severity: 'CRITICAL'
          });
        }
      }
      
      // Verificar diretórios essenciais
      const essentialDirs = [
        'services/core',
        'config/google',
        'routes'
      ];
      
      for (const dir of essentialDirs) {
        try {
          const stats = await fs.stat(dir);
          if (stats.isDirectory()) {
            console.log(`✅ ${dir}/ - Diretório presente`);
          } else {
            console.error(`❌ ${dir}/ - Não é um diretório`);
            this.issues.push({
              category: 'ARQUIVOS',
              issue: `${dir} não é um diretório válido`,
              severity: 'HIGH'
            });
          }
        } catch (error) {
          console.error(`❌ ${dir}/ - Diretório ausente`);
          this.issues.push({
            category: 'ARQUIVOS',
            issue: `Diretório essencial ausente: ${dir}`,
            severity: 'HIGH'
          });
        }
      }
      
    } catch (error) {
      console.error(`❌ Erro na verificação de arquivos: ${error.message}`);
      this.issues.push({
        category: 'ARQUIVOS',
        issue: `Erro na verificação: ${error.message}`,
        severity: 'HIGH'
      });
    }
  }

  /**
   * Diagnóstico 2: Verificação de dependências
   */
  async diagnoseDependencies() {
    console.log('\n📦 DIAGNÓSTICO 2: VERIFICAÇÃO DE DEPENDÊNCIAS');
    console.log('-'.repeat(50));
    
    try {
      // Verificar package.json
      try {
        const packageJson = await fs.readFile('package.json', 'utf8');
        const packageData = JSON.parse(packageJson);
        
        console.log(`✅ package.json - Versão: ${packageData.version || 'N/A'}`);
        
        // Verificar dependências essenciais
        const essentialDeps = [
          '@supabase/supabase-js',
          'openai',
          'googleapis',
          'express'
        ];
        
        const deps = { ...packageData.dependencies, ...packageData.devDependencies };
        
        for (const dep of essentialDeps) {
          if (deps[dep]) {
            console.log(`✅ ${dep} - ${deps[dep]}`);
          } else {
            console.error(`❌ ${dep} - AUSENTE`);
            this.issues.push({
              category: 'DEPENDÊNCIAS',
              issue: `Dependência essencial ausente: ${dep}`,
              severity: 'CRITICAL'
            });
          }
        }
        
      } catch (error) {
        console.error(`❌ Erro ao ler package.json: ${error.message}`);
        this.issues.push({
          category: 'DEPENDÊNCIAS',
          issue: `Não foi possível ler package.json: ${error.message}`,
          severity: 'HIGH'
        });
      }
      
      // Verificar node_modules
      try {
        const stats = await fs.stat('node_modules');
        if (stats.isDirectory()) {
          console.log('✅ node_modules/ - Presente');
        } else {
          console.error('❌ node_modules/ - Não é um diretório');
          this.issues.push({
            category: 'DEPENDÊNCIAS',
            issue: 'node_modules não é um diretório válido',
            severity: 'HIGH'
          });
        }
      } catch (error) {
        console.error('❌ node_modules/ - Ausente');
        this.issues.push({
          category: 'DEPENDÊNCIAS',
          issue: 'node_modules ausente - execute npm install',
          severity: 'CRITICAL'
        });
      }
      
    } catch (error) {
      console.error(`❌ Erro na verificação de dependências: ${error.message}`);
      this.issues.push({
        category: 'DEPENDÊNCIAS',
        issue: `Erro na verificação: ${error.message}`,
        severity: 'HIGH'
      });
    }
  }

  /**
   * Diagnóstico 3: Verificação de configurações
   */
  async diagnoseConfigurations() {
    console.log('\n⚙️ DIAGNÓSTICO 3: VERIFICAÇÃO DE CONFIGURAÇÕES');
    console.log('-'.repeat(50));
    
    try {
      // Verificar variáveis de ambiente
      const requiredEnvVars = [
        'VITE_SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'OPENAI_API_KEY',
        'WHATSAPP_META_ACCESS_TOKEN',
        'WHATSAPP_META_PHONE_NUMBER_ID'
      ];
      
      const missingVars = [];
      
      for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
          missingVars.push(envVar);
        }
      }
      
      if (missingVars.length > 0) {
        console.error(`❌ Variáveis de ambiente ausentes: ${missingVars.join(', ')}`);
        this.issues.push({
          category: 'CONFIGURAÇÕES',
          issue: `Variáveis de ambiente ausentes: ${missingVars.join(', ')}`,
          severity: 'CRITICAL'
        });
      } else {
        console.log('✅ Todas as variáveis de ambiente estão configuradas');
      }
      
      // Verificar arquivo .env
      try {
        await fs.access('.env');
        console.log('✅ Arquivo .env presente');
      } catch (error) {
        console.warn('⚠️ Arquivo .env ausente');
        this.warnings.push({
          category: 'CONFIGURAÇÕES',
          warning: 'Arquivo .env ausente - use env.example como base'
        });
      }
      
      // Verificar configurações do Google
      try {
        const googleCredsPath = 'config/google-credentials.json';
        await fs.access(googleCredsPath);
        console.log('✅ Credenciais do Google presentes');
      } catch (error) {
        console.warn('⚠️ Credenciais do Google ausentes');
        this.warnings.push({
          category: 'CONFIGURAÇÕES',
          warning: 'Credenciais do Google não configuradas - integração com Calendar pode não funcionar'
        });
      }
      
    } catch (error) {
      console.error(`❌ Erro na verificação de configurações: ${error.message}`);
      this.issues.push({
        category: 'CONFIGURAÇÕES',
        issue: `Erro na verificação: ${error.message}`,
        severity: 'HIGH'
      });
    }
  }

  /**
   * Diagnóstico 4: Verificação de conectividade
   */
  async diagnoseConnectivity() {
    console.log('\n🌐 DIAGNÓSTICO 4: VERIFICAÇÃO DE CONECTIVIDADE');
    console.log('-'.repeat(50));
    
    try {
      // Verificar conectividade com Supabase
      try {
        const { createClient } = await import('@supabase/supabase-js');
        
        const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (!supabaseKey) {
          throw new Error('Chave do Supabase não configurada');
        }
        
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Testar conexão
        const { data, error } = await supabase
          .from('clinics')
          .select('count')
          .limit(1);
        
        if (error) {
          throw new Error(`Erro na conexão: ${error.message}`);
        }
        
        console.log('✅ Conexão com Supabase estabelecida');
        
      } catch (error) {
        console.error(`❌ Erro na conexão com Supabase: ${error.message}`);
        this.issues.push({
          category: 'CONECTIVIDADE',
          issue: `Falha na conexão com Supabase: ${error.message}`,
          severity: 'CRITICAL'
        });
      }
      
      // Verificar conectividade com OpenAI
      try {
        const openaiKey = process.env.OPENAI_API_KEY;
        
        if (!openaiKey) {
          throw new Error('Chave da OpenAI não configurada');
        }
        
        // Teste simples de conectividade (sem fazer chamada real)
        if (openaiKey.startsWith('sk-')) {
          console.log('✅ Chave da OpenAI configurada corretamente');
        } else {
          throw new Error('Formato da chave da OpenAI inválido');
        }
        
      } catch (error) {
        console.error(`❌ Erro na configuração da OpenAI: ${error.message}`);
        this.issues.push({
          category: 'CONECTIVIDADE',
          issue: `Problema com OpenAI: ${error.message}`,
          severity: 'HIGH'
        });
      }
      
      // Verificar configuração do WhatsApp
      try {
        const whatsappToken = process.env.WHATSAPP_META_ACCESS_TOKEN;
        const whatsappPhoneId = process.env.WHATSAPP_META_PHONE_NUMBER_ID;
        
        if (!whatsappToken || !whatsappPhoneId) {
          throw new Error('Configurações do WhatsApp incompletas');
        }
        
        console.log('✅ Configurações do WhatsApp configuradas');
        
      } catch (error) {
        console.error(`❌ Erro na configuração do WhatsApp: ${error.message}`);
        this.issues.push({
          category: 'CONECTIVIDADE',
          issue: `Problema com WhatsApp: ${error.message}`,
          severity: 'HIGH'
        });
      }
      
    } catch (error) {
      console.error(`❌ Erro na verificação de conectividade: ${error.message}`);
      this.issues.push({
        category: 'CONECTIVIDADE',
        issue: `Erro na verificação: ${error.message}`,
        severity: 'HIGH'
      });
    }
  }

  /**
   * Diagnóstico 5: Análise de código
   */
  async diagnoseCodeIssues() {
    console.log('\n🔍 DIAGNÓSTICO 5: ANÁLISE DE CÓDIGO');
    console.log('-'.repeat(50));
    
    try {
      // Verificar imports nos arquivos principais
      const coreFiles = [
        'services/core/index.js',
        'services/core/llmOrchestratorService.js',
        'services/core/appointmentFlowManager.js'
      ];
      
      for (const file of coreFiles) {
        try {
          const content = await fs.readFile(file, 'utf8');
          
          // Verificar imports
          if (content.includes('import') && content.includes('from')) {
            console.log(`✅ ${file} - Imports válidos`);
          } else {
            console.warn(`⚠️ ${file} - Possível problema com imports`);
            this.warnings.push({
              category: 'CÓDIGO',
              warning: `Arquivo ${file} pode ter problemas com imports`
            });
          }
          
          // Verificar sintaxe básica
          if (content.includes('export') || content.includes('module.exports')) {
            console.log(`✅ ${file} - Exports configurados`);
          } else {
            console.warn(`⚠️ ${file} - Exports não encontrados`);
            this.warnings.push({
              category: 'CÓDIGO',
              warning: `Arquivo ${file} pode não estar exportando corretamente`
            });
          }
          
        } catch (error) {
          console.error(`❌ Erro ao analisar ${file}: ${error.message}`);
          this.issues.push({
            category: 'CÓDIGO',
            issue: `Não foi possível analisar ${file}: ${error.message}`,
            severity: 'MEDIUM'
          });
        }
      }
      
      // Verificar estrutura do webhook
      try {
        const webhookContent = await fs.readFile('routes/webhook-final.js', 'utf8');
        
        if (webhookContent.includes('processMessageWithCompleteContext')) {
          console.log('✅ Função principal do webhook encontrada');
        } else {
          console.warn('⚠️ Função principal do webhook não encontrada');
          this.warnings.push({
            category: 'CÓDIGO',
            warning: 'Função principal do webhook pode estar ausente'
          });
        }
        
        if (webhookContent.includes('LLMOrchestratorService')) {
          console.log('✅ Integração com LLMOrchestratorService encontrada');
        } else {
          console.error('❌ Integração com LLMOrchestratorService não encontrada');
          this.issues.push({
            category: 'CÓDIGO',
            issue: 'Webhook não está integrado com LLMOrchestratorService',
            severity: 'CRITICAL'
          });
        }
        
      } catch (error) {
        console.error(`❌ Erro ao analisar webhook: ${error.message}`);
        this.issues.push({
          category: 'CÓDIGO',
          issue: `Não foi possível analisar webhook: ${error.message}`,
          severity: 'HIGH'
        });
      }
      
    } catch (error) {
      console.error(`❌ Erro na análise de código: ${error.message}`);
      this.issues.push({
        category: 'CÓDIGO',
        issue: `Erro na análise: ${error.message}`,
        severity: 'HIGH'
      });
    }
  }

  /**
   * Gera relatório de diagnóstico
   */
  generateDiagnosticReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RELATÓRIO DE DIAGNÓSTICO');
    console.log('='.repeat(80));
    
    const criticalIssues = this.issues.filter(i => i.severity === 'CRITICAL');
    const highIssues = this.issues.filter(i => i.severity === 'HIGH');
    const mediumIssues = this.issues.filter(i => i.severity === 'MEDIUM');
    const warningsCount = this.warnings.length;
    
    console.log(`\n📈 RESUMO DO DIAGNÓSTICO:`);
    console.log(`   🚨 Problemas críticos: ${criticalIssues.length}`);
    console.log(`   ⚠️  Problemas altos: ${highIssues.length}`);
    console.log(`   🔶 Problemas médios: ${mediumIssues.length}`);
    console.log(`   💡 Avisos: ${warningsCount}`);
    
    if (criticalIssues.length > 0) {
      console.log(`\n🚨 PROBLEMAS CRÍTICOS:`);
      criticalIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. [${issue.category}] ${issue.issue}`);
      });
    }
    
    if (highIssues.length > 0) {
      console.log(`\n⚠️  PROBLEMAS ALTOS:`);
      highIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. [${issue.category}] ${issue.issue}`);
      });
    }
    
    if (mediumIssues.length > 0) {
      console.log(`\n🔶 PROBLEMAS MÉDIOS:`);
      mediumIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. [${issue.category}] ${issue.issue}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log(`\n💡 AVISOS:`);
      this.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. [${warning.category}] ${warning.warning}`);
      });
    }
    
    // Recomendações
    if (criticalIssues.length > 0) {
      console.log(`\n🚨 RECOMENDAÇÕES CRÍTICAS:`);
      console.log(`   • CORRIJA TODOS OS PROBLEMAS CRÍTICOS ANTES DE PROSSEGUIR`);
      console.log(`   • Execute 'npm install' se houver problemas de dependências`);
      console.log(`   • Configure todas as variáveis de ambiente necessárias`);
      console.log(`   • Verifique a conectividade com serviços externos`);
    }
    
    if (highIssues.length > 0) {
      console.log(`\n⚠️  RECOMENDAÇÕES IMPORTANTES:`);
      console.log(`   • Resolva problemas altos para melhorar a estabilidade`);
      console.log(`   • Verifique configurações de arquivos e diretórios`);
      console.log(`   • Teste conectividade com serviços`);
    }
    
    if (criticalIssues.length === 0 && highIssues.length === 0) {
      console.log(`\n🎉 SISTEMA APROVADO NO DIAGNÓSTICO! Pode prosseguir com os testes.`);
    } else {
      console.log(`\n🚨 SISTEMA COM PROBLEMAS! Corrija os problemas antes de prosseguir.`);
      process.exit(1);
    }
  }
}

// Executar diagnóstico se o arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const diagnostic = new AppointmentSystemDiagnostic();
  diagnostic.runDiagnostic().catch(error => {
    console.error('💥 ERRO FATAL NO DIAGNÓSTICO:', error);
    process.exit(1);
  });
}
