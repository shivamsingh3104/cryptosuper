import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import JoditEditor from "jodit-react";
import "jodit/es2021/jodit.min.css";
import { API, headers } from "../../../config/api";

export default function Pages() {
  const editor = useRef(null);

  // const [form, setForm] = useState({
  //   title: "",
  //   slug: "",
  //   content: "<p>Start writing...</p>",
  // });
  const [form, setForm] = useState({
  title: "",
  slug: "",
  content: "<p>Start writing...</p>",

  showInHeader: false,
  headerMenu: "",
  headerSubmenu: "",

  showInFooter: false,
  footerColumn: "",
});

  const [pages, setPages] = useState([]);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const config = useMemo(
    () => ({
      readonly: false,
      placeholder: "Write page content here...",
      height: 500,
      buttons: [
        "bold",
        "italic",
        "underline",
        "|",
        "ul",
        "ol",
        "|",
        "font",
        "fontsize",
        "brush",
        "|",
        "image",
        "link",
        "table",
        "|",
        "align",
        "undo",
        "redo",
        "|",
        "source",
      ],
      uploader: {
        insertImageAsBase64URI: true,
      },
    }),
    []
  );

  const showMsg = (m) => {
    setMsg(m);
    setTimeout(() => setMsg(""), 3000);
  };

  const loadPages = useCallback(() => {
    fetch(`${API}/api/pages`)
      .then(async (res) => {
        const data = await res.json().catch(() => []);
        if (!res.ok) throw new Error(data?.message || "Failed to load pages");
        return data;
      })
      .then((data) => setPages(data || []))
      .catch((err) => {
        console.error(err);
        showMsg(`❌ ${err.message || "Error loading pages"}`);
      });
  }, []);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  const handleTitle = (e) => {
    const title = e.target.value;
    setForm((prev) => ({
      ...prev,
      title,
      slug: title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    }));
  };

  const handleContentChange = useCallback((newContent) => {
    setForm((prev) => ({
      ...prev,
      content: typeof newContent === "string" ? newContent : "",
    }));
  }, []);

const save = async () => {
  try {
    const res = await fetch(
      editing ? `${API}/api/pages/${editing}` : `${API}/api/pages`,
      {
        method: editing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      }
    );

    const data = await res.json();

    console.log("RESPONSE:", data);

    if (!res.ok) {
      throw new Error(data.message || "Save failed");
    }

    showMsg("✅ Saved");
  } catch (err) {
    console.error("ERROR:", err);
    showMsg(err.message);
  }
};

  const handleEdit = (p) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setForm({
      title: p.title || "",
      slug: p.slug || "",
      content: typeof p.content === "string" ? p.content : "<p></p>",
    });
    setEditing(p.slug);
  };

  const handleDelete = async (slug) => {
    if (!window.confirm("Delete this page permanently?")) return;

    try {
      const res = await fetch(`${API}/api/pages/${slug}`, {
        method: "DELETE",
        headers: {
          ...(headers || {}),
          "Content-Type": "application/json",
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Delete failed");
      }

      showMsg("🗑️ Deleted");
      loadPages();
    } catch (err) {
      console.error(err);
      showMsg(`❌ ${err.message || "Delete failed"}`);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-[#f4f7fe] min-h-screen font-sans text-[#2b3674]">
      {msg && (
        <div
          className={`fixed top-5 right-5 z-[1000] px-6 py-4 rounded-xl font-bold shadow-xl border-l-4 bg-white ${
            msg.includes("✅")
              ? "border-green-500 text-green-600"
              : "border-red-500 text-red-600"
          }`}
        >
          {msg}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#1b2559]">Page Builder</h2>
          <p className="text-sm text-[#a3aed0] font-medium">
            Manage page content with the Jodit editor
          </p>
        </div>
        <button
          onClick={loadPages}
          className="bg-white px-5 py-2.5 rounded-xl font-bold shadow-sm border border-gray-100"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8">
        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-[#e0e5f2]">
          <div className="space-y-4 mb-5">
            <div>
              <label className="text-xs font-bold uppercase text-[#a3aed0] ml-1">Title</label>
              <input
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl mt-1 outline-none"
                placeholder="e.g. Terms of Service"
                value={form.title}
                onChange={handleTitle}
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-[#a3aed0] ml-1">URL Slug</label>
              <input
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl mt-1 outline-none"
                placeholder="url-path-name"
                value={form.slug}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
              />
            </div>

            {/* HEADER SETTINGS */}
<div className="mt-4">
  <label className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={form.showInHeader}
      onChange={(e) =>
        setForm((p) => ({ ...p, showInHeader: e.target.checked }))
      }
    />
    Show in Header
  </label>

  {form.showInHeader && (
    <>
      <input
        className="w-full mt-2 p-2 border rounded"
        placeholder="Menu Name (e.g. Support)"
        value={form.headerMenu}
        onChange={(e) =>
          setForm((p) => ({ ...p, headerMenu: e.target.value }))
        }
      />

      <input
        className="w-full mt-2 p-2 border rounded"
        placeholder="Submenu (optional)"
        value={form.headerSubmenu}
        onChange={(e) =>
          setForm((p) => ({ ...p, headerSubmenu: e.target.value }))
        }
      />
    </>
  )}
</div>

{/* FOOTER SETTINGS */}
<div className="mt-4">
  <label className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={form.showInFooter}
      onChange={(e) =>
        setForm((p) => ({ ...p, showInFooter: e.target.checked }))
      }
    />
    Show in Footer
  </label>

  {form.showInFooter && (
    <input
      className="w-full mt-2 p-2 border rounded"
      placeholder="Footer Column (e.g. Support)"
      value={form.footerColumn}
      onChange={(e) =>
        setForm((p) => ({ ...p, footerColumn: e.target.value }))
      }
    />
  )}
</div>
          </div>

          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <JoditEditor
              ref={editor}
              value={form.content}
              config={config}
              tabIndex={1}
              onBlur={handleContentChange}
              onChange={handleContentChange}
            />
          </div>

          <button
            onClick={save}
            disabled={loading}
            className="w-full mt-6 bg-[#4318ff] text-white p-4 rounded-xl font-bold disabled:bg-gray-300"
          >
            {loading ? "Processing..." : editing ? "Update Changes" : "Save & Publish"}
          </button>

          {editing && (
            <button
              onClick={() => {
                setEditing(null);
                setForm({ title: "", slug: "", content: "<p>Start writing...</p>" });
              }}
              className="w-full mt-2 bg-gray-100 text-[#a3aed0] p-3 rounded-xl font-bold"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="bg-white rounded-[20px] shadow-sm border border-[#e0e5f2] overflow-hidden self-start">
          <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-bold text-[#1b2559]">Manage Pages</h3>
            <span className="text-xs font-bold text-[#a3aed0] uppercase tracking-wider">
              {pages.length} Pages
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#f8fafc]">
                  <th className="p-4 text-center text-[11px] uppercase font-extrabold text-[#a3aed0] border-b border-[#f1f5f9] w-16">
                    S.No
                  </th>
                  <th className="p-4 text-left text-[11px] uppercase font-extrabold text-[#a3aed0] border-b border-[#f1f5f9]">
                    Page Details
                  </th>
                  <th className="p-4 text-center text-[11px] uppercase font-extrabold text-[#a3aed0] border-b border-[#f1f5f9]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {pages.map((p, i) => (
                  <tr key={p.slug || i} className="hover:bg-indigo-50/30 border-b border-gray-50">
                    <td className="p-4 text-center font-bold text-[#a3aed0]">{i + 1}</td>
                    <td className="p-4">
                      <div className="font-bold text-[#1b2559] text-sm">{p.title}</div>
                      <div className="text-xs text-[#a3aed0] tracking-tight">/page/{p.slug}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center items-center gap-2">
                        <a
                          href={`/page/${p.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-green-50 text-green-600 border border-green-100 font-bold text-[11px]"
                        >
                          View
                        </a>
                        <button
                          onClick={() => handleEdit(p)}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 font-bold text-[11px]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.slug)}
                          className="px-3 py-1.5 rounded-lg bg-red-50 text-red-500 border border-red-100 font-bold text-[11px]"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pages.length === 0 && (
                  <tr>
                    <td
                      colSpan="3"
                      className="p-20 text-center text-[#a3aed0] font-bold uppercase text-xs"
                    >
                      No pages found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}