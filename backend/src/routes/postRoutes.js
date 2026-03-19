import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
    createPost,
    getFeed,
    toggleLike,
    addComment
} from "../controllers/postController.js";

const router = express.Router();

router.get("/feed", getFeed);
router.post("/create", protect, createPost);
router.post("/:id/like", protect, toggleLike);
router.post("/:id/comment", protect, addComment);

export default router;
