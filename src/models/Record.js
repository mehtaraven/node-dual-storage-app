const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({

  recordId: {
    type: String,
    required: true
  },

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
  phone: {
    type: String,
    default: null
  },

  // "type" tells us which schema this record belongs to.
  // Default "record" = the original Add Record form.
  // Dynamic forms set this to their screenName (e.g., "vehicle", "employee")
  type: { type: String, default: 'record' },

  // "data" is a flexible object — stores whatever fields the dynamic form collected.
  // For type="record", this is empty (we use firstName/lastName/phone directly).
  // For type="vehicle", this might be: { make: "Toyota", model: "Camry", year: "2024" }
  // mongoose.Schema.Types.Mixed = accepts any shape (no strict schema for this field)
  data: { type: mongoose.Schema.Types.Mixed, default: null }
}, {
  timestamps: true    // Auto-adds createdAt + updatedAt
});


recordSchema.index({ recordId: 1, userEmail: 1 }, { unique: true });

const Record = mongoose.model('Record', recordSchema); // Compile schema into a Model (the "repository" with all CRUD methods built in)

module.exports = Record;



// NOTEs
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


// need to look  // files   //js  functions look into


// dynamic >> type vehicle == screen name
//>> publish >> saving acc to screen name >> render acc to endpoint == file name
// CSS work  

// 25 L  + 18 L = 43 L >>  69 L   JUNE 2030  1.25 CR >> in the end 70 L stay and 
// car  boyght for 38 L  ( interest paid to bank ) >> 1cr 5 L  ? 1cr 22 L