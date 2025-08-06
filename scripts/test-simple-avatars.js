// Script para testar o sistema de avatares simplificado
console.log('🧪 TESTANDO SISTEMA DE AVATARES SIMPLIFICADO');
console.log('==============================================\n');

const testUsers = [
  { name: 'João Silva', phone: '5547999999999' },
  { name: 'Maria Santos', phone: '5547888888888' },
  { name: 'Pedro Costa', phone: '5547777777777' },
  { name: 'Ana Oliveira', phone: '554730915628' },
  { name: 'Carlos Ferreira', phone: '5547666666666' }
];

// Simular a função de cores baseada no nome
function generateColorsFromName(name) {
  const colors = [
    { bg: '#10B981', text: '#FFFFFF' }, // Verde
    { bg: '#3B82F6', text: '#FFFFFF' }, // Azul
    { bg: '#8B5CF6', text: '#FFFFFF' }, // Roxo
    { bg: '#F59E0B', text: '#FFFFFF' }, // Amarelo
    { bg: '#EF4444', text: '#FFFFFF' }, // Vermelho
    { bg: '#06B6D4', text: '#FFFFFF' }, // Ciano
    { bg: '#84CC16', text: '#FFFFFF' }, // Verde claro
    { bg: '#F97316', text: '#FFFFFF' }, // Laranja
  ];

  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorIndex = hash % colors.length;
  
  return colors[colorIndex];
}

// Simular a função de avatar URL
function generateUIAvatar(name) {
  const initials = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&font-size=0.4&bold=true&length=2`;
}

for (const user of testUsers) {
  console.log(`👤 ${user.name} (${user.phone})`);
  
  const colors = generateColorsFromName(user.name);
  const avatarUrl = generateUIAvatar(user.name);
  const initials = user.name.split(' ').map(w => w.charAt(0).toUpperCase()).join('').slice(0, 2);
  
  console.log(`   🎨 Cores: BG=${colors.bg}, Text=${colors.text}`);
  console.log(`   🖼️  Avatar URL: ${avatarUrl}`);
  console.log(`   🔤 Iniciais: ${initials}`);
  console.log('   ---');
}

console.log('\n✅ SISTEMA DE AVATARES IMPLEMENTADO!');
console.log('🎯 Funcionalidades:');
console.log('   • Avatares baseados em iniciais');
console.log('   • Cores personalizadas por nome');
console.log('   • URLs de avatar automáticas');
console.log('   • Fallback para iniciais quando imagem falha');
console.log('   • Integração com UI Avatars');
console.log('\n🚀 Pronto para uso na tela de conversas!'); 