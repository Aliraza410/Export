require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const email = 'admin@fyp.com';
  const newPassword = 'password123';
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  try {
    const res = await pool.query('UPDATE "User" SET password = $1 WHERE email = $2', [hashedPassword, email]);
    if (res.rowCount > 0) {
      console.log(`Password for ${email} has been reset to: ${newPassword}`);
    } else {
      console.log(`User ${email} not found.`);
    }
  } catch (err) {
    console.error('Error updating password:', err.message);
  } finally {
    pool.end();
  }
}

main();
