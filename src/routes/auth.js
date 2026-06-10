// ═══════════════════════════════════════════════════════════════════════
// IMPORTS (require statements)
// ═══════════════════════════════════════════════════════════════════════
// 
// In Java, you use: import com.example.package.ClassName;
// In Node.js, you use: const Something = require('module-name');
//
// Key difference: Java imports are resolved at compile-time by the JVM.
// Node.js require() is a FUNCTION that runs at runtime and returns whatever
// the target file exported via module.exports.
// ═══════════════════════════════════════════════════════════════════════

const express = require('express');
// ↑ Imports the Express framework.
//   express is an object with methods like .Router(), .json(), etc.
//   Spring equivalent: This is like having Spring MVC on the classpath —
//   it gives you the ability to define routes and handle HTTP requests.

const bcrypt = require('bcrypt');
// ↑ Imports the bcrypt password-hashing library.
//   Spring equivalent: BCryptPasswordEncoder from Spring Security.
//   We'll use bcrypt.hash() to encode and bcrypt.compare() to verify.

const User = require('../models/User');
// ↑ Imports the Mongoose User model we created in Phase 2.
//   "../" means "go up one directory" (from routes/ to src/, then into models/).
//   This gives us methods like User.create(), User.findOne(), etc.
//   Spring equivalent: Autowiring a JpaRepository<User, String> into your controller.
//   In Java you'd do: @Autowired private UserRepository userRepository;


// ═══════════════════════════════════════════════════════════════════════
// CREATE A ROUTER
// ═══════════════════════════════════════════════════════════════════════
const router = express.Router();
// ↑ express.Router() creates a mini "sub-application" that can have its
//   own routes. Later, we'll mount it at "/api/auth" in app.js.
//
//   Spring equivalent: This is like a @RestController class.
//   In Spring you'd write:
//     @RestController
//     @RequestMapping("/api/auth")
//     public class AuthController { ... }
//
//   The router object collects route handlers (like @PostMapping methods)
//   and can be "mounted" at a URL prefix in the main app.


// ═══════════════════════════════════════════════════════════════════════
// POST /register  ENDPOINT
// ═══════════════════════════════════════════════════════════════════════
//
// When mounted at '/api/auth', this handles: POST /api/auth/register
//
// Spring equivalent:
//   @PostMapping("/register")
//   public ResponseEntity<UserResponse> register(@RequestBody RegisterRequest request) {
//       ...
//   }
// ═══════════════════════════════════════════════════════════════════════

