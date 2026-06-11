const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { signToken } = require('../utils/jwt'); 

// CREATE A ROUTER
const router = express.Router();

// POST /register  ENDPOINT :  Mounted at '/api/auth',  handles: POST /api/auth/register
router.post('/register', async (req, res) => {

//   - "req" parameter (request):
//     Contains everything about the incoming HTTP request:
//       req.body     = parsed JSON body (like @RequestBody in Spring)
//       req.params   = URL path parameters (like @PathVariable)
//       req.query    = query string params (like @RequestParam)
//       req.headers  = HTTP headers
//
//   - "res" parameter (response):
//     Object used to send the HTTP response back to the client:
//       res.status(201)  = set HTTP status code
//       res.json({...})  = send JSON response body
//       res.send('text') = send plain text
  try {
    const { email, password, storage_type } = req.body;

    // VALIDATION
    const missingFields = [];

    if (!email) missingFields.push('email');
    if (!password) missingFields.push('password');
    if (!storage_type) missingFields.push('storage_type');
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Email format is invalid. Expected format: local-part@domain'
      });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        error: 'Password must be between 8 and 72 characters'
      });
    }

    const validStorageTypes = ['file', 'mongodb'];

    if (!validStorageTypes.includes(storage_type)) {
      return res.status(400).json({
        error: `Invalid storage_type. Must be one of: ${validStorageTypes.join(', ')}`
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(409).json({
        error: 'Email is already registered'
      });
    }
    // --- Hash the password ---
    const saltRounds = 10;    // ↑ "Salt rounds" (also called "cost factor") controls how slow bcrypt is.
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    // ↑ bcrypt.hash(plaintext, rounds) — hashes the password with a random salt.
    //   It returns a Promise (because hashing is CPU-intensive and Node.js does it
    //   in a background thread to avoid blocking the event loop).

    // --- Create user in MongoDB ---
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      storage_type: storage_type,
      role: 'user'
    });

    // --- Return success response ---  // ↑ HTTP 201 Created — standard response for successful resource creation.
    res.status(201).json({
      email: user.email,
      storage_type: user.storage_type,
      role: user.role
    });
   
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    // VALIDATION
    const missingFields = [];  // Accumulate errors (like BindingResult)
    if (!email) missingFields.push('email');
    if (!password) missingFields.push('password');
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // FIND USER — Database Lookup
    // Mongoose's findOne() returns a Promise that resolves to the document
    // or null if not found. `await` pauses until the DB responds.
    // In Mongoose: findOne returns ONE document matching the filter, or null.

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);    // bcrypt.compare(plaintext, hash) → Promise<boolean> `await` because bcrypt hashing is CPU-intensive and runs in a

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials' 
      });
    }

    // GENERATE JWT — Authentication successful, issue a token
    const token = signToken({
      email: user.email,         // Who this token belongs to (like JWT "sub" claim)
      storage_type: user.storage_type,  // Custom claim: which DB to use for this user's data
      role: user.role            // Authorization level (like GrantedAuthority in Spring)
    });
    // The library automatically adds:
    //   iat (issued at)  — Unix timestamp of token creation
    //   exp (expires at) — Unix timestamp when token becomes invalid

    res.json({ token });    // { token } is shorthand for { token: token } — "shorthand property name"
  } catch (error) {
    // In Express, if you DON'T catch errors in async route handlers,
    // the error silently disappears and the client gets no response (hangs).
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;