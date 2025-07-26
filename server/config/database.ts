import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

let isConnected = false;

const connectDB = async (): Promise<boolean> => {
  try {
    const mongoURI =
      process.env.MONGO_URI || "mongodb://localhost:27017/ecommerce";

    // Set connection timeout and other options
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      connectTimeoutMS: 10000,
    });

    isConnected = true;
    console.log("✅ MongoDB connected successfully");
    return true;
  } catch (error) {
    console.warn("⚠️  MongoDB connection failed:", error.message);
    console.log(
      "⚠️  Database connection required. For full functionality, please:",
    );
    console.log("   1. Install MongoDB locally, or");
    console.log("   2. Set MONGO_URI to a MongoDB Atlas connection string");
    console.log("   3. Restart the application after fixing");
    isConnected = false;
    return false;
  }
};

export const getConnectionStatus = () => isConnected;

export default connectDB;
