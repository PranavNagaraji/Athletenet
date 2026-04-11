import { useEffect, useState, useRef } from "react";
import { Users, Building2, UserPlus, Loader2, Trophy, MessageSquare, Send, Paperclip, User, FileText, Image, MapPin, Crosshair } from "lucide-react";
import { io } from "socket.io-client";
import { useAuth } from "../../context/AuthContext";
import { VALIDATION_LIMITS, validateFile } from "../../utils/formValidation";
import FormationsBoard from "../../components/FormationsBoard";
import FormationChatCard from "../../components/FormationChatCard";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

const SPORT_BG_MINI = {
  football: "linear-gradient(135deg, #166534, #15803d)",
  basketball: "linear-gradient(135deg, #7c2d12, #9a3412)",
  cricket: "linear-gradient(135deg, #1e3a5f, #1e40af)",
};
const SPORT_ACCENT = { football: "#22c55e", basketball: "#f97316", cricket: "#38bdf8" };



export default function AthleteTeams() {
  const { user } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [teams, setTeams] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [socket, setSocket] = useState(null);
  const scrollRef = useRef();
  const fileInputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
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
    if (text.trim().length > VALIDATION_LIMITS.messageMax) return;

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
      const fileError = validateFile(file, { maxBytes: VALIDATION_LIMITS.attachmentMaxBytes, allowNonImages: true });
      if (fileError) return;

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

  const handleAttachLocation = () => {
      if (!navigator.geolocation) return alert("Geolocation not supported by your browser");
      if (!socket || activeView.type === "join") return;

      navigator.geolocation.getCurrentPosition(
          (pos) => {
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              const url = `https://www.google.com/maps?q=${lat},${lng}`;
              
              const roomName = activeView.type === "team_chat" ? `team_${activeView.id}` : activeView.type === "club_chat" ? `club_${activeView.id}` : `dm_${[user._id, activeView.id].sort().join("_")}`;

              socket.emit("send_message", {
                  room: roomName,
                  sender: user._id,
                  text: "📍 Shared Location",
                  teamGroup: activeView.type === "team_chat" ? activeView.id : null,
                  clubGroup: activeView.type === "club_chat" ? activeView.id : null,
                  receiver: activeView.type === "dm" ? activeView.id : null,
                  fileUrl: url,
                  fileType: "location"
              });
          },
          () => alert("Unable to fetch location. Please check your browser permissions.")
      );
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

  const renderAvatar = (name, url, size = 32, type = 'club') => {
      if (url) {
        return <img src={`${API}${url}`} style={{ width: size, height: size, borderRadius: "10px", objectFit: "cover", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.1)" }} alt={name} />;
      }
      const initials = name ? (name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()) : "XX";
      const colors = type === 'team' ? "linear-gradient(135deg, #3b82f6, #1d4ed8)" : 
                     type === 'admin' ? "linear-gradient(135deg, #8b5cf6, #6d28d9)" :
                     type === 'coach' ? "linear-gradient(135deg, #10b981, #047857)" :
                     "linear-gradient(135deg, #f97316, #c2410c)";
      return (
        <div style={{ width: size, height: size, borderRadius: "10px", background: colors, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.45, fontWeight: 800, textTransform: "uppercase", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.1)" }}>
          {initials}
        </div>
      );
  };

  return (
    <>
    {/* Lightbox Overlay */}
    {lightboxImage && (
      <div
        onClick={() => setLightboxImage(null)}
        style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", animation: "fadeIn 0.2s ease" }}
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
          <div className="card" style={{ width: 320, display: "flex", flexDirection: "column", padding: "1rem 0", background: "var(--theme-surface)", overflowY: "auto" }}>
           
           <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
             {clubs.length === 0 ? (
                 <div style={{ padding: "0 1.2rem", fontSize: "0.85rem", color: "var(--theme-muted)", marginBottom: "1rem" }}>No joined clubs.</div>
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
                      <div key={clubId.toString()} style={{ borderBottom: "1px solid var(--theme-border)", paddingBottom: "1.2rem", marginBottom: "1rem" }}>
                        {/* Club Identity Section Header */}
                        <div style={{ padding: "0.2rem 1.2rem", fontSize: "0.75rem", color: "var(--theme-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: "0.8rem" }}>
                           {clubName}
                        </div>

                        {/* Lobby & Admin */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                            <div 
                                onClick={() => {
                                    setActiveView({ type: "club_chat", id: clubId, name: `${clubName} Lobby`, avatar: club.profilePic });
                                    if (window.innerWidth < 768) setSidebarOpen(false);
                                }}
                              style={{ padding: "0.5rem 1.2rem", display: "flex", alignItems: "center", gap: "0.8rem", cursor: "pointer", background: activeView?.id === clubId && activeView?.type === "club_chat" ? "var(--theme-surface-2)" : "transparent", borderRadius: "0 20px 20px 0", marginRight: "1rem", transition: "all 0.2s" }}
                            >
                              {renderAvatar("Global Lobby", club.profilePic, 36, 'club')}
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                  <span style={{ fontWeight: 600, fontSize: "0.95rem", color: activeView?.id === clubId && activeView?.type === "club_chat" ? "var(--theme-primary)" : "var(--theme-text)" }}>Global Lobby</span>
                                  <span style={{ fontSize: "0.75rem", color: "var(--theme-muted)" }}>Everyone in the club</span>
                              </div>
                            </div>

                            {clubAdminId && (
                              <div 
                                onClick={() => {
                                    setActiveView({ type: "dm", id: clubAdminId, name: `Admin (${clubName})`, avatar: null });
                                    if (window.innerWidth < 768) setSidebarOpen(false);
                                }}
                                style={{ padding: "0.5rem 1.2rem", display: "flex", alignItems: "center", gap: "0.8rem", cursor: "pointer", background: activeView?.id === clubAdminId ? "var(--theme-surface-2)" : "transparent", borderRadius: "0 20px 20px 0", marginRight: "1rem", transition: "all 0.2s" }}
                              >
                                {renderAvatar("Admin", null, 36, 'admin')}
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                  <span style={{ fontWeight: 600, fontSize: "0.95rem", color: activeView?.id === clubAdminId ? "var(--theme-primary)" : "var(--theme-text)" }}>Contact Admin</span>
                                  <span style={{ fontSize: "0.75rem", color: "var(--theme-muted)" }}>Direct Message</span>
                                </div>
                              </div>
                            )}
                        </div>

                        {/* Club Teams */}
                        {clubTeams.length > 0 && (
                          <div style={{ marginTop: "1.2rem" }}>
                            <div style={{ padding: "0.2rem 1.2rem", fontSize: "0.7rem", color: "var(--theme-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: "0.5rem" }}>Teams</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                                {clubTeams.map(team => (
                                   <div key={team._id} onClick={() => { setActiveView({ type: "team_chat", id: team._id, name: team.name }); if (window.innerWidth < 768) setSidebarOpen(false); }}
                                     style={{ padding: "0.5rem 1.2rem", display: "flex", alignItems: "center", gap: "0.8rem", cursor: "pointer", background: activeView?.id === team._id ? "var(--theme-surface-2)" : "transparent", borderRadius: "0 20px 20px 0", marginRight: "1rem", transition: "all 0.2s" }}
                                   >
                                     {renderAvatar(team.name, null, 32, 'team')}
                                     <div style={{ display: "flex", flexDirection: "column" }}>
                                        <span style={{ fontWeight: 600, fontSize: "0.9rem", color: activeView?.id === team._id ? "var(--theme-primary)" : "var(--theme-text)" }}>{team.name}</span>
                                        <span style={{ fontSize: "0.75rem", color: "var(--theme-muted)" }}>Team Group</span>
                                     </div>
                                   </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Club Coaches */}
                        {clubCoaches.length > 0 && (
                          <div style={{ marginTop: "1.2rem" }}>
                            <div style={{ padding: "0.2rem 1.2rem", fontSize: "0.7rem", color: "var(--theme-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: "0.5rem" }}>Coaches</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                                {clubCoaches.map(coach => (
                                   <div key={coach._id} onClick={() => { setActiveView({ type: "dm", id: coach._id, name: coach.name, avatar: coach.profilePic }); if (window.innerWidth < 768) setSidebarOpen(false); }}
                                     style={{ padding: "0.5rem 1.2rem", display: "flex", alignItems: "center", gap: "0.8rem", cursor: "pointer", background: activeView?.id === coach._id ? "var(--theme-surface-2)" : "transparent", borderRadius: "0 20px 20px 0", marginRight: "1rem", transition: "all 0.2s" }}
                                   >
                                     {renderAvatar(coach.name, coach.profilePic, 32, 'coach')}
                                     <div style={{ display: "flex", flexDirection: "column" }}>
                                        <span style={{ fontWeight: 600, fontSize: "0.9rem", color: activeView?.id === coach._id ? "var(--theme-primary)" : "var(--theme-text)" }}>{coach.name}</span>
                                        <span style={{ fontSize: "0.75rem", color: "var(--theme-muted)" }}>Direct Message</span>
                                     </div>
                                   </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                 })
             )}

             <div style={{ padding: "1rem 1.2rem" }}>
                <h3 style={{ margin: "0 1.2rem 0.8rem", fontSize: "0.75rem", color: "var(--theme-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Explore Teams</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    {availableTeams.map(team => (
                      <div key={team._id} onClick={() => setActiveView({ type: "join", team })} style={{ padding: "0.5rem 1.2rem", display: "flex", alignItems: "center", gap: "0.8rem", cursor: "pointer", opacity: 0.8, borderRadius: "0 20px 20px 0", marginRight: "1rem", transition: "all 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.background="var(--theme-surface-2)"} onMouseLeave={(e)=>e.currentTarget.style.background="transparent"}>
                        {renderAvatar(team.name, null, 32, 'team')}
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--theme-text)" }}>{team.name}</span>
                            <span style={{ fontSize: "0.75rem", color: "var(--theme-muted)" }}>{team.club?.name || "Join Team"}</span>
                        </div>
                      </div>
                    ))}
                </div>
             </div>
           </div>
        </div>
        )}

        {/* RIGHT CANVAS: Chat or Join Interface */}
        <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden", background: "var(--theme-surface)" }}>
           {!activeView ? (
             <div className="empty-state" style={{ height: "100%", justifyContent: "center", border: "none" }}>
               <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn-ghost" style={{ position: "absolute", top: 15, left: 15 }}>
                 <Users size={20} />
               </button>
               <MessageSquare size={50} opacity={0.3} />
               <p style={{ marginTop: "1rem", color: "var(--theme-muted)", maxWidth: 300, textAlign: "center", lineHeight: 1.5 }}>Select a Team to open the group chat, or select a Coach to send a direct message.</p>
             </div>
           ) : activeView.type === "join" ? (
             <div className="empty-state" style={{ height: "100%", justifyContent: "center", border: "none" }}>
               <Trophy size={60} color="var(--theme-primary)" style={{ marginBottom: "1rem" }} />
               <h2>{activeView.team.name}</h2>
               <p style={{ color: "var(--theme-muted)", marginBottom: "2rem" }}>You are not a member of this team yet.</p>
               <button className="btn-primary" onClick={() => handleJoinTeam(activeView.team._id)}>
                 <UserPlus size={18} /> Join Team to Access Chat
               </button>
             </div>
           ) : (
             <>
                {/* Chat Header */}
                <div style={{ padding: "0.8rem 1.5rem", background: "var(--theme-surface)", borderBottom: "1px solid var(--theme-border)", display: "flex", alignItems: "center", gap: "1rem" }}>
                  <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn-ghost" style={{ padding: "0.5rem", borderRadius: 8, background: "var(--theme-surface-2)" }}>
                     <Users size={18} />
                  </button>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--theme-surface)", overflow: "hidden", display: "flex", alignItems: "center", justifyItems: "center" }}>
                    {activeView.type === "team_chat" ? renderAvatar(activeView.name, null, 40, 'team') : 
                      (activeView.avatar ? <img src={`${API}${activeView.avatar}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : renderAvatar(activeView.name, null, 40, 'coach'))
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--theme-text)", fontWeight: 800 }}>{activeView.name}</h3>
                    <span style={{ fontSize: "0.75rem", color: "var(--theme-primary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                        {activeView.type === "team_chat" ? "Team Group" : activeView.type === "club_chat" ? "Club Lobby" : "Direct Message"}
                    </span>
                  </div>

                  {/* Contextual Coaches for Teams */}
                  {activeView.type === "team_chat" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--theme-surface-2)", padding: "0.4rem 0.8rem", border: "1px solid var(--theme-border)", borderRadius: 12 }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--theme-muted)", fontWeight: 700 }}>COACHES:</span>
                        <div style={{ display: "flex", gap: "0.3rem" }}>
                            {teams.find(t => t._id === activeView.id)?.coaches?.map(coach => (
                                <div 
                                    key={coach._id} 
                                    title={coach.name}
                                    onClick={() => setActiveView({ type: "dm", id: coach._id, name: coach.name, avatar: coach.profilePic })}
                                    style={{ width: 26, height: 26, borderRadius: "50%", border: "2px solid var(--theme-primary)", cursor: "pointer", overflow: "hidden" }}
                                >
                                    {coach.profilePic ? <img src={`${API}${coach.profilePic}`} style={{width:"100%",height:"100%",objectFit:"cover"}} /> : <User size={12} style={{margin:"4px"}} />}
                                </div>
                            ))}
                        </div>
                    </div>
                  )}
                </div>

               {/* Chat Log */}
               <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
                  {messages.some(m => m.isPinned) && (
                    <div style={{ background: "rgba(245,158,11,0.1)", borderBottom: "1px solid rgba(245,158,11,0.2)", padding: "0.5rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }} onClick={() => {
                        const pinned = messages.slice().reverse().find(m => m.isPinned && m.fileType === "formation");
                        if (pinned) setOpenFormation(pinned.fileUrl);
                    }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#f59e0b", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", flexShrink: 0 }}>📌</div>
                      <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                         <span style={{ fontWeight: 800, color: "#fcd34d", fontSize: "0.8rem", marginRight: "0.4rem" }}>Pinned Tactic:</span>
                         <span style={{ fontSize: "0.8rem", color: "var(--theme-text)" }}>{messages.slice().reverse().find(m => m.isPinned)?.text || "Tactical formation shared"}</span>
                      </div>
                      <span style={{ fontSize: "0.7rem", color: "#f59e0b", fontWeight: 700, textTransform: "uppercase" }}>View</span>
                    </div>
                  )}
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
                            position: "relative",
                            background: isMe ? "var(--theme-primary)" : "var(--theme-surface)", 
                            color: isMe ? "#fff" : "var(--theme-text)",
                            padding: "0.9rem 1.2rem", 
                            borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                            boxShadow: msg.isPinned ? "0 0 0 2px #f59e0b, 0 12px 24px rgba(245,158,11,0.3)" : (isMe ? "0 4px 15px rgba(249,115,22,0.3)" : "0 4px 15px rgba(0,0,0,0.05)"),
                            border: isMe && !msg.isPinned ? "none" : "1px solid var(--theme-border)",
                            lineHeight: 1.5,
                            fontSize: "0.95rem",
                            display: "flex",
                            flexDirection: "column",
                            gap: msg.fileUrl ? "0.6rem" : "0"
                         }}>
                            {msg.isPinned && (
                               <div style={{ position: "absolute", top: -10, right: isMe ? "auto" : -10, left: isMe ? -10 : "auto", background: "#f59e0b", color: "#fff", width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(245,158,11,0.5)", zIndex: 10 }}>
                                 📌
                               </div>
                            )}
                            {/* File Attachment Rendering */}
                            {msg.fileUrl && (
                                msg.fileType === "formation" ? (
                                  <div style={{ position: "relative" }}>
                                    <FormationChatCard formationId={msg.fileUrl} isMe={isMe} portal="athlete" />
                                    {/* Unlike coach, athletes cannot unpin by themselves so we just mirror coach logic or omit the button. Since athletes shouldn't pin anyway, we just render the pin banner, no pin toggle button */}
                                  </div>
                                ) : msg.fileType === "image" ? (
                                    <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", maxWidth: 250, maxHeight: 250, cursor: "zoom-in", position: "relative" }} onClick={() => setLightboxImage(`${API}${msg.fileUrl}`)}
                                      onMouseEnter={e => e.currentTarget.querySelector('.img-overlay').style.opacity = '1'}
                                      onMouseLeave={e => e.currentTarget.querySelector('.img-overlay').style.opacity = '0'}
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
                            
                            {/* Text content */}
                            {msg.text && <div style={{ wordBreak: "break-word" }}>{msg.text}</div>}

                            <div style={{ fontSize: "0.65rem", color: isMe ? "rgba(255,255,255,0.7)" : "var(--theme-muted)", textAlign: "right", marginTop: "0.4rem", fontWeight: 600 }}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
                            </div>
                         </div>
                       </div>
                    );
                  })}
                  </div>
               </div>

               {/* Chat Input */}
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
                   type="text" 
                   value={text} 
                   onChange={e => setText(e.target.value)} 
                   placeholder="Type a message..." 
                   maxLength={VALIDATION_LIMITS.messageMax}
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
