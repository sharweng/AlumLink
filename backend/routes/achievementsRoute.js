import express from "express";
import {
    getPostsRecognition,
    getDiscussionsRecognition,
    getJobsRecognition,
    getEventsRecognition
} from "../controllers/achievementsController.js";
import { protectRoute } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protectRoute);

router.get("/posts", getPostsRecognition);
router.get("/discussions", getDiscussionsRecognition);
router.get("/jobs", getJobsRecognition);
router.get("/events", getEventsRecognition);

export default router;
