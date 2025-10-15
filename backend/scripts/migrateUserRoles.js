import User from "../models/User.js";
import { connectDB } from "../lib/db.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root directory (two levels up from scripts folder)
dotenv.config({ path: path.join(__dirname, "../../.env") });

const migrateUserRoles = async () => {
    try {
        await connectDB();
        
        console.log("Starting user role migration...");
        
        // Update users without a role field
        const result = await User.updateMany(
            { role: { $exists: false } },
            { $set: { role: 'user' } }
        );
        
        console.log(`✅ Migration complete: ${result.modifiedCount} users updated with default role 'user'`);
        
        // Also ensure isActive field exists
        const activeResult = await User.updateMany(
            { isActive: { $exists: false } },
            { $set: { isActive: true } }
        );
        
        console.log(`✅ Migration complete: ${activeResult.modifiedCount} users updated with default isActive 'true'`);
        
        // Show all users with their roles
        const allUsers = await User.find({}, 'name email role isActive');
        console.log("\nAll users after migration:");
        allUsers.forEach(user => {
            console.log(`- ${user.name} (${user.email}): role=${user.role}, isActive=${user.isActive}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
};

migrateUserRoles();
