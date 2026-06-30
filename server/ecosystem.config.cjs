const path = require("path");

module.exports = {
  apps: [
    {
      name: "facturabot-mx",
      script: "node_modules/.bin/tsx",
      args: "src/app.ts",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      restart_delay: 3000,
      max_restarts: 50,
      min_uptime: "10s",
      max_memory_restart: "500M",
      watch: false,
      kill_timeout: 10000,
      out_file: path.join(__dirname, "logs", "out.log"),
      error_file: path.join(__dirname, "logs", "error.log"),
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      merge_logs: true,
    },
  ],
};
