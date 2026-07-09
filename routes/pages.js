import express from "express";
import {
  createPage,
  getPages,
  getPageBySlug,
  updatePage,
  deletePage
} from "../controllers/pageController.js";

const router = express.Router();

router.post("/", createPage);
router.get("/", getPages);
router.get("/:slug", getPageBySlug);
router.put("/:slug", updatePage);
router.delete("/:slug", deletePage);

export default router;