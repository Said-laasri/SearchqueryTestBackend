require('dotenv').config();
const express = require('express');
const searchRoute = require('../routes/search');
const db = require('../db/index');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000; // Railway will provide PORT

app.use(cors());
app.use('/api/search', searchRoute);

(async () => {
  const isConnected = await db.checkConnection();
  if (!isConnected) {
    console.error('❌ Could not connect to database. Exiting...');
    // In a standard server environment, exiting on database connection failure is reasonable
    process.exit(1);
  } else {
    console.log('✅ Database connected successfully!');
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
})();

module.exports = app; // Export the Express app directly for Railway