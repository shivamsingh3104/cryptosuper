import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import {
  createEmployee,
  getEmployees,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employeeController.js";

const router = express.Router();

router.use(adminAuth);

router.get("/", getEmployees);
router.post("/", createEmployee);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

export default router;