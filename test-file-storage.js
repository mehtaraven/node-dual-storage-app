// ═══════════════════════════════════════════════════════════════════════════════
// MANUAL INTEGRATION TEST FOR FILE STORAGE
// ═══════════════════════════════════════════════════════════════════════════════
//
// This is a quick "smoke test" you run manually to verify FileStorage works.
// It's NOT a unit test framework (no JUnit, no Mocha/Jest) — just a script
// that exercises each CRUD method and prints results.
//
// Java equivalent: A main() method that manually calls repository methods
// and prints results — like what you'd do before setting up @SpringBootTest.
//
// Run with: node test-file-storage.js
// After testing: delete this file (it's not part of the production code)
// ═══════════════════════════════════════════════════════════════════════════════

// Import the path module (needed indirectly by FileStorage, but also used
// in Node.js scripts for any path-related work)
const path = require('path');

// Load environment variables from .env file into process.env
// Java equivalent: @PropertySource("classpath:.env") or Spring's application.properties
// dotenv reads the .env file and makes its key=value pairs available as
// process.env.KEY_NAME (like System.getenv("KEY_NAME") in Java)
require('dotenv').config();

// Import our FileStorage class
// './' means "relative to this file" — like a relative import in a Java module
const FileStorage = require('./src/storage/fileStorage');

// ─────────────────────────────────────────────────────────────────────────────
// async function — The test runner
// ─────────────────────────────────────────────────────────────────────────────
//
// WHY async?
//   All FileStorage methods are async (they return Promises).
//   To use `await` inside a function, that function MUST be declared `async`.
//   Java equivalent: This whole function returns CompletableFuture<Void>
//   and we .join() on it at the end.
//
// WHY wrap in a function instead of top-level code?
//   `await` can only be used inside async functions (in older Node.js).
//   Modern Node.js (v14.8+) supports top-level await in ES modules,
//   but we're using CommonJS (require/module.exports), so we need the wrapper.
async function testFileStorage() {
  // Create a new instance of FileStorage (our "repository" under test)
  // In Spring, this would be @Autowired StorageRepository storage;
  const storage = new FileStorage();

  // Test data — simulating a logged-in user's email from their JWT token
  const testEmail = 'test@example.com';
  // Entity type — like specifying which "table" to use
  const entityType = 'records';

  console.log('--- Testing File Storage ---\n');
  // console.log() is like System.out.println() in Java

  // ─── TEST 1: CREATE ───
  // Verifies: folder creation + JSON serialization + file writing
  console.log('1. CREATE:');
  const record = { id: 'rec-001', firstName: 'Bob', lastName: 'Smith' };
  const createResult = await storage.create(testEmail, entityType, record);
  console.log('   Result:', createResult);
  // After this, a file should exist at:
  // data/test_at_example_dot_com/records/rec-001.json
  console.log('   File should exist at: data/test_at_example_dot_com/records/rec-001.json\n');

  // ─── TEST 2: READ ───
  // Verifies: file reading + JSON deserialization + correct data returned
  console.log('2. READ:');
  const readResult = await storage.read(testEmail, entityType, 'rec-001');
  console.log('   Result:', readResult);
  // JSON.stringify comparison is a simple equality check for objects
  // In Java: Objects.equals() or assertEquals() in JUnit
  // JavaScript objects can't be compared with === (that checks reference equality)
  // So we serialize both to strings and compare the strings.
  console.log('   Data matches:', JSON.stringify(readResult.data) === JSON.stringify(record), '\n');

  // ─── TEST 3: READ ALL ───
  // Verifies: directory listing + reading multiple files + filtering .json files
  console.log('3. READ ALL:');
  // Create a second record so we have multiple to list
  await storage.create(testEmail, entityType, { id: 'rec-002', firstName: 'Alice', lastName: 'Jones' });
  const allRecords = await storage.readAll(testEmail, entityType);
  console.log('   Count:', allRecords.length);  // Should be 2
  console.log('   Records:', allRecords, '\n');

  // ─── TEST 4: UPDATE ───
  // Verifies: existence check (fs.access) + overwriting file contents
  console.log('4. UPDATE:');
  const updateResult = await storage.update(testEmail, entityType, 'rec-001', { firstName: 'Robert', lastName: 'Smith' });
  console.log('   Result:', updateResult, '\n');
  // Note: the result should have id: 'rec-001' added automatically (from spread operator)

  // ─── TEST 5: READ AFTER UPDATE ───
  // Verifies: the update actually persisted to disk
  console.log('5. READ AFTER UPDATE:');
  const afterUpdate = await storage.read(testEmail, entityType, 'rec-001');
  console.log('   Result:', afterUpdate, '\n');
  // firstName should now be 'Robert', not 'Bob'

  // // ─── TEST 6: DELETE ───
  // // Verifies: fs.unlink removes the file, and subsequent read returns null
  // console.log('6. DELETE:');
  // const deleteResult = await storage.delete(testEmail, entityType, 'rec-001');
  // console.log('   Result:', deleteResult);
  // const afterDelete = await storage.read(testEmail, entityType, 'rec-001');
  // console.log('   Read after delete:', afterDelete, '(should be null)\n');

  // ─── TEST 7: READ NON-EXISTENT ───
  // Verifies: ENOENT handling returns null (not throws)
  console.log('7. READ NON-EXISTENT:');
  const noRecord = await storage.read(testEmail, entityType, 'does-not-exist');
  console.log('   Result:', noRecord, '(should be null)\n');

  // ─── TEST 8: READ ALL FROM NON-EXISTENT USER ───
  // Verifies: ENOENT on the folder level returns empty array
  console.log('8. READ ALL FROM NON-EXISTENT USER:');
  const noUser = await storage.readAll('nobody@nowhere.com', entityType);
  console.log('   Result:', noUser, '(should be empty array)\n');

  // ─── CLEANUP ───
  // Remove the second test record so we don't leave test data behind
  await storage.delete(testEmail, entityType, 'rec-002');
  console.log('--- All tests passed! ---');
}

// ─────────────────────────────────────────────────────────────────────────────
// EXECUTE THE TEST FUNCTION
// ─────────────────────────────────────────────────────────────────────────────
//
// testFileStorage() returns a Promise (because it's async).
// .catch(console.error) handles any unhandled errors by printing them.
//
// Java equivalent:
//   public static void main(String[] args) {
//       try {
//           testFileStorage();
//       } catch (Exception e) {
//           e.printStackTrace();
//       }
//   }
//
// WHY .catch(console.error)?
//   If any await inside testFileStorage() throws, the Promise rejects.
//   Without .catch(), you'd get an "UnhandledPromiseRejection" warning.
//   console.error prints the error with stack trace (like e.printStackTrace())
testFileStorage().catch(console.error);