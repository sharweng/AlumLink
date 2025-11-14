// Script to create a superAdmin user for AlumniLink
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../backend/models/User.js";
import bcrypt from "bcryptjs";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function createSuperAdmin() {
  if (!MONGO_URI) {
    console.error("MONGO_URI not set in environment variables.");
    process.exit(1);
  }
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const email = "admin@alumnilink.com";
  const username = "admin";
  const password = "password123";
  const name = "AlumniLink Admin";
  const tuptId = "TUPT-00-0001";
  const batch = 0;
  const course = "Admin";

  // Check if user already exists
  const existing = await User.findOne({ email });
  if (existing) {
    console.log("SuperAdmin user already exists:", existing.email);
    mongoose.disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({
    name,
    username,
    email,
    password: hashedPassword,
    tuptId,
    batch,
    course,
    role: "staff",
    permission: "superAdmin",
    isActive: true,
    banned: false
  });

  await user.save();
  console.log("SuperAdmin user created:", email);
  mongoose.disconnect();
}

createSuperAdmin().catch(err => {
  console.error("Error creating superAdmin:", err);
  mongoose.disconnect();
});
