// ========================================
// EXEMPLOS DE FORMATAÇÃO DE MENSAGENS
// ========================================
// Este arquivo mostra a diferença entre o formato atual (problemático)
// e o formato esperado (correto) para as mensagens da CardioPrime

import { CARDIOPRIME_MESSAGES, formatMessage } from './cardioprime-messages.js';

export const MESSAGE_EXAMPLES = {
  // ========================================
  // MENSAGEM SOBRE EXAMES
  // ========================================
  
  // ❌ FORMATO ATUAL (PROBLEMÁTICO)
  exames_atual: `A CardioPrime oferece os seguintes exames:

1.⁠ ⁠Ecocardiograma Transtorácico: Um ultrassom do coração que avalia a função cardíaca. 2. Teste Ergométrico: Um teste de esforço para avaliar a capacidade cardíaca durante o exercício. 3. Holter 24 horas: Monitorização contínua do ritmo cardíaco por 24 horas.

Esses exames são essenciais para uma avaliação detalhada da saúde cardiovascular.

Caso tenha interesse em agendar algum deles ou tenha dúvidas específicas, estou à disposição para ajudar.`,

  // ✅ FORMATO ESPERADO (CORRETO)
  exames_esperado: `A CardioPrime oferece os seguintes exames:

1. Ecocardiograma Transtorácico: Um ultrassom do coração que avalia a função cardíaca.
2. Teste Ergométrico: Um teste de esforço para avaliar a capacidade cardíaca durante o exercício.
3. Holter 24 horas: Monitorização contínua do ritmo cardíaco por 24 horas.

Esses exames são essenciais para uma avaliação detalhada da saúde cardiovascular.

Caso tenha interesse em agendar algum deles ou tenha dúvidas específicas, estou à disposição para ajudar.`,

  // ========================================
  // MENSAGEM SOBRE PROFISSIONAIS
  // ========================================
  
  // ❌ FORMATO ATUAL (PROBLEMÁTICO)
  profissionais_atual: `Na CardioPrime, contamos com dois profissionais especializados em cardiologia:

1.⁠ ⁠*Dr.

Roberto Silva* - Médico cardiologista com vasta experiência na área. 2. *Dra.

Maria Fernanda* - Médica cardiologista também com sólida formação e atuação em cardiologia.

Ambos estão disponíveis para consultas e atendem a diferentes necessidades relacionadas à saúde cardiovascular.

Se precisar agendar uma consulta ou obter mais informações, estou à disposição para ajudar.`,

  // ✅ FORMATO ESPERADO (CORRETO)
  profissionais_esperado: `Na CardioPrime, contamos com dois profissionais especializados em cardiologia:

1. *Dr. Roberto Silva* - Médico cardiologista com vasta experiência na área.

2. *Dra. Maria Fernanda* - Médica cardiologista também com sólida formação e atuação em cardiologia.

Ambos estão disponíveis para consultas e atendem a diferentes necessidades relacionadas à saúde cardiovascular.

Se precisar agendar uma consulta ou obter mais informações, estou à disposição para ajudar.`
};

// ========================================
// FUNÇÕES PARA CORRIGIR FORMATAÇÃO
// ========================================

