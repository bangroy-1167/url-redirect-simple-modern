module.exports = {
  apps: [{
    name: 'app2-urlref',
    script: './dist/index.js',
    cwd: __dirname,
    env: {
      NODE_ENV: 'production',
      PORT: 38802,
      API_PREFIX: '',
      DATABASE_URL: 'mysql://root:password234@localhost:3306/thin1722_urlsRF',
      DATABASE_HOST: 'localhost',
      DATABASE_PORT: 3306,
      DATABASE_NAME: 'thin1722_urlsRF',
      DATABASE_USER: 'root',
      DATABASE_PASSWORD: 'password234',
      JWT_SECRET: 'change-randomthis-to-a-strong--secret-key',
      JWT_EXPIRES_IN: '1d',
      JWT_REFRESH_EXPIRES_IN: '7d',
      RATE_LIMIT_PUBLIC: 200,
      RATE_LIMIT_AUTH: 500,
      CORS_ORIGINS: '*'
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    autorestart: true,
    error_file: './logs/err.log',
    out_file: './logs/out.log'
  }]
};
