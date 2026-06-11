// ─────────────────────────────────────────────────────────────────────────────
// STORAGE FACTORY — The Factory Pattern for Storage Backends
// ─────────────────────────────────────────────────────────────────────────────
// In Node.js, we use a Factory class with a static method instead of Spring's
// DI container. The result is the same: calling code doesn't know or care
// which implementation it gets — it just calls create/read/update/delete.
//
// WHY Factory Pattern here:
//   - The routes/controllers don't import FileStorage or DatabaseStorage directly
//   - They call StorageFactory.createHandler(config.storageType)
//   - If we add a third backend (Redis, DynamoDB, etc.), only THIS file changes
//   - Controllers remain untouched — Open/Closed Principle (open for extension,
//     closed for modification)
// ─────────────────────────────────────────────────────────────────────────────

const FileStorage = require('./fileStorage');
const DatabaseStorage = require('./databaseStorage');

class StorageFactory {
  static createHandler(storageType) {
    switch (storageType) {
      case 'file':
        return new FileStorage();

      case 'mongodb':
        return new DatabaseStorage();

      default:
          throw new Error(`Unsupported storage type: "${storageType}". Must be "file" or "mongodb".`);
    }
  }
}

module.exports = StorageFactory;


// Notes:

//   Both imports provide classes with the SAME method signatures:
//   .create(userEmail, entityType, data)
//   .read(userEmail, entityType, id)
//   .readAll(userEmail, entityType)
//   .update(userEmail, entityType, id, data)
//   .delete(userEmail, entityType, id)
//
// This is "duck typing" — if it has the same methods, it's interchangeable.
// In JavaScript, it's a convention enforced by tests, not the compiler.