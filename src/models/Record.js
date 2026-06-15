// ─────────────────────────────────────────────────────────────────────────────
// RECORD SCHEMA — A user can have MULTIPLE records (unlike Profile which is 1:1)
// ─────────────────────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({

  // a user can have many Records, each with a unique recordId.
  recordId: {
    type: String,
    required: true
  },

  // userEmail: Owner of this record. Used in EVERY query for data isolation.
  userEmail: {
    type: String,
    required: true,
    lowercase: true
  },

  firstName: {
    type: String,
    required: true
  },

  lastName: {
    type: String,
    required: true
  },
  phone: { type: String, default: null }

}, {
  timestamps: true    // Auto-adds createdAt + updatedAt (like @EnableMongoAuditing)
});

// WHY compound (two fields) vs single field:
//   - recordId ALONE is not unique globally — two different users could both
//     have a record with id "rec-001".
//   - The COMBINATION of (recordId + userEmail) must be unique.
//   - This means: User A can have "rec-001", User B can also have "rec-001",
//     but User A cannot have TWO records called "rec-001".
//
// FIELD ORDER MATTERS in compound indexes:
//   { recordId: 1, userEmail: 1 } — Optimizes queries that filter by recordId first.
//   Since our queries always include BOTH fields, either order works, but this
//   order matches our most common query pattern: "find record X for user Y".
//
// In Spring Data MongoDB, compound indexes are created via @CompoundIndex annotation
// on the entity class, or programmatically with MongoTemplate.indexOps().
// ─────────────────────────────────────────────────────────────────────────────
recordSchema.index({ recordId: 1, userEmail: 1 }, { unique: true });

// Compile schema into a Model (the "repository" with all CRUD methods built in)
const Record = mongoose.model('Record', recordSchema);

module.exports = Record;