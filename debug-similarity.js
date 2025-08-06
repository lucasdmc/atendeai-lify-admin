import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

function calculateSimilarity(str1, str2) {
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;
  
  // Dividir em palavras
  const words1 = new Set(str1.split(/\s+/));
  const words2 = new Set(str2.split(/\s+/));
  
  // Filtrar palavras muito comuns que não indicam duplicação
  const commonWords = new Set(['a', 'o', 'e', 'de', 'da', 'do', 'em', 'para', 'com', 'que', 'se', 'não', 'é', 'são', 'tem', 'está', 'pode', 'posso', 'te', 'você', 'nossa', 'nossos', 'sua', 'seus']);
  
  const filteredWords1 = new Set([...words1].filter(word => !commonWords.has(word.toLowerCase())));
  const filteredWords2 = new Set([...words2].filter(word => !commonWords.has(word.toLowerCase())));
  
  // Se após filtrar não há palavras significativas, usar comparação original
  if (filteredWords1.size === 0 && filteredWords2.size === 0) {
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  }
  
  // Calcular interseção e união das palavras filtradas
  const intersection = new Set([...filteredWords1].filter(x => filteredWords2.has(x)));
  const union = new Set([...filteredWords1, ...filteredWords2]);
  
  return intersection.size / union.size;
}

function debugSimilarity() {
  console.log('🔍 DEBUG: Análise de similaridade entre frases');
  
  // Teste com frases do exemplo
  const phrases = [
    "A CardioPrime é uma clínica especializada em cardiologia",
    "A CardioPrime oferece serviços de qualidade", 
    "A CardioPrime está localizada em Blumenau",
    "A CardioPrime tem equipamentos modernos"
  ];
  
  console.log('\n📝 Frases para análise:');
  phrases.forEach((phrase, index) => {
    console.log(`${index + 1}. "${phrase}"`);
  });
  
  console.log('\n🔍 Matriz de similaridade:');
  console.log('='.repeat(80));
  
  for (let i = 0; i < phrases.length; i++) {
    for (let j = 0; j < phrases.length; j++) {
      const similarity = calculateSimilarity(phrases[i].toLowerCase(), phrases[j].toLowerCase());
      console.log(`${i+1}x${j+1}: ${similarity.toFixed(3)}`);
    }
    console.log('');
  }
  
  // Testar com frases similares
  console.log('\n📝 Teste com frases similares:');
  const similarPhrases = [
    "Posso te ajudar com informações sobre nossos serviços",
    "Posso te ajudar com agendamentos", 
    "Posso te ajudar com dúvidas sobre exames"
  ];
  
  console.log('\n🔍 Matriz de similaridade para frases similares:');
  console.log('='.repeat(80));
  
  for (let i = 0; i < similarPhrases.length; i++) {
    for (let j = 0; j < similarPhrases.length; j++) {
      const similarity = calculateSimilarity(similarPhrases[i].toLowerCase(), similarPhrases[j].toLowerCase());
      console.log(`${i+1}x${j+1}: ${similarity.toFixed(3)}`);
    }
    console.log('');
  }
  
  // Testar com frases realmente duplicadas
  console.log('\n📝 Teste com frases realmente duplicadas:');
  const duplicatePhrases = [
    "Olá! Sou o Cardio, assistente virtual da CardioPrime. Como posso ajudá-lo hoje?",
    "Olá! Sou o Cardio, assistente virtual da CardioPrime. Em que posso ajudar você hoje?"
  ];
  
  console.log('\n🔍 Matriz de similaridade para frases duplicadas:');
  console.log('='.repeat(80));
  
  for (let i = 0; i < duplicatePhrases.length; i++) {
    for (let j = 0; j < duplicatePhrases.length; j++) {
      const similarity = calculateSimilarity(duplicatePhrases[i].toLowerCase(), duplicatePhrases[j].toLowerCase());
      console.log(`${i+1}x${j+1}: ${similarity.toFixed(3)}`);
    }
    console.log('');
  }
}

// Executar debug
debugSimilarity();
console.log('\n✅ Debug concluído!'); 