import express from "express";
import { protectRoute } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/request/:userId", protectRoute, sendLinkRequest)
router.put("/accept/:userId", protectRoute, acceptLinkRequest)
router.put("/reject/:userId", protectRoute, rejectLinkRequest)
router.get("/requests", protectRoute, getLinkRequests) // get all link requests for the logged-in user
router.get("/", protectRoute, getUserLinks) // get all links for the logged-in user
router.delete("/:userId", protectRoute, removeLink)
router.get("/status/:userId", protectRoute, getLinkStatus)

export default router;