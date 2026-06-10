const mongoose = require('mongoose');


const connectDB = async () => {
  try {
    // It returns a connection object with metadata about the connection
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    // conn.connection.host shows which MongoDB host we connected to
    // Useful to confirm you're pointing at the right database
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    // If MongoDB isn't running or URI is wrong, we end up here
    console.error(`MongoDB connection error: ${error.message}`);

    // process.exit(1) terminates the entire Node.js process with error code 1
    // We do this because the app can't function without a database
    // Code 0 = normal exit, Code 1 = error exit
    // Like throwing an exception in main() that crashes the Spring app on startup
    process.exit(1);
  }
};

// module.exports = makes this function available to other files
// Like making a class "public" in Java so other classes can use it
// Any file that does require('./config/database') gets this function
module.exports = connectDB;