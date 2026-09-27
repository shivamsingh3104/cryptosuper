import { useCallback, useEffect, useState } from "react";
import { API, headers } from "../../config/api";

export default function EmployeesSection() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [empLoading, setEmpLoading] = useState(false);
  const [empSearch, setEmpSearch] = useState("");
  const [empFilter, setEmpFilter] = useState("all");
  const [msg, setMsg] = useState("");
  
  // Password Visibility Toggle
  const [showPass, setShowPass] = useState(false);

  const [empForm, setEmpForm] = useState({
    id: null,
    username: "",
    fullName: "",
    password: "",
    role: "employee",
    status: "active",
  });

  const showMsg = (m) => {
    setMsg(m);
    setTimeout(() => setMsg(""), 3000);
  };

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/employees`, { headers });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      showMsg("❌ Failed to load employees");
    } finally {
      setLoading(false);
      setEmpLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const resetEmpForm = () => {
    setShowPass(false);
    setEmpForm({
      id: null,
      username: "",
      fullName: "",
      password: "",
      role: "employee",
      status: "active",
    });
  };

  const handleEmpEdit = (emp) => {
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll up to show form
    setShowPass(false);
    setEmpForm({
      id: emp.id || emp._id || emp.uid,
      username: emp.username || "",
      fullName: emp.fullName || "",
      password: "", // Security: don't fill password
      role: emp.role || "employee",
      status: emp.status || "active",
    });
  };

  const handleEmpSave = async (e) => {
    e.preventDefault();
    if (!empForm.username.trim()) return showMsg("❌ Username is required");
    if (!empForm.id && !empForm.password.trim()) return showMsg("❌ Password is required");

    try {
      setEmpLoading(true);
      const payload = {
        username: empForm.username.trim(),
        fullName: empForm.fullName.trim(),
        role: empForm.role,
        status: empForm.status,
      };
      if (empForm.password.trim()) payload.password = empForm.password;
      const url = empForm.id ? `${API}/api/employees/${empForm.id}` : `${API}/api/employees`;
      const method = empForm.id ? "PUT" : "POST";
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Operation failed");
      showMsg(empForm.id ? "✅ Updated Successfully" : "✅ Created Successfully");
      resetEmpForm();
      await fetchEmployees();
    } catch (err) {
      showMsg(`❌ ${err.message}`);
    } finally {
      setEmpLoading(false);
    }
  };

  const handleEmpDelete = async (id) => {
    if (!window.confirm("Delete this employee permanently?")) return;
    try {
      setEmpLoading(true);
      const res = await fetch(`${API}/api/employees/${id}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error("Delete failed");
      showMsg("✅ Deleted Successfully");
      if (empForm.id === id) resetEmpForm();
      await fetchEmployees();
    } catch (err) {
      showMsg(`❌ ${err.message}`);
    } finally {
      setEmpLoading(false);
    }
  };

  // State Change Helper (This fixes the "nothing showing" issue)
  const onInputChange = (key, val) => {
    setEmpForm(prev => ({ ...prev, [key]: val }));
  };

  const filteredEmployees = employees.filter(emp => {
    const q = empSearch.toLowerCase();
    const matchSearch = !q || (emp.username || "").toLowerCase().includes(q) || (emp.fullName || "").toLowerCase().includes(q) || (emp.role || "").toLowerCase().includes(q);
    const matchFilter = empFilter === "all" ? true : empFilter === "active" ? emp.status === "active" : empFilter === "inactive" ? emp.status === "inactive" : empFilter === "manager" ? emp.role === "manager" : empFilter === "employee" ? emp.role === "employee" : true;
    return matchSearch && matchFilter;
  });

  return (
    <div className="adm-root">
      {/* Material Icons Link */}
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      
      <style>{`
        .adm-root { padding: 20px; background: #f0f2f5; min-height: 100vh; font-family: 'Inter', sans-serif; }
        
        .toast-popup { position: fixed; top: 20px; right: 20px; z-index: 9999; padding: 15px 25px; border-radius: 8px; color: white; font-weight: 600; box-shadow: 0 4px 12px rgba(0,0,0,0.1); animation: fadeInRight 0.3s ease; }
        @keyframes fadeInRight { from { transform: translateX(50px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

        .adm-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; flex-wrap: wrap; gap: 10px; }
        .adm-header h1 { margin: 0; color: #1a202c; font-size: 24px; }

        /* Toolbar */
        .adm-toolbar { background: white; padding: 15px; border-radius: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; gap: 15px; flex-wrap: wrap; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .search-box { position: relative; flex: 1; min-width: 250px; }
        .search-box input { width: 100%; padding: 10px 10px 10px 40px; border-radius: 8px; border: 1px solid #d1d5db; outline: none; font-size: 14px; color: #1f2937; }
        .search-box .material-icons { position: absolute; left: 12px; top: 10px; color: #9ca3af; font-size: 20px; }

        .filter-btn-group { display: flex; gap: 5px; flex-wrap: wrap; }
        .filter-btn { padding: 6px 14px; border-radius: 20px; border: none; cursor: pointer; font-size: 13px; font-weight: 600; background: #e5e7eb; color: #4b5563; transition: 0.2s; }
        .filter-btn.active { background: #4f46e5; color: white; }

        /* Grid */
        .adm-main-grid { display: grid; grid-template-columns: 350px 1fr; gap: 20px; }
        @media (max-width: 1024px) { .adm-main-grid { grid-template-columns: 1fr; } }

        .adm-card { background: white; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; height: fit-content; }
        .adm-card h3 { margin: 0 0 20px 0; color: #111827; font-size: 18px; border-bottom: 1px solid #f3f4f6; padding-bottom: 10px; }

        /* Inputs */
        .input-wrapper { margin-bottom: 15px; position: relative; }
        .input-wrapper label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #374151; }
        .adm-input-field { width: 100%; padding: 11px; border: 1px solid #d1d5db; border-radius: 8px; box-sizing: border-box; font-size: 14px; color: #111827; background: #ffffff; }
        .adm-input-field:focus { border-color: #4f46e5; outline: none; box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1); }
        
        /* Password Toggle Icon */
        .eye-icon-btn { position: absolute; right: 10px; top: 34px; background: none; border: none; cursor: pointer; color: #6b7280; padding: 0; display: flex; align-items: center; height: 38px; z-index: 5; }
        .eye-icon-btn:hover { color: #4f46e5; }

        /* Table Responsiveness */
        .table-scroll-container { width: 100%; overflow-x: auto; background: white; border-radius: 12px; border: 1px solid #e5e7eb; }
        .adm-data-table { width: 100%; border-collapse: collapse; min-width: 700px; }
        .adm-data-table th { background: #f9fafb; padding: 12px 15px; text-align: left; font-size: 12px; color: #6b7280; border-bottom: 2px solid #f3f4f6; text-transform: uppercase; font-weight: 700; }
        .adm-data-table td { padding: 14px 15px; border-bottom: 1px solid #f3f4f6; font-size: 14px; vertical-align: middle; color: #1f2937; }
        
        /* Badge UI */
        .status-badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; }
        .status-badge.active { background: #dcfce7; color: #15803d; }
        .status-badge.inactive { background: #fee2e2; color: #b91c1c; }

        /* Action Buttons */
        .action-flex { display: flex; gap: 8px; }
        .btn-icon-text { padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; border: 1px solid transparent; display: flex; align-items: center; gap: 4px; transition: 0.2s; }
        .edit-btn { background: #eff6ff; color: #1d4ed8; border-color: #dbeafe; }
        .edit-btn:hover { background: #1d4ed8; color: white; }
        .delete-btn { background: #fef2f2; color: #b91c1c; border-color: #fee2e2; }
        .delete-btn:hover { background: #b91c1c; color: white; }

        .btn-primary { background: #4f46e5; color: white; width: 100%; padding: 12px; border-radius: 8px; border: none; font-weight: 700; cursor: pointer; margin-top: 10px; transition: 0.2s; }
        .btn-primary:hover { background: #4338ca; }
        .btn-outline { background: white; border: 1px solid #d1d5db; width: 100%; padding: 10px; border-radius: 8px; margin-top: 8px; cursor: pointer; font-weight: 600; color: #4b5563; }
        .btn-outline:hover { background: #f9fafb; }
      `}</style>

      {/* Message Toast */}
      {msg && (
        <div className="toast-popup" style={{ background: msg.startsWith("✅") ? "#10b981" : "#ef4444" }}>
          {msg}
        </div>
      )}

      {/* Header */}
      <div className="adm-header">
        <h1>Employee Management</h1>
        <div className="action-flex">
          <button className="btn-icon-text edit-btn" style={{ background: 'white' }} onClick={fetchEmployees}>
            <span className="material-icons" style={{fontSize:'18px'}}>refresh</span> Refresh
          </button>
          <button className="btn-icon-text btn-primary" style={{ width: 'auto', padding: '8px 16px', margin: 0 }} onClick={resetEmpForm}>
            <span className="material-icons" style={{fontSize:'18px'}}>add</span> New Member
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="adm-toolbar">
        <div className="search-box">
          <span className="material-icons">search</span>
          <input
            placeholder="Search by name, role or username..."
            value={empSearch}
            onChange={e => setEmpSearch(e.target.value)}
          />
        </div>
        <div className="filter-btn-group">
          {["all", "employee", "manager", "active", "inactive"].map(f => (
            <button
              key={f}
              onClick={() => setEmpFilter(f)}
              className={`filter-btn ${empFilter === f ? 'active' : ''}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Layout */}
      <div className="adm-main-grid">
        {/* Left Side: Form */}
        <div className="adm-card">
          <h3>{empForm.id ? "✏️ Edit Employee" : "👤 Create Profile"}</h3>
          <form onSubmit={handleEmpSave}>
            <div className="input-wrapper">
              <label>Full Name</label>
              <input 
                className="adm-input-field" 
                value={empForm.fullName} 
                onChange={e => onInputChange("fullName", e.target.value)} 
                placeholder="Ex: John Doe" 
              />
            </div>
            <div className="input-wrapper">
              <label>Username</label>
              <input 
                className="adm-input-field" 
                value={empForm.username} 
                onChange={e => onInputChange("username", e.target.value)} 
                placeholder="Ex: john.doe" 
              />
            </div>
            <div className="input-wrapper">
              <label>Password {empForm.id && "(Leave blank to keep same)"}</label>
              <input
                type={showPass ? "text" : "password"}
                className="adm-input-field"
                value={empForm.password}
                onChange={e => onInputChange("password", e.target.value)}
                placeholder="••••••••"
              />
              <button type="button" className="eye-icon-btn" onClick={() => setShowPass(!showPass)}>
                <span className="material-icons">{showPass ? "visibility" : "visibility_off"}</span>
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
              <div className="input-wrapper">
                <label>Role</label>
                <select className="adm-input-field" value={empForm.role} onChange={e => onInputChange("role", e.target.value)}>
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="support">Support</option>
                </select>
              </div>
              <div className="input-wrapper">
                <label>Status</label>
                <select className="adm-input-field" value={empForm.status} onChange={e => onInputChange("status", e.target.value)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={empLoading}>
              {empLoading ? "Saving..." : empForm.id ? "Update Employee" : "Save Employee"}
            </button>
            <button type="button" className="btn-outline" onClick={resetEmpForm}>Cancel / Clear</button>
          </form>
        </div>

        {/* Right Side: Table */}
        <div className="table-scroll-container">
          <table className="adm-data-table">
            <thead>
              <tr>
                <th style={{ width: '50px', textAlign: 'center' }}>S.No</th>
                <th>Employee</th>
                <th>Role</th>
                <th>Status</th>
                <th>Date Joined</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Loading...</td></tr>
              ) : filteredEmployees.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>No records found</td></tr>
              ) : (
                filteredEmployees.map((emp, i) => (
                  <tr key={emp.id || emp._id || i}>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#9ca3af' }}>{i + 1}</td>
                    <td>
                      <div style={{ fontWeight: '700', color: '#111827' }}>{emp.fullName || "Unnamed"}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>@{emp.username}</div>
                    </td>
                    <td><span className="status-badge" style={{ background: '#f3f4f6', color: '#374151' }}>{emp.role}</span></td>
                    <td>
                      <span className={`status-badge ${emp.status === 'active' ? 'active' : 'inactive'}`}>
                        <span className="material-icons" style={{ fontSize: '12px' }}>{emp.status === 'active' ? 'check_circle' : 'cancel'}</span>
                        {emp.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize: '13px', color: '#6b7280' }}>
                      {emp.createdAt ? new Date(emp.createdAt).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td>
                      <div className="action-flex" style={{ justifyContent: 'center' }}>
                        <button className="btn-icon-text edit-btn" onClick={() => handleEmpEdit(emp)}>Edit</button>
                        <button className="btn-icon-text delete-btn" onClick={() => handleEmpDelete(emp.id || emp._id || emp.uid)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}