
import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { Check, Circle, CheckCircle2 } from "lucide-react";
import Layout from "../components/Layout";
import { socket } from "../components/ChatHub";
import "../styles/NotificationsPage.css";

const Icons = {
  check: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
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
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("All");

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const filterOptions = ["All", "Success", "Error", "Warning", "Info"];

  const fetchNotifications = useCallback(async () => {
    if (!user || (!user.user_id && !user.id)) {
      setLoading(false);
      return;
    }

    try {
      const activeUserId = user.user_id || user.id;
      const url = `http://localhost:4000/api/notifications/user/${activeUserId}`;

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
  }, [user]);

  useEffect(() => {
    fetchNotifications();

    socket.on("new_notification", fetchNotifications);

    return () => {
      socket.off("new_notification", fetchNotifications);
    };
  }, [fetchNotifications]);

  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation();
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
    1: "nurse", 2: "secretary", 3: "supervisor", 4: "director",
    5: "qualityManager", 6: "trainingDirector", 7: "researchDirector", 8: "assistantDirector"
  };

  const titleMap = {
    1: "Nurse", 2: "Secretary", 3: "Supervisor", 4: "Director",
    5: "Quality Manager", 6: "Training Director", 7: "Researcher", 8: "Patient Services"
  };

  const layoutRole = user && user.role_id ? roleMap[user.role_id] : "nurse";
  const fallbackName = user && user.role_id ? titleMap[user.role_id] : "User";
  const displayUsername = user?.full_name || fallbackName;

  return (
    <Layout logoSrc="/logo.png" role={layoutRole} username={displayUsername}>
      <div className="notifications-page-container">
        <div className="notifications-content">

          <div className="notifications-header">
            <h1>Notifications</h1>
            <button className="mark-all-read-link" onClick={handleMarkAllAsRead}>
              Mark all as read
            </button>
          </div>

          <div className="notifications-filters">
            {filterOptions.map(opt => (
              <button
                key={opt}
                className={`filter-chip ${filterType === opt ? 'active' : ''}`}
                onClick={() => setFilterType(opt)}
              >
                {opt}
              </button>
            ))}
          </div>

          {(() => {
            const filteredNotifications = notifications.filter(notif => {
              if (filterType === "All") return true;
              return notif.notification_type?.toLowerCase() === filterType.toLowerCase();
            });

            return (
              <>
                {!loading && filteredNotifications.length === 0 && (
                  <div className="empty-state">
                    {Icons.bellGhost}
                    <p>No {filterType !== 'All' ? filterType.toLowerCase() : ''} notifications to display</p>
                  </div>
                )}

                <div className="notifications-list">
                  {filteredNotifications.map(notif => (
                    <div
                      key={notif.notification_id}
                      className={`notification-card type-${notif.notification_type || 'info'} ${notif.is_read ? 'read' : 'unread'}`}
                      onClick={(e) => {
                        if (!notif.is_read) handleMarkAsRead(e, notif.notification_id);
                      }}
                    >
                      <div className="notification-card-main">
                        <div className="notification-icon-square">
                          {Icons.check}
                        </div>
                        <div className="notification-info">
                          <h4 className="notification-title">{notif.title}</h4>
                          <p className="notification-desc">{notif.message}</p>
                        </div>
                      </div>

                      <div className="notification-meta-wrapper">
                        <div className="notification-meta">
                          <span className="notification-time">
                            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                          </span>
                        </div>

                        <button
                          className={`persistent-mark-read ${notif.is_read ? 'is-read' : ''}`}
                          onClick={(e) => {
                            if (!notif.is_read) handleMarkAsRead(e, notif.notification_id);
                          }}
                          title={notif.is_read ? "Read" : "Mark as read"}
                        >
                          {notif.is_read ? <CheckCircle2 size={24} color="#3B82F6" fill="#3B82F6" stroke="white" /> : <Circle size={24} color="#3B82F6" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}

        </div>
      </div>
    </Layout>
  );
}
