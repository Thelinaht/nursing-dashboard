import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import logo from "../assets/logo.png";

export default function Layout({ children, role = "nurse", logoSrc = logo, username = "User" }) {
  console.log("LOGO:", logoSrc);
  const navigate = useNavigate();

  let displayUsername = username;
  if (!username || username === "User") {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (user && user.full_name) {
        displayUsername = user.full_name;
      }
    } catch (err) {
      console.error("Failed to parse user from localStorage", err);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };


  return (
    <div style={styles.wrapper}>
      <Navbar username={displayUsername} />
      <div style={styles.body}>
        <Sidebar role={role} onLogout={handleLogout} logoSrc={logoSrc} />
        <div style={styles.content}>
          {children}
        </div>
      </div>
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
