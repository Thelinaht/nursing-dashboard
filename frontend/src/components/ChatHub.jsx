import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, User, Search, Smile, Bell, ChevronLeft } from "lucide-react";
import io from "socket.io-client";
import "./ChatHub.css";

// Singleton socket connection
const socket = io("http://localhost:4000", {
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
});

export default function ChatHub() {
    const [isOpen, setIsOpen] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [notifications, setNotifications] = useState({}); // {userId: count}
    
    // Docking state
    const [isDocked, setIsDocked] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    
    const messagesEndRef = useRef(null);
    
    // Safety check for current user configuration
    const rawUser = JSON.parse(sessionStorage.getItem("user") || "{}");
    const currentUser = {
        user_id: Number(rawUser.user_id || rawUser.id || 1),
        full_name: rawUser.full_name || "User"
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const selectedContactRef = useRef(null);
    const isOpenRef = useRef(false);

    useEffect(() => {
        selectedContactRef.current = selectedContact;
    }, [selectedContact]);

    useEffect(() => {
        isOpenRef.current = isOpen;
    }, [isOpen]);

    useEffect(() => {
        if (!currentUser.user_id) return;

        function joinRoom() {
            console.log(`[ChatHub] Joining room: user_${currentUser.user_id}`);
            socket.emit("join_user_room", currentUser.user_id);
        }

        if (socket.connected) joinRoom();
        socket.on("connect", joinRoom);

        // Fetch contacts with persistent sorting
        const fetchContacts = async () => {
            try {
                const res = await fetch(`http://localhost:4000/api/live-chat/contacts/${currentUser.user_id}`);
                const data = await res.json();
                const processed = data
                    .filter(u => Number(u.user_id) !== currentUser.user_id)
                    .map(c => ({
                        ...c,
                        last_msg_at: new Date(c.last_msg_at).getTime()
                    }));
                setContacts(processed);
            } catch (err) {
                console.error("[ChatHub] Contact load error:", err);
            }
        };
        fetchContacts();

        const handleReceive = (msg) => {
            console.log("[ChatHub] Incoming message:", msg);
            
            const senderId = Number(msg.sender_id);
            const recipientId = Number(msg.recipient_id);

            // Audio ping
            if (senderId !== currentUser.user_id) {
                const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
                audio.play().catch(() => console.warn("[ChatHub] Audio playback requires a user gesture first."));
            }

            // Move the relevant contact to the top of the list
            setContacts(prev => {
                const partnerId = (senderId === currentUser.user_id) ? recipientId : senderId;
                return prev.map(c => {
                    if (Number(c.user_id) === partnerId) {
                        return { ...c, last_msg_at: new Date(msg.timestamp).getTime() };
                    }
                    return c;
                });
            });

            // If chat is open and we are looking at this sender, add to message list
            if (isOpenRef.current && selectedContactRef.current && (senderId === Number(selectedContactRef.current.user_id) || senderId === currentUser.user_id)) {
                setMessages(prev => {
                    if (prev.some(m => m.timestamp === msg.timestamp && m.content === msg.content)) return prev;
                    return [...prev, msg];
                });
            } else if (senderId !== currentUser.user_id) {
                // Otherwise, trigger a notification dot
                setNotifications(prev => ({
                    ...prev,
                    [senderId]: (prev[senderId] || 0) + 1
                }));
            }
        };

        socket.on("receive_message", handleReceive);

        return () => {
            socket.off("connect", joinRoom);
            socket.off("receive_message", handleReceive);
        };
    }, [currentUser.user_id]);

    useEffect(() => {
        if (selectedContact) {
            const partnerId = Number(selectedContact.user_id);
            
            fetch(`http://localhost:4000/api/live-chat/history/${currentUser.user_id}/${partnerId}`)
                .then(res => res.json())
                .then(setMessages)
                .catch(err => console.error("[ChatHub] History fetch fail:", err));
            
            setNotifications(prev => {
                const updated = { ...prev };
                delete updated[partnerId];
                return updated;
            });
        }
    }, [selectedContact, currentUser.user_id]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedContact) return;

        const msgData = {
            sender_id: currentUser.user_id,
            recipient_id: Number(selectedContact.user_id),
            content: newMessage,
            timestamp: new Date().toISOString()
        };

        socket.emit("send_message", msgData);

        try {
            await fetch("http://localhost:4000/api/live-chat/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(msgData)
            });
        } catch (err) {
            console.error("[ChatHub] Send fail:", err);
        }

        setNewMessage("");
    };

    const totalNotifications = Object.values(notifications).reduce((a, b) => a + b, 0);

    const toggleDock = (e) => {
        e.stopPropagation();
        setIsDocked(!isDocked);
        if (isOpen) setIsOpen(false);
    };

    const handleBubbleClick = () => {
        if (isDocked) {
            setIsDocked(false);
            return;
        }
        setIsOpen(!isOpen);
    };

    return (
        <div 
            className={`chat-hub-container ${isOpen ? 'active' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                right: isDocked ? "-45px" : "30px",
                transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                bottom: "30px"
            }}
        >
            
            {isHovered && !isDocked && (
                <button 
                    title="Minimize to side"
                    onClick={toggleDock}
                    className="hub-minimize-btn"
                >
                    <X size={12} />
                </button>
            )}

            {/* Main Floating Bubble */}
            <div 
                className="chat-bubble" 
                onClick={handleBubbleClick}
            >
                {totalNotifications > 0 && <span className="notification-dot-bubble"></span>}
                {isDocked ? <ChevronLeft size={24} style={{ marginRight: '15px' }} /> : (isOpen ? <X size={24} /> : <MessageSquare size={24} />)}
            </div>

            {/* Main Chat Area */}
            {isOpen && (
                <div className="chat-window">
                    <div className="chat-sidebar">
                        <div className="sidebar-header">
                            <h3>Staff Directory</h3>
                            <div className="search-box">
                                <Search size={14} className="search-icon" />
                                <input 
                                    type="text" 
                                    placeholder="Search colleague..." 
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="contacts-list">
                            {Array.isArray(contacts) && contacts
                                .filter(c => (c.full_name || "").toLowerCase().includes(search.toLowerCase()))
                                .sort((a, b) => b.last_msg_at - a.last_msg_at)
                                .map(contact => (
                                    <div 
                                        key={contact.user_id} 
                                        className={`contact-item ${selectedContact?.user_id === contact.user_id ? 'active' : ''}`}
                                        onClick={() => setSelectedContact(contact)}
                                    >
                                    <div className="avatar">
                                        <User size={18} />
                                    </div>
                                    <div className="contact-info">
                                        <span className="contact-name">{contact.full_name}</span>
                                        <span className="contact-role">{contact.job_title}</span>
                                    </div>
                                    {notifications[Number(contact.user_id)] > 0 && (
                                        <div className="green-status-dot" title="New message"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="chat-main">
                        {selectedContact ? (
                            <>
                                <div className="chat-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div className="avatar-small"><User size={14} /></div>
                                        <div>
                                            <div className="chat-title">{selectedContact.full_name}</div>
                                            <div className="chat-status">Online</div>
                                        </div>
                                    </div>
                                    <button className="close-btn" onClick={() => setSelectedContact(null)}><X size={18} /></button>
                                </div>
                                <div className="messages-area">
                                    {messages.map((m, idx) => (
                                        <div key={idx} className={`message-bubble ${Number(m.sender_id) === currentUser.user_id ? 'sent' : 'received'}`}>
                                            <div className="message-content">{m.content}</div>
                                            <div className="message-time">
                                                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                                <form className="chat-input-area" onSubmit={handleSendMessage}>
                                    <input 
                                        type="text" 
                                        placeholder="Type your message..." 
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                    />
                                    <button type="submit" className="send-btn">
                                        <Send size={18} />
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="chat-placeholder">
                                <MessageSquare size={48} color="#dce6ef" />
                                <p>Select a staff member to start chatting</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
