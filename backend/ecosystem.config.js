const fs = require('fs');
const path = require('path');
 
// Path ke C:\laragon\etc\ssl\
const sslBasePath = 'C:\\laragon\\etc\\ssl';
 

//const key = fs.readFileSync(path.join(sslBasePath, 'mnst.thinking.my.id.key'));
//const cert = fs.readFileSync(path.join(sslBasePath, 'mnst.thinking.my.id.crt'));
 

module.exports = {
  apps: [{
    name: 'urlz-prod',
    script: './public/dist/index.js',
    cwd: __dirname,
    env: {
      NODE_ENV: 'production',
      PORT: 8001,
      HTTPS_KEY: key.toString(),
      HTTPS_CERT: cert.toString(),      API_PREFIX: '/api18url',
      DATABASE_URL: 'postgresql://postgres.hnvcbgefezpyjmpyurhb:q_a5muBbWJem4y5@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1',
      JWT_SECRET: '867453b8033e27e32a867e708ac1b6a591d2dbcf9fe12bfa1ace56a2da1b0c50',
      JWT_EXPIRES_IN: '7d',
      CORS_ORIGINS: '*',
      MAX_FILE_SIZE: '2485760',
      UPLOAD_DIR: './uploads'
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