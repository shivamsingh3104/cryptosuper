import express from "express";
import multer from "multer";
import path from "path";

const router = express.Router();

// storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const name = Date.now() + path.extname(file.originalname);
    cb(null, name);
  }
});

const upload = multer({ storage });

// ✅ upload API
router.post("/", upload.single("file"), (req, res) => {
  try {
    res.json({
      url: `http://localhost:5001/uploads/${req.file.filename}`
    });
  } catch (err) {
    res.status(500).json({ message: "Upload failed" });
  }
});

export default router;