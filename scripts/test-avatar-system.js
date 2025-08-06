import { getAvatarUrl, generateColorsFromName, generateUIAvatar, generateDiceBearAvatar } from '../src/utils/avatarUtils.js';

async function testAvatarSystem() {
  console.log('🧪 Testando sistema de avatares...\n');

  const testUsers = [
    { name: 'João Silva', phone: '5547999999999', email: 'joao.silva@email.com' },
    { name: 'Maria Santos', phone: '5547888888888', email: 'maria.santos@email.com' },
    { name: 'Pedro Costa', phone: '5547777777777', email: 'pedro.costa@email.com' },
    { name: 'Ana Oliveira', phone: '554730915628', email: 'ana.oliveira@email.com' },
    { name: 'Carlos Ferreira', phone: '5547666666666', email: 'carlos.ferreira@email.com' }
  ];

  for (const user of testUsers) {
    console.log(`👤 Testando avatar para: ${user.name}`);
    
    try {
      // Testar função principal
      const avatarUrl = getAvatarUrl({
        name: user.name,
        phone: user.phone,
        email: user.email,
        size: 200
      });
      
      console.log(`✅ Avatar URL: ${avatarUrl}`);
      
      // Testar cores personalizadas
      const colors = generateColorsFromName(user.name);
      console.log(`🎨 Cores: BG=${colors.backgroundColor}, Text=${colors.textColor}`);
      
      // Testar UI Avatars
      const uiAvatarUrl = generateUIAvatar({
        name: user.name,
        size: 200
      });
      console.log(`🖼️  UI Avatar: ${uiAvatarUrl}`);
      
      // Testar DiceBear
      const diceBearUrl = generateDiceBearAvatar({
        name: user.name,
        size: 200
      });
      console.log(`🎲 DiceBear: ${diceBearUrl}`);
      
      console.log('---');
      
    } catch (error) {
      console.error(`❌ Erro para ${user.name}:`, error.message);
    }
  }

  console.log('\n✅ Teste do sistema de avatares concluído!');
  console.log('🎯 Agora os avatares aparecerão com cores personalizadas baseadas no nome.');
}

testAvatarSystem(); 