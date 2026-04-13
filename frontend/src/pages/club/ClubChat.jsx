import { useEffect, useState, useRef } from "react";
import { MessageSquare, Send, Users, User, Dumbbell, Paperclip, Loader2, FileText, Trophy, Info, ShieldCheck, MapPin, Image, X, ChevronLeft } from "lucide-react";
import { io } from "socket.io-client";
import { useAuth } from "../../context/AuthContext";
import { VALIDATION_LIMITS, validateFile } from "../../utils/formValidation";
import "./ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

const renderAvatar = (name, url, size = 32, type = 'club') => {
    if (url) {
      return <img src={`${API}${url}`} style={{ width: size, height: size, borderRadius: "10px", objectFit: "cover", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.1)" }} alt={name} />;
    }
    const initials = name ? (name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()) : "??";
    const colors = type === 'team' ? "linear-gradient(135deg, #3b82f6, #1d4ed8)" : 
                   type === 'admin' ? "linear-gradient(135deg, #8b5cf6, #6d28d9)" :
                   type === 'coach' ? "linear-gradient(135deg, #10b981, #047857)" :
                   type === 'athlete' ? "linear-gradient(135deg, #f97316, #c2410c)" :
                   "linear-gradient(135deg, #f97316, #c2410c)";
    return (
      <div style={{ width: size, height: size, borderRadius: "10px", background: colors, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 800, textTransform: "uppercase", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", flexShrink: 0 }}>
        {initials}
      </div>
    );
};

export default function ClubChat() {
  const { user } = useAuth();
  const [clubProfile, setClubProfile] = useState(null);
  const [members, setMembers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [socket, setSocket] = useState(null);
  const scrollRef = useRef();
  const fileInputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  const [showMembers, setShowMembers] = useState(false);
  const [activeChannelMembers, setActiveChannelMembers] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const profRes = await fetch(`${API}/api/club/profile`, { credentials: "include" });
        if (!profRes.ok) throw new Error("Profile fetch failed");
        const profData = await profRes.json();
        setClubProfile(profData);
        const myId = profData._id;

        setActiveChat({ type: "group", id: myId, name: "Global Club Team Chat", avatar: profData.profilePic });

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
            .then(data => { if (Array.isArray(data)) setActiveChannelMembers(data.map(m => ({ _id: m._id, name: m.name, profilePic: m.profilePic, role: m.role }))); })
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

    const handleReceive = (msg) => setMessages(prev => [...prev, msg]);
    socket.on("receive_message", handleReceive);
    return () => socket.off("receive_message", handleReceive);
  }, [activeChat, socket, user?._id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket || !activeChat) return;
    if (text.trim().length > VALIDATION_LIMITS.messageMax) return;

    const roomName = activeChat.type === "group" 
                    ? `club_${activeChat.id}` 
                    : activeChat.type === "team_chat"
                    ? `team_${activeChat.id}`
                    : activeChat.type === "tournament_chat"
                    ? `tournament_${activeChat.id}`
                    : `dm_${[user._id, activeChat.id].sort().join("_")}`;

    socket.emit("send_message", {
      room: roomName,
      sender: user._id,
      text: text.trim(),
      clubGroup: activeChat.type === "group" ? activeChat.id : null,
      teamGroup: activeChat.type === "team_chat" ? activeChat.id : null,
      tournamentGroup: activeChat.type === "tournament_chat" ? activeChat.id : null,
      receiver: activeChat.type === "dm" ? activeChat.id : null,
    });
    setText("");
    setShowAttachMenu(false);
  };

  const handleFileUpload = async (e) => {
      const file = e.target.files[0];
      if (!file || !socket || !activeChat) return;
      const fileError = validateFile(file, { maxBytes: VALIDATION_LIMITS.attachmentMaxBytes, allowNonImages: true });
      if (fileError) return;

      setUploading(true);
      const formData = new FormData();
      formData.append("image", file);

      try {
          const res = await fetch(`${API}/api/upload`, { method: "POST", body: formData });
          const data = await res.json();
          if (data.url) {
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
      } catch (err) { console.error("Upload error", err); }
      finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const handleAttachLocation = () => {
      if (!navigator.geolocation) return alert("Geolocation not supported by your browser");
      if (!socket || !activeChat) return;

      navigator.geolocation.getCurrentPosition(
          (pos) => {
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              const url = `https://www.google.com/maps?q=${lat},${lng}`;
              const roomName = activeChat.type === "group" ? `club_${activeChat.id}` : activeChat.type === "team_chat" ? `team_${activeChat.id}` : `dm_${[user._id, activeChat.id].sort().join("_")}`;

              socket.emit("send_message", {
                  room: roomName,
                  sender: user._id,
                  text: "📍 Shared Location",
                  clubGroup: activeChat.type === "group" ? activeChat.id : null,
                  teamGroup: activeChat.type === "team_chat" ? activeChat.id : null,
                  receiver: activeChat.type === "dm" ? activeChat.id : null,
                  fileUrl: url,
                  fileType: "location"
              });
          },
          () => alert("Unable to fetch location. Please check your browser permissions.")
      );
  };

  const SidebarRow = ({ name, url, type, subtitle, isActive, onClick }) => (
    <div
      onClick={onClick}
      style={{ padding: "0.5rem 1.2rem", display: "flex", alignItems: "center", gap: "0.8rem", cursor: "pointer", background: isActive ? "var(--theme-surface-2)" : "transparent", borderRadius: "0 20px 20px 0", marginRight: "1rem", transition: "all 0.2s" }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--theme-surface-2)"; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
    >
      {renderAvatar(name, url, 36, type)}
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <span style={{ fontWeight: 600, fontSize: "0.9rem", color: isActive ? "var(--theme-primary)" : "var(--theme-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>
        <span style={{ fontSize: "0.72rem", color: "var(--theme-muted)" }}>{subtitle}</span>
      </div>
    </div>
  );

  return (
    <>
    {/* Lightbox Overlay */}
    {lightboxImage && (
      <div
        onClick={() => setLightboxImage(null)}
        style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}
      >
        <button
          onClick={() => setLightboxImage(null)}
          style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "1.2rem", backdropFilter: "blur(4px)", transition: "all 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
        >✕</button>
        <div onClick={e => e.stopPropagation()} style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 16, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <img src={lightboxImage} alt="Preview" style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", display: "block" }} />
        </div>
      </div>
    )}
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className="page-header" style={{ paddingBottom: "1rem", flexShrink: 0 }}>
         <div className="page-header-left">
           <h1>Club Communications Hub</h1>
           <p>Broadcast to the entire team or securely DM specific members</p>
         </div>
      </div>

      <div style={{ flex: 1, display: "flex", gap: "1rem", overflow: "hidden", padding: "0 0 1rem 0" }}>
        
        {/* Left Sidebar */}
        {sidebarOpen && (
          <div className="card" style={{ width: 300, display: "flex", flexDirection: "column", padding: "1rem 0", background: "var(--theme-surface)", overflowY: "auto" }}>
           
           <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

             {/* Global Lobby */}
             <div style={{ borderBottom: "1px solid var(--theme-border)", paddingBottom: "1rem" }}>
               <div style={{ padding: "0.2rem 1.2rem", fontSize: "0.75rem", color: "var(--theme-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: "0.5rem" }}>Club</div>
               <SidebarRow
                 name="Global Lobby"
                 url={clubProfile?.profilePic}
                 type="club"
                 subtitle="Everyone in the club"
                 isActive={activeChat?.type === "group"}
                 onClick={() => clubProfile && setActiveChat({ type: "group", id: clubProfile._id, name: "Global Club Team Chat", avatar: clubProfile.profilePic })}
               />
             </div>
             
             {/* Tournaments */}
             {tournaments.length > 0 && (
               <div style={{ borderBottom: "1px solid var(--theme-border)", paddingBottom: "1rem" }}>
                 <div style={{ padding: "0.2rem 1.2rem", fontSize: "0.75rem", color: "var(--theme-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: "0.5rem" }}>Competition Arena</div>
                 {tournaments.map(t => (
                   <SidebarRow key={t._id} name={t.name} url={null} type="team" subtitle={t.isHost ? "Organizer Chat" : "Participant Chat"} isActive={activeChat?.id === t._id} onClick={() => setActiveChat({ type: "tournament_chat", id: t._id, name: t.name, avatar: null })} />
                 ))}
               </div>
             )}

             {/* Teams */}
             {teams.length > 0 && (
               <div style={{ borderBottom: "1px solid var(--theme-border)", paddingBottom: "1rem" }}>
                 <div style={{ padding: "0.2rem 1.2rem", fontSize: "0.75rem", color: "var(--theme-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: "0.5rem" }}>My Teams</div>
                 {teams.map(team => (
                   <SidebarRow key={team._id} name={team.name} url={null} type="team" subtitle="Team Chat" isActive={activeChat?.id === team._id && activeChat?.type === "team_chat"} onClick={() => setActiveChat({ type: "team_chat", id: team._id, name: team.name, avatar: null })} />
                 ))}
               </div>
             )}
             
             {/* Coaches */}
             {coaches.length > 0 && (
               <div style={{ borderBottom: "1px solid var(--theme-border)", paddingBottom: "1rem" }}>
                 <div style={{ padding: "0.2rem 1.2rem", fontSize: "0.75rem", color: "var(--theme-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: "0.5rem" }}>Coaches</div>
                 {coaches.map(co => {
                   const coId = co.user?._id || co.user;
                   const coName = co.user?.name || co.name;
                   const coPic = co.user?.profilePic || co.profilePic;
                   return (
                     <SidebarRow key={co._id} name={coName} url={coPic} type="coach" subtitle="Coach · Direct Message" isActive={activeChat?.id === coId} onClick={() => setActiveChat({ type: "dm", id: coId, name: coName, avatar: coPic })} />
                   );
                 })}
               </div>
             )}

             {/* Athletes */}
             <div>
               <div style={{ padding: "0.2rem 1.2rem", fontSize: "0.75rem", color: "var(--theme-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: "0.5rem" }}>Direct Messages</div>
               {members.length === 0 ? (
                 <div style={{ padding: "0 1.2rem", fontSize: "0.85rem", color: "var(--theme-muted)" }}>No athletes in your club yet.</div>
               ) : (
                 members.map(ath => (
                   <SidebarRow key={ath._id} name={ath.user?.name || "Athlete"} url={ath.user?.profilePic} type="athlete" subtitle="Athlete · Direct Message" isActive={activeChat?.id === ath.user?._id} onClick={() => setActiveChat({ type: "dm", id: ath.user?._id, name: ath.user?.name, avatar: ath.user?.profilePic })} />
                 ))
               )}
             </div>
           </div>
          </div>
        )}

        {/* Right Panel (Chat Canvas) */}
        <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden", background: "var(--theme-surface)" }}>
           {!activeChat ? (
             <div className="empty-state" style={{ height: "100%", justifyContent: "center", border: "none" }}>
               <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn-ghost" style={{ position: "absolute", top: 15, left: 15 }} title={sidebarOpen ? "Collapse sidebar" : "Open sidebar"}>
                 <ChevronLeft size={20} style={{ transform: sidebarOpen ? "rotate(0deg)" : "rotate(180deg)" }} />
               </button>
               <MessageSquare size={50} opacity={0.3} />
               <p style={{ marginTop: "1rem", color: "var(--theme-muted)", maxWidth: 300, textAlign: "center", lineHeight: 1.5 }}>Select a channel to start broadcasting.</p>
             </div>
           ) : (
             <>
               {/* Chat Header */}
               <div style={{ padding: "0.8rem 1.5rem", background: "var(--theme-surface)", borderBottom: "1px solid var(--theme-border)", display: "flex", alignItems: "center", gap: "1rem" }}>
                 <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn-ghost" style={{ padding: "0.5rem", borderRadius: 8, background: "var(--theme-surface-2)" }} title={sidebarOpen ? "Collapse sidebar" : "Open sidebar"}>
                    <ChevronLeft size={18} style={{ transform: sidebarOpen ? "rotate(0deg)" : "rotate(180deg)" }} />
                 </button>
                 {renderAvatar(activeChat.name, activeChat.avatar, 40, activeChat.type === "group" ? "club" : activeChat.type === "team_chat" ? "team" : activeChat.type === "tournament_chat" ? "team" : "coach")}
                 <div style={{ flex: 1 }}>
                   <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--theme-text)", fontWeight: 800 }}>{activeChat.name}</h3>
                   <span style={{ fontSize: "0.75rem", color: "var(--theme-primary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                        {activeChat.type === "group" ? "Club Global Announcement Room" : 
                         activeChat.type === "team_chat" ? "Team Private Group" :
                         activeChat.type === "tournament_chat" ? "Tournament Organizer Hub" :
                         "Private Direct Message"}
                    </span>
                 </div>
                 
                 {activeChat.type !== "dm" && (
                    <button 
                      onClick={() => setShowMembers(!showMembers)} 
                      className="btn-ghost"
                      style={{ padding: "0.5rem", borderRadius: 8, background: showMembers ? "var(--theme-primary)" : "var(--theme-surface-2)", color: showMembers ? "#fff" : "var(--theme-text)" }}
                      title="Show Members"
                    >
                      <Info size={20} />
                    </button>
                  )}
               </div>

               <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                 {/* Chat Log */}
                 <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", background: "var(--theme-surface-2)" }}>
                    {messages.length === 0 && <div style={{ textAlign: "center", color: "var(--theme-muted)", fontSize: "0.85rem", marginTop: "auto", marginBottom: "auto" }}>This is the beginning of the message history.</div>}
                    {messages.map((msg, i) => {
                      const isMe = msg.sender?._id === user?._id;
                      const showName = !isMe && (i === 0 || messages[i-1].sender?._id !== msg.sender?._id);
                      return (
                         <div key={msg._id} style={{ display: "flex", alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "75%", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                           {showName && (
                               <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--theme-text)", marginBottom: "0.3rem", padding: "0 0.5rem" }}>
                                  {msg.sender?.name}
                               </div>
                           )}
                           <div style={{ 
                              background: isMe ? "var(--theme-primary)" : "var(--theme-surface)", 
                              color: isMe ? "#fff" : "var(--theme-text)",
                              padding: "0.9rem 1.2rem", 
                              borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                              boxShadow: isMe ? "0 4px 15px rgba(249,115,22,0.3)" : "0 4px 15px rgba(0,0,0,0.05)",
                              border: isMe ? "none" : "1px solid var(--theme-border)",
                              lineHeight: 1.5, fontSize: "0.95rem",
                              display: "flex", flexDirection: "column",
                              gap: msg.fileUrl ? "0.6rem" : "0"
                           }}>
                              {msg.fileUrl && (
                                  msg.fileType === "image" ? (
                                      <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", maxWidth: 250, maxHeight: 250, cursor: "zoom-in", position: "relative" }}
                                        onClick={() => setLightboxImage(`${API}${msg.fileUrl}`)}
                                        onMouseEnter={e => { const o = e.currentTarget.querySelector('.img-overlay'); if(o) o.style.opacity='1'; }}
                                        onMouseLeave={e => { const o = e.currentTarget.querySelector('.img-overlay'); if(o) o.style.opacity='0'; }}
                                      >
                                          <img src={`${API}${msg.fileUrl}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} alt="Attachment" />
                                          <div className="img-overlay" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s", fontSize: "0.8rem", color: "#fff", fontWeight: 700, letterSpacing: 1 }}>TAP TO VIEW</div>
                                      </div>
                                  ) : msg.fileType === "location" ? (
                                      <button onClick={() => window.open(msg.fileUrl, "_blank", "noopener,noreferrer")} style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: isMe ? "#fff" : "var(--theme-primary)", background: "rgba(0,0,0,0.15)", padding: "0.6rem 0.8rem", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" }}>
                                          <MapPin size={18} /> View on Google Maps
                                      </button>
                                  ) : (
                                      <button onClick={() => window.open(`${API}${msg.fileUrl}`, "_blank", "noopener,noreferrer")} style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: isMe ? "#fff" : "var(--theme-primary)", background: "rgba(0,0,0,0.15)", padding: "0.6rem 0.8rem", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" }}>
                                          <FileText size={18} /> Document
                                      </button>
                                  )
                              )}
                              {msg.text && <div style={{ wordBreak: "break-word" }}>{msg.text}</div>}
                              <div style={{ fontSize: "0.65rem", color: isMe ? "rgba(255,255,255,0.7)" : "var(--theme-muted)", textAlign: "right", marginTop: "0.4rem", fontWeight: 600 }}>
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
                              </div>
                           </div>
                         </div>
                      );
                    })}
                 </div>

                 {/* Member Sidebar */}
                 {showMembers && activeChat.type !== "dm" && (
                  <div style={{ width: 250, borderLeft: "1px solid var(--theme-border)", background: "var(--theme-surface)", display: "flex", flexDirection: "column" }}>
                      <div style={{ padding: "1rem 1.2rem", borderBottom: "1px solid var(--theme-border)", fontSize: "0.9rem", fontWeight: 700, color: "var(--theme-text)" }}>
                          Members ({activeChannelMembers.length})
                      </div>
                      <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem" }}>
                          {activeChannelMembers.length === 0 ? (
                              <div style={{ padding: "1rem", textAlign: "center", color: "var(--theme-muted)", fontSize: "0.85rem" }}>No members found.</div>
                          ) : (
                              activeChannelMembers.map(m => {
                                  const isSelf = m._id === user?._id;
                                  return (
                                      <div key={m._id} style={{ padding: "0.8rem", borderRadius: 8, display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.5rem", background: "var(--theme-surface-2)" }}>
                                          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                                              {renderAvatar(m.name, m.profilePic, 30, m.role === "Coach" ? "coach" : "athlete")}
                                              <div style={{ display: "flex", flexDirection: "column" }}>
                                                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--theme-text)" }}>{m.name} {isSelf && "(You)"}</span>
                                                  <span style={{ fontSize: "0.7rem", color: "var(--theme-primary)", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                                                      {m.role === "Host" ? <ShieldCheck size={10}/> : m.role === "Athlete" ? <Dumbbell size={10}/> : <Users size={10}/>}
                                                      {m.role}
                                                  </span>
                                              </div>
                                          </div>
                                          {!isSelf && (
                                              <button className="btn-ghost" style={{ width: "100%", fontSize: "0.75rem", padding: "0.4rem", border: "1px solid var(--theme-border)", borderRadius: 6, color: "var(--theme-primary)" }}
                                                  onClick={() => { setActiveChat({ type: "dm", id: m._id, name: m.name, avatar: m.profilePic }); setShowMembers(false); }}>
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

               {/* Chat Input with Attach Menu */}
               <div style={{ position: "relative" }}>
                 {showAttachMenu && (
                    <div style={{ position: "absolute", bottom: "100%", left: "1.5rem", marginBottom: "0.5rem", background: "var(--theme-surface)", border: "1px solid var(--theme-border)", borderRadius: "12px", boxShadow: "0 10px 40px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", padding: "0.5rem", zIndex: 100 }}>
                        <button type="button" onClick={() => { setShowAttachMenu(false); fileInputRef.current?.click(); }} style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.6rem 1.2rem", background: "transparent", border: "none", color: "var(--theme-text)", cursor: "pointer", borderRadius: "8px", textAlign: "left", transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.background="var(--theme-surface-2)"} onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                            <div style={{ background: "linear-gradient(135deg, #a855f7, #6d28d9)", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 4px 10px rgba(109,40,217,0.3)" }}><Image size={18}/></div>
                            <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Gallery / Document</span>
                        </button>

                        <button type="button" onClick={() => { setShowAttachMenu(false); handleAttachLocation(); }} style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.6rem 1.2rem", background: "transparent", border: "none", color: "var(--theme-text)", cursor: "pointer", borderRadius: "8px", textAlign: "left", transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.background="var(--theme-surface-2)"} onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                            <div style={{ background: "linear-gradient(135deg, #10b981, #047857)", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 4px 10px rgba(4,120,87,0.3)" }}><MapPin size={18}/></div>
                            <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Location</span>
                        </button>
                    </div>
                 )}
                 
                 <form onSubmit={handleSend} style={{ padding: "1.2rem 1.5rem", background: "var(--theme-surface)", borderTop: "1px solid var(--theme-border)", display: "flex", gap: "0.8rem", alignItems: "center" }}>
                   <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} />
                   <button type="button" onClick={() => setShowAttachMenu(!showAttachMenu)} className="btn-ghost" style={{ padding: "0.8rem", borderRadius: "50%", background: showAttachMenu ? "var(--theme-primary)" : "var(--theme-surface-2)", color: showAttachMenu ? "#fff" : "var(--theme-text)", width: 45, height: 45, transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)", transform: showAttachMenu ? "scale(1.1)" : "scale(1)" }} disabled={uploading}>
                      {uploading ? <Loader2 size={18} className="spinner-icon" /> : <Paperclip size={18} />}
                   </button>
                   <input 
                     type="text" value={text} onChange={e => setText(e.target.value)} 
                     maxLength={VALIDATION_LIMITS.messageMax}
                     placeholder={activeChat.type === "group" ? "Broadcast message to all club athletes..." : `Message ${activeChat.name}...`} 
                     style={{ flex: 1, background: "var(--theme-surface-2)", border: "1px solid var(--theme-border)", borderRadius: 25, padding: "0.9rem 1.4rem", color: "var(--theme-text)", outline: "none", fontSize: "0.95rem" }}
                   />
                   <button type="submit" disabled={!text.trim()} className="btn-primary" style={{ borderRadius: "50%", width: 45, height: 45, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: text.trim() ? 1 : 0.5 }}>
                     <Send size={18} style={{ marginLeft: -2 }} />
                   </button>
                 </form>
               </div>
             </>
           )}
        </div>
      </div>
    </div>
    </>
  );
}
