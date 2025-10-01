import express from "express";
import { globalSearch, searchSuggestions } from "../controllers/searchController.js";
import { protectRoute } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protectRoute, globalSearch);
router.get("/suggestions", protectRoute, searchSuggestions);

export default router;