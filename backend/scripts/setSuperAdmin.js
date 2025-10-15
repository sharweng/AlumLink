import User from "../models/User.js";
import { connectDB } from "../lib/db.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root directory (two levels up from scripts folder)
dotenv.config({ path: path.join(__dirname, "../../.env") });

const setSuperAdmin = async () => {
    try {
        await connectDB();
        
        console.log("Setting super admin...");
        
        // You can change this email to the user you want to make super admin
        const superAdminEmail = "admin@gmail.com";
        
        const result = await User.findOneAndUpdate(
            { email: superAdminEmail },
            { 
                role: 'admin',
                isSuperAdmin: true 
            },
            { new: true }
        );
        
        if (!result) {
            console.log(`❌ User with email ${superAdminEmail} not found`);
        } else {
            console.log(`✅ Super admin set successfully: ${result.name} (${result.email})`);
        }
        
        // Show all admins
        const allAdmins = await User.find({ role: 'admin' }, 'name email role isSuperAdmin');
        console.log("\nAll admins:");
        allAdmins.forEach(admin => {
            console.log(`- ${admin.name} (${admin.email}): ${admin.isSuperAdmin ? 'SUPER ADMIN' : 'Regular Admin'}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error("❌ Failed to set super admin:", error);
        process.exit(1);
    }
};

setSuperAdmin();
