// PM2 process file. Run with: pm2 start ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'adversarydata',
      cwd: '/var/www/adversarydata',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 4011',
      env: {
        NODE_ENV: 'production',
        PORT: '4011',
      },
      // Resource & logging
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      autorestart: true,
      out_file: '/var/log/adversarydata/out.log',
      error_file: '/var/log/adversarydata/err.log',
      time: true,
      // Don't try to read .env here; the systemd/PM2 environment owns it.
    },
  ],
};
