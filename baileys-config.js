// Configuração específica para Baileys
module.exports = {
  // Configurações do Baileys
  baileys: {
    version: 'latest',
    browser: ['Chrome (Linux)', '', ''],
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 120000,
    keepAliveIntervalMs: 10000,
    emitOwnEvents: true,
    fireInitQueries: false,
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
    markOnlineOnConnect: true
  },
  
  // Configurações do servidor
  server: {
    port: process.env.PORT || 3001,
    host: '0.0.0.0',
    cors: {
      origin: [
        'https://atendeai.lify.com.br',
        'https://www.atendeai.lify.com.br',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:8080'
      ],
      credentials: true
    }
  },
  
  // Configurações do Supabase
  supabase: {
    url: 'https://niakqdolcdwxtrkbqmdi.supabase.co',
    key: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw'
  }
};
