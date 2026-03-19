import express from "express";
import upload from "../utils/upload.js";

const router = express.Router();

router.post("/", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    // Return relative path to be appended to backend URL
    const imageUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({ success: true, url: imageUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
