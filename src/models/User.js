const mongoose = require('mongoose');

// ============================================================
// A Schema defines the SHAPE of documents in a MongoDB collection.
// 
// In relational DB terms:
//   Schema  = CREATE TABLE statement (defines columns and constraints)
//   Model   = The Repository/DAO (provides CRUD methods)
//   Document = A single row in the table
//
// In Spring/JPA terms:
//   Schema  = @Entity class with @Column annotations
//   Model   = JpaRepository interface
//   Document = An entity instance
// ============================================================

const userSchema = new mongoose.Schema({
  // Each field has a type and optional validation rules
  // These are like @Column annotations in JPA

  email: {
    type: String,              // Data type (String, Number, Boolean, Date, etc.)
    required: [true, 'Email is required'],  // Like @NotNull — second param is error message
    unique: true,              // Like @Column(unique = true) — creates a DB index
    lowercase: true,           // Auto-converts "Alice@Example.COM" → "alice@example.com"
    trim: true                 // Auto-removes leading/trailing whitespace
  },

  password: {
    type: String,
    required: [true, 'Password is required']
    // This stores the HASHED password, never the plaintext
  },

  storage_type: {
    type: String,
    required: [true, 'Storage type is required'],
    enum: {
      // enum = only these exact values are allowed (like Java enum)
      // If someone tries to save storage_type: "redis", Mongoose rejects it
      values: ['file', 'mongodb'],
      message: 'Storage type must be either "file" or "mongodb"'
    }
  },

  role: {
    type: String,
    default: 'user',           // If not provided, defaults to "user"
    enum: ['user', 'admin']    // Short form of enum validation
  }
}, {
  // Schema options (second argument to Schema constructor)
  
  // timestamps: true automatically adds:
  //   createdAt: Date (set on creation)
  //   updatedAt: Date (updated on every save)
  // Like @CreatedDate and @LastModifiedDate in Spring Data
  timestamps: true
});

// ============================================================
// mongoose.model('User', userSchema) does two things:
// 1. Creates a "User" model (your CRUD interface) — like a JpaRepository
// 2. Tells MongoDB to use a collection called "users" (lowercase + plural)
//
// After this, you can do:
//   User.create({...})     — INSERT
//   User.findOne({...})    — SELECT ... WHERE ... LIMIT 1
//   User.find({...})       — SELECT ... WHERE ...
//   User.findByIdAndUpdate — UPDATE
//   User.deleteOne({...})  — DELETE
// ============================================================
const User = mongoose.model('User', userSchema);

module.exports = User;