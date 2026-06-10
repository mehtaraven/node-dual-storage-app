const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const connectDB = require('./config/database');
const authRouter = require('./routes/auth');

// Load environment variables from .env file
dotenv.config();

// Create Express application
const app = express();

// Middleware
app.use(cors());                    // Allow cross-origin requests (for React frontend)
app.use(express.json());            // Parse JSON request bodies

// Health check route — verify server is running
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
});

app.use('/api/auth', authRouter);

// Start the server
const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
//   console.log(`Health check: http://localhost:${PORT}/api/health`);
// });



const startServer = async () => {
  // Step 1: Connect to MongoDB (waits until connection succeeds or crashes)
  await connectDB();
  
  // Step 2: ONLY after DB is ready, start accepting HTTP requests
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

// Call the async function to kick everything off
// This is the actual "main()" equivalent
startServer();

module.exports = app;