// server.js
const express = require('express');
const searchRoutes = require('./routes/searchRoutes');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());
// Consider adding CORS middleware if needed
// const cors = require('cors');
// app.use(cors());

// Routes
app.use('/', searchRoutes);

// Basic Root Route
app.get('/', (req, res) => {
    res.send('Live Search Backend API is running!');
});

// Start Server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});