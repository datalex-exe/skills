// server.js – express server serving APIs and frontend static files
const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

// Initialize Database connection and auto table setup
require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Determine the correct frontend directory path (handling both lowercase and uppercase variations due to Git casing behavior on Windows/Linux)
const fs = require('fs');
let frontendDir = path.join(__dirname, '..', 'frontend');
if (!fs.existsSync(frontendDir)) {
  const uppercaseDir = path.join(__dirname, '..', 'FRONTEND');
  if (fs.existsSync(uppercaseDir)) {
    frontendDir = uppercaseDir;
  }
}

// Serve CSS files from CSS directory
app.use('/css', express.static(path.join(frontendDir, 'css')));
// Serve JS files from JS directory
app.use('/js', express.static(path.join(frontendDir, 'js')));

// API Routes
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

// Serve HTML files from HTML directory
app.use(express.static(path.join(frontendDir, 'html')));

// Fallback to index.html for any unknown routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDir, 'html', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`================================================`);
  console.log(`🚀 Skill-for-Skill Server is running!`);
  console.log(`🔗 Local Server: http://localhost:${PORT}`);
  console.log(`================================================`);
});
