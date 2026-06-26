require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

pool.query('SELECT count(*) FROM "User"').then(res => {
  console.log('USER COUNT FROM PG:', res.rows[0]);
  pool.end();
}).catch(err => {
  console.error(err);
  pool.end();
});
