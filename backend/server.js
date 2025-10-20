import express from "express"
import dotenv from "dotenv"
import cookieParser from "cookie-parser";
import cors from "cors"
import { createServer } from "http"

import authRoutes from "./routes/authRoute.js"
import userRoutes from "./routes/userRoute.js"
import postRoutes from "./routes/postRoute.js"
import notificationRoutes from "./routes/notificationRoute.js"
import linkRoutes from "./routes/linkRoute.js"
import searchRoutes from "./routes/searchRoute.js"
import jobRoutes from "./routes/jobRoute.js"
import discussionRoutes from "./routes/discussionRoute.js"
import eventRoutes from "./routes/eventRoute.js"
import adminRoutes from "./routes/adminRoute.js"
import mentorshipRoutes from "./routes/mentorshipRoute.js"
import streamRoutes from "./routes/streamRoute.js"
import messageRoutes from "./routes/messageRoute.js"
import achievementsRoutes from "./routes/achievementsRoute.js"
import feedbackRoutes from "./routes/feedbackRoute.js"
import reportRoutes from "./routes/reportRoute.js"

import { connectDB } from "./lib/db.js";
import { initializeSocket } from "./lib/socket.js";

dotenv.config()

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000

// Initialize Socket.IO
initializeSocket(server);

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}))

app.use(express.json({ limit: "25mb" })) 
app.use(express.urlencoded({ limit: "25mb", extended: true })) // for form data
app.use(cookieParser())

app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/users", userRoutes)
app.use("/api/v1/posts", postRoutes)
app.use("/api/v1/notifications", notificationRoutes)
app.use("/api/v1/links", linkRoutes)
app.use("/api/v1/search", searchRoutes)
app.use("/api/v1/jobs", jobRoutes)
app.use("/api/v1/discussions", discussionRoutes)
app.use("/api/v1/events", eventRoutes)
app.use("/api/v1/admin", adminRoutes)
app.use("/api/v1/mentorships", mentorshipRoutes)
app.use("/api/v1/stream", streamRoutes)
app.use("/api/v1/messages", messageRoutes)
app.use("/api/v1/achievements", achievementsRoutes)
app.use("/api/v1/feedbacks", feedbackRoutes)
app.use("/api/v1/reports", reportRoutes)

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    connectDB();
})