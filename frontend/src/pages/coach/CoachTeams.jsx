import { useEffect, useState, useRef } from "react";
import { Users, Building2, UserPlus, Loader2, Trophy, MessageSquare, Send, Paperclip, User, FileText, Image as ImageIcon } from "lucide-react";
import { io } from "socket.io-client";
import { useAuth } from "../../context/AuthContext";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

export default function CoachTeams() {
  const { user } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [teams, setTeams] = useState([]);
  const [athletes, setAthletes] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState(null); // { type: 'team_chat', id, name }, { type: 'dm', id, name, avatar }, { type: 'join', team }
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [socket, setSocket] = useState(null);
  const scrollRef = useRef();
  const fileInputRef = useRef();
  const [uploading, setUploading] = useState(false);

  const [coachUserId, setCoachUserId] = useState(null);

  useEffect(() => {
    // 1. Fetch own coach data to get joined clubs
    fetch(`${API}/api/coach/me`, { credentials: "include" })
      .then(r => r.json())
      .then(async (d) => {
        const myUserId = d.user?._id || d.user;
        setCoachUserId(myUserId);
        const joinedClubs = d.clubs || [];
        setClubs(joinedClubs);
        
        let allTeams = [];
        let allAthletesMap = new Map();

        await Promise.all(joinedClubs.map(async (club) => {
          const adminId = club.admin?._id || club.admin;
          if (!adminId) return;

          // Fetch teams
          const teamRes = await fetch(`${API}/api/team/club/${adminId}`);
          if (teamRes.ok) {
            const clubTeams = await teamRes.json();
            allTeams = [...allTeams, ...clubTeams];
            
            // Extract athletes from teams for 1-on-1s
            clubTeams.forEach(team => {
               if (team.athletes) {
                   team.athletes.forEach(ath => {
                       // if ath is populated with user
                       if (ath.user && !allAthletesMap.has(ath.user._id)) {
                           allAthletesMap.set(ath.user._id, ath.user);
                       } else if (ath.name && !allAthletesMap.has(ath._id)) {
                           // if ath itself is the user object
                           allAthletesMap.set(ath._id, ath);
                       }
                   });
               }
            });
          }
        }));

        setTeams(allTeams);
        setAthletes(Array.from(allAthletesMap.values()));
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Initialize Socket
    const newSocket = io(API);
    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    if (!socket || !activeView || activeView.type === "join") return;

    const roomName = activeView.type === "team_chat" 
                     ? `team_${activeView.id}` 
                     : `dm_${[user._id, activeView.id].sort().join("_")}`;
                     
    socket.emit("join_room", roomName);

    const historyUrl = activeView.type === "team_chat" 
                       ? `${API}/api/chat/team/${activeView.id}`
                       : `${API}/api/chat/direct/${activeView.id}`;

    fetch(historyUrl, { credentials: "include" })
      .then(r => r.json())
      .then(data => setMessages(Array.isArray(data) ? data : []));

    const handleReceive = (msg) => {
      setMessages(prev => [...prev, msg]);
    };
    socket.on("receive_message", handleReceive);

    return () => socket.off("receive_message", handleReceive);
  }, [activeView, socket, user?._id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!text.trim() || !socket || !activeView || activeView.type === "join") return;

    const roomName = activeView.type === "team_chat" 
                    ? `team_${activeView.id}` 
                    : `dm_${[user._id, activeView.id].sort().join("_")}`;

    const payload = {
      room: roomName,
      sender: user._id,
      text: text.trim(),
      teamGroup: activeView.type === "team_chat" ? activeView.id : null,
      receiver: activeView.type === "dm" ? activeView.id : null,
    };

    socket.emit("send_message", payload);
    setText("");
  };

  const handleFileUpload = async (e) => {
      const file = e.target.files[0];
      if (!file || !socket || activeView.type === "join") return;

      setUploading(true);
      const formData = new FormData();
      formData.append("image", file);

      try {
          const res = await fetch(`${API}/api/upload`, {
              method: "POST",
              body: formData,
          });
          const data = await res.json();
          
          if (data.url) { // URL patch
              const roomName = activeView.type === "team_chat" ? `team_${activeView.id}` : `dm_${[user._id, activeView.id].sort().join("_")}`;
              const isImage = file.type.startsWith("image/");

              socket.emit("send_message", {
                  room: roomName,
                  sender: user._id,
                  text: "",
                  teamGroup: activeView.type === "team_chat" ? activeView.id : null,
                  receiver: activeView.type === "dm" ? activeView.id : null,
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

  const handleJoinTeam = async (teamId) => {
    try {
      const res = await fetch(`${API}/api/team/join/coach`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId })
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
        console.error(err);
    }
  };

  if (loading) return <div className="loading-state"><Loader2 size={24} className="spinner-icon"/> Loading ...</div>;

  const joinedTeams = teams.filter(t => t.coaches?.some(c => c._id === coachUserId || c === coachUserId));
  const availableTeams = teams.filter(t => !t.coaches?.some(c => c._id === coachUserId || c === coachUserId));

  return (
    <div style={{ height: "calc(100vh - 40px)", display: "flex", flexDirection: "column" }}>
      <div className="page-header" style={{ paddingBottom: "1rem" }}>
         <div className="page-header-left">
           <h1>My Coaching Hub</h1>
           <p>Manage your teams, mentor athletes, and share resources</p>
         </div>
      </div>

      <div style={{ flex: 1, display: "flex", gap: "1rem", overflow: "hidden", paddingBottom: "1rem" }}>
        
        {/* LEFT SIDEBAR */}
        {sidebarOpen && (
          <div className="card" style={{ width: 320, display: "flex", flexDirection: "column", padding: "1rem 0", background: "var(--c-surface)", overflowY: "auto" }}>
           
           <h3 style={{ padding: "0 1.2rem", margin: "0 0 0.8rem 0", fontSize: "0.85rem", color: "var(--c-muted)", textTransform: "uppercase", letterSpacing: 1 }}>My Instructed Teams</h3>
           {joinedTeams.length === 0 ? (
               <div style={{ padding: "0 1.2rem", fontSize: "0.85rem", color: "var(--c-muted)", marginBottom: "1rem" }}>No instructed teams.</div>
           ) : (
               joinedTeams.map(team => (
                 <div 
                   key={team._id} 
                   onClick={() => setActiveView({ type: "team_chat", id: team._id, name: team.name, description: `${team.athletes?.length || 0} Athletes` })}
                   style={{ padding: "0.8rem 1.2rem", display: "flex", alignItems: "center", gap: "0.8rem", cursor: "pointer", background: activeView?.id === team._id ? "rgba(249,115,22,0.1)" : "transparent", borderLeft: activeView?.id === team._id ? "3px solid var(--c-primary)" : "3px solid transparent" }}
                 >
                   <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--c-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Trophy size={20} color="#fff" />
                   </div>
                   <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
                     <span style={{ fontWeight: 600, fontSize: "0.95rem", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{team.name}</span>
                     <span style={{ fontSize: "0.75rem", color: "var(--c-muted)" }}>Group Chat • {team.athletes?.length || 0} Members</span>
                   </div>
                 </div>
               ))
           )}

           <hr style={{ border: 0, borderBottom: "1px solid var(--c-border)", margin: "1rem 1.2rem" }} />

           <h3 style={{ padding: "0 1.2rem", margin: "0 0 0.8rem 0", fontSize: "0.85rem", color: "var(--c-muted)", textTransform: "uppercase", letterSpacing: 1 }}>My Athletes (1-on-1)</h3>
           {athletes.length === 0 ? (
               <div style={{ padding: "0 1.2rem", fontSize: "0.85rem", color: "var(--c-muted)", marginBottom: "1rem" }}>No athletes found in your teams.</div>
           ) : (
               athletes.map(ath => (
                 <div 
                   key={ath._id} 
                   onClick={() => setActiveView({ type: "dm", id: ath._id, name: ath.name, avatar: ath.profilePic })}
                   style={{ padding: "0.8rem 1.2rem", display: "flex", alignItems: "center", gap: "0.8rem", cursor: "pointer", background: activeView?.id === ath._id ? "rgba(249,115,22,0.1)" : "transparent", borderLeft: activeView?.id === ath._id ? "3px solid var(--c-primary)" : "3px solid transparent" }}
                 >
                   <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--c-surface2)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {ath.profilePic ? <img src={`${API}${ath.profilePic}`} style={{width:"100%",height:"100%",objectFit:"cover"}} /> : <User size={20} color="var(--c-muted)" />}
                   </div>
                   <div style={{ display: "flex", flexDirection: "column" }}>
                     <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{ath.name}</span>
                     <span style={{ fontSize: "0.75rem", color: "var(--c-muted)" }}>Athlete Feedback</span>
                   </div>
                 </div>
               ))
           )}

           <hr style={{ border: 0, borderBottom: "1px solid var(--c-border)", margin: "1rem 1.2rem" }} />

           <h3 style={{ padding: "0 1.2rem", margin: "0 0 0.8rem 0", fontSize: "0.85rem", color: "var(--c-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Other Teams To Coach</h3>
           {availableTeams.length === 0 ? (
               <div style={{ padding: "0 1.2rem", fontSize: "0.85rem", color: "var(--c-muted)", marginBottom: "1rem" }}>No other teams available.</div>
           ) : (
               availableTeams.map(team => (
                 <div 
                   key={team._id} 
                   onClick={() => setActiveView({ type: "join", team })}
                   style={{ padding: "0.8rem 1.2rem", display: "flex", alignItems: "center", gap: "0.8rem", cursor: "pointer", background: activeView?.team?._id === team._id ? "rgba(255,255,255,0.03)" : "transparent", borderLeft: activeView?.team?._id === team._id ? "3px solid var(--c-muted)" : "3px solid transparent", opacity: 0.7 }}
                 >
                   <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--c-surface2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Users size={20} color="var(--c-muted)" />
                   </div>
                   <div style={{ display: "flex", flexDirection: "column" }}>
                     <span style={{ fontWeight: 500, fontSize: "0.9rem" }}>{team.name}</span>
                     <span style={{ fontSize: "0.75rem", color: "var(--c-muted)" }}>Click to view & instruct</span>
                   </div>
                 </div>
               ))
           )}
        </div>
        )}

        {/* RIGHT CANVAS */}
        <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden", background: "var(--c-surface)" }}>
           {!activeView ? (
             <div className="empty-state" style={{ height: "100%", justifyContent: "center" }}>
               <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn-ghost" style={{ position: "absolute", top: 15, left: 15 }}>
                  <Users size={20} />
               </button>
               <MessageSquare size={50} opacity={0.3} />
               <p style={{ marginTop: "1rem", color: "var(--c-muted)", maxWidth: 300, textAlign: "center", lineHeight: 1.5 }}>Select a Team to open the group chat, or select an Athlete to send direct feedback.</p>
             </div>
           ) : activeView.type === "join" ? (
             <div className="empty-state" style={{ height: "100%", justifyContent: "center" }}>
               <Trophy size={60} color="var(--c-primary)" style={{ marginBottom: "1rem" }} />
               <h2>{activeView.team.name}</h2>
               <p style={{ color: "var(--c-muted)", marginBottom: "2rem" }}>You are not instructing this team yet.</p>
               <button className="btn-primary" onClick={() => handleJoinTeam(activeView.team._id)}>
                 <UserPlus size={18} /> Join as Coach to Access Hub
               </button>
             </div>
           ) : (
             <>
               <div style={{ padding: "1rem 1.5rem", background: "var(--c-surface2)", borderBottom: "1px solid var(--c-border)", display: "flex", alignItems: "center", gap: "1rem" }}>
                 <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn-ghost" style={{ padding: "0.5rem", borderRadius: 8, background: "rgba(0,0,0,0.05)" }}>
                    <Users size={18} />
                 </button>
                 <div style={{ width: 40, height: 40, borderRadius: "50%", background: activeView.type === "team_chat" ? "var(--c-primary)" : "var(--c-surface)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                   {activeView.type === "team_chat" ? <Trophy size={20} color="#fff" /> : 
                     (activeView.avatar ? <img src={`${API}${activeView.avatar}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={20} color="var(--c-muted)" />)
                   }
                 </div>
                 <div>
                   <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{activeView.name}</h3>
                   <span style={{ fontSize: "0.75rem", color: "var(--c-primary)" }}>{activeView.type === "team_chat" ? "Team Instruction & Announcements" : "Athlete Direct Feedback"}</span>
                 </div>
               </div>

               <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", background: "rgba(0,0,0,0.1)" }}>
                  {messages.length === 0 && <div style={{ textAlign: "center", color: "var(--c-muted)", fontSize: "0.85rem", marginTop: "auto", marginBottom: "auto" }}>This is the beginning of the message history.</div>}
                  {messages.map((msg, i) => {
                    const isMe = msg.sender?._id === user?._id;
                    const showName = !isMe && (i === 0 || messages[i-1].sender?._id !== msg.sender?._id);

                    return (
                       <div key={msg._id} style={{ display: "flex", alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "70%", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                         {showName && (
                             <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--c-primary)", marginBottom: "0.2rem", padding: "0 0.5rem" }}>
                                {msg.sender?.name}
                             </div>
                         )}
                         <div style={{ 
                            background: isMe ? "var(--c-primary)" : "var(--c-surface2)", 
                            color: isMe ? "#fff" : "var(--c-text)",
                            padding: "0.8rem 1rem", 
                            borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                            boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                            lineHeight: 1.4,
                            fontSize: "0.95rem",
                            display: "flex",
                            flexDirection: "column",
                            gap: msg.fileUrl ? "0.5rem" : "0"
                         }}>
                            {msg.fileUrl && (
                                msg.fileType === "image" ? (
                                    <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", maxWidth: 250, maxHeight: 250 }}>
                                        <img src={`${API}${msg.fileUrl}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} alt="Attachment" />
                                    </div>
                                ) : (
                                    <a href={`${API}${msg.fileUrl}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: isMe ? "#fff" : "var(--c-primary)", textDecoration: "underline", background: "rgba(0,0,0,0.1)", padding: "0.5rem", borderRadius: 8 }}>
                                        <FileText size={18} /> Document Attachment
                                    </a>
                                )
                            )}
                            
                            {msg.text && <div>{msg.text}</div>}

                            <div style={{ fontSize: "0.65rem", color: isMe ? "rgba(255,255,255,0.6)" : "var(--c-muted)", textAlign: "right", marginTop: "0.3rem" }}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
                            </div>
                         </div>
                       </div>
                    )
                  })}
               </div>

               <form onSubmit={handleSend} style={{ padding: "1rem", background: "var(--c-surface)", borderTop: "1px solid var(--c-border)", display: "flex", gap: "0.8rem", alignItems: "center" }}>
                 
                 <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} />
                 <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-ghost" style={{ padding: "0.8rem", borderRadius: "50%", background: "var(--c-surface2)" }} disabled={uploading}>
                    {uploading ? <Loader2 size={18} className="spinner-icon" /> : <Paperclip size={18} />}
                 </button>

                 <input 
                   type="text" 
                   value={text} 
                   onChange={e => setText(e.target.value)} 
                   placeholder="Type an announcement or feedback..." 
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
