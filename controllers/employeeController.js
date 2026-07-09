import bcrypt from "bcryptjs";
import { db } from "../config/firebase.js";

const EMP_COLLECTION = "employees";

function normalizeEmployee(doc) {
  const data = doc.data() || {};
  const { password, ...safe } = data; 
  return {
    id: doc.id,
    ...safe,
  };
}

export const getEmployees = async (req, res) => {
  try {
    const snapshot = await db.collection(EMP_COLLECTION).get();
    const data = snapshot.docs
      .map(normalizeEmployee)
      .sort((a, b) => {
        const ad = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bd = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bd - ad;
      });

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const createEmployee = async (req, res) => {
  try {
    const {
      username,
      fullName = "",
      password,
      role = "employee",
      status = "active",
    } = req.body;

    if (!username?.trim()) {
      return res.status(400).json({ message: "username required" });
    }
    if (!password?.trim()) {
      return res.status(400).json({ message: "password required" });
    }

    const existing = await db
      .collection(EMP_COLLECTION)
      .where("username", "==", username.trim())
      .limit(1)
      .get();

    if (!existing.empty) {
      return res.status(409).json({ message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    const docRef = await db.collection(EMP_COLLECTION).add({
      username: username.trim(),
      fullName: fullName.trim(),
      password: hashedPassword,
      role,
      status,
      createdAt: now,
      updatedAt: now,
    });

    return res.status(201).json({
      id: docRef.id,
      message: "Employee created",
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, fullName, password, role, status } = req.body;

    const docRef = db.collection(EMP_COLLECTION).doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const updateData = {
      updatedAt: new Date().toISOString(),
    };

    if (typeof username === "string" && username.trim()) {
      updateData.username = username.trim();
    }

    if (typeof fullName === "string") {
      updateData.fullName = fullName.trim();
    }

    if (typeof role === "string" && role.trim()) {
      updateData.role = role;
    }

    if (typeof status === "string" && status.trim()) {
      updateData.status = status;
    }

    if (typeof password === "string" && password.trim()) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await docRef.update(updateData);

    return res.json({ success: true, message: "Employee updated" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const docRef = db.collection(EMP_COLLECTION).doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({ message: "Employee not found" });
    }

    await docRef.delete();
    return res.json({ success: true, message: "Employee deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};