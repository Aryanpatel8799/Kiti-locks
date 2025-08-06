import mongoose from "mongoose";
import User from "../models/User";
import connectDB from "../config/database";

async function migrateUserActiveField() {
  try {
    console.log("Connecting to database...");
    await connectDB();

    console.log("Updating existing users with isActive field...");
    
    // Update all existing users who don't have the isActive field set
    const result = await User.updateMany(
      { isActive: { $exists: false } },
      { $set: { isActive: true } }
    );

    console.log(`Updated ${result.modifiedCount} users with isActive: true`);

    // Check the total count of users
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });

    console.log(`Total users: ${totalUsers}`);
    console.log(`Active users: ${activeUsers}`);
    console.log(`Inactive users: ${inactiveUsers}`);

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
}

// Run the migration
migrateUserActiveField();

export default migrateUserActiveField;
