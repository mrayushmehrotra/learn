const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config({path: "./.env.example"});

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI

mongoose.connect(MONGODB_URI, {
  
})
.then(() => console.log('MongoDB connected successfully.'))
.catch(err => console.error('MongoDB connection error:', err));


// API Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/claim', require('./routes/claim'));
app.use('/api/history', require('./routes/history'));
app.use('/api/leaderboard', require('./routes/leaderboard'));


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
