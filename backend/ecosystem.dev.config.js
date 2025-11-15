module.exports = {
  apps: [
    {
      name: "aubrigo-backend-dev",
      script: "./dist/main.js",
      cwd: "/var/www/aubrigo-dev/current/backend",
      instances: 1,
      exec_mode: "fork",
      // Environment variables are loaded from .env file by NestJS ConfigModule
      // No need to hardcode secrets here - they come from deployment script
      error_file: "./logs/error.log",
      out_file: "./logs/output.log",
      log_file: "./logs/combined.log",
      time: true,
      max_memory_restart: "500M",
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
    },
  ],
};
