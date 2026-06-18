const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the MONGO_URI environment variable.
 * Exits the process if the connection cannot be established, since
 * the API cannot serve requests without a database.
 */
const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI is not set. Add it to your .env file.');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB-ն հաջողությամբ միացավ!');
  } catch (err) {
    console.error('❌ MongoDB միանալու սխալ:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
