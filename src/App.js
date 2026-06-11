const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const connectDB = require('./config/database');
const authRouter = require('./routes/auth');
const authMiddleware = require('./middleware/auth'); // Our JWT filter from 5.1


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

// MOUNTING A ROUTER — app.use('/api/auth', authRouter)
app.use('/api/auth', authRouter);

// PROTECTED ROUTE — Requires valid JWT token
// *** THIS DEMONSTRATES HOW MIDDLEWARE IS APPLIED PER-ROUTE ***
// Syntax: app.get(path, middleware1, middleware2, ..., routeHandler)
// Express processes them LEFT TO RIGHT:
//   1. authMiddleware runs first (validates JWT)
//   2. If authMiddleware calls next(), the route handler runs
//   3. If authMiddleware does NOT call next(), the route handler is SKIPPED
//
// WAYS TO APPLY MIDDLEWARE IN EXPRESS (3 patterns):
//
//   1. PER-ROUTE (shown here):
//      app.get('/path', authMiddleware, handler)
//      → Only this one route is protected
//
//   2. PER-ROUTER PREFIX (protects all routes under a path):
//      app.use('/api/items', authMiddleware, itemsRouter)
//      → Every route in itemsRouter requires auth
//      → Spring equivalent: .requestMatchers("/api/items/**").authenticated()
//
//   3. GLOBAL (protects everything AFTER this line):
//      app.use(authMiddleware)  // all routes defined BELOW this line need auth
//      → Spring equivalent: .anyRequest().authenticated()
//
// We're using pattern #1 here for a test route.
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/test-auth', authMiddleware, (req, res) => {
  // If we reach here, authMiddleware already verified the token
  // and set req.user. This is guaranteed because authMiddleware
  // only calls next() on success.
  //
  // req.user is available here because authMiddleware attached it.
  // Spring equivalent: @AuthenticationPrincipal UserDetails user
  // or SecurityContextHolder.getContext().getAuthentication().getPrincipal()
  res.json({
    message: 'You are authenticated!',
    user: req.user   // { email, storage_type, role } — set by authMiddleware
  });
});


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