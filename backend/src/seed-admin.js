// src/seed-admin.js
const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

async function seedAdmin() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log("Connected. Checking for existing admin...");
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("Admin account already exists:", existingAdmin.email);
      process.exit(0);
    }

    const email = "admin@steambuddies.com";
    const password = "adminpassword123";
    const passwordHash = await User.hashPassword(password);

    const admin = new User({
      role: "admin",
      fullName: "System Administrator",
      email: email,
      passwordHash: passwordHash
    });

    await admin.save();
    console.log("=========================================");
    console.log("✅ Admin account created successfully!");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log("=========================================");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding admin:", err);
    process.exit(1);
  }
}

seedAdmin();
