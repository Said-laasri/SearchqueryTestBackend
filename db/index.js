const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});


module.exports = {
  query: (text, params) => pool.query(text, params),

  checkConnection: async () => {
    try {
      await pool.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database connection failed:', error.message);
      return false;
    }
  }
};
