const express = require('express');
const cors = require('cors');
const path = require('path');
const huffmanRoutes = require('./routes/huffman');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/huffman', huffmanRoutes);

// Serve static files from client
app.use(express.static(path.join(__dirname, '../client')));


// Handle client-side routing
app.get('/*path', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});