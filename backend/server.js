import express from "express"
import dotenv from "dotenv"

import authRoutes from "./routes/authRoute.js"
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";

dotenv.config()

const app = express();
const PORT = process.env.PORT || 5000

app.use(express.json())
app.use(cookieParser())

app.use("/api/v1/auth", authRoutes)

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    connectDB();
})