import express from "express"
import dotenv from "dotenv"
import cookieParser from "cookie-parser";
import cors from "cors"

import authRoutes from "./routes/authRoute.js"
import userRoutes from "./routes/userRoute.js"
import postRoutes from "./routes/postRoute.js"
import notificationRoutes from "./routes/notificationRoute.js"
import linkRoutes from "./routes/linkRoute.js"
import searchRoutes from "./routes/searchRoute.js"
import jobRoutes from "./routes/jobRoute.js"

import { connectDB } from "./lib/db.js";

dotenv.config()

const app = express();
const PORT = process.env.PORT || 5000

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}))

app.use(express.json({ limit: "5mb" })) // limits image size to 5mb
app.use(cookieParser())

app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/users", userRoutes)
app.use("/api/v1/posts", postRoutes)
app.use("/api/v1/notifications", notificationRoutes)
app.use("/api/v1/links", linkRoutes)
app.use("/api/v1/search", searchRoutes)
app.use("/api/v1/jobs", jobRoutes)

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    connectDB();
})