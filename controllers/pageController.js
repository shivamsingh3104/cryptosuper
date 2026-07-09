import { db } from "../config/firebase.js";

// CREATE PAGE
export const createPage = async (req, res) => {
  try {
    const {
      title,
      slug,
      content,
      showInHeader,
      headerMenu,
      headerSubmenu,
      showInFooter,
      footerColumn,
    } = req.body;

    if (!title || !slug || content === undefined || content === null) {
      return res.status(400).json({ message: "All fields required" });
    }

    await db.collection("pages").doc(slug).set({
      title,
      slug,
      content: typeof content === "string" ? content : String(content || ""),

      // ✅ NEW
      showInHeader: !!showInHeader,
      headerMenu: headerMenu || "",
      headerSubmenu: headerSubmenu || "",

      showInFooter: !!showInFooter,
      footerColumn: footerColumn || "",

      createdAt: new Date(),
    });

    res.json({ success: true });
  } catch (err) {
    console.log("CREATE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET ALL PAGES
export const getPages = async (req, res) => {
  try {
    const snapshot = await db.collection("pages").get();
    const data = snapshot.docs.map((doc) => doc.data());
    res.json(data);
  } catch (err) {
    console.log("GET ALL ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET PAGE BY SLUG
export const getPageBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const doc = await db.collection("pages").doc(slug).get();

    if (!doc.exists) return res.json(null);

    res.json(doc.data());
  } catch (err) {
    console.log("GET ONE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// UPDATE PAGE
export const updatePage = async (req, res) => {
  try {
    const { slug } = req.params;

    const {
      title,
      slug: newSlug,
      content,
      showInHeader,
      headerMenu,
      headerSubmenu,
      showInFooter,
      footerColumn,
    } = req.body;

    const finalSlug = newSlug || slug;

    const data = {
      title: title || "",
      slug: finalSlug,
      content: typeof content === "string" ? content : String(content || ""),

      // ✅ NEW
      showInHeader: !!showInHeader,
      headerMenu: headerMenu || "",
      headerSubmenu: headerSubmenu || "",

      showInFooter: !!showInFooter,
      footerColumn: footerColumn || "",

      updatedAt: new Date(),
    };

    if (newSlug && newSlug !== slug) {
      await db.collection("pages").doc(newSlug).set(data);
      await db.collection("pages").doc(slug).delete();
    } else {
      await db.collection("pages").doc(slug).set(data, { merge: true });
    }

    res.json({ success: true });
  } catch (err) {
    console.log("UPDATE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// DELETE PAGE
export const deletePage = async (req, res) => {
  try {
    const { slug } = req.params;
    await db.collection("pages").doc(slug).delete();
    res.json({ success: true });
  } catch (err) {
    console.log("DELETE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};