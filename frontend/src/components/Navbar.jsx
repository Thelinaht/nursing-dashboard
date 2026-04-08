export default function Navbar({ username = "User" }) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <header style={styles.navbar}>
      {/* Left */}
      <div style={styles.left}>
        <div style={styles.accentLine} />
        <div>
          <p style={styles.subtitle}>King Fahad University Hospital</p>
          <h1 style={styles.title}>Hello, {username} </h1>
        </div>
      </div>

      {/* Right */}
      <div style={styles.right}>
        <div style={styles.dateTime}>
          <span style={styles.time}>{timeStr}</span>
          <span style={styles.date}>{dateStr}</span>
        </div>
        <div style={styles.divider} />
        <button style={styles.iconBtn} title="Fullscreen" onClick={() => document.documentElement.requestFullscreen?.()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7a8fa6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        </button>
      </div>
    </header>
  );
}

const styles = {
  navbar: {
    height: "64px",
    backgroundColor: "#f0f4f8",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 28px",
    boxSizing: "border-box",
    borderBottom: "1px solid rgba(100,130,160,0.12)",
    flexShrink: 0,
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  accentLine: {
    width: "3px",
    height: "32px",
    backgroundColor: "#6a8faa",
    borderRadius: "4px",
  },
  subtitle: {
    margin: 0,
    fontSize: "10px",
    fontWeight: "500",
    color: "#9aacbe",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  title: {
    margin: 0,
    fontSize: "17px",
    fontWeight: "700",
    color: "#2c3e50",
    letterSpacing: "-0.01em",
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  dateTime: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "1px",
  },
  time: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#3d5166",
  },
  date: {
    fontSize: "10px",
    color: "#9aacbe",
    fontWeight: "500",
  },
  divider: {
    width: "1px",
    height: "28px",
    backgroundColor: "rgba(100,130,160,0.2)",
  },
  iconBtn: {
    background: "rgba(100,130,160,0.08)",
    border: "none",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
