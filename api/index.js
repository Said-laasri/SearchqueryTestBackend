require('dotenv').config();
const express = require('express');
const searchRoute = require('../routes/search');
const db = require('../db/index');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use('/api/search', searchRoute);

(async () => {
  const isConnected = await db.checkConnection();
  if (!isConnected) {
    console.error('❌ Could not connect to database. Exiting...');
    process.exit(1);
  } else {
    console.log('✅ Database connected successfully!');
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
})();
