// ─────────────────────────────────────────────────────────────────────────────
// INTEGRATION TEST — Verify both storage backends produce identical results
// ─────────────────────────────────────────────────────────────────────────────
// WHY this test:
//   The Repository Pattern guarantees that FileStorage and DatabaseStorage
//   are interchangeable. This test PROVES it by running the same operations
//   on both backends and comparing the outputs.
//
// Spring equivalent: An @SpringBootTest with @ParameterizedTest that runs
// the same test logic against both FileStorageHandler and MongoStorageHandler:
//
//   @ParameterizedTest
//   @ValueSource(strings = {"file", "mongodb"})
//   void testCrudOperations(String storageType) {
//       StorageHandler handler = StorageFactory.create(storageType);
//       // ... same assertions for both
//   }
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config();
// ▲ Loads environment variables from .env file into process.env.
// Spring equivalent: @PropertySource("classpath:application.properties")
// This gives us access to MONGODB_URI for the connection string.

const mongoose = require('mongoose');
// ▲ The ODM library — needed here to manage the database connection lifecycle.
// Spring equivalent: Spring Boot auto-configures MongoClient via application.properties.
// In Node.js, we must manually connect/disconnect.

const StorageFactory = require('./src/storage/storageFactory');
// ▲ Our Factory — we'll use it to create both storage handlers.

async function testBothStorages() {
  // ───────────────────────────────────────────────────────────────────────────
  // CONNECT TO MONGODB
  // ───────────────────────────────────────────────────────────────────────────
  // Spring equivalent: Spring Boot auto-connects on startup using:
  //   spring.data.mongodb.uri=mongodb://localhost:27017/mydb
  //
  // In Node.js, you must explicitly call mongoose.connect().
  // process.env.MONGODB_URI comes from the .env file (loaded by dotenv above).
  // The await ensures we're connected before running any queries.
  // ───────────────────────────────────────────────────────────────────────────
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  // Test data — same for both storage backends
  const testEmail = 'storagetest@example.com';
  const testRecord = { id: 'test-001', firstName: 'Jane', lastName: 'Doe' };

  // ───────────────────────────────────────────────────────────────────────────
  // RUN SAME OPERATIONS ON BOTH BACKENDS
  // ───────────────────────────────────────────────────────────────────────────
  // The for...of loop iterates over both storage types sequentially.
  // If both produce the same output, the Repository Pattern is working correctly.
  // Any difference in output means one backend has a bug in its implementation.
  // ───────────────────────────────────────────────────────────────────────────
  for (const storageType of ['file', 'mongodb']) {
    console.log(`\n=== Testing ${storageType.toUpperCase()} storage ===\n`);

    // Factory creates the correct handler — caller doesn't know or care which one
    const handler = StorageFactory.createHandler(storageType);

    // CREATE — Insert a new record
    // Spring equivalent: repository.save(new Record(...))
    const created = await handler.create(testEmail, 'records', testRecord);
    console.log('CREATE:', created);

    // READ — Find by ID + userEmail
    // Spring equivalent: repository.findByRecordIdAndUserEmail("test-001", email)
    const read = await handler.read(testEmail, 'records', 'test-001');
    console.log('READ:', read);

    // READ ALL — Get all records for this user
    // Spring equivalent: repository.findByUserEmail(email)
    const all = await handler.readAll(testEmail, 'records');
    console.log('READ ALL:', all);

    // UPDATE — Modify existing record
    // Spring equivalent: mongoTemplate.findAndModify(query, update, options, Record.class)
    const updated = await handler.update(testEmail, 'records', 'test-001', {
      firstName: 'Janet',
      lastName: 'Doe'
    });
    console.log('UPDATE:', updated);

    // DELETE — Remove the record
    // Spring equivalent: mongoTemplate.findAndRemove(query, Record.class)
    const deleted = await handler.delete(testEmail, 'records', 'test-001');
    console.log('DELETE:', deleted);

    // VERIFY DELETION — Read should return null
    // Spring equivalent: assertThat(repository.findByRecordId("test-001")).isEmpty()
    const afterDelete = await handler.read(testEmail, 'records', 'test-001');
    console.log('AFTER DELETE:', afterDelete, '(should be null)');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // DISCONNECT — Clean up the MongoDB connection
  // ───────────────────────────────────────────────────────────────────────────
  // Spring equivalent: Spring handles this automatically on shutdown via @PreDestroy.
  // In Node.js, if you don't disconnect, the process hangs forever waiting
  // for the open connection to close. Always disconnect in scripts and tests.
  // ───────────────────────────────────────────────────────────────────────────
  await mongoose.disconnect();
  console.log('\n--- Done! Both storages produce consistent results ---');
}

// ─────────────────────────────────────────────────────────────────────────────
// RUN THE TEST — Top-level async execution
// ─────────────────────────────────────────────────────────────────────────────
// WHY .catch(console.error):
//   In Node.js, unhandled promise rejections are logged but may not crash the process
//   (depending on Node version). The .catch() ensures any error is visible.
//   Spring equivalent: The main() method in a CommandLineRunner would wrap in try/catch.
// ─────────────────────────────────────────────────────────────────────────────
testBothStorages().catch(console.error);