// ========================================
// CONFIGURAÇÃO PM2 PARA PRODUÇÃO
// ========================================

module.exports = {
  apps: [
    {
      name: 'atendeai-frontend',
      script: 'npm',
      args: 'start',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NODE_OPTIONS: '--max-old-space-size=2048'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true
    },
    {
      name: 'atendeai-backend',
      script: 'npm',
      args: 'start',
      cwd: '../atendeai-lify-backend',
      instances: 2,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        NODE_OPTIONS: '--max-old-space-size=4096'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    },
    {
      name: 'atendeai-ai-worker',
      script: 'npm',
      args: 'run worker',
      cwd: '../atendeai-lify-backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        NODE_OPTIONS: '--max-old-space-size=2048'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      error_file: './logs/ai-worker-error.log',
      out_file: './logs/ai-worker-out.log',
      log_file: './logs/ai-worker-combined.log',
      time: true
    }
  ],

  deploy: {
    production: {
      user: 'ubuntu',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/atendeai-lify-admin.git',
      path: '/var/www/atendeai-lify-admin',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
}; 