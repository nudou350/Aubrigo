module.exports = {
  apps: [
    {
      name: process.env.PM2_APP_NAME || 'aubrigo-backend',
      script: './dist/main.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: process.env.NODE_ENV || 'production',
        PORT: process.env.PORT || 3002,
      },
      error_file: './logs/error.log',
      out_file: './logs/output.log',
      log_file: './logs/combined.log',
      time: true,
      max_memory_restart: '500M',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};
