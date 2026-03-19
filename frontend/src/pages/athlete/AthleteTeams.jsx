import { useEffect, useState, useRef } from "react";
import { Users, Building2, UserPlus, Loader2, Trophy, MessageSquare, Send, Paperclip, User, FileText, Image as ImageIcon } from "lucide-react";
import { io } from "socket.io-client";
import { useAuth } from "../../context/AuthContext";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

export default function AthleteTeams() {
  const { user } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [teams, setTeams] = useState([]);
  const [coaches, setCoaches] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState(null); // { type: 'team_chat', id, name }, { type: 'dm', id, name, avatar }, { type: 'join', team }
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [socket, setSocket] = useState(null);
  const scrollRef = useRef();
  const fileInputRef = useRef();
  const [uploading, setUploading] = useState(false);

  const [athleteUserId, setAthleteUserId] = useState(null);

  useEffect(() => {
    // 1. Fetch own athlete data to get joined clubs
    fetch(`${API}/api/athlete/me`, { credentials: "include" })
      .then(r => r.json())
      .then(async (d) => {
        const myUserId = d.user?._id || d.user;
        setAthleteUserId(myUserId);
        const joinedClubs = d.clubs || [];
        setClubs(joinedClubs);
        
        // 2. Fetch all teams for these clubs
        let allTeams = [];
        let allCoachesMap = new Map();

        await Promise.all(joinedClubs.map(async (club) => {
          const adminId = club.admin?._id || club.admin;
          if (!adminId) return;

          // Fetch teams
          const teamRes = await fetch(`${API}/api/team/club/${adminId}`);
          if (teamRes.ok) {
            const clubTeams = await teamRes.json();
            allTeams = [...allTeams, ...clubTeams];
          }

          // Fetch coaches for the club (if endpoint exists, else fallback to extracting from teams)
          const coachRes = await fetch(`${API}/api/club/coach/${club._id || club}`, { credentials: "include" }).catch(()=>null);
          if (coachRes && coachRes.ok) {
             const coachData = await coachRes.json();
             const clubCoaches = Array.isArray(coachData) ? coachData : (coachData.coaches || []);
             clubCoaches.forEach(c => {
                 if(c.user) {
                     // Store the user object and add the club info for this context
                     const coachUser = {
                       ...c.user,
                       clubs: Array.isArray(c.clubs) ? c.clubs.map(cid => (cid._id || cid).toString()) : []
                     };
                     if (!allCoachesMap.has(c.user._id)) {
                        allCoachesMap.set(c.user._id, coachUser);
                     }
                 }
             });
          }
        }));

        setTeams(allTeams);
        setCoaches(Array.from(allCoachesMap.values()));
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Initialize Socket
    const newSocket = io(API);
    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  // Handle Socket connections and history fetching when ActiveView changes to a chat
  useEffect(() => {
    if (!socket || !activeView || activeView.type === "join") return;

    const roomName = activeView.type === "team_chat" 
                     ? `team_${activeView.id}` 
                     : activeView.type === "club_chat"
                     ? `club_${activeView.id}`
                     : `dm_${[user._id, activeView.id].sort().join("_")}`;
                     
    socket.emit("join_room", roomName);

    const historyUrl = activeView.type === "team_chat" 
                       ? `${API}/api/chat/team/${activeView.id}`
                       : activeView.type === "club_chat"
                       ? `${API}/api/chat/club/${activeView.id}`
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
                    : activeView.type === "club_chat"
                    ? `club_${activeView.id}`
                    : `dm_${[user._id, activeView.id].sort().join("_")}`;

    const payload = {
      room: roomName,
      sender: user._id,
      text: text.trim(),
      teamGroup: activeView.type === "team_chat" ? activeView.id : null,
      clubGroup: activeView.type === "club_chat" ? activeView.id : null,
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
      formData.append("image", file); // Your upload endpoint expects 'image'

      try {
          const res = await fetch(`${API}/api/upload`, {
              method: "POST",
              body: formData,
          });
          const data = await res.json();
          
          if (data.url) { // Fix bug here properly utilizing output mapping
              const roomName = activeView.type === "team_chat" ? `team_${activeView.id}` : activeView.type === "club_chat" ? `club_${activeView.id}` : `dm_${[user._id, activeView.id].sort().join("_")}`;
              const isImage = file.type.startsWith("image/");

              socket.emit("send_message", {
                  room: roomName,
                  sender: user._id,
                  text: "",
                  teamGroup: activeView.type === "team_chat" ? activeView.id : null,
                  clubGroup: activeView.type === "club_chat" ? activeView.id : null,
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
      const res = await fetch(`${API}/api/team/join`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId })
      });
      if (res.ok) {
        // Refresh page or update local state
        window.location.reload();
      }
    } catch (err) {
        console.error(err);
    }
  };

  if (loading) return <div className="loading-state"><Loader2 size={24} className="spinner-icon"/> Loading ...</div>;

  const joinedTeams = teams.filter(t => t.athletes?.some(a => a._id === athleteUserId || a === athleteUserId));
  const availableTeams = teams.filter(t => !t.athletes?.some(a => a._id === athleteUserId || a === athleteUserId));

  return (
    <div style={{ height: "calc(100vh - 40px)", display: "flex", flexDirection: "column" }}>
      <div className="page-header" style={{ paddingBottom: "1rem" }}>
         <div className="page-header-left">
           <h1>My Teams Hub</h1>
           <p>Chat with your teams, collaborate with coaches, and manage files</p>
         </div>
      </div>

      <div style={{ flex: 1, display: "flex", gap: "1rem", overflow: "hidden", paddingBottom: "1rem" }}>
        
        {/* LEFT SIDEBAR: Teams & DMs */}
        {sidebarOpen && (
          <div className="card" style={{ width: 320, display: "flex", flexDirection: "column", padding: "1rem 0", background: "var(--c-surface)", overflowY: "auto" }}>
           
           <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
             {clubs.length === 0 ? (
                 <div style={{ padding: "0 1.2rem", fontSize: "0.85rem", color: "var(--c-muted)", marginBottom: "1rem" }}>No joined clubs.</div>
             ) : (
                 clubs.map(club => {
                    const clubId = club._id || club;
                    const clubName = club.name || "Club";
                    const clubAdminId = club.admin?._id || club.admin;
                    
                    const clubTeams = joinedTeams.filter(t => (t.club?._id || t.club).toString() === clubId.toString());
                    const clubCoaches = coaches.filter(c => c.clubs?.includes(clubId.toString())); 
                    // Fallback for coaches: if we fetched them by club in the effect, we might already have them mapped
                    // For now, let's assume they are associated.

                    return (
                      <div key={clubId.toString()} style={{ borderBottom: "1px solid var(--c-border)", paddingBottom: "1.2rem" }}>
                        {/* Club Header */}
                        <div style={{ padding: "0.5rem 1.2rem", display: "flex", alignItems: "center", gap: "0.6rem", background: "rgba(255,255,255,0.02)", marginBottom: "0.5rem" }}>
                           {club.profilePic ? <img src={`${API}${club.profilePic}`} style={{width:18,height:18,borderRadius:"50%"}} /> : <Building2 size={14} color="var(--c-primary)" />}
                           <span style={{ fontWeight: 700, fontSize: "0.8rem", color: "var(--c-primary)", textTransform: "uppercase", letterSpacing: 0.5 }}>{clubName}</span>
                        </div>

                        {/* Lobby & Admin */}
                        <div 
                            onClick={() => {
                                setActiveView({ type: "club_chat", id: clubId, name: `${clubName} Lobby`, avatar: club.profilePic });
                                if (window.innerWidth < 768) setSidebarOpen(false);
                            }}
                          style={{ padding: "0.6rem 1.2rem", display: "flex", alignItems: "center", gap: "0.8rem", cursor: "pointer", background: activeView?.id === clubId && activeView?.type === "club_chat" ? "rgba(249,115,22,0.1)" : "transparent" }}
                        >
                          <MessageSquare size={16} color="var(--c-muted)" />
                          <span style={{ fontWeight: 500, fontSize: "0.9rem" }}>Global Lobby</span>
                        </div>

                        {clubAdminId && (
                          <div 
                            onClick={() => {
                                setActiveView({ type: "dm", id: clubAdminId, name: `Admin (${clubName})`, avatar: null });
                                if (window.innerWidth < 768) setSidebarOpen(false);
                            }}
                            style={{ padding: "0.6rem 1.2rem", display: "flex", alignItems: "center", gap: "0.8rem", cursor: "pointer", fontSize: "0.9rem", color: "var(--c-muted)", background: activeView?.id === clubAdminId ? "rgba(255,255,255,0.03)" : "transparent" }}
                          >
                            <User size={16} /> Contact Admin
                          </div>
                        )}

                        {/* Club Teams */}
                        {clubTeams.length > 0 && (
                          <div style={{ marginTop: "0.5rem" }}>
                            <div style={{ padding: "0.3rem 1.2rem", fontSize: "0.7rem", color: "var(--c-muted)", fontWeight: 600 }}>Teams</div>
                            {clubTeams.map(team => (
                               <div key={team._id} onClick={() => { setActiveView({ type: "team_chat", id: team._id, name: team.name }); if (window.innerWidth < 768) setSidebarOpen(false); }}
                                 style={{ padding: "0.5rem 1.2rem 0.5rem 2rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.6rem", background: activeView?.id === team._id ? "rgba(249,115,22,0.1)" : "transparent" }}
                               >
                                 <Trophy size={14} color={activeView?.id === team._id ? "var(--c-primary)" : "var(--c-muted)"} />
                                 <span style={{ fontSize: "0.85rem", fontWeight: activeView?.id === team._id ? 600 : 400 }}>{team.name}</span>
                               </div>
                            ))}
                          </div>
                        )}

                        {/* Club Coaches */}
                        {clubCoaches.length > 0 && (
                          <div style={{ marginTop: "0.5rem" }}>
                            <div style={{ padding: "0.3rem 1.2rem", fontSize: "0.7rem", color: "var(--c-muted)", fontWeight: 600 }}>Coaches</div>
                            {clubCoaches.map(coach => (
                               <div key={coach._id} onClick={() => { setActiveView({ type: "dm", id: coach._id, name: coach.name, avatar: coach.profilePic }); if (window.innerWidth < 768) setSidebarOpen(false); }}
                                 style={{ padding: "0.5rem 1.2rem 0.5rem 2rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.6rem", background: activeView?.id === coach._id ? "rgba(249,115,22,0.1)" : "transparent" }}
                               >
                                 <div style={{width:18,height:18,borderRadius:"50%",background:"var(--c-surface2)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
                                   {coach.profilePic ? <img src={`${API}${coach.profilePic}`} style={{width:"100%",height:"100%",objectFit:"cover"}} /> : <User size={12} color="var(--c-muted)" />}
                                 </div>
                                 <span style={{ fontSize: "0.85rem", fontWeight: activeView?.id === coach._id ? 600 : 400 }}>{coach.name}</span>
                               </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                 })
             )}

             <div style={{ padding: "1rem 1.2rem" }}>
                <h3 style={{ margin: "0 0 0.8rem 0", fontSize: "0.85rem", color: "var(--c-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Explore Teams</h3>
                {availableTeams.map(team => (
                  <div key={team._id} onClick={() => setActiveView({ type: "join", team })} style={{ padding: "0.5rem 0", display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer", opacity: 0.7 }}>
                    <Users size={14} />
                    <span style={{ fontSize: "0.85rem" }}>{team.name} ({team.club?.name || "Join"})</span>
                  </div>
                ))}
             </div>
           </div>
        </div>
        )}

        {/* RIGHT CANVAS: Chat or Join Interface */}
        <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden", background: "var(--c-surface)" }}>
           {!activeView ? (
             <div className="empty-state" style={{ height: "100%", justifyContent: "center" }}>
               <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn-ghost" style={{ position: "absolute", top: 15, left: 15 }}>
                 <Users size={20} />
               </button>
               <MessageSquare size={50} opacity={0.3} />
               <p style={{ marginTop: "1rem", color: "var(--c-muted)", maxWidth: 300, textAlign: "center", lineHeight: 1.5 }}>Select a Team to open the group chat, or select a Coach to send a direct message.</p>
             </div>
           ) : activeView.type === "join" ? (
             <div className="empty-state" style={{ height: "100%", justifyContent: "center" }}>
               <Trophy size={60} color="var(--c-primary)" style={{ marginBottom: "1rem" }} />
               <h2>{activeView.team.name}</h2>
               <p style={{ color: "var(--c-muted)", marginBottom: "2rem" }}>You are not a member of this team yet.</p>
               <button className="btn-primary" onClick={() => handleJoinTeam(activeView.team._id)}>
                 <UserPlus size={18} /> Join Team to Access Chat
               </button>
             </div>
           ) : (
             <>
                {/* Chat Header */}
                <div style={{ padding: "0.8rem 1.5rem", background: "var(--c-surface2)", borderBottom: "1px solid var(--c-border)", display: "flex", alignItems: "center", gap: "1rem" }}>
                  <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn-ghost" style={{ padding: "0.5rem", borderRadius: 8, background: "rgba(0,0,0,0.05)" }}>
                     <Users size={18} />
                  </button>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: activeView.type === "team_chat" ? "var(--c-primary)" : "var(--c-surface)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {activeView.type === "team_chat" ? <Trophy size={20} color="#fff" /> : 
                      (activeView.avatar ? <img src={`${API}${activeView.avatar}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={20} color="var(--c-muted)" />)
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: "1rem" }}>{activeView.name}</h3>
                    <span style={{ fontSize: "0.7rem", color: "var(--c-primary)", fontWeight: 600, textTransform: "uppercase" }}>
                        {activeView.type === "team_chat" ? "Team Group" : activeView.type === "club_chat" ? "Club Lobby" : "Direct Message"}
                    </span>
                  </div>

                  {/* Contextual Coaches for Teams */}
                  {activeView.type === "team_chat" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(0,0,0,0.1)", padding: "0.4rem 0.8rem", borderRadius: 12 }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--c-muted)", fontWeight: 600 }}>COACHES:</span>
                        <div style={{ display: "flex", gap: "0.3rem" }}>
                            {teams.find(t => t._id === activeView.id)?.coaches?.map(coach => (
                                <div 
                                    key={coach._id} 
                                    title={coach.name}
                                    onClick={() => setActiveView({ type: "dm", id: coach._id, name: coach.name, avatar: coach.profilePic })}
                                    style={{ width: 26, height: 26, borderRadius: "50%", border: "2px solid var(--c-primary)", cursor: "pointer", overflow: "hidden" }}
                                >
                                    {coach.profilePic ? <img src={`${API}${coach.profilePic}`} style={{width:"100%",height:"100%",objectFit:"cover"}} /> : <User size={12} style={{margin:"4px"}} />}
                                </div>
                            ))}
                        </div>
                    </div>
                  )}
                </div>

               {/* Chat Log */}
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
                            {/* File Attachment Rendering */}
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
                            
                            {/* Text content */}
                            {msg.text && <div>{msg.text}</div>}

                            <div style={{ fontSize: "0.65rem", color: isMe ? "rgba(255,255,255,0.6)" : "var(--c-muted)", textAlign: "right", marginTop: "0.3rem" }}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
                            </div>
                         </div>
                       </div>
                    )
                  })}
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
                   placeholder="Type a message..." 
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
