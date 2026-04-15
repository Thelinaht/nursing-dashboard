import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import logo from "../assets/logo.png";

export default function Layout({
  children,
  role = "nurse",
  logoSrc = logo,
  username = "User",
}) {
  const navigate = useNavigate();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! I’m your smart assistant. Ask me about your profile, training, license, requests, or notifications.",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  }, []);

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

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;

    const userText = inputMessage.trim();

    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setInputMessage("");
    setIsSending(true);

    try {
      const response = await fetch("http://localhost:4000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userText,
          userId: currentUser.user_id || currentUser.id || 1,
          role,
        }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: data.reply || "No response received.",
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Unable to connect to the server right now.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <div style={styles.wrapper}>
      <Navbar username={displayUsername} />
      <div style={styles.body}>
        <Sidebar role={role} onLogout={handleLogout} logoSrc={logoSrc} />
        <div style={styles.content}>{children}</div>
      </div>

      {isChatOpen && (
        <div style={styles.chatWindow}>
          <div style={styles.chatHeader}>
            <div>
              <p style={styles.chatHeaderLabel}>Smart Assistant</p>
              <h3 style={styles.chatHeaderTitle}>Hospital Chatbot</h3>
            </div>

            <button
              style={styles.chatCloseBtn}
              onClick={() => setIsChatOpen(false)}
            >
              ×
            </button>
          </div>

          <div style={styles.chatBody}>
            {messages.map((msg, index) => (
              <div
                key={index}
                style={msg.sender === "user" ? styles.userMessage : styles.botMessage}
              >
                {msg.text}
              </div>
            ))}

            {isSending && <div style={styles.botMessage}>Typing...</div>}
          </div>

          <div style={styles.chatFooter}>
            <input
              type="text"
              placeholder="Type your message here..."
              style={styles.chatInput}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleInputKeyDown}
            />
            <button style={styles.sendBtn} onClick={handleSendMessage}>
              Send
            </button>
          </div>
        </div>
      )}

      <button
        title="Open Chat"
        onClick={() => setIsChatOpen((prev) => !prev)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsPressed(false);
        }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        style={{
          ...styles.chatbotFloatingBtn,
          ...(isHovered ? styles.chatbotFloatingBtnHover : {}),
          ...(isPressed ? styles.chatbotFloatingBtnPressed : {}),
        }}
      >
        <span style={styles.chatbotBtnRing}></span>
        <span style={styles.chatbotPulse}></span>

        <svg
          style={styles.chatbotIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
          <path d="M8 10h8" />
          <path d="M8 14h5" />
        </svg>
      </button>
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
  chatbotFloatingBtn: {
    position: "fixed",
    bottom: "28px",
    right: "28px",
    width: "70px",
    height: "70px",
    border: "none",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #4a6a85 0%, #5f7f99 100%)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow:
      "0 12px 28px rgba(74, 106, 133, 0.28), 0 4px 10px rgba(0, 0, 0, 0.08)",
    zIndex: 1000,
    transition: "all 0.2s ease",
  },
  chatbotFloatingBtnHover: {
    transform: "translateY(-3px) scale(1.04)",
    boxShadow:
      "0 18px 34px rgba(74, 106, 133, 0.34), 0 8px 16px rgba(0, 0, 0, 0.12)",
    background: "linear-gradient(135deg, #43627c 0%, #597892 100%)",
  },
  chatbotFloatingBtnPressed: {
    transform: "scale(0.96)",
  },
  chatbotBtnRing: {
    position: "absolute",
    width: "84px",
    height: "84px",
    borderRadius: "50%",
    border: "2px solid rgba(74, 106, 133, 0.14)",
    pointerEvents: "none",
  },
  chatbotPulse: {
    position: "absolute",
    width: "92px",
    height: "92px",
    borderRadius: "50%",
    backgroundColor: "rgba(74, 106, 133, 0.08)",
    pointerEvents: "none",
  },
  chatbotIcon: {
    width: "30px",
    height: "30px",
    position: "relative",
    zIndex: 2,
  },
  chatWindow: {
    position: "fixed",
    bottom: "112px",
    right: "28px",
    width: "360px",
    height: "500px",
    backgroundColor: "#ffffff",
    borderRadius: "22px",
    boxShadow: "0 20px 50px rgba(44, 62, 80, 0.18)",
    border: "1px solid rgba(106, 143, 170, 0.12)",
    zIndex: 999,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  chatHeader: {
    padding: "18px 18px 16px",
    background: "linear-gradient(135deg, #f8fbff 0%, #edf4fa 100%)",
    borderBottom: "1px solid rgba(106, 143, 170, 0.12)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chatHeaderLabel: {
    margin: 0,
    fontSize: "11px",
    fontWeight: "700",
    color: "#8ea2b5",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  chatHeaderTitle: {
    margin: "4px 0 0",
    fontSize: "18px",
    color: "#243647",
  },
  chatCloseBtn: {
    border: "none",
    background: "rgba(74, 106, 133, 0.08)",
    color: "#4a6a85",
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "22px",
    lineHeight: 1,
  },
  chatBody: {
    flex: 1,
    padding: "18px",
    backgroundColor: "#f8fbfd",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  botMessage: {
    maxWidth: "85%",
    backgroundColor: "#e8f0f7",
    color: "#243647",
    padding: "12px 14px",
    borderRadius: "16px 16px 16px 6px",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  userMessage: {
    marginLeft: "auto",
    maxWidth: "85%",
    backgroundColor: "#4a6a85",
    color: "#ffffff",
    padding: "12px 14px",
    borderRadius: "16px 16px 6px 16px",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  chatFooter: {
    display: "flex",
    gap: "10px",
    padding: "14px",
    borderTop: "1px solid rgba(106, 143, 170, 0.12)",
    backgroundColor: "#ffffff",
  },
  chatInput: {
    flex: 1,
    border: "1px solid rgba(106, 143, 170, 0.18)",
    borderRadius: "14px",
    padding: "12px 14px",
    fontSize: "14px",
    outline: "none",
    color: "#243647",
  },
  sendBtn: {
    border: "none",
    backgroundColor: "#4a6a85",
    color: "#ffffff",
    borderRadius: "14px",
    padding: "0 16px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
  },
};
