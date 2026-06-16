// dotenv is used to load environment variables from a .env file into process.env
import dotenv from 'dotenv';
dotenv.config();

// heere we centralize all our environment variables in one place
export default {
  //environment: development, production, or test
  NODE_ENV: process.env.NODE_ENV || 'development',

  // port number for the server to listen on
  PORT: process.env.PORT || 5000,
  // MongoDB connection string
  MONGODB_URI: process.env.MONGODB_URI,

  // secret key for signing JWT tokens (should be a long, random string in production)
  JWT_SECRET: process.env.JWT_SECRET,

  // how long JWT tokens are valid (e.g., '7d' for 7 days)
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // URL of the frontend client (used for CORS and email links)
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',

  // Cloudinary configuration for image uploads
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};