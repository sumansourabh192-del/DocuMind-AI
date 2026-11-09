const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('Checking MongoDB configuration...');

    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is missing.');
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000
    });

    console.log('MongoDB Atlas connected successfully!');
  } catch (error) {
    console.error('MongoDB connection failed.');
    console.error('Error name:', error.name);
    console.error('Error code:', error.code || 'Not provided');
    console.error('Error message:', error.message);
    console.error('Error reason:', error.reason?.message || 'Not provided');

    process.exit(1);
  }
};

module.exports = connectDB;
