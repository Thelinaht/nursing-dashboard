import { useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import ChatHub from "./ChatHub";
import logo from "../assets/logo.png";
import { Bot, X, ChevronLeft } from "lucide-react";

export default function Layout({
  children,
  role = "nurse",
  logoSrc = logo,
  username = "User",
}) {
  const navigate = useNavigate();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDocked, setIsDocked] = useState(false);

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
      return JSON.parse(sessionStorage.getItem("user")) || {};
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
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
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

  const toggleDock = (e) => {
    e.stopPropagation();
    setIsDocked(!isDocked);
    if (isChatOpen) setIsChatOpen(false);
  };

  return (
    <div style={styles.wrapper}>
      <Navbar username={displayUsername} />
      <div style={styles.body}>
        <Sidebar role={role} onLogout={handleLogout} logoSrc={logoSrc} />
        <div style={styles.content}>{children}</div>
      </div>

      {/* Smart Assistant Chatbot window */}
      {isChatOpen && !isDocked && (
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
              <X size={18} />
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

      {/* Floating Chatbot Button (Assistant) */}
      <div 
        style={{
            ...styles.floatingControl,
            right: isDocked ? "-45px" : "30px",
            opacity: isDocked ? 0.7 : 1
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isHovered && !isDocked && (
            <button 
                title="Minimize to side"
                onClick={toggleDock}
                style={styles.minimizeBtn}
            >
                <X size={12} />
            </button>
        )}

        <button
            title={isDocked ? "Show Assistant" : "Open Smart Assistant"}
            onClick={() => isDocked ? setIsDocked(false) : setIsChatOpen(!isChatOpen)}
            style={{
                ...styles.chatbotFloatingBtn,
                transform: isHovered && !isDocked ? "translateY(-3px) scale(1.04)" : "none",
            }}
        >
            {isDocked ? <ChevronLeft size={24} style={{ marginRight: '15px' }} /> : <Bot size={28} />}
        </button>
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
  floatingControl: {
    position: "fixed",
    bottom: "105px",
    display: "flex",
    alignItems: "center",
    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    zIndex: 1000,
  },
  minimizeBtn: {
    position: "absolute",
    top: "-10px",
    left: "-10px",
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "#314259",
    color: "white",
    border: "2px solid white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 1001,
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  },
  chatbotFloatingBtn: {
    width: "60px",
    height: "60px",
    border: "none",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #4a6a85 0%, #314259 100%)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 8px 25px rgba(0, 0, 0, 0.2)",
    transition: "all 0.2s ease",
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
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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
