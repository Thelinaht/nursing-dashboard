import { useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import ChatHub from "./ChatHub";
import logo from "../assets/logo.png";

export default function Layout({
  children,
  role = "nurse",
  logoSrc = logo,
  username = "User",
}) {
  const navigate = useNavigate();



  const currentUser = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  }, []);

  let displayUsername = username;
  if (!username || username === "User") {
    try {
      const user = JSON.parse(sessionStorage.getItem("user"));
      if (user && user.full_name) {
        displayUsername = user.full_name;
      }
    } catch (err) {
      console.error("Failed to parse user from localStorage", err);
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    navigate("/");
  };



  return (
    <div style={styles.wrapper}>
      <Navbar username={displayUsername} />
      <div style={styles.body}>
        <Sidebar role={role} onLogout={handleLogout} logoSrc={logoSrc} />
        <div style={styles.content}>{children}</div>
      </div>



      {/* New Live Chat System (Staff-to-Staff) */}
      <ChatHub />
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    overflow: "hidden",
    backgroundColor: "#eef1f5",
    position: "relative",
  },
  body: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    padding: "24px",
    overflowY: "auto",
    boxSizing: "border-box",
  },

};
