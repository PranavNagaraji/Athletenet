import { useEffect, useState, useRef } from "react";
import { MessageSquare, Send, Users, User, Dumbbell, Paperclip, Loader2, FileText, Trophy, Info, ShieldCheck } from "lucide-react";
import { io } from "socket.io-client";
import { useAuth } from "../../context/AuthContext";
import "./ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

export default function ClubChat() {
  const { user } = useAuth();
  const [clubProfile, setClubProfile] = useState(null);
  const [members, setMembers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [activeChat, setActiveChat] = useState(null); // { type: 'group' | 'dm' | 'team_chat' | 'tournament_chat', id: String, name: String, avatar: String }
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [socket, setSocket] = useState(null);
  const scrollRef = useRef();
  const fileInputRef = useRef();
  const [uploading, setUploading] = useState(false);

  // New state for member discovery
  const [showMembers, setShowMembers] = useState(false);
  const [activeChannelMembers, setActiveChannelMembers] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Profile
        const profRes = await fetch(`${API}/api/club/profile`, { credentials: "include" });
        if (!profRes.ok) throw new Error("Profile fetch failed");
        const profData = await profRes.json();
        setClubProfile(profData);
        const myId = profData._id;

        // Auto-select Global Lobby
        setActiveChat({ type: "group", id: myId, name: "Global Club Team Chat", avatar: profData.profilePic });

        // 2-4. Athletes, Teams, Coaches
        const [athRes, teamRes, coachRes] = await Promise.all([
          fetch(`${API}/api/club/athlete/${myId}`, { credentials: "include" }),
          fetch(`${API}/api/team/club/${myId}`, { credentials: "include" }),
          fetch(`${API}/api/club/coach/${myId}`, { credentials: "include" })
        ]);

        const [athData, teamData, coachData] = await Promise.all([
           athRes.ok ? athRes.json() : [],
           teamRes.ok ? teamRes.json() : [],
           coachRes.ok ? coachRes.json() : []
        ]);

        if (Array.isArray(athData)) setMembers(athData);
        if (Array.isArray(teamData)) setTeams(teamData);
        if (Array.isArray(coachData)) setCoaches(coachData);

        // 5. Tournaments
        const [hostedRes, joinedRes] = await Promise.all([
          fetch(`${API}/api/tournament/me`, { credentials: "include" }),
          fetch(`${API}/api/tournament/participating`, { credentials: "include" })
        ]);

        const hosted = hostedRes.ok ? await hostedRes.json() : [];
        const joined = joinedRes.ok ? await joinedRes.json() : [];

        const allT = [
          ...(Array.isArray(hosted) ? hosted.map(t => ({ ...t, isHost: true })) : []),
          ...(Array.isArray(joined) ? joined.map(t => ({ ...t, isHost: false })) : [])
        ];
        console.log("Tournaments loaded:", allT.length);
        setTournaments(allT);

      } catch (err) {
        console.error("ClubChat data load error:", err);
      }
    };

    loadData();

    const newSocket = io(API);
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  // Update channel members whenever activeChat changes
  useEffect(() => {
    if (!activeChat) return;

    if (activeChat.type === "group" && clubProfile) {
        setActiveChannelMembers([
            ...members.map(m => ({ ...m.user, role: "Athlete" })),
            ...coaches.map(c => ({ ...(c.user || c), role: "Coach" }))
        ]);
    } else if (activeChat.type === "team_chat") {
        const team = teams.find(t => t._id === activeChat.id);
        if (team) {
            setActiveChannelMembers([
                ...(team.athletes || []).map(a => ({ ...(a.user || a), role: "Athlete" })),
                ...(team.coaches || []).map(c => ({ ...(c.user || c), role: "Coach" }))
            ]);
        }
    } else if (activeChat.type === "tournament_chat") {
        fetch(`${API}/api/tournament/members/${activeChat.id}`, { credentials: "include" })
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setActiveChannelMembers(data.map(m => ({ 
                        _id: m._id, 
                        name: m.name, 
                        profilePic: m.profilePic, 
                        role: m.role 
                    })));
                }
            })
            .catch(() => {});
    } else { setActiveChannelMembers([]); }
  }, [activeChat, clubProfile, members, coaches, teams]);

  useEffect(() => {
    if (!socket || !activeChat || !user?._id) return;

    const roomName = activeChat.type === "group" 
                     ? `club_${activeChat.id}` 
                     : activeChat.type === "team_chat"
                     ? `team_${activeChat.id}`
                     : activeChat.type === "tournament_chat"
                     ? `tournament_${activeChat.id}`
                     : `dm_${[user._id, activeChat.id].sort().join("_")}`;
                     
    socket.emit("join_room", roomName);

    const historyUrl = activeChat.type === "group" 
                       ? `${API}/api/chat/club/${activeChat.id}`
                       : activeChat.type === "team_chat"
                       ? `${API}/api/chat/team/${activeChat.id}`
                       : activeChat.type === "tournament_chat"
                       ? `${API}/api/chat/tournament/${activeChat.id}`
                       : `${API}/api/chat/direct/${activeChat.id}`;

    fetch(historyUrl, { credentials: "include" })
      .then(r => r.json())
      .then(data => setMessages(Array.isArray(data) ? data : []));

    const handleReceive = (msg) => {
      setMessages(prev => [...prev, msg]);
    };
    socket.on("receive_message", handleReceive);

    return () => socket.off("receive_message", handleReceive);
  }, [activeChat, socket, user?._id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket || !activeChat) return;

    const roomName = activeChat.type === "group" 
                    ? `club_${activeChat.id}` 
                    : activeChat.type === "team_chat"
                    ? `team_${activeChat.id}`
                    : activeChat.type === "tournament_chat"
                    ? `tournament_${activeChat.id}`
                    : `dm_${[user._id, activeChat.id].sort().join("_")}`;

    const payload = {
      room: roomName,
      sender: user._id,
      text: text.trim(),
      clubGroup: activeChat.type === "group" ? activeChat.id : null,
      teamGroup: activeChat.type === "team_chat" ? activeChat.id : null,
      tournamentGroup: activeChat.type === "tournament_chat" ? activeChat.id : null,
      receiver: activeChat.type === "dm" ? activeChat.id : null,
    };

    socket.emit("send_message", payload);
    setText("");
  };

  const handleFileUpload = async (e) => {
      const file = e.target.files[0];
      if (!file || !socket || !activeChat) return;

      setUploading(true);
      const formData = new FormData();
      formData.append("image", file); // Your upload endpoint expects 'image'

      try {
          const res = await fetch(`${API}/api/upload`, {
              method: "POST",
              body: formData,
          });
          const data = await res.json();
          
          if (data.url) { // Fix: backend returns { url: ... }
              const roomName = activeChat.type === "group" ? `club_${activeChat.id}` : activeChat.type === "team_chat" ? `team_${activeChat.id}` : `dm_${[user._id, activeChat.id].sort().join("_")}`;
              const isImage = file.type.startsWith("image/");

              socket.emit("send_message", {
                  room: roomName,
                  sender: user._id,
                  text: "",
                  clubGroup: activeChat.type === "group" ? activeChat.id : null,
                  teamGroup: activeChat.type === "team_chat" ? activeChat.id : null,
                  receiver: activeChat.type === "dm" ? activeChat.id : null,
                  fileUrl: data.url,
                  fileType: isImage ? "image" : "document"
              });
          }
      } catch (err) {
          console.error("Upload error", err);
      } finally {
          setUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
      }
  };

  return (
    <div style={{ height: "calc(100vh - 40px)", display: "flex", flexDirection: "column" }}>
      <div className="page-header" style={{ paddingBottom: "1rem" }}>
         <div className="page-header-left">
           <h1>Club CommunicationsHub</h1>
           <p>Broadcast to the entire team or securely DM specific members</p>
         </div>
      </div>

      <div style={{ flex: 1, display: "flex", gap: "1rem", overflow: "hidden", paddingBottom: "1rem" }}>
        
        {/* Left Sidebar (Contacts) */}
        {sidebarOpen && (
          <div className="card" style={{ width: 280, display: "flex", flexDirection: "column", padding: "1rem 0" }}>
           
           <div style={{ padding: "0 1.2rem", marginBottom: "1.5rem" }}>
              <button 
                className={`btn-ghost ${activeChat?.type === "group" ? "btn-primary" : ""}`} 
                style={{ width: "100%", justifyContent: "flex-start", padding: "0.8rem", border: "1px solid var(--c-border)" }}
                onClick={() => {
                   if (clubProfile) {
                      setActiveChat({ type: "group", id: clubProfile._id, name: "Global Club Team Chat", avatar: clubProfile.profilePic });
                   }
                }}
              >
                <Users size={16} /> Club Lobby
              </button>
            </div>
 
            <h3 style={{ padding: "0 1.2rem", margin: "0 0 1rem 0", fontSize: "0.9rem", color: "var(--c-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Competition Arena</h3>
            <div style={{ marginBottom: "1rem" }}>
              {tournaments.length === 0 ? (
                <div style={{ padding: "0 1.2rem", fontSize: "0.85rem", color: "var(--c-muted)" }}>No active tournaments.</div>
              ) : (
                tournaments.map(t => (
                  <div 
                    key={t._id} 
                    onClick={() => setActiveChat({ type: "tournament_chat", id: t._id, name: t.name, avatar: null })}
                    style={{ padding: "0.8rem 1.2rem", display: "flex", alignItems: "center", gap: "0.8rem", cursor: "pointer", background: activeChat?.id === t._id ? "rgba(249,115,22,0.1)" : "transparent", borderLeft: activeChat?.id === t._id ? "3px solid var(--c-primary)" : "3px solid transparent" }}
                  >
                    <div style={{ width: 35, height: 35, borderRadius: "50%", background: t.isHost ? "var(--c-primary)" : "var(--c-surface2)", display: "flex", alignItems: "center", justifyContent: "center", border: t.isHost ? "none" : "1px solid var(--c-border)" }}>
                       <Trophy size={16} color={t.isHost ? "#fff" : "var(--c-muted)"} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: 500, fontSize: "0.95rem" }}>{t.name}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--c-muted)" }}>{t.isHost ? "Organizer Chat" : "Participant Chat"}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <h3 style={{ padding: "0 1.2rem", margin: "0 0 1rem 0", fontSize: "0.9rem", color: "var(--c-muted)", textTransform: "uppercase", letterSpacing: 1 }}>My Teams</h3>
           <div style={{ marginBottom: "1rem" }}>
             {teams.length === 0 ? (
               <div style={{ padding: "0 1.2rem", fontSize: "0.85rem", color: "var(--c-muted)" }}>No teams created.</div>
             ) : (
               teams.map(team => (
                 <div 
                   key={team._id} 
                   onClick={() => setActiveChat({ type: "team_chat", id: team._id, name: team.name, avatar: null })}
                   style={{ padding: "0.8rem 1.2rem", display: "flex", alignItems: "center", gap: "0.8rem", cursor: "pointer", background: activeChat?.id === team._id ? "rgba(249,115,22,0.1)" : "transparent", borderLeft: activeChat?.id === team._id ? "3px solid var(--c-primary)" : "3px solid transparent" }}
                 >
                   <div style={{ width: 35, height: 35, borderRadius: "50%", background: "var(--c-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Trophy size={16} color="#fff" />
                   </div>
                   <div style={{ display: "flex", flexDirection: "column" }}>
                     <span style={{ fontWeight: 500, fontSize: "0.95rem" }}>{team.name}</span>
                     <span style={{ fontSize: "0.75rem", color: "var(--c-muted)" }}>Team Chat</span>
                   </div>
                 </div>
               ))
             )}
           </div>

           <h3 style={{ padding: "0 1.2rem", margin: "0 0 1rem 0", fontSize: "0.9rem", color: "var(--c-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Coaches</h3>
           <div style={{ marginBottom: "1rem" }}>
             {coaches.length === 0 ? (
               <div style={{ padding: "0 1.2rem", fontSize: "0.85rem", color: "var(--c-muted)" }}>No coaches in your club.</div>
             ) : (
               coaches.map(co => (
                 <div 
                   key={co._id} 
                   onClick={() => setActiveChat({ type: "dm", id: co.user?._id || co.user, name: co.user?.name || co.name, avatar: co.user?.profilePic || co.profilePic })}
                   style={{ padding: "0.8rem 1.2rem", display: "flex", alignItems: "center", gap: "0.8rem", cursor: "pointer", background: activeChat?.id === (co.user?._id || co.user) ? "rgba(249,115,22,0.1)" : "transparent", borderLeft: activeChat?.id === (co.user?._id || co.user) ? "3px solid var(--c-primary)" : "3px solid transparent" }}
                 >
                   <div style={{ width: 35, height: 35, borderRadius: "50%", background: "var(--c-surface2)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {(co.user?.profilePic || co.profilePic) ? <img src={`${API}${(co.user?.profilePic || co.profilePic)}`} style={{width:"100%",height:"100%",objectFit:"cover"}} /> : <User size={16} color="var(--c-muted)" />}
                   </div>
                   <div style={{ display: "flex", flexDirection: "column" }}>
                     <span style={{ fontWeight: 500, fontSize: "0.95rem" }}>{co.user?.name || co.name}</span>
                     <span style={{ fontSize: "0.75rem", color: "var(--c-muted)" }}>Coach</span>
                   </div>
                 </div>
               ))
             )}
           </div>

           <h3 style={{ padding: "0 1.2rem", margin: "0 0 1rem 0", fontSize: "0.9rem", color: "var(--c-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Direct Messages</h3>
           
           <div style={{ overflowY: "auto", flex: 1 }}>
             {members.length === 0 ? (
               <div style={{ padding: "0 1.2rem", fontSize: "0.85rem", color: "var(--c-muted)" }}>You have no athletes in your club yet.</div>
             ) : (
               members.map(ath => (
                 <div 
                   key={ath._id} 
                   onClick={() => setActiveChat({ type: "dm", id: ath.user?._id, name: ath.user?.name, avatar: ath.user?.profilePic })}
                   style={{ padding: "0.8rem 1.2rem", display: "flex", alignItems: "center", gap: "0.8rem", cursor: "pointer", background: activeChat?.id === ath.user?._id ? "rgba(249,115,22,0.1)" : "transparent", borderLeft: activeChat?.id === ath.user?._id ? "3px solid var(--c-primary)" : "3px solid transparent" }}
                 >
                   <div style={{ width: 35, height: 35, borderRadius: "50%", background: "var(--c-surface2)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {ath.user?.profilePic ? <img src={`${API}${ath.user.profilePic}`} style={{width:"100%",height:"100%",objectFit:"cover"}} /> : <User size={16} color="var(--c-muted)" />}
                   </div>
                   <div style={{ display: "flex", flexDirection: "column" }}>
                     <span style={{ fontWeight: 500, fontSize: "0.95rem" }}>{ath.user?.name || "Athlete"}</span>
                     <span style={{ fontSize: "0.75rem", color: "var(--c-muted)", display: "flex", alignItems: "center", gap: "0.2rem" }}><Dumbbell size={10}/> Athlete</span>
                   </div>
                 </div>
               ))
             )}
           </div>
        </div>
        )}

        {/* Right Panel (Chat Canvas) */}
        <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
           {!activeChat ? (
             <div className="empty-state" style={{ height: "100%", justifyContent: "center" }}>
               <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn-ghost" style={{ position: "absolute", top: 15, left: 15 }}>
                 <Users size={20} />
               </button>
               <MessageSquare size={50} opacity={0.3} />
               <p style={{ marginTop: "1rem", color: "var(--c-muted)" }}>Select a channel to start broadcasting.</p>
             </div>
           ) : (
             <>
               {/* Chat Header */}
               <div style={{ padding: "1rem 1.5rem", background: "var(--c-surface2)", borderBottom: "1px solid var(--c-border)", display: "flex", alignItems: "center", gap: "1rem" }}>
                 <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn-ghost" style={{ padding: "0.5rem", borderRadius: 8, background: "rgba(0,0,0,0.05)" }}>
                    <Users size={18} />
                 </button>
                 <div style={{ width: 40, height: 40, borderRadius: "50%", background: activeChat.type === "group" ? "var(--c-primary)" : "var(--c-surface)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                   {activeChat.type === "group" ? <Users size={20} color="#fff" /> : 
                     (activeChat.avatar ? <img src={`${API}${activeChat.avatar}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={20} color="var(--c-muted)" />)
                   }
                 </div>
                 <div>
                   <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{activeChat.name}</h3>
                   <span style={{ fontSize: "0.75rem", color: "var(--c-primary)" }}>
                        {activeChat.type === "group" ? "Club Global Announcement Room" : 
                         activeChat.type === "team_chat" ? "Team Private Group" :
                         activeChat.type === "tournament_chat" ? "Tournament Organizer Hub" :
                         "Private Direct Message"}
                    </span>
                 </div>
                 
                 {activeChat.type !== "dm" && (
                    <button 
                      onClick={() => setShowMembers(!showMembers)} 
                      className={`btn-ghost ${showMembers ? "btn-primary" : ""}`} 
                      style={{ marginLeft: "auto", padding: "0.5rem", borderRadius: 8 }}
                      title="Show Members"
                    >
                      <Info size={20} />
                    </button>
                  )}
               </div>

               <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                 {/* Chat Log */}
                 <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", background: "rgba(0,0,0,0.1)" }}>
                    {messages.length === 0 && <div style={{ textAlign: "center", color: "var(--c-muted)", fontSize: "0.85rem", marginTop: "auto", marginBottom: "auto" }}>This is the beginning of the message history.</div>}
                    {messages.map(msg => {
                      const isMe = msg.sender?._id === user?._id;
                      return (
                         <div key={msg._id} style={{ display: "flex", alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "70%", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                           <div style={{ fontSize: "0.7rem", color: "var(--c-muted)", marginBottom: "0.2rem", padding: "0 0.2rem" }}>
                              {msg.sender?.name || (isMe ? "You (Admin)" : "Unknown")} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
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
                              {/* File Attachment Rendering */}
                              {msg.fileUrl && (
                                  msg.fileType === "image" ? (
                                      <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", maxWidth: 250, maxHeight: 250, marginBottom: "0.5rem" }}>
                                          <img src={`${API}${msg.fileUrl}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} alt="Attachment" />
                                      </div>
                                  ) : (
                                      <a href={`${API}${msg.fileUrl}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: isMe ? "#fff" : "var(--c-primary)", textDecoration: "underline", background: "rgba(0,0,0,0.1)", padding: "0.5rem", borderRadius: 8, marginBottom: "0.5rem" }}>
                                          <FileText size={18} /> Document Attachment
                                      </a>
                                  )
                              )}
                              {msg.text && <div>{msg.text}</div>}
                           </div>
                         </div>
                      )
                    })}
                 </div>

                 {/* Member Sidebar */}
                 {showMembers && activeChat.type !== "dm" && (
                  <div style={{ width: 250, borderLeft: "1px solid var(--c-border)", background: "var(--c-surface2)", display: "flex", flexDirection: "column" }}>
                      <div style={{ padding: "1rem", borderBottom: "1px solid var(--c-border)", fontSize: "0.9rem", fontWeight: 600 }}>
                          Channel Members ({activeChannelMembers.length})
                      </div>
                      <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem" }}>
                          {activeChannelMembers.length === 0 ? (
                              <div style={{ padding: "1rem", textAlign: "center", color: "var(--c-muted)", fontSize: "0.85rem" }}>No members found.</div>
                          ) : (
                              activeChannelMembers.map(m => {
                                  const isMe = m._id === user?._id;
                                  return (
                                      <div 
                                        key={m._id} 
                                        style={{ padding: "0.8rem", borderRadius: 8, display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.5rem", background: "rgba(0,0,0,0.1)" }}
                                      >
                                          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                                              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--c-surface)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                  {m.profilePic ? <img src={`${API}${m.profilePic}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={14} color="var(--c-muted)" />}
                                              </div>
                                              <div style={{ display: "flex", flexDirection: "column" }}>
                                                  <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{m.name} {isMe && "(You)"}</span>
                                                  <span style={{ fontSize: "0.7rem", color: "var(--c-primary)", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                                                      {m.role === "Host" ? <ShieldCheck size={10}/> : m.role === "Athlete" ? <Dumbbell size={10}/> : <Users size={10}/>}
                                                      {m.role}
                                                  </span>
                                              </div>
                                          </div>
                                          {!isMe && (
                                              <button 
                                                  className="btn-ghost" 
                                                  style={{ width: "100%", fontSize: "0.75rem", padding: "0.4rem", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 4, color: "var(--c-primary)" }}
                                                  onClick={() => {
                                                      setActiveChat({ type: "dm", id: m._id, name: m.name, avatar: m.profilePic });
                                                      setShowMembers(false);
                                                  }}
                                              >
                                                  Send Message
                                              </button>
                                          )}
                                      </div>
                                  );
                               })
                          )}
                      </div>
                  </div>
                )}
               </div>

               {/* Chat Input */}
               <form onSubmit={handleSend} style={{ padding: "1rem", background: "var(--c-surface)", borderTop: "1px solid var(--c-border)", display: "flex", gap: "0.8rem", alignItems: "center" }}>
                 <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} />
                 <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-ghost" style={{ padding: "0.8rem", borderRadius: "50%", background: "var(--c-surface2)" }} disabled={uploading}>
                    {uploading ? <Loader2 size={18} className="spinner-icon" /> : <Paperclip size={18} />}
                 </button>
                 <input 
                   type="text" 
                   value={text} 
                   onChange={e => setText(e.target.value)} 
                   placeholder={activeChat.type === "group" ? "Broadcast message to all club athletes..." : `Message ${activeChat.name}...`} 
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