export const fixMessageFormatting = {
  // Corrige formatação de exames de forma mais precisa
  fixExamesFormat: (text) => {
    // Primeiro, limpar caracteres especiais
    let cleaned = text.replace(/[⁠]/g, '');
    
    // Corrigir espaçamento após números
    cleaned = cleaned.replace(/(\d+\.)\s*⁠\s*⁠/g, '$1 ');
    
    // Separar os itens da lista que estão juntos
    cleaned = cleaned.replace(/(\d+\.\s*[^:]+:\s*[^.]+\.)\s*(\d+\.)/g, '$1\n$2');
    
    // Adicionar quebras de linha após cada item da lista
    cleaned = cleaned.replace(/(\d+\.\s*[^:]+:\s*[^.]+\.)/g, '$1\n');
    
    // Normalizar quebras de linha (máximo 2 quebras consecutivas)
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    // Garantir que o título tenha quebra de linha adequada
    cleaned = cleaned.replace(/(CardioPrime oferece os seguintes exames:)/, '$1\n');
    
    // Garantir que a conclusão tenha quebra de linha adequada
    cleaned = cleaned.replace(/(Esses exames são essenciais)/, '\n$1');
    
    // Garantir que a ação tenha quebra de linha adequada
    cleaned = cleaned.replace(/(Caso tenha interesse)/, '\n$1');
    
    // Remover quebras de linha extras no final
    cleaned = cleaned.replace(/\n+$/, '');
    
    return cleaned.trim();
  },

  // Corrige formatação de profissionais de forma mais precisa
  fixProfissionaisFormat: (text) => {
    // Primeiro, limpar caracteres especiais
    let cleaned = text.replace(/[⁠]/g, '');
    
    // Corrigir quebras de linha incorretas nos nomes
    cleaned = cleaned.replace(/\*\s*\n\s*([^*]+)\*/g, '*$1*');
    
    // Separar os itens da lista que estão juntos
    cleaned = cleaned.replace(/(\d+\.\s*\*[^*]+\*[^.]*\.)\s*(\d+\.)/g, '$1\n\n$2');
    
    // Adicionar quebras de linha após cada item da lista
    cleaned = cleaned.replace(/(\d+\.\s*\*[^*]+\*[^.]*\.)/g, '$1\n');
    
    // Normalizar quebras de linha (máximo 2 quebras consecutivas)
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    // Garantir que o título tenha quebra de linha adequada
    cleaned = cleaned.replace(/(contamos com dois profissionais especializados em cardiologia:)/, '$1\n');
    
    // Garantir que a conclusão tenha quebra de linha adequada
    cleaned = cleaned.replace(/(Ambos estão disponíveis)/, '\n$1');
    
    // Garantir que a ação tenha quebra de linha adequada
    cleaned = cleaned.replace(/(Se precisar agendar)/, '\n$1');
    
    // Remover quebras de linha extras no final
    cleaned = cleaned.replace(/\n+$/, '');
    
    return cleaned.trim();
  },

  // Corrige formatação geral de qualquer mensagem
  fixGeneralFormat: (text) => {
    return text
      // Remove caracteres especiais problemáticos
      .replace(/[⁠]/g, '')
      // Remove espaços múltiplos
      .replace(/\s+/g, ' ')
      // Normaliza quebras de linha (máximo 2 consecutivas)
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
};

// ========================================
// EXEMPLOS DE USO
// ========================================

export const usageExamples = {
  // Exemplo 1: Usar mensagens pré-formatadas
  exemplo1: () => {
    console.log('=== MENSAGEM DE EXAMES ===');
    console.log(CARDIOPRIME_MESSAGES.formatExamesMessage());
    
    console.log('\n=== MENSAGEM DE PROFISSIONAIS ===');
    console.log(CARDIOPRIME_MESSAGES.formatProfissionaisMessage());
  },

  // Exemplo 2: Corrigir mensagens existentes
  exemplo2: () => {
    console.log('=== CORRIGINDO MENSAGEM DE EXAMES ===');
    const mensagemCorrigida = fixMessageFormatting.fixExamesFormat(MESSAGE_EXAMPLES.exames_atual);
    console.log('ANTES:', MESSAGE_EXAMPLES.exames_atual);
    console.log('DEPOIS:', mensagemCorrigida);
    
    console.log('\n=== CORRIGINDO MENSAGEM DE PROFISSIONAIS ===');
    const profCorrigida = fixMessageFormatting.fixProfissionaisFormat(MESSAGE_EXAMPLES.profissionais_atual);
    console.log('ANTES:', MESSAGE_EXAMPLES.profissionais_atual);
    console.log('DEPOIS:', profCorrigida);
  },

  // Exemplo 3: Formatação personalizada
  exemplo3: () => {
    const exames = [
      'Ecocardiograma Transtorácico: Ultrassom do coração',
      'Teste Ergométrico: Teste de esforço cardíaco',
      'Holter 24h: Monitorização contínua'
    ];
    
    const listaFormatada = formatMessage.formatNumberedList(exames);
    console.log('=== LISTA FORMATADA ===');
    console.log(listaFormatada);
  }
};

export default MESSAGE_EXAMPLES;
