const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,  // 15s to find a server
      connectTimeoutMS:         15000,  // 15s to establish connection
      socketTimeoutMS:          45000,  // 45s for operations
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`\n❌ MongoDB connection failed!`);
    console.error(`   Error: ${error.message}\n`);

    if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 Fix: MongoDB is not running. Start it with: mongod');
    } else if (error.message.includes('timed out') || error.message.includes('ETIMEDOUT')) {
      console.error('💡 Fix: Go to MongoDB Atlas → Network Access → Add your IP or use 0.0.0.0/0');
      console.error('   Atlas URL: https://cloud.mongodb.com');
    } else if (error.message.includes('Authentication failed')) {
      console.error('💡 Fix: Wrong username or password in MONGODB_URI');
    } else if (error.message.includes('queryTxt')) {
      console.error('💡 Fix: DNS cannot resolve the Atlas cluster. Check your internet connection.');
    }

    console.error('\n⚠️  Server running WITHOUT database. Login/register will not work.\n');
    // Don't exit — let server stay up for debugging
  }
};

module.exports = connectDB;
