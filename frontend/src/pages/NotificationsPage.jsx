import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import Layout from "../components/Layout";
import "../styles/NotificationsPage.css";

const Icons = {
  success: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  ),
  error: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  ),
  warning: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  ),
  info: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
  ),
  bell: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2c3e6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
  ),
  bellGhost: (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
  )
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [filterType, setFilterType] = useState("All");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
  const filterOptions = ["All", "Success", "Error", "Warning", "Info"];

  const fetchNotifications = async () => {
    if (!user || (!user.user_id && !user.id)) {
      setLoading(false);
      return;
    }

    try {
      const activeUserId = user.user_id || user.id;
      let url = `http://localhost:4000/api/notifications/user/${activeUserId}`;
      if (filterType !== "All") {
        url += `?type=${filterType.toLowerCase()}`;
      }

      const res = await fetch(url, {
        headers: {
          'x-user-id': activeUserId.toString()
        }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filterType]);

  const handleMarkAsRead = async (id) => {
    try {
      const activeUserId = user.user_id || user.id;
      const res = await fetch(`http://localhost:4000/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: {
          'x-user-id': activeUserId.toString()
        }
      });

      if (res.ok) {
        setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: 1 } : n));
        window.dispatchEvent(new Event("notifications_updated"));
      }
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const activeUserId = user.user_id || user.id;
      const res = await fetch(`http://localhost:4000/api/notifications/user/${activeUserId}/read-all`, {
        method: "PATCH",
        headers: {
          'x-user-id': activeUserId.toString()
        }
      });

      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
        window.dispatchEvent(new Event("notifications_updated"));
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const roleMap = {
    1: "nurse",
    2: "secretary",
    3: "supervisor",
    4: "director",
    5: "qualityManager",
    6: "trainingDirector",
    7: "researchDirector",
    8: "assistantDirector"
  };

  const titleMap = {
    1: "Nurse",
    2: "Secretary",
    3: "Supervisor",
    4: "Director",
    5: "Quality Manager",
    6: "Training Director",
    7: "Researcher",
    8: "Patient Services"
  };

  const layoutRole = user && user.role_id ? roleMap[user.role_id] : "nurse";
  const fallbackName = user && user.role_id ? titleMap[user.role_id] : "User";
  const displayUsername = user?.full_name || fallbackName;

  return (
    <Layout logoSrc="/logo.png" role={layoutRole} username={displayUsername}>
      <div className="notifications-page-container">
        <div className="notifications-content">

          <div className="notifications-header">
            <div className="notifications-title-area">
              {Icons.bell}
              <h1>Notifications</h1>
            </div>

            <button className="mark-read-btn" onClick={handleMarkAllAsRead}>
              Mark all as read
            </button>
          </div>

          <div className="notifications-filter">
            <div className="filter-label">Filter</div>
            <div style={{ position: "relative" }}>
              <div
                className="filter-select"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", minWidth: "110px", height: "100%", userSelect: "none" }}
              >
                <span>{filterType}</span>
                <span style={{ fontSize: "10px", marginLeft: "8px" }}>▼</span>
              </div>
              {showFilterDropdown && (
                <div style={{ position: "absolute", top: "100%", right: 0, marginTop: "5px", background: "#fff", border: "1px solid #c7d5e5", borderRadius: "10px", padding: "10px", zIndex: 10, display: "flex", flexDirection: "column", gap: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", minWidth: "110px" }}>
                  {filterOptions.map(opt => (
                    <div
                      key={opt}
                      onClick={() => { setFilterType(opt); setShowFilterDropdown(false); }}
                      style={{ padding: "4px 8px", fontSize: "12px", color: "#2f3e55", cursor: "pointer", borderRadius: "6px", background: filterType === opt ? "#f0f4f8" : "transparent" }}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {!loading && notifications.length === 0 && (
            <div className="empty-state">
              {Icons.bellGhost}
              <p>No notifications to display</p>
            </div>
          )}

          <div className="notifications-list">
            {notifications.map(notif => (
              <div
                key={notif.notification_id}
                className={`notification-card type-${notif.notification_type || 'info'} ${notif.is_read ? 'read' : ''}`}
                onClick={() => {
                  if (!notif.is_read) handleMarkAsRead(notif.notification_id);
                }}
              >
                <div className="icon-circle">
                  {Icons[notif.notification_type] || Icons.info}
                </div>
                <div className="notification-content-area">
                  <h4 className="notification-title">{notif.title}</h4>
                  <p className="notification-desc">{notif.message}</p>
                </div>
                <div className="notification-time">
                  {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </Layout>
  );
}
