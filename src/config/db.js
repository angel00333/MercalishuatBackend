const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  ssl:
    process.env.NODE_ENV === 'production'
      ? {
          rejectUnauthorized: false,
        }
      : false,
});

pool.on('connect', () => {
  console.log('PostgreSQL conectado');
});

pool.on('error', (error) => {
  console.error(
    'Error inesperado en PostgreSQL:',
    error
  );
});

module.exports = pool;