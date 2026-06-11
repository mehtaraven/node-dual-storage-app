const { verifyToken } = require('../utils/jwt');


const authMiddleware = (req, res, next) => {
const authHeader = req.headers.authorization;
 if (!authHeader) {
    return res.status(401).json({
      error: 'Authentication required'
    });
    // ⚠️ next() is NOT called here — request pipeline STOPS
    // This is like NOT calling filterChain.doFilter() in Spring
  }
  
    if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Invalid authorization format. Expected: Bearer <token>'
    });
    // ⚠️ Again, next() is NOT called — pipeline stops here
  }

  // How it works:
  //   Input:  "Bearer eyJhbGciOiJIUzI1NiJ9.payload.signature"
  //   split(' ') produces: ["Bearer", "eyJhbGciOiJIUzI1NiJ9.payload.signature"]
  //   [1] gets index 1:   "eyJhbGciOiJIUzI1NiJ9.payload.signature"
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Invalid authorization format. Token is empty.'
    });
  }
  // STEP 6: Verify the JWT token (signature + expiration)
  try {
    const decoded = verifyToken(token);
    // STEP 7: Validate that required claims exist in the payload
    // Even if the token is cryptographically valid, we need to ensure it
    // contains the claims our application expects. A token might be valid
    // but issued for a different purpose/service.
    if (!decoded.email || !decoded.storage_type || !decoded.role) {
      return res.status(401).json({
        error: 'Invalid token. Missing required claims.'
      });
    }
    // STEP 8: Attach the user context to the request object
    // THIS IS THE KEY STEP — equivalent to setting the SecurityContext!
    // In Express, there's no SecurityContext or ThreadLocal magic. Instead,
    // we simply ADD a property to the request object. JavaScript objects are
    // dynamic — you can add properties at any time (no class definition needed!).
    //
    //   req.user = { ... }
    //
    // This is like saying: "Hey request object, you now have a 'user' field."
    // Any middleware or route handler that runs AFTER this one can access
    // req.user to get the authenticated user's info.
    req.user = {
      email: decoded.email,           // Like principal.getName()
      storage_type: decoded.storage_type,  // Custom claim
      role: decoded.role              // Like GrantedAuthority
    };
    // STEP 9: Call next() — CONTINUE the pipeline
    // THIS IS THE MOST IMPORTANT LINE!
    // next() is EXACTLY like filterChain.doFilter(request, response) in Spring.
    // What happens when you call next():
    //   → Express moves to the NEXT middleware or route handler in line
    //   → The route handler can now access req.user (we just set it above)
    //   → If there's no next handler, Express ends the request
    //
    // What happens when you DON'T call next():
    //   → The request STOPS here
    //   → The route handler NEVER executes
    //   → This is why all our error responses above use `return` without next()
    //
    // CRITICAL MENTAL MODEL:
    //   • Calling next()           = filterChain.doFilter(req, res)  → let it through
    //   • NOT calling next()       = don't call doFilter()           → block it
    //   • return res.status(401)   = response.sendError(401)         → send error
    next();

  } catch (error) {
    return res.status(401).json({
      error: 'Invalid token'
    });
  }
};

module.exports = authMiddleware;