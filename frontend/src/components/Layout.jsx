import { useMemo, useState, useRef, useEffect } from "react";
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



  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const user = JSON.parse(sessionStorage.getItem("user")) || JSON.parse(localStorage.getItem("user"));
      if (!user || (!user.user_id && !user.id)) return;
      const activeUserId = user.user_id || user.id;

      const res = await fetch(`http://localhost:4000/api/notifications/user/${activeUserId}`, {
        headers: {
          'x-user-id': activeUserId.toString()
        }
      });
      if (res.ok) {
        const data = await res.json();
        // Count unread (where is_read is 0 or false)
        const unread = data.filter(n => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error("Failed to fetch unread notifications count:", err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    
    // Listen for custom event when notifications are read on the NotificationsPage
    window.addEventListener("notifications_updated", fetchUnreadCount);
    
    return () => {
      window.removeEventListener("notifications_updated", fetchUnreadCount);
    };
  }, []);

  return (
    <div style={styles.wrapper}>
      <Navbar username={displayUsername} />
      <div style={styles.body}>
        <Sidebar role={role} onLogout={handleLogout} logoSrc={logoSrc} unreadCount={unreadCount} />
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
