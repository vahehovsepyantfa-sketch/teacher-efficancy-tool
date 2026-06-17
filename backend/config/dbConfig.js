const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB-ն հաջողությամբ միացավ: ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB միանալու սխալ:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