router.post('/register', async (req, res) => {
// ↑ Let's break this line down piece by piece:
//
// router.post('/register', ...)
//   - Registers a handler for HTTP POST requests to '/register'
//   - Similar to @PostMapping("/register") in Spring
//   - Only POST requests match; GET/PUT/DELETE to this URL won't trigger this handler
//
// async (req, res) => { ... }
//   - This is an ARROW FUNCTION — a concise way to write functions in JavaScript.
//     Java equivalent: (req, res) -> { ... } (a lambda expression)
//     Full form would be: async function(req, res) { ... }
//
//   - "async" keyword:
//     Marks this function as asynchronous. It means:
//     1. The function can use "await" inside it
//     2. The function implicitly returns a Promise
//     Java equivalent: Think of it as a method that returns CompletableFuture<T>
//     Without async, you CANNOT use await (you'd get a syntax error).
//
//   - "req" parameter (request):
//     Contains everything about the incoming HTTP request:
//       req.body     = parsed JSON body (like @RequestBody in Spring)
//       req.params   = URL path parameters (like @PathVariable)
//       req.query    = query string params (like @RequestParam)
//       req.headers  = HTTP headers
//     Spring equivalent: HttpServletRequest, or the auto-mapped method parameters
//
//   - "res" parameter (response):
//     Object used to send the HTTP response back to the client:
//       res.status(201)  = set HTTP status code
//       res.json({...})  = send JSON response body
//       res.send('text') = send plain text
//     Spring equivalent: HttpServletResponse, or returning ResponseEntity<T>

  try {
  // ↑ try/catch in JavaScript works identically to Java.
  //   We wrap the entire handler in try/catch to handle unexpected errors.
  //   In Spring, you'd use @ExceptionHandler or @ControllerAdvice for this.
  //   Here, any uncaught exception inside this block goes to the catch.

    const { email, password, storage_type } = req.body;
    // ↑ This is DESTRUCTURING — a JavaScript feature with no direct Java equivalent.
    //
    //   What it does:
    //     Extracts named properties from an object into individual variables.
    //     It's syntactic sugar (shorthand) for:
    //       const email = req.body.email;
    //       const password = req.body.password;
    //       const storage_type = req.body.storage_type;
    //
    //   Java equivalent (closest):
    //     String email = request.getEmail();
    //     String password = request.getPassword();
    //     String storageType = request.getStorageType();
    //
    //   Or if you had a DTO: RegisterRequest dto = objectMapper.readValue(body, RegisterRequest.class);
    //   Then accessing dto.email, dto.password, etc.
    //
    //   Why use destructuring?
    //     - Less repetitive code
    //     - Clearly shows which fields you expect from the request body
    //     - If a field isn't in req.body, the variable will be `undefined` (not null, not an error)
    //
    //   IMPORTANT: JavaScript has NO compile-time type checking.
    //     In Java, if RegisterRequest.email is String, the compiler guarantees it.
    //     In JavaScript, req.body.email could be ANYTHING: string, number, null, undefined, array...
    //     That's why we must validate manually below (or use a validation library).


    // ═══════════════════════════════════════════════════════════════════
    // VALIDATION
    // ═══════════════════════════════════════════════════════════════════
    //
    // In Spring, you'd use Bean Validation (JSR 380) annotations:
    //   public class RegisterRequest {
    //       @NotBlank(message = "Email is required")
    //       @Email(message = "Email format is invalid")
    //       private String email;
    //
    //       @NotBlank(message = "Password is required")
    //       @Size(min = 8, max = 72, message = "Password must be 8-72 chars")
    //       private String password;
    //
    //       @NotBlank(message = "Storage type is required")
    //       private String storageType;
    //   }
    //
    // And in the controller: public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req)
    //
    // In Express/Node.js, there is NO built-in validation framework.
    // Options:
    //   1. Manual validation (what we're doing here) — simple and explicit
    //   2. Use a library like "joi" or "express-validator" (like Bean Validation)
    //
    // We're doing manual validation to show you exactly what's happening.
    // ═══════════════════════════════════════════════════════════════════

    // --- Check required fields ---
    const missingFields = [];
    // ↑ An empty JavaScript array. Like: List<String> missingFields = new ArrayList<>();

    if (!email) missingFields.push('email');
    // ↑ The "!" operator: In JavaScript, "!" coerces the value to boolean first.
    //   "Falsy" values in JavaScript: undefined, null, 0, '', NaN, false
    //   So (!email) is true when email is undefined, null, or empty string ''.
    //
    //   .push() appends to the array — like Java's List.add().
    //
    //   Java equivalent:
    //     if (email == null || email.isBlank()) missingFields.add("email");
    //
    //   NOTE: In Java, a missing JSON field would be null.
    //   In JavaScript, a missing field from req.body is `undefined`.
    //   Both are "falsy", so !email catches both cases.

    if (!password) missingFields.push('password');
    if (!storage_type) missingFields.push('storage_type');

    if (missingFields.length > 0) {
    // ↑ .length = array size. Like Java's list.size().
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
      // ↑ Let's break down this response:
      //
      // res.status(400) — sets HTTP status to 400 Bad Request
      //   Java equivalent: ResponseEntity.status(HttpStatus.BAD_REQUEST)
      //
      // .json({...}) — sends a JSON response body AND sets Content-Type header
      //   Java equivalent: .body(new ErrorResponse("..."))
      //
      // Template literal: `Missing required fields: ${missingFields.join(', ')}`
      //   - Backticks (`) create a "template literal" — a string with embedded expressions
      //   - ${expression} is evaluated and its result is inserted into the string
      //   - Java equivalent: String.format("Missing required fields: %s", String.join(", ", missingFields))
      //   - Or in Java 15+: "Missing required fields: " + String.join(", ", missingFields)
      //
      // missingFields.join(', ') — joins array elements with ", " separator
      //   Java equivalent: String.join(", ", missingFields)
      //   Example: ['password', 'storage_type'].join(', ') → "password, storage_type"
      //
      // "return" — CRITICAL! Without return, the function would continue executing
      //   after sending the response, potentially sending ANOTHER response (which crashes).
      //   In Spring, returning ResponseEntity automatically stops the method.
      //   In Express, you MUST use return to stop execution after sending a response.
    }

    // --- Validate email format ---
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // ↑ A REGULAR EXPRESSION (regex) literal in JavaScript.
    //   In Java: Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")
    //
    //   JavaScript regex syntax: /pattern/flags
    //   The /.../ delimiters replace Java's Pattern.compile("...")
    //
    //   Pattern breakdown:
    //     ^          = start of string
    //     [^\s@]+    = one or more chars that are NOT whitespace or @
    //     @          = literal @ symbol
    //     [^\s@]+    = one or more chars that are NOT whitespace or @
    //     \.         = literal dot (escaped because . means "any char" in regex)
    //     [^\s@]+    = one or more chars that are NOT whitespace or @
    //     $          = end of string
    //
    //   This matches: user@domain.com, a@b.c
    //   This rejects: no-at-sign, @no-local, user@, spaces in email
    //
    //   Spring equivalent: @Email annotation on the DTO field
    //   (Spring uses a more complex RFC-compliant regex internally)

    if (!emailRegex.test(email)) {
    // ↑ .test(string) — executes the regex against the string, returns true/false.
    //   Java equivalent: pattern.matcher(email).matches()
    //   The "!" negates it: if the email does NOT match the pattern, reject it.

      return res.status(400).json({
        error: 'Email format is invalid. Expected format: local-part@domain'
      });
      // ↑ Note: In JavaScript, strings can use single quotes ' ' or double quotes " ".
      //   They behave identically. Convention varies by project.
      //   Java only uses double quotes for strings (single quotes are for char).
    }

    // --- Validate password length ---
    if (password.length < 8 || password.length > 72) {
    // ↑ .length on a string = number of characters. Like Java's String.length().
    //   Why max 72? bcrypt has a hard limit of 72 bytes for input.
    //   Anything beyond 72 bytes is silently truncated by bcrypt.
    //   Spring equivalent: @Size(min = 8, max = 72)
      return res.status(400).json({
        error: 'Password must be between 8 and 72 characters'
      });
    }

    // --- Validate storage_type ---
    const validStorageTypes = ['file', 'mongodb'];
    // ↑ A simple array of allowed values.
    //   Java equivalent: List.of("file", "mongodb") or an enum: enum StorageType { FILE, MONGODB }

    if (!validStorageTypes.includes(storage_type)) {
    // ↑ Array.includes(value) — returns true if the array contains the value.
    //   Java equivalent: list.contains(storageType)
    //   Or with enum: StorageType.valueOf(storageType) throwing IllegalArgumentException
    //
    //   The "!" means: if storage_type is NOT in the allowed list, reject it.

      return res.status(400).json({
        error: `Invalid storage_type. Must be one of: ${validStorageTypes.join(', ')}`
      });
    }

    // --- Check if email already exists ---
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    // ↑ Let's break this down:
    //
    // "await" — pauses execution until the Promise resolves (the DB query finishes).
    //   Without await, existingUser would be a Promise object, not the actual result.
    //   Java equivalent: userRepository.findByEmail(email).orElse(null)
    //   Or: CompletableFuture<User> future = ...; User result = future.get();
    //
    // User.findOne({...}) — Mongoose method to find ONE document matching the filter.
    //   Equivalent MongoDB query: db.users.findOne({ email: "alice@example.com" })
    //   Spring/JPA equivalent: @Query("SELECT u FROM User u WHERE u.email = :email")
    //   Or with derived query: Optional<User> findByEmail(String email);
    //
    // { email: email.toLowerCase() } — the query filter (a "where clause").
    //   This is a plain JavaScript object used as a query.
    //   email.toLowerCase() ensures case-insensitive matching.
    //   Spring equivalent: WHERE LOWER(u.email) = LOWER(:email)
    //
    // If no document matches, findOne returns null (not Optional.empty() like in Java).
    // If a document matches, it returns the full document as a JavaScript object.

    if (existingUser) {
    // ↑ In JavaScript, null is "falsy", so if(existingUser) means "if not null".
    //   Java equivalent: if (existingUser != null) or if (optional.isPresent())
      return res.status(409).json({
        error: 'Email is already registered'
      });
      // ↑ HTTP 409 Conflict — indicates the request conflicts with existing data.
      //   Spring equivalent: throw new ConflictException("Email is already registered");
      //   (with a @ExceptionHandler that maps it to 409)
    }


    // ═══════════════════════════════════════════════════════════════════
    // CREATE USER
    // ═══════════════════════════════════════════════════════════════════
    //
    // If we reach this point, ALL validation has passed.
    // Now we hash the password and save the user to MongoDB.
    //
    // Spring equivalent flow:
    //   String hashedPassword = passwordEncoder.encode(request.getPassword());
    //   User user = new User(request.getEmail(), hashedPassword, request.getStorageType());
    //   userRepository.save(user);
    //   return ResponseEntity.status(HttpStatus.CREATED).body(new UserResponse(user));
    // ═══════════════════════════════════════════════════════════════════

    // --- Hash the password ---
    const saltRounds = 10;
    // ↑ "Salt rounds" (also called "cost factor") controls how slow bcrypt is.
    //   - Each increment DOUBLES the computation time.
    //   - 10 rounds ≈ ~100ms to hash on modern hardware (good balance)
    //   - 12 rounds ≈ ~300ms (more secure but slower)
    //   - 15 rounds ≈ ~3 seconds (too slow for most apps)
    //
    //   Spring equivalent: new BCryptPasswordEncoder(10)
    //     (Spring defaults to 10 if you use the no-arg constructor)
    //
    //   Why is slowness GOOD for passwords?
    //     If an attacker steals your database, they'll try to crack hashes.
    //     At 10 rounds, they can only try ~10 passwords/second per CPU core.
    //     With SHA-256, they could try BILLIONS per second.

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    // ↑ bcrypt.hash(plaintext, rounds) — hashes the password with a random salt.
    //   It returns a Promise (because hashing is CPU-intensive and Node.js does it
    //   in a background thread to avoid blocking the event loop).
    //   "await" waits for the hash to complete.
    //
    //   The result looks like: "$2b$10$N9qo8uLOickgx2ZMRZoMye.IjqQBrJm..."
    //   That string contains: algorithm version + cost + salt + hash (all in one!)
    //
    //   Spring equivalent: passwordEncoder.encode(password)
    //
    //   IMPORTANT: NEVER store the plaintext password. NEVER log it.
    //   If someone gets your database, they only get unusable hashes.

    // --- Create user in MongoDB ---
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      storage_type: storage_type,
      role: 'user'
    });
    // ↑ User.create({...}) — Mongoose method that validates + inserts a new document.
    //   Under the hood, it does:
    //     1. Validates the data against the schema (from Phase 2)
    //     2. Runs any schema middleware (pre-save hooks)
    //     3. Inserts into the "users" collection in MongoDB
    //     4. Returns the created document (with _id, timestamps, etc.)
    //
    //   If validation fails (e.g., duplicate email due to unique index),
    //   it throws an error which gets caught by our try/catch.
    //
    //   The object {email, password, ...} uses JavaScript "shorthand property" syntax:
    //     { email: email } can be written as just { email }
    //     We're NOT using shorthand here because the variable names match the field names.
    //
    //   Spring/JPA equivalent:
    //     User user = new User();
    //     user.setEmail(email.toLowerCase());
    //     user.setPassword(hashedPassword);
    //     user.setStorageType(storageType);
    //     user.setRole("user");
    //     userRepository.save(user);
    //
    //   NOTE: Unlike JPA's save(), Mongoose create() does NOT require a separate flush.
    //   The document is immediately persisted to MongoDB (no transaction context needed).

    // --- Return success response ---
    res.status(201).json({
      email: user.email,
      storage_type: user.storage_type,
      role: user.role
    });
    // ↑ HTTP 201 Created — standard response for successful resource creation.
    //
    //   IMPORTANT: We deliberately EXCLUDE the password field from the response!
    //   Even though it's hashed, there's no reason to send it to the client.
    //   We pick only the fields we want to expose.
    //
    //   Spring equivalent:
    //     return ResponseEntity.status(HttpStatus.CREATED)
    //         .body(new UserResponse(user.getEmail(), user.getStorageType(), user.getRole()));
    //   Or with a DTO mapper: return ResponseEntity.created(uri).body(mapper.toDto(user));
    //
    //   In Spring, you'd often use a separate Response DTO class to control what's serialized.
    //   In Node.js, you manually construct the response object with only the desired fields.
    //   (Some projects use libraries like "class-transformer" for this.)

  } catch (error) {
  // ↑ If ANY line above throws an exception, execution jumps here.
  //   Common causes:
  //     - MongoDB is down (network error)
  //     - Mongoose validation error (duplicate key from unique constraint)
  //     - bcrypt fails (extremely rare)
  //
  //   "error" is the caught exception object (like Exception e in Java's catch block).
  //   It has: error.message (string), error.stack (stack trace), error.name (type).

    console.error('Registration error:', error);
    // ↑ console.error() prints to stderr (red in most terminals).
    //   The error object will show the stack trace.
    //   Spring equivalent: log.error("Registration error", e);
    //   (Using SLF4J/Logback: private static final Logger log = ...)
    //
    //   In production, you'd use a proper logging library (like "winston" or "pino")
    //   that writes structured logs to files/services. console.error is fine for dev.

    res.status(500).json({ error: 'Internal server error' });
    // ↑ HTTP 500 — generic server error. We DON'T expose the actual error message
    //   to the client (that could leak implementation details / stack traces).
    //   
    //   Spring equivalent: 
    //     @ExceptionHandler(Exception.class)
    //     public ResponseEntity<ErrorResponse> handleGeneral(Exception e) {
    //         return ResponseEntity.status(500).body(new ErrorResponse("Internal server error"));
    //     }
    //
    //   Best practice: Log the real error server-side, send a generic message to the client.
  }
});


// ═══════════════════════════════════════════════════════════════════════
// EXPORT THE ROUTER
// ═══════════════════════════════════════════════════════════════════════
module.exports = router;
// ↑ Makes this router available to other files.
//   When another file does: const authRouter = require('./routes/auth');
//   they get this router object with all its registered routes.
//
//   Spring equivalent: There IS no equivalent — Spring uses classpath scanning
//   (@ComponentScan) to automatically discover @Controller classes.
//   In Node.js, you must explicitly import and mount each router.
//
//   module.exports can export ANYTHING: an object, function, class, or primitive.
//   Each file has exactly one module.exports (like a file can have one public class in Java).