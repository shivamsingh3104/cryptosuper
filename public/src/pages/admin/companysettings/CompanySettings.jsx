import { useEffect, useState } from "react";
import { API, headers } from "../../../config/api";

// ✅ ADD THIS (ONLY NEW IMPORT)
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../../firebase";

export default function CompanySettings() {

  const [data, setData] = useState({
    name: "",
    tagline: "",
    about: "",
    logo: {
      light: "",
      dark: "",
      favicon: ""
    },
    address: {
      registered: "",
      city: "",
      state: "",
      country: ""
    },
    contact: {
      supportEmail: "",
      phone: ""
    },
    social: {
      instagram: "",
      linkedin: "",
      twitter: ""
    }
  });

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  // Track specific upload
  const [uploadingType, setUploadingType] = useState(null); 

  const showMsg = (m) => {
    setMsg(m);
    setTimeout(() => setMsg(""), 4000);
  };


  // load refressd data start 
  const loadCompany = async () => {
  try {
    const res = await fetch(`${API}/api/company?ts=${Date.now()}`);
    const d = await res.json();

    if (!d) return;

    setData({
      name: d?.name || "",
      tagline: d?.tagline || "",
      about: d?.about || "",
      logo: {
        light: d?.logo?.light || "",
        dark: d?.logo?.dark || "",
        favicon: d?.logo?.favicon || ""
      },
      address: {
        registered: d?.address?.registered || "",
        city: d?.address?.city || "",
        state: d?.address?.state || "",
        country: d?.address?.country || ""
      },
      contact: {
        supportEmail: d?.contact?.supportEmail || "",
        phone: d?.contact?.phone || ""
      },
      social: {
        instagram: d?.social?.instagram || "",
        linkedin: d?.social?.linkedin || "",
        twitter: d?.social?.twitter || ""
      }
    });

  } catch {
    showMsg("❌ Failed to load settings");
  }
};

  // end

  useEffect(() => {
    loadCompany();
  }, []);

  // 🔥 LOAD DATA (UNCHANGED)
  // useEffect(() => {
  //   fetch(`${API}/api/company`)
  //     .then(res => res.json())
  //     .then(d => {
  //       if (!d) return;

  //       setData({
  //         name: d?.name || "",
  //         tagline: d?.tagline || "",
  //         about: d?.about || "",
  //         logo: {
  //           light: d?.logo?.light || "",
  //           dark: d?.logo?.dark || "",
  //           favicon: d?.logo?.favicon || ""
  //         },
  //         address: {
  //           registered: d?.address?.registered || "",
  //           city: d?.address?.city || "",
  //           state: d?.address?.state || "",
  //           country: d?.address?.country || ""
  //         },
  //         contact: {
  //           supportEmail: d?.contact?.supportEmail || "",
  //           phone: d?.contact?.phone || ""
  //         },
  //         social: {
  //           instagram: d?.social?.instagram || "",
  //           linkedin: d?.social?.linkedin || "",
  //           twitter: d?.social?.twitter || ""
  //         }
  //       });
  //     })
  //     .catch(() => showMsg("❌ Failed to load settings"));
  // }, []);

  // ✅ NEW FUNCTION (ADD ONLY THIS)
  const uploadImage = async (file) => {
    const storageRef = ref(storage, `logos/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  // 🔥 FIXED IMAGE FUNCTION (ONLY CHANGE)
  const handleImage = (e, type) => {
  const file = e.target.files[0];
  if (!file) return;

  const img = new Image();
  const reader = new FileReader();

  reader.onload = (event) => {
    img.src = event.target.result;
  };

  img.onload = () => {
    const canvas = document.createElement("canvas");

    const MAX_WIDTH = 300;
    const scale = MAX_WIDTH / img.width;

    canvas.width = MAX_WIDTH;
    canvas.height = img.height * scale;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const compressed = canvas.toDataURL("image/jpeg", 0.7); // 👈 compress

    setData(prev => ({
      ...prev,
      logo: {
        ...prev.logo,
        [type]: compressed
      }
    }));

    showMsg("✅ Image optimized & ready");
  };

  reader.readAsDataURL(file);
};

  // 🔥 SAVE (UNCHANGED)
  const save = async () => {
    setLoading(true);
    showMsg("⏳ Saving settings...");

    console.log("SAVING DATA:", data);

    try {
      const res = await fetch(`${API}/api/company`, {
        method: "PUT",
        headers,
        body: JSON.stringify(data)
      });

      if (!res.ok) throw new Error();

      showMsg("✅ Saved all settings successfully");
      await loadCompany();

    } catch (err) {
      console.log(err);
      showMsg("❌ Save error");
    }

    setLoading(false);
  };

  return (
    <div className="adm-comp-wrapper">
      {/* Google Material Icons */}
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />

      <style>{`
        .adm-comp-wrapper {
          padding: 30px;
          background: #f4f7fe;
          min-height: 100vh;
          font-family: 'Inter', system-ui, sans-serif;
          color: #2b3674;
        }

        /* Toast Popup */
        .adm-toast-fixed {
          position: fixed;
          top: 25px;
          right: 25px;
          z-index: 10000;
          background: #fff;
          color: #1b2559;
          padding: 15px 30px;
          border-radius: 15px;
          font-weight: 700;
          font-size: 14px;
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
          border: 1px solid #eee;
          animation: slideInRight 0.3s ease;
        }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }

        /* Header Area */
        .adm-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 15px;
        }
        .adm-title h1 {
          font-size: 26px;
          font-weight: 800;
          margin: 0;
          color: #1b2559;
        }
        .adm-title p {
          margin: 5px 0 0 0;
          color: #a3aed0;
          font-size: 14px;
        }

        /* Card System */
        .adm-settings-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 1100px) { .adm-settings-grid { grid-template-columns: 1fr; } }

        .adm-card {
          background: white;
          border-radius: 16px;
          padding: 25px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
          border: 1px solid #e0e5f2;
        }
        .adm-card h3 {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 20px 0;
          font-size: 16px;
          font-weight: 700;
          color: #1b2559;
          border-bottom: 1px solid #f0f2f5;
          padding-bottom: 12px;
        }
        .adm-card h3 span.material-icons { color: #4318ff; }

        /* Form Controls */
        .form-group { margin-bottom: 18px; }
        .form-group label {
          display: block;
          font-size: 12px;
          color: #1b2559;
          margin-bottom: 8px;
          font-weight: 600;
          margin-left: 2px;
        }
        .adm-input, .adm-textarea {
          width: 100%;
          padding: 12px 16px;
          background: #fff;
          border: 1px solid #d1d5db;
          color: #1b2559;
          border-radius: 12px;
          font-size: 14px;
          box-sizing: border-box;
          transition: 0.2s;
        }
        .adm-input:focus, .adm-textarea:focus {
          border-color: #4318ff;
          outline: none;
          box-shadow: 0 0 0 3px rgba(67, 24, 255, 0.1);
        }
        .adm-textarea { min-height: 100px; resize: vertical; }

        /* Logo UX */
        .logo-upload-box {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 15px;
        }
        .logo-item {
          background: #f8fafc;
          padding: 15px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          text-align: center;
        }
        .logo-item img {
          max-height: 40px;
          max-width: 100px;
          object-fit: contain;
          margin-top: 10px;
          display: block;
          margin-left: auto;
          margin-right: auto;
        }
        .empty-logo {
          height: 40px; width: 40px; background: #e0e7ff; color: #4318ff;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          margin-top: 10px; margin-left: auto; margin-right: auto; font-weight: bold; font-size: 18px;
        }
        .custom-file-upload {
          margin-top: 10px; display: inline-block; padding: 6px 12px;
          background: white; border: 1px solid #d1d5db; color: #4b5563;
          border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;
        }
        .custom-file-upload:hover { background: #f9fafb; }

        /* Actions */
        .save-btn {
          background: #4318ff;
          padding: 12px 30px;
          border: none;
          color: #fff;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: 0.2s;
        }
        .save-btn:hover { background: #3311db; transform: translateY(-2px); }
        .save-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

        .field-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        @media (max-width: 600px) { .field-grid-2 { grid-template-columns: 1fr; } }
      `}</style>

      {msg && <div className="adm-toast-fixed">{msg}</div>}

      <div className="adm-head">
        <div className="adm-title">
          <h1>Company Profile</h1>
          <p>Global settings and brand asset management</p>
        </div>
        <button className="save-btn" onClick={save} disabled={loading}>
          <span className="material-icons">{loading ? 'hourglass_top' : 'save'}</span>
          {loading ? "Saving changes..." : "Save Settings"}
        </button>
      </div>

      <div className="adm-settings-grid">
        {/* BASIC */}
        <div className="adm-card">
          <h3><span className="material-icons">info</span> Basic Information</h3>
          <div className="form-group">
            <label>Legal Company Name</label>
            <input
              className="adm-input"
              placeholder="Ex: Acme Corporation Ltd."
              value={data.name}
              onChange={e => setData({ ...data, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Tagline / Punchline</label>
            <input
              className="adm-input"
              placeholder="Ex: Innovation Redefined"
              value={data.tagline}
              onChange={e => setData({ ...data, tagline: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>About Company</label>
            <textarea
              className="adm-textarea"
              placeholder="Enter brief company description..."
              value={data.about}
              onChange={e => setData({ ...data, about: e.target.value })}
            />
          </div>
        </div>

        {/* LOGO */}
        <div className="adm-card">
          <h3><span className="material-icons">monochrome_photos</span> Brand Assets (Logos)</h3>
          <div className="logo-upload-box">
            <div className="logo-item">
              <label>Light Logo</label>
              {data.logo.light ? <img src={data.logo.light} /> : <div className="empty-logo">L</div>}
              <label className="custom-file-upload">
                <input type="file" style={{display:'none'}} onChange={(e) => handleImage(e, "light")} />
                {uploadingType === "light" ? "Wait..." : "Change"}
              </label>
            </div>
            <div className="logo-item">
              <label>Dark Logo</label>
              {data.logo.dark ? <img src={data.logo.dark} /> : <div className="empty-logo">D</div>}
              <label className="custom-file-upload">
                <input type="file" style={{display:'none'}} onChange={(e) => handleImage(e, "dark")} />
                {uploadingType === "dark" ? "Wait..." : "Change"}
              </label>
            </div>
            <div className="logo-item">
              <label>Favicon</label>
              {data.logo.favicon ? <img src={data.logo.favicon} /> : <div className="empty-logo">F</div>}
              <label className="custom-file-upload">
                <input type="file" style={{display:'none'}} onChange={(e) => handleImage(e, "favicon")} />
                {uploadingType === "favicon" ? "Wait..." : "Change"}
              </label>
            </div>
          </div>
        </div>

        {/* ADDRESS */}
        <div className="adm-card">
          <h3><span className="material-icons">pin_drop</span> Registered Address</h3>
          <div className="form-group">
            <label>Registered Street / Premises</label>
            <input className="adm-input" value={data.address.registered} placeholder="Street, Building Name"
              onChange={e => setData({ ...data, address: { ...data.address, registered: e.target.value } })}
            />
          </div>
          <div className="field-grid-2">
            <div className="form-group">
              <label>City</label>
              <input className="adm-input" value={data.address.city} placeholder="Ex: New Delhi"
                onChange={e => setData({ ...data, address: { ...data.address, city: e.target.value } })}
              />
            </div>
            <div className="form-group">
              <label>State / Province</label>
              <input className="adm-input" value={data.address.state} placeholder="Ex: Delhi"
                onChange={e => setData({ ...data, address: { ...data.address, state: e.target.value } })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Country</label>
            <input className="adm-input" value={data.address.country} placeholder="Ex: India"
              onChange={e => setData({ ...data, address: { ...data.address, country: e.target.value } })}
            />
          </div>
        </div>

        {/* CONTACT & SOCIAL */}
        <div className="adm-card">
          <h3><span className="material-icons">phone_android</span> Support & Social</h3>
          <div className="field-grid-2">
            <div className="form-group">
              <label>Support Email Address</label>
              <input className="adm-input" value={data.contact.supportEmail} placeholder="help@comp.com"
                onChange={e => setData({ ...data, contact: { ...data.contact, supportEmail: e.target.value } })}
              />
            </div>
            <div className="form-group">
              <label>Business Phone Number</label>
              <input className="adm-input" value={data.contact.phone} placeholder="Ex: +91 98..."
                onChange={e => setData({ ...data, contact: { ...data.contact, phone: e.target.value } })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Instagram Page URL</label>
            <input className="adm-input" value={data.social.instagram} placeholder="Ex: https://instagram..."
              onChange={e => setData({ ...data, social: { ...data.social, instagram: e.target.value } })}
            />
          </div>
          <div className="field-grid-2">
            <div className="form-group">
              <label>LinkedIn Page</label>
              <input className="adm-input" value={data.social.linkedin} placeholder="Profile URL"
                onChange={e => setData({ ...data, social: { ...data.social, linkedin: e.target.value } })}
              />
            </div>
            <div className="form-group">
              <label>X (Twitter) Profile</label>
              <input className="adm-input" value={data.social.twitter} placeholder="Profile URL"
                onChange={e => setData({ ...data, social: { ...data.social, twitter: e.target.value } })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}