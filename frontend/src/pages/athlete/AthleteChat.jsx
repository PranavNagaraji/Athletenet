import { useEffect, useState, useRef } from "react";
import { MessageSquare, Send, Loader2, Users, Building2, User } from "lucide-react";
import { io } from "socket.io-client";
import { useAuth } from "../../context/AuthContext";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

export default function AthleteChat() {
  const { user } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // { type: 'group' | 'dm', id: String, name: String, avatar: String }
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [socket, setSocket] = useState(null);
  const scrollRef = useRef();

  useEffect(() => {
    // Fetch athlete's joined clubs for the sidebar
    fetch(`${API}/api/athlete/me`, { credentials: "include" })
      .then(r => r.json())
      .then(data => {
         if(data.clubs) setClubs(data.clubs);
      })
      .catch(() => {});

    // Initialize Socket
    const newSocket = io(API);
    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    if (!socket || !activeChat) return;

    // The room name strategy:
    // Group: "club_id"
    // DM: "dm_id1_id2" (sorted alphabetically to guarantee match)
    const roomName = activeChat.type === "group" 
                     ? `club_${activeChat.id}` 
                     : `dm_${[user._id, activeChat.id].sort().join("_")}`;
                     
    socket.emit("join_room", roomName);

    // Fetch history
    const historyUrl = activeChat.type === "group" 
                       ? `${API}/api/chat/club/${activeChat.id}`
                       : `${API}/api/chat/direct/${activeChat.id}`;

    fetch(historyUrl, { credentials: "include" })
      .then(r => r.json())
      .then(data => setMessages(Array.isArray(data) ? data : []));

    // Listen for new messages
    const handleReceive = (msg) => {
      setMessages(prev => [...prev, msg]);
    };
    socket.on("receive_message", handleReceive);

    return () => {
      socket.off("receive_message", handleReceive);
    };
  }, [activeChat, socket, user._id]);

  useEffect(() => {
    // Auto scroll to bottom
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket || !activeChat) return;

    const roomName = activeChat.type === "group" 
                    ? `club_${activeChat.id}` 
                    : `dm_${[user._id, activeChat.id].sort().join("_")}`;

    const payload = {
      room: roomName,
      sender: user._id,
      text: text.trim(),
      clubGroup: activeChat.type === "group" ? activeChat.id : null,
      receiver: activeChat.type === "dm" ? activeChat.id : null,
    };

    socket.emit("send_message", payload);
    setText("");
  };

  return (
    <div style={{ height: "calc(100vh - 40px)", display: "flex", flexDirection: "column" }}>
      <div className="page-header" style={{ paddingBottom: "1rem" }}>
         <div className="page-header-left">
           <h1>Athlete Messenger</h1>
           <p>Communicate instantly with your clubs and organizers</p>
         </div>
      </div>

      <div style={{ flex: 1, display: "flex", gap: "1rem", overflow: "hidden", paddingBottom: "1rem" }}>
        
        {/* Left Sidebar (Contacts) */}
        <div className="card" style={{ width: 280, display: "flex", flexDirection: "column", padding: "1rem 0" }}>
           <h3 style={{ padding: "0 1.2rem", margin: "0 0 1rem 0", fontSize: "0.9rem", color: "var(--c-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Joined Clubs</h3>
           
           <div style={{ overflowY: "auto", flex: 1 }}>
             {clubs.length === 0 ? (
               <div style={{ padding: "0 1.2rem", fontSize: "0.85rem", color: "var(--c-muted)" }}>You haven't joined any clubs yet.</div>
             ) : (
               clubs.map(club => (
                 <div key={club._id} style={{ marginBottom: "0.5rem" }}>
                    <div 
                      onClick={() => setActiveChat({ type: "group", id: club._id, name: `${club.name} Lobby`, avatar: club.profilePic })}
                      style={{ padding: "0.8rem 1.2rem", display: "flex", alignItems: "center", gap: "0.8rem", cursor: "pointer", background: activeChat?.id === club._id && activeChat?.type === "group" ? "rgba(249,115,22,0.1)" : "transparent", borderLeft: activeChat?.id === club._id && activeChat?.type === "group" ? "3px solid var(--c-primary)" : "3px solid transparent" }}
                    >
                      <div style={{ background: "var(--c-surface2)", padding: "0.4rem", borderRadius: "50%" }}>
                         <Users size={16} color="var(--c-primary)" />
                      </div>
                      <span style={{ fontWeight: 500 }}>{club.name} Team</span>
                    </div>

                    {/* Extracted DM to Admin */}
                    {club.admin && (
                        <div 
                          onClick={() => setActiveChat({ type: "dm", id: club.admin._id, name: `Admin (${club.name})`, avatar: club.admin.profilePic })}
                          style={{ padding: "0.6rem 1.2rem 0.6rem 3rem", display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer", fontSize: "0.9rem", color: "var(--c-muted)", background: activeChat?.id === club.admin._id ? "rgba(255,255,255,0.03)" : "transparent" }}
                        >
                          <Building2 size={13} /> Message Admin
                        </div>
                    )}
                 </div>
               ))
             )}
           </div>
        </div>

        {/* Right Panel (Chat Canvas) */}
        <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
           {!activeChat ? (
             <div className="empty-state" style={{ height: "100%", justifyContent: "center" }}>
               <MessageSquare size={50} opacity={0.3} />
               <p style={{ marginTop: "1rem", color: "var(--c-muted)" }}>Select a club or admin to start chatting.</p>
             </div>
           ) : (
             <>
               {/* Chat Header */}
               <div style={{ padding: "1rem 1.5rem", background: "var(--c-surface2)", borderBottom: "1px solid var(--c-border)", display: "flex", alignItems: "center", gap: "1rem" }}>
                 <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--c-surface)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                   {activeChat.avatar ? <img src={`${API}${activeChat.avatar}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={20} color="var(--c-muted)" />}
                 </div>
                 <div>
                   <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{activeChat.name}</h3>
                   <span style={{ fontSize: "0.75rem", color: "var(--c-primary)" }}>{activeChat.type === "group" ? "Global Club Chat" : "Private Direct Message"}</span>
                 </div>
               </div>

               {/* Chat Log */}
               <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", background: "rgba(0,0,0,0.1)" }}>
                  {messages.length === 0 && <div style={{ textAlign: "center", color: "var(--c-muted)", fontSize: "0.85rem", marginTop: "auto", marginBottom: "auto" }}>Say hello! This is the start of the conversation.</div>}
                  {messages.map(msg => {
                    const isMe = msg.sender?._id === user._id;
                    return (
                       <div key={msg._id} style={{ display: "flex", alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "70%", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                         <div style={{ fontSize: "0.7rem", color: "var(--c-muted)", marginBottom: "0.2rem", padding: "0 0.2rem" }}>
                            {msg.sender?.name || "Unknown"} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
                         </div>
                         <div style={{ 
                            background: isMe ? "var(--c-primary)" : "var(--c-surface2)", 
                            color: isMe ? "#fff" : "var(--c-text)",
                            padding: "0.8rem 1rem", 
                            borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                            boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                            lineHeight: 1.4,
                            fontSize: "0.95rem"
                         }}>
                            {msg.text}
                         </div>
                       </div>
                    )
                  })}
               </div>

               {/* Chat Input */}
               <form onSubmit={handleSend} style={{ padding: "1rem", background: "var(--c-surface)", borderTop: "1px solid var(--c-border)", display: "flex", gap: "0.8rem" }}>
                 <input 
                   type="text" 
                   value={text} 
                   onChange={e => setText(e.target.value)} 
                   placeholder={`Message ${activeChat.name}...`} 
                   style={{ flex: 1, background: "var(--c-surface2)", border: "1px solid var(--c-border)", borderRadius: 20, padding: "0.8rem 1.2rem", color: "var(--c-text)", outline: "none" }}
                 />
                 <button type="submit" disabled={!text.trim()} className="btn-primary" style={{ borderRadius: "50%", width: 45, height: 45, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: text.trim() ? 1 : 0.5 }}>
                   <Send size={18} style={{ marginLeft: -2 }} />
                 </button>
               </form>
             </>
           )}
        </div>
      </div>
    </div>
  );
}
