import React, { useState, useEffect } from "react";
import { Maximize, Minimize } from "lucide-react";

export default function Navbar({ username = "User" }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(err => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen?.();
    }
  };

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
        <button style={styles.iconBtn} title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"} onClick={toggleFullscreen}>
          {isFullscreen ? (
            <Minimize size={16} color="#7a8fa6" strokeWidth={2} />
          ) : (
            <Maximize size={16} color="#7a8fa6" strokeWidth={2} />
          )}
        </button>
      </div>
    </header>
  );
}

const styles = {
  navbar: {
    height: "64px",
    backgroundColor: "var(--bg-card)",
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
    backgroundColor: "var(--accent-blue)",
    borderRadius: "4px",
  },
  subtitle: {
    margin: 0,
    fontSize: "10px",
    fontWeight: "300",
    color: "var(--text-muted)",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  title: {
    margin: 0,
    fontSize: "17px",
    fontWeight: "500",
    color: "var(--text-primary)",
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
    fontWeight: "500",
    color: "#3d5166",
  },
  date: {
    fontSize: "10px",
    color: "#9aacbe",
    fontWeight: "300",
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
