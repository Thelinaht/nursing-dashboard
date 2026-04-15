import { NavLink } from "react-router-dom";

// ─── Icons ───────────────────────────────────────────────────────────────────
const I = {
  person: <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>,
  request: <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>,
  training: <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>,
  bell: <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
  staff: <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  addNurse: <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="16" y1="11" x2="22" y2="11" /></svg>,
  assign: <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
  ratio: <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>,
  report: <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>,
  calc: <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="12" y2="14" /></svg>,
  patient: <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>,
  staffing: <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  compliance: <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>,
  research: <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  evaluation: <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
};

// ─── Menu Config ──────────────────────────────────────────────────────────────
const menuConfig = {
  nurse: [
    { label: "Nurse Info", path: "/nurse-info", icon: I.person },
    { label: "Request", path: "/request", icon: I.request },
    { label: "Training", path: "/training", icon: I.training },
    { label: "Notifications", path: "/notifications", icon: I.bell },
  ],
  secretary: [
    { label: "Dashboard", path: "/secretary-dashboard", icon: I.staff },
    { label: "Add Nurse", path: "/add-nurse", icon: I.addNurse },
    { label: "Notifications", path: "/notifications", icon: I.bell },
  ],
  supervisor: [
    { label: "Dashboard", path: "/supervisor-dashboard", icon: I.dashboard },
    { label: "Assign Staff", path: "/assign-staff", icon: I.assign },
    { label: "Manage Requests", path: "/supervisor/manage-requests", icon: I.request },
    { label: "Nurse-to-Patient", path: "/ratio", icon: I.ratio },
    { label: "Notifications", path: "/notifications", icon: I.bell },
  ],
  assistantDirector: [
    { label: "Dashboard", path: "/dashboard", icon: I.dashboard },
    { label: "Manage Requests", path: "/requests", icon: I.request },
    { label: "Patient Care", path: "/patient-care", icon: I.patient },
    { label: "Staffing", path: "/staffing", icon: I.staffing },
    { label: "Notifications", path: "/notifications", icon: I.bell },
  ],
  director: [
    { label: "Dashboard", path: "/director-dashboard", icon: I.dashboard },
    { label: "Staff Directory", path: "/staff", icon: I.staff },
    { label: "Reports", path: "/reports", icon: I.report },
    { label: "Calculations", path: "/calculations", icon: I.calc },
    { label: "Notifications", path: "/notifications", icon: I.bell },
  ],
  associateDirector: [
    { label: "Dashboard", path: "/director-dashboard", icon: I.dashboard },
    { label: "Staff Directory", path: "/staff", icon: I.staff },
    { label: "Reports", path: "/reports", icon: I.report },
    { label: "Calculations", path: "/calculations", icon: I.calc },
    { label: "Notifications", path: "/notifications", icon: I.bell },
  ],
  qualityManager: [
    { label: "Dashboard", path: "/quality-manager-dashboard", icon: I.dashboard },
    { label: "Compliance", path: "/compliance", icon: I.compliance },
    { label: "Evaluation", path: "/evaluation", icon: I.evaluation },
    { label: "Reports", path: "/reports", icon: I.report },
    { label: "Notifications", path: "/notifications", icon: I.bell },
  ],
  researchDirector: [
    { label: "Dashboard", path: "/dashboard", icon: I.dashboard },
    { label: "Research", path: "/research", icon: I.research },
    { label: "Reports", path: "/reports", icon: I.report },
    { label: "Notifications", path: "/notifications", icon: I.bell },
  ],
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function Sidebar({ role = "nurse", onLogout, logoSrc }) {
  const menuItems = menuConfig[role] || menuConfig.nurse;

  return (
    <div style={styles.wrapper}>
      <aside style={styles.sidebar}>
        {/* Logo */}
        <div style={styles.logoArea}>
          {logoSrc ? (
            <img src={logoSrc} alt="Logo" style={{ width: 170 }} />) : (
            <div style={styles.logoFallback}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" width="20" height="28">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={styles.nav}>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                ...styles.navItem,
                ...(isActive ? styles.navItemActive : {}),
              })}
            >
              <div style={styles.iconCircle}>{item.icon}</div>
              <span style={styles.label}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <button style={styles.logoutBtn} onClick={onLogout}>
          <div style={styles.iconCircle}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </div>
          <span style={styles.label}>Log out</span>
        </button>
      </aside>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  wrapper: {
    width: "210px",
    height: "100%",        // change from 100vh to 100%
    backgroundColor: "#c8d8e8",
    display: "flex",
    alignItems: "stretch",
    padding: "16px 10px",
    boxSizing: "border-box",
    flexShrink: 0,
    overflowY: "auto",     // add this
  },
  sidebar: {
    flex: 1,
    overflowY: "auto",
    backgroundColor: "#b8cad8",
    borderRadius: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px 10px",
    boxSizing: "border-box",
    boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
  },
  logoArea: {
    marginBottom: "24px",
    display: "flex",
    justifyContent: "center",
  },
  logoImg: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    objectFit: "cover",
  },
  logoFallback: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    backgroundColor: "#5a7a99",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    width: "100%",
    flex: 1,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "6px 8px",
    borderRadius: "30px",
    textDecoration: "none",
    color: "#2c3e50",
    fontSize: "12.5px",
    fontWeight: "500",
    transition: "background 0.2s",
  },
  navItemActive: {
    backgroundColor: "rgba(220,232,242,0.85)",
  },
  iconCircle: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "#4a6a85",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  label: {
    whiteSpace: "nowrap",
    fontSize: "12.5px",
    fontWeight: "500",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "6px 8px",
    borderRadius: "30px",
    background: "none",
    border: "none",
    cursor: "pointer",
    width: "100%",
    color: "#2c3e50",
    fontSize: "12.5px",
    fontWeight: "500",
    marginTop: "8px",
  },
};
