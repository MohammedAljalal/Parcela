import mongoose from 'mongoose';
import env from './env.js';

const connectDB = async () => {
  try {
    // mongoose.connect returns a Promise, so we use await
    const conn = await mongoose.connect(env.MONGODB_URI);

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

  } catch (error) {
    // Stop the server immediately if connection fails at startup
    // A server without a database is useless
    console.error(`Failed to connect to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Connection Events

// Triggered on sudden disconnection (e.g., network failure)
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB: Disconnected');
});

// Triggered on auto-reconnect
mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB: Reconnected');
});

export default connectDB;