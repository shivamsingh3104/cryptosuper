import express from "express";
import {
  getCompany,
  updateCompany
} from "../controllers/companyController.js";

const router = express.Router();

router.get("/", getCompany);
router.put("/", updateCompany);

export default router;