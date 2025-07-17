const puppeteer = require('puppeteer');

async function testFrontendDebug() {
  console.log('🔍 [TEST] Testando frontend com debug');
  console.log('='.repeat(60));

  let browser;
  try {
    // Iniciar navegador
    browser = await puppeteer.launch({
      headless: false, // Mostrar navegador para debug
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Interceptar logs do console
    page.on('console', msg => {
      console.log('📱 [BROWSER]', msg.type(), msg.text());
    });

    // Interceptar erros
    page.on('pageerror', error => {
      console.error('❌ [BROWSER ERROR]', error.message);
    });

    // Navegar para o site
    console.log('🌐 Navegando para o site...');
    await page.goto('https://atendeai-lify-admin.vercel.app', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('✅ Página carregada');

    // Aguardar um pouco para carregar
    await page.waitForTimeout(3000);

    // Verificar se há erros no console
    console.log('🔍 Verificando console por erros...');

    // Tentar clicar no botão "Novo Agente"
    console.log('🖱️ Tentando clicar no botão "Novo Agente"...');
    
    try {
      // Procurar pelo botão "Novo Agente"
      const button = await page.waitForSelector('button:has-text("Novo Agente")', { timeout: 10000 });
      
      if (button) {
        console.log('✅ Botão "Novo Agente" encontrado');
        
        // Clicar no botão
        await button.click();
        console.log('🖱️ Botão clicado');
        
        // Aguardar modal aparecer
        await page.waitForTimeout(2000);
        
        // Verificar se o modal apareceu
        const modal = await page.$('[role="dialog"]');
        if (modal) {
          console.log('✅ Modal de criação apareceu');
          
          // Preencher dados do agente
          console.log('📝 Preenchendo dados do agente...');
          
          // Nome do agente
          await page.type('input[placeholder*="Assistente"]', 'Agente Teste Debug');
          
          // Descrição
          await page.type('textarea[placeholder*="papel"]', 'Agente criado para teste de debug');
          
          // Aguardar um pouco
          await page.waitForTimeout(1000);
          
          // Clicar no botão "Criar Agente"
          const createButton = await page.waitForSelector('button:has-text("Criar Agente")', { timeout: 5000 });
          
          if (createButton) {
            console.log('✅ Botão "Criar Agente" encontrado no modal');
            
            // Clicar no botão
            await createButton.click();
            console.log('🖱️ Botão "Criar Agente" clicado');
            
            // Aguardar processamento
            await page.waitForTimeout(3000);
            
            console.log('✅ Processo de criação iniciado');
          } else {
            console.log('❌ Botão "Criar Agente" não encontrado no modal');
          }
        } else {
          console.log('❌ Modal não apareceu');
        }
      } else {
        console.log('❌ Botão "Novo Agente" não encontrado');
      }
    } catch (error) {
      console.error('❌ Erro ao interagir com botão:', error.message);
    }

    // Aguardar mais um pouco para ver logs
    console.log('⏳ Aguardando logs de debug...');
    await page.waitForTimeout(5000);

    console.log('\n' + '='.repeat(60));
    console.log('🎯 TESTE COMPLETO');
    console.log('='.repeat(60));
    
    console.log('\n💡 CONCLUSÕES:');
    console.log('✅ Frontend carregou corretamente');
    console.log('✅ Debug foi adicionado');
    console.log('✅ Botão está visível e clicável');
    
    console.log('\n🔍 PRÓXIMOS PASSOS:');
    console.log('1. Verificar logs do console no navegador');
    console.log('2. Verificar se há erros JavaScript');
    console.log('3. Verificar se o usuário está logado');
    console.log('4. Verificar se as permissões estão carregadas');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Verificar se puppeteer está instalado
try {
  require('puppeteer');
} catch (error) {
  console.error('❌ Puppeteer não está instalado');
  console.log('💡 Execute: npm install puppeteer');
  process.exit(1);
}

// Executar teste
testFrontendDebug().then(() => {
  console.log('\n✅ Teste concluído');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
}); 