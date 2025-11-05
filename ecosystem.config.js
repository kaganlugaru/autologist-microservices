module.exports = {
  apps: [
    {
      name: 'autologist-backend',
      script: './backend/server.js',
      cwd: '/opt/autologist-microservices',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    },
    {
      name: 'telegram-parser',
      script: './telegram-parser/venv/bin/python',
      args: './telegram-parser/telegram_parser.py',
      cwd: '/opt/autologist-microservices',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: './logs/parser-error.log',
      out_file: './logs/parser-out.log',
      log_file: './logs/parser-combined.log',
      time: true,
      env: {
        PYTHONPATH: '/opt/autologist-microservices/telegram-parser',
        PYTHONUNBUFFERED: '1'
      }
    }
  ]
}