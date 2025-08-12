export function normalizeMessage(text) {
  if (!text || typeof text !== 'string') return text;
  let cleaned = text;

  // Remover caracteres invisíveis problemáticos
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF\u2060]/g, '');

  // Normalizar títulos adicionando quebra dupla após dois-pontos em frases de seção comuns
  cleaned = cleaned.replace(/(médicos?:|profissionais?:|exames?:)/gi, '$1\n\n');

  // Colapsar múltiplas quebras de linha para no máximo duas
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Corrigir listas numeradas que ficaram coladas
  cleaned = cleaned.replace(/(\d+\.)\s*(?=\S)/g, '$1 ');

  // Inserir quebra entre itens consecutivos de lista numerada
  cleaned = cleaned.replace(/(\d+\.\s[^\n]+)(\s*)(?=\d+\.\s)/g, '$1\n');

  // Remover espaços duplicados
  cleaned = cleaned.replace(/[ ]{2,}/g, ' ');

  // Trim final e normalização de finais
  cleaned = cleaned.replace(/\n+$/, '').trim();
  cleaned = cleaned.replace(/\n\s*\n/g, '\n\n');

  return cleaned;
}
